// Automated proof that realtime sync works end-to-end.
// Signs in, subscribes to rooms changes, makes an UPDATE, and asserts the change
// arrives over the websocket. Run with: node scripts/realtime-test.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import ws from "ws"; // Node < 22 has no native WebSocket; the browser app needs no shim.

// Minimal .env.local parser (no dep).
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { realtime: { transport: ws } },
);

const fail = (msg) => {
  console.error("❌ FAIL:", msg);
  process.exit(1);
};

// 1. Sign in as reception so RLS allows reads + realtime delivery.
const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
  email: env.NEXT_PUBLIC_RECEPTION_EMAIL,
  password: "123456",
});
if (authErr) fail("sign in: " + authErr.message);
await supabase.realtime.setAuth(auth.session.access_token);
console.log("✅ signed in as", auth.user.email);

// 2. Pick a room to poke (hotel 101).
const { data: room, error: roomErr } = await supabase
  .from("rooms")
  .select("*")
  .eq("room_group", "hotel")
  .eq("name", "101")
  .single();
if (roomErr) fail("fetch room 101: " + roomErr.message);

const newStatus = room.status === "pulita" ? "da_pulire" : "pulita";
console.log(`   room 101 currently "${room.status}", will set to "${newStatus}"`);

// 3. Subscribe, and once subscribed, make the change.
const timeout = setTimeout(
  () => fail("no realtime event received within 12s"),
  12000,
);

async function sendUpdate() {
  const { error } = await supabase
    .from("rooms")
    .update({ status: newStatus, updated_by: "reception" })
    .eq("id", room.id);
  if (error) fail("update room: " + error.message);
  console.log("   update sent, waiting for realtime echo…");
}

supabase
  .channel("rt-test")
  // The DB subscription is only live once this system event fires — NOT at
  // channel "SUBSCRIBED". Trigger the write only after it, or we race the bind.
  .on("system", {}, (m) => {
    if (m.extension === "postgres_changes" && m.status === "ok") sendUpdate();
  })
  .on(
    "postgres_changes",
    { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${room.id}` },
    (payload) => {
      clearTimeout(timeout);
      const got = payload.new.status;
      console.log(`📡 realtime UPDATE received: status = "${got}"`);
      if (got === newStatus) {
        console.log("✅ PASS — live sync works end-to-end.");
        process.exit(0);
      } else {
        fail(`expected "${newStatus}", got "${got}"`);
      }
    },
  )
  .subscribe((status) => console.log("   channel status:", status));
