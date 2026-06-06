"use client";

// THROWAWAY debug page (Phase 3): proves auth + live realtime sync.
// Open this in two browser tabs, sign in, click a room in one tab, and watch it
// change in the other within ~1s. This page will be deleted once the real
// reception/cleaning views exist.

import { useAuth } from "@/hooks/useAuth";
import { useRooms } from "@/hooks/useRooms";
import { STATUS_LABELS, type RoomStatus } from "@/lib/types";

const NEXT_STATUS: Record<RoomStatus, RoomStatus> = {
  pulita: "da_pulire",
  da_pulire: "in_pulizia",
  in_pulizia: "pulita",
};

// Placeholder PINs from setup — debug only.
const PINS = { reception: "123456", pulizie: "567890" } as const;

export default function DebugPage() {
  const { session, role, loading, signIn, signOut } = useAuth();
  const { rooms, loading: roomsLoading, updateRoom } = useRooms(!!session);

  if (loading) return <main className="p-6">Caricamento…</main>;

  if (!session) {
    return (
      <main className="flex flex-col items-center gap-4 p-10">
        <h1 className="text-xl font-semibold">Debug — accedi</h1>
        <div className="flex gap-3">
          <button
            className="rounded bg-blue-600 px-4 py-2 text-white"
            onClick={() => signIn("reception", PINS.reception)}
          >
            Entra come Reception
          </button>
          <button
            className="rounded bg-emerald-600 px-4 py-2 text-white"
            onClick={() => signIn("pulizie", PINS.pulizie)}
          >
            Entra come Pulizie
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Debug — ruolo: <span className="text-blue-600">{role}</span>
        </h1>
        <button className="text-sm underline" onClick={signOut}>
          Esci
        </button>
      </div>

      {roomsLoading ? (
        <p>Caricamento camere…</p>
      ) : (
        <ul className="divide-y rounded border">
          {rooms.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="w-28 font-mono">
                {r.room_group === "bnb" ? "B&B " : ""}
                {r.name}
              </span>
              <span className="flex-1 text-sm text-zinc-600">
                {STATUS_LABELS[r.status]}
                {r.urgent && (
                  <span className="ml-2 rounded bg-red-100 px-1 text-red-700">
                    URGENTE
                  </span>
                )}
              </span>
              {role && (
                <span className="flex gap-2">
                  <button
                    className="rounded bg-zinc-200 px-2 py-1 text-sm"
                    onClick={() =>
                      updateRoom(r.id, { status: NEXT_STATUS[r.status] }, role)
                    }
                  >
                    stato →
                  </button>
                  <button
                    className="rounded bg-zinc-200 px-2 py-1 text-sm"
                    onClick={() =>
                      updateRoom(r.id, { urgent: !r.urgent }, role)
                    }
                  >
                    urgente
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
