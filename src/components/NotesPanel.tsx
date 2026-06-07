"use client";

import { useMemo, useState } from "react";
import { roomLabel } from "@/lib/groups";
import { timeAgo } from "@/lib/time";
import { ROLE_LABELS, type Note, type Room } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { CheckIcon, PlusIcon, TrashIcon } from "./icons";

interface NotesPanelProps {
  rooms: Room[];
  now: number;
  notes: Note[];
  loading: boolean;
  onAddNote: () => void;
  onResolve: (id: string) => void;
  onReopen: (id: string) => void;
  onDelete: (id: string) => void;
}

// The "Note" tab content: a button to add a note + the notes in chronological
// order (open first, resolved kept below for tracking).
export function NotesPanel({
  rooms,
  now,
  notes,
  loading,
  onAddNote,
  onResolve,
  onReopen,
  onDelete,
}: NotesPanelProps) {
  const [pendingResolve, setPendingResolve] = useState<Note | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const roomById = useMemo(() => {
    const map = new Map<string, Room>();
    for (const r of rooms) map.set(r.id, r);
    return map;
  }, [rooms]);

  const { open, resolved } = useMemo(() => {
    const open = notes
      .filter((n) => !n.resolved_at)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    const resolved = notes
      .filter((n) => n.resolved_at)
      .sort((a, b) => ((a.resolved_at ?? "") < (b.resolved_at ?? "") ? 1 : -1));
    return { open, resolved };
  }, [notes]);

  const roomOf = (note: Note) => (note.room_id ? roomById.get(note.room_id) ?? null : null);

  return (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={onAddNote}
        className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3.5 text-base font-semibold text-white transition active:scale-[0.99] hover:bg-zinc-800 sm:self-start sm:px-6"
      >
        <PlusIcon className="h-5 w-5" />
        Aggiungi nota
      </button>

      {loading ? (
        <p className="py-16 text-center text-zinc-400">Caricamento note…</p>
      ) : open.length === 0 && resolved.length === 0 ? (
        <Empty />
      ) : (
        <>
          {open.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Da risolvere <span className="font-normal text-zinc-400">{open.length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {open.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    room={roomOf(note)}
                    now={now}
                    onResolve={() => setPendingResolve(note)}
                    onDelete={() => setPendingDelete(note)}
                  />
                ))}
              </ul>
            </section>
          )}

          {resolved.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowResolved((v) => !v)}
                className="flex w-full items-center justify-between text-sm font-semibold uppercase tracking-wide text-zinc-500"
              >
                <span>
                  Risolte <span className="font-normal text-zinc-400">{resolved.length}</span>
                </span>
                <span className="text-zinc-400">{showResolved ? "Nascondi" : "Mostra"}</span>
              </button>
              {showResolved && (
                <ul className="mt-3 flex flex-col gap-2">
                  {resolved.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      room={roomOf(note)}
                      now={now}
                      onReopen={() => onReopen(note.id)}
                      onDelete={() => setPendingDelete(note)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {pendingResolve && (
        <ConfirmDialog
          title="Segnare questa nota come risolta?"
          message="Resterà salvata tra le note risolte."
          confirmLabel="Sì, risolta"
          onConfirm={() => {
            onResolve(pendingResolve.id);
            setPendingResolve(null);
          }}
          onCancel={() => setPendingResolve(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Eliminare questa nota?"
          message="L'operazione non può essere annullata."
          confirmLabel="Sì, elimina"
          destructive
          onConfirm={() => {
            onDelete(pendingDelete.id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}

interface NoteRowProps {
  note: Note;
  room: Room | null;
  now: number;
  onResolve?: () => void;
  onReopen?: () => void;
  onDelete: () => void;
}

function NoteRow({ note, room, now, onResolve, onReopen, onDelete }: NoteRowProps) {
  const isResolved = !!note.resolved_at;

  // Resolved notes: compact row, small "Riapri" + delete (left as-is).
  if (isResolved) {
    return (
      <li className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 text-[15px] leading-snug text-zinc-400 line-through">
            {note.text}
          </p>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
            {room ? roomLabel(room) : "Generale"}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400">
            {`Risolta ${timeAgo(note.resolved_at!, now)}${
              note.resolved_by ? ` · ${ROLE_LABELS[note.resolved_by]}` : ""
            }`}
          </p>
          <div className="flex items-center gap-1">
            {onReopen && (
              <button
                type="button"
                onClick={onReopen}
                className="rounded-full px-2.5 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100"
              >
                Riapri
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              aria-label="Elimina nota"
              title="Elimina"
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </li>
    );
  }

  // Open notes: two big 50/50 actions at the bottom of the card.
  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="flex-1 text-[15px] leading-snug text-zinc-900">{note.text}</p>
        <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
          {room ? roomLabel(room) : "Generale"}
        </span>
      </div>

      <p className="text-xs text-zinc-400">
        {`Aggiunta ${timeAgo(note.created_at, now)}${
          note.created_by ? ` · ${ROLE_LABELS[note.created_by]}` : ""
        }`}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onResolve}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-emerald-700"
        >
          <CheckIcon className="h-4 w-4" />
          Risolvi
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-600 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-red-700"
        >
          <TrashIcon className="h-4 w-4" />
          Elimina
        </button>
      </div>
    </li>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
        <CheckIcon className="h-7 w-7 text-zinc-400" />
      </div>
      <p className="font-semibold">Nessuna nota</p>
      <p className="max-w-xs text-sm text-zinc-500">
        Aggiungi una nota per segnalare un problema o un promemoria.
      </p>
    </div>
  );
}
