// Sets the PIN (= account password) for the two hidden role accounts via the
// Supabase Admin API. Secrets are NEVER hardcoded or committed — you pass them
// at runtime. The Supabase URL + role emails are read from .env.local.
//
// Run (from the app/ folder):
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
//   RECEPTION_PIN=123456 PULIZIE_PIN=456789 \
//   node scripts/set-pins.mjs
//
// The service_role key is at Supabase → Project Settings → API ("service_role",
// secret). Do not paste it into any committed file.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import ws from "ws"; // Node < 22 has no native WebSocket; createClient needs it.

// Minimal .env.local parser (no dependency), same as realtime-test.mjs.
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY (Supabase → Settings → API).");
  process.exit(1);
}

const targets = [
  { label: "reception", email: env.NEXT_PUBLIC_RECEPTION_EMAIL, pin: process.env.RECEPTION_PIN },
  { label: "pulizie", email: env.NEXT_PUBLIC_PULIZIE_EMAIL, pin: process.env.PULIZIE_PIN },
];

for (const t of targets) {
  if (!t.pin) {
    console.error(`Missing ${t.label.toUpperCase()}_PIN.`);
    process.exit(1);
  }
  if (!/^\d{6,}$/.test(t.pin)) {
    console.error(`${t.label} PIN must be at least 6 digits (Supabase minimum).`);
    process.exit(1);
  }
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  realtime: { transport: ws },
});

async function findUserId(email) {
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 200) return null; // no more pages
  }
}

for (const t of targets) {
  const id = await findUserId(t.email);
  if (!id) {
    console.error(`✗ user not found: ${t.email}`);
    continue;
  }
  const { error } = await admin.auth.admin.updateUserById(id, { password: t.pin });
  console.log(error ? `✗ ${t.email}: ${error.message}` : `✓ ${t.email} → PIN aggiornato`);
}

console.log("done");
