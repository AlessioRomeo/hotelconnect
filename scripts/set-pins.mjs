// Sets the PIN/password (= account password) for the hidden role accounts via
// the Supabase Admin API. Secrets are NEVER hardcoded or committed — you pass
// them at runtime. The Supabase URL + role emails are read from .env.local.
//
// Run (from the app/ folder), passing only the roles you want to update:
//   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
//   RECEPTION_PIN=123456 PULIZIE_PIN=456789 \
//   COLAZIONE_PIN=147369 ADMIN_PASSWORD=secret \
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
  { label: "reception", email: env.NEXT_PUBLIC_RECEPTION_EMAIL, secret: process.env.RECEPTION_PIN, pin: true },
  { label: "pulizie", email: env.NEXT_PUBLIC_PULIZIE_EMAIL, secret: process.env.PULIZIE_PIN, pin: true },
  { label: "colazione", email: env.NEXT_PUBLIC_COLAZIONE_EMAIL, secret: process.env.COLAZIONE_PIN, pin: true },
  { label: "admin", email: env.NEXT_PUBLIC_ADMIN_EMAIL, secret: process.env.ADMIN_PASSWORD, pin: false },
].filter((t) => t.secret);

if (targets.length === 0) {
  console.error(
    "Nothing to do: set at least one of RECEPTION_PIN, PULIZIE_PIN, COLAZIONE_PIN, ADMIN_PASSWORD.",
  );
  process.exit(1);
}

for (const t of targets) {
  if (t.pin && !/^\d{6,}$/.test(t.secret)) {
    console.error(`${t.label} PIN must be at least 6 digits (Supabase minimum).`);
    process.exit(1);
  }
  if (!t.pin && t.secret.length < 6) {
    console.error(`${t.label} password must be at least 6 characters (Supabase minimum).`);
    process.exit(1);
  }
  if (!t.email) {
    console.error(`Missing NEXT_PUBLIC_${t.label.toUpperCase()}_EMAIL in .env.local.`);
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
  const { error } = await admin.auth.admin.updateUserById(id, { password: t.secret });
  console.log(error ? `✗ ${t.email}: ${error.message}` : `✓ ${t.email} → aggiornato`);
}

console.log("done");
