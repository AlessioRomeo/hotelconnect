"use client";

import { useMemo } from "react";
import { useRooms } from "@/hooks/useRooms";
import { useTick } from "@/hooks/useTick";
import { STATUS_META } from "@/lib/status";
import { timeAgo } from "@/lib/time";
import type { Room, RoomStatus } from "@/lib/types";

// Cleaners only care about rooms that still need attention.
const NEEDS_WORK: RoomStatus[] = ["da_pulire", "in_pulizia"];

// Sort so the next thing to do is always first: urgent on top, then rooms not
// yet started before ones already in progress, then a stable room order.
const STATUS_RANK: Record<RoomStatus, number> = {
  da_pulire: 0,
  in_pulizia: 1,
  pulita: 2,
};

function cleaningSort(a: Room, b: Room): number {
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
  if (a.status !== b.status) return STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (a.room_group !== b.room_group) return a.room_group === "hotel" ? -1 : 1;
  return a.sort_order - b.sort_order;
}

// The cleaning (Pulizie) screen. Deliberately minimal: a single urgent-first
// list of rooms to do, each with large one-tap buttons. Built for one-handed
// use on a phone, but scales up to a grid on tablet/desktop.
export function CleaningView({ onSignOut }: { onSignOut: () => void }) {
  const { rooms, loading, updateRoom } = useRooms(true);
  const now = useTick(60_000);

  const todo = useMemo(
    () => rooms.filter((r) => NEEDS_WORK.includes(r.status)).sort(cleaningSort),
    [rooms],
  );

  const setStatus = (room: Room, status: RoomStatus) => {
    // Mark room clean → also drop the urgent flag so it doesn't come back hot.
    const patch: Partial<Room> =
      status === "pulita" ? { status, urgent: false } : { status };
    updateRoom(room.id, patch, "pulizie");
  };

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-semibold leading-tight">
              Da pulire
              {!loading && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-semibold tabular-nums text-emerald-700">
                  {todo.length}
                </span>
              )}
            </h1>
            <p className="text-xs text-zinc-500">Pulizie</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Esci
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5">
        {loading ? (
          <p className="py-20 text-center text-zinc-400">Caricamento camere…</p>
        ) : todo.length === 0 ? (
          <AllClean />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {todo.map((room) => (
              <CleaningCard
                key={room.id}
                room={room}
                now={now}
                onSetStatus={setStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

interface CleaningCardProps {
  room: Room;
  now: number;
  onSetStatus: (room: Room, status: RoomStatus) => void;
}

function CleaningCard({ room, now, onSetStatus }: CleaningCardProps) {
  const meta = STATUS_META[room.status];
  const inProgress = room.status === "in_pulizia";

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 ${meta.card} ${
        room.urgent ? "ring-2 ring-red-500" : ""
      }`}
    >
      {/* Room identity + status */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {room.room_group === "bnb" ? "B&B" : "Hotel"}
          </p>
          <p className="text-3xl font-semibold leading-none tabular-nums">
            {room.name}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {room.urgent && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Urgente
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${meta.text}`}>
            <span className={`h-2 w-2 rounded-full ${meta.swatch}`} />
            {meta.label}
          </span>
        </div>
      </div>

      {/* Note from reception — important context, shown prominently. */}
      {room.note && (
        <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-zinc-700">
          {room.note}
        </p>
      )}

      <p className="text-xs text-zinc-500">Aggiornata {timeAgo(room.updated_at, now)}</p>

      {/* Actions — big one-tap targets. */}
      {inProgress ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onSetStatus(room, "pulita")}
            className="flex h-14 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-semibold text-white transition active:scale-[0.98] hover:bg-emerald-700"
          >
            Segna pulita
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(room, "da_pulire")}
            className="self-center px-3 py-1 text-sm font-medium text-zinc-500 transition hover:text-zinc-700"
          >
            Annulla
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetStatus(room, "in_pulizia")}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl bg-blue-600 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-blue-700"
          >
            Inizia
          </button>
          <button
            type="button"
            onClick={() => onSetStatus(room, "pulita")}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-emerald-600 bg-white text-base font-semibold text-emerald-700 transition active:scale-[0.98] hover:bg-emerald-50"
          >
            Pulita
          </button>
        </div>
      )}
    </div>
  );
}

// Reassuring empty state when there is nothing left to clean.
function AllClean() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-emerald-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <p className="text-lg font-semibold">Tutto pulito!</p>
      <p className="max-w-xs text-sm text-zinc-500">
        Nessuna camera da pulire al momento.
      </p>
    </div>
  );
}
