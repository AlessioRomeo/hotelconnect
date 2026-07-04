"use client";

import { useCallback, useEffect, useState } from "react";
import { GROUP_META } from "@/lib/groups";
import { SERVICE_META, SERVICE_ORDER } from "@/lib/service";
import { STATUS_META, STATUS_ORDER } from "@/lib/status";
import { timeAgo } from "@/lib/time";
import { ROLE_LABELS, type Room } from "@/lib/types";
import { CoffeeIcon, MinusIcon, PlusIcon } from "./icons";
import { DndBadge } from "./RoomTags";

interface RoomSheetProps {
  room: Room;
  now: number;
  onClose: () => void;
  onUpdate: (patch: Partial<Room>) => void;
}

export function RoomSheet({ room, now, onClose, onUpdate }: RoomSheetProps) {
  const [note, setNote] = useState(room.note ?? "");

  const saveNote = useCallback(() => {
    // A note only exists while the room needs cleaning; never (re)save one on a
    // clean room — the field is hidden there and the note is cleared on cleaning.
    if (room.status === "pulita") return;
    const next = note.trim();
    if (next !== (room.note ?? "")) onUpdate({ note: next || null });
  }, [note, room.note, room.status, onUpdate]);

  const handleClose = useCallback(() => {
    saveNote();
    onClose();
  }, [saveNote, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [handleClose]);

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
        onClick={handleClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
      />

      <div className="relative z-10 flex w-full animate-sheet flex-col gap-5 rounded-t-3xl bg-white p-5 pb-8 text-zinc-900 sm:max-w-md sm:rounded-3xl sm:pb-5">
        <div className="mx-auto h-1.5 w-10 rounded-full bg-zinc-200 sm:hidden" />

        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
              {GROUP_META[room.room_group].label}
            </p>
            <h2 className="text-2xl font-semibold tabular-nums">{room.name}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Chiudi"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100"
          >
            ✕
          </button>
        </header>

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

        {room.status !== "pulita" && (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-500">Tipo di pulizia</p>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_ORDER.map((t) => {
                const meta = SERVICE_META[t];
                const active = room.service_type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onUpdate({ service_type: active ? null : t })}
                    className={`rounded-2xl border p-3 text-sm font-medium transition ${
                      active
                        ? `${meta.pill} border-transparent ring-2 ring-current`
                        : "border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50"
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {room.do_not_disturb && (
          <div className="-my-1 flex items-center justify-between gap-3">
            <DndBadge />
            <button
              type="button"
              onClick={() => onUpdate({ do_not_disturb: false })}
              className="text-sm font-medium text-red-700 transition hover:underline"
            >
              Rimuovi
            </button>
          </div>
        )}

        {room.status !== "pulita" && (
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
        )}

        {room.status !== "pulita" && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 p-4">
            <div>
              <p className="font-medium">Ospite in camera</p>
              <p className="text-sm text-zinc-500">
                Nascosta alle pulizie finché è presente.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={room.guest_in_room}
              aria-label="Ospite in camera"
              onClick={() => onUpdate({ guest_in_room: !room.guest_in_room })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                room.guest_in_room ? "bg-rose-600" : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  room.guest_in_room ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        )}

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CoffeeIcon className="h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-medium">Colazione</p>
                <p className="text-sm text-zinc-500">
                  Visibile al servizio colazione.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={room.breakfast}
              aria-label="Colazione"
              onClick={() =>
                onUpdate(
                  room.breakfast
                    ? { breakfast: false, breakfast_guests: null }
                    : { breakfast: true, breakfast_guests: room.breakfast_guests ?? 2 },
                )
              }
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                room.breakfast ? "bg-amber-500" : "bg-zinc-300"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  room.breakfast ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {room.breakfast && (
            <div className="mt-3 flex items-center justify-between gap-4 border-t border-amber-200/70 pt-3">
              <p className="text-sm font-medium text-zinc-600">Ospiti</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      breakfast_guests: Math.max(1, (room.breakfast_guests ?? 2) - 1),
                    })
                  }
                  disabled={(room.breakfast_guests ?? 2) <= 1}
                  aria-label="Meno ospiti"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-700 transition active:scale-95 hover:bg-amber-50 disabled:opacity-40 disabled:active:scale-100"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-lg font-semibold tabular-nums">
                  {room.breakfast_guests ?? 2}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      breakfast_guests: Math.min(12, (room.breakfast_guests ?? 2) + 1),
                    })
                  }
                  disabled={(room.breakfast_guests ?? 2) >= 12}
                  aria-label="Più ospiti"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-300 bg-white text-amber-700 transition active:scale-95 hover:bg-amber-50 disabled:opacity-40 disabled:active:scale-100"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {room.status !== "pulita" && (
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
        )}

        <p className="text-center text-xs text-zinc-400">
          Aggiornata {timeAgo(room.updated_at, now)}
          {room.updated_by && ` · ${ROLE_LABELS[room.updated_by]}`}
        </p>
      </div>
    </div>
  );
}
