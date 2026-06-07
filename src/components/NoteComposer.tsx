"use client";

import { useEffect, useRef, useState } from "react";
import { GROUP_META, GROUP_ORDER } from "@/lib/groups";
import type { Room } from "@/lib/types";

interface NoteComposerProps {
  rooms: Room[];
  onClose: () => void;
  onSubmit: (text: string, roomId: string | null) => void;
}

// Same centered-modal shell as ConfirmDialog — just with a text field + room
// picker for adding a note.
export function NoteComposer({ rooms, onClose, onSubmit }: NoteComposerProps) {
  const [text, setText] = useState("");
  const [roomId, setRoomId] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
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

  const trimmed = text.trim();
  const submit = () => {
    if (!trimmed) return;
    onSubmit(trimmed, roomId || null);
    onClose();
  };

  const sections = GROUP_ORDER.map((group) => ({
    group,
    rooms: rooms.filter((r) => r.room_group === group),
  })).filter((s) => s.rooms.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Nuova nota"
    >
      <button
        type="button"
        aria-label="Annulla"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-in rounded-3xl bg-white p-6 text-zinc-900 shadow-xl">
        <h2 className="text-lg font-semibold">Nuova nota</h2>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Es. Lampadina fulminata, lavandino rotto…"
          className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 p-3 text-base outline-none transition focus:border-zinc-400"
        />

        <label htmlFor="note-room" className="mt-3 mb-1.5 block text-sm font-medium text-zinc-500">
          Camera <span className="font-normal text-zinc-400">(facoltativo)</span>
        </label>
        <select
          id="note-room"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="w-full appearance-none rounded-2xl border border-zinc-200 bg-white p-3 text-base outline-none transition focus:border-zinc-400"
        >
          <option value="">Generale (nessuna camera)</option>
          {sections.map(({ group, rooms }) => (
            <optgroup key={group} label={GROUP_META[group].label}>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {GROUP_META[group].single ? r.name : `${GROUP_META[group].label} ${r.name}`}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={!trimmed}
            className="flex h-14 items-center justify-center rounded-2xl bg-emerald-600 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-emerald-700 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            Aggiungi
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-2xl text-base font-medium text-zinc-500 transition hover:bg-zinc-100"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
