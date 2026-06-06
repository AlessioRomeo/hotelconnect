"use client";

import { useEffect, useState } from "react";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import { timeAgo } from "@/lib/time";
import type { Room } from "@/lib/types";

interface RoomSheetProps {
  room: Room;
  now: number;
  onClose: () => void;
  onUpdate: (patch: Partial<Room>) => void;
}

const UPDATED_BY_LABEL = { reception: "Reception", pulizie: "Pulizie" } as const;

// A bottom sheet on phones, a centered modal on larger screens — one component,
// driven by responsive alignment. Shows the live room (the parent passes the
// latest copy by id, so status changes from other devices appear here in real
// time while it is open).
export function RoomSheet({ room, now, onClose, onUpdate }: RoomSheetProps) {
  const [note, setNote] = useState(room.note ?? "");

  // Close on Escape and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const saveNote = () => {
    const next = note.trim();
    if (next !== (room.note ?? "")) onUpdate({ note: next || null });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Camera ${room.name}`}
    >
      <button
        type="button"
        aria-label="Chiudi"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
      />

      <div className="relative z-10 flex w-full animate-sheet flex-col gap-5 rounded-t-3xl bg-white p-5 pb-8 text-zinc-900 sm:max-w-md sm:rounded-3xl sm:pb-5">
        {/* drag handle (mobile affordance) */}
        <div className="mx-auto h-1.5 w-10 rounded-full bg-zinc-200 sm:hidden" />

        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              {room.room_group === "bnb" ? "B&B" : "Hotel"}
            </p>
            <h2 className="text-2xl font-semibold tabular-nums">{room.name}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100"
          >
            ✕
          </button>
        </header>

        {/* Status selector */}
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-500">Stato</p>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_ORDER.map((s) => {
              const meta = STATUS_META[s];
              const active = room.status === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onUpdate({ status: s })}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-sm font-medium transition ${
                    active
                      ? `${meta.card} text-zinc-900 ring-2 ${meta.ring}`
                      : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.swatch}`} />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Urgent toggle */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 p-4">
          <div>
            <p className="font-medium">Urgente</p>
            <p className="text-sm text-zinc-500">
              In cima alla lista delle pulizie.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={room.urgent}
            aria-label="Urgente"
            onClick={() => onUpdate({ urgent: !room.urgent })}
            className={`relative h-7 w-12 shrink-0 rounded-full transition ${
              room.urgent ? "bg-red-600" : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                room.urgent ? "left-[1.375rem]" : "left-0.5"
              }`}
            />
          </button>
        </div>

        {/* Note */}
        <div>
          <label htmlFor="room-note" className="mb-2 block text-sm font-medium text-zinc-500">
            Nota
          </label>
          <textarea
            id="room-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            rows={2}
            placeholder="Es. check-out tardivo, pulire dopo le 14"
            className="w-full resize-none rounded-2xl border border-zinc-200 p-3 text-sm outline-none transition focus:border-zinc-400"
          />
        </div>

        <p className="text-center text-xs text-zinc-400">
          Aggiornata {timeAgo(room.updated_at, now)}
          {room.updated_by && ` · ${UPDATED_BY_LABEL[room.updated_by]}`}
        </p>
      </div>
    </div>
  );
}
