"use client";

import { useMemo, useState } from "react";
import { useRooms } from "@/hooks/useRooms";
import { useNotes } from "@/hooks/useNotes";
import { useTick } from "@/hooks/useTick";
import { GROUP_META } from "@/lib/groups";
import { STATUS_META } from "@/lib/status";
import { timeAgo } from "@/lib/time";
import type { Room, RoomStatus } from "@/lib/types";
import { Toast } from "./Toast";
import { NotesPanel } from "./NotesPanel";
import { NoteComposer } from "./NoteComposer";
import { BottomNav, type Tab } from "./BottomNav";
import { ConfirmDialog } from "./ConfirmDialog";
import { ServiceBadge, DndBadge } from "./RoomTags";
import { DoNotDisturbIcon } from "./icons";

const NEEDS_WORK: RoomStatus[] = ["da_pulire", "in_pulizia"];

const STATUS_RANK: Record<RoomStatus, number> = {
  da_pulire: 0,
  in_pulizia: 1,
  pulita: 2,
};

function cleaningSort(a: Room, b: Room): number {
  if (a.do_not_disturb !== b.do_not_disturb) return a.do_not_disturb ? 1 : -1;
  if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
  if (a.status !== b.status) return STATUS_RANK[a.status] - STATUS_RANK[b.status];
  if (a.room_group !== b.room_group)
    return GROUP_META[a.room_group].order - GROUP_META[b.room_group].order;
  return a.sort_order - b.sort_order;
}

export function CleaningView({ onSignOut }: { onSignOut: () => void }) {
  const { rooms, loading, updateRoom, saveError, dismissSaveError } = useRooms(true);
  const notes = useNotes(true);
  const now = useTick(60_000);
  const [tab, setTab] = useState<Tab>("rooms");
  const [pendingClean, setPendingClean] = useState<Room | null>(null);
  const [pendingDnd, setPendingDnd] = useState<Room | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const todo = useMemo(
    // Rooms with a guest still inside (reception flag) stay hidden until cleared.
    () =>
      rooms
        .filter((r) => NEEDS_WORK.includes(r.status) && !r.guest_in_room)
        .sort(cleaningSort),
    [rooms],
  );

  const openNotes = notes.notes.reduce((n, note) => n + (note.resolved_at ? 0 : 1), 0);

  const setStatus = (room: Room, status: RoomStatus) => {
    updateRoom(room.id, { status }, "pulizie");
  };

  const setDnd = (room: Room, value: boolean) => {
    updateRoom(room.id, { do_not_disturb: value }, "pulizie");
  };

  const confirmClean = () => {
    if (pendingClean) setStatus(pendingClean, "pulita");
    setPendingClean(null);
  };

  const confirmDnd = () => {
    if (pendingDnd) setDnd(pendingDnd, true);
    setPendingDnd(null);
  };

  const roomLabel = (room: Room) =>
    GROUP_META[room.room_group].single ? room.name : `la camera ${room.name}`;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="flex items-center gap-2 text-xl font-semibold leading-tight">
            {tab === "notes" ? (
              "Note"
            ) : (
              <>
                Da pulire
                {!loading && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-sm font-semibold tabular-nums text-emerald-700">
                    {todo.length}
                  </span>
                )}
              </>
            )}
          </h1>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Esci
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {tab === "notes" ? (
          <NotesPanel
            rooms={rooms}
            now={now}
            notes={notes.notes}
            loading={notes.loading}
            onAddNote={() => setComposerOpen(true)}
            onResolve={(id) => notes.setResolved(id, true, "pulizie")}
            onReopen={(id) => notes.setResolved(id, false, "pulizie")}
            onDelete={notes.deleteNote}
          />
        ) : loading ? (
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
                onRequestClean={setPendingClean}
                onRequestDnd={setPendingDnd}
                onSetDnd={setDnd}
              />
            ))}
          </div>
        )}
      </main>

      {pendingClean && (
        <ConfirmDialog
          title={`Vuoi davvero segnare ${roomLabel(pendingClean)} come pulita?`}
          message="Sparirà dalla lista delle pulizie."
          confirmLabel="Sì, è pulita"
          onConfirm={confirmClean}
          onCancel={() => setPendingClean(null)}
        />
      )}

      {pendingDnd && (
        <ConfirmDialog
          title={`Segnare ${roomLabel(pendingDnd)} come "Non disturbare"?`}
          message="Resterà da pulire, in fondo alla lista."
          confirmLabel="Sì, non disturbare"
          onConfirm={confirmDnd}
          onCancel={() => setPendingDnd(null)}
        />
      )}

      <BottomNav
        tab={tab}
        onTab={setTab}
        roomsLabel="Pulizie"
        notesCount={openNotes}
        onAddNote={tab === "rooms" ? () => setComposerOpen(true) : undefined}
      />

      {composerOpen && (
        <NoteComposer
          rooms={rooms}
          onClose={() => setComposerOpen(false)}
          onSubmit={(text, roomId) => notes.addNote(text, roomId, "pulizie")}
        />
      )}

      {saveError && <Toast message={saveError} onDismiss={dismissSaveError} />}
      {notes.saveError && (
        <Toast message={notes.saveError} onDismiss={notes.dismissSaveError} />
      )}
    </div>
  );
}

interface CleaningCardProps {
  room: Room;
  now: number;
  onSetStatus: (room: Room, status: RoomStatus) => void;
  onRequestClean: (room: Room) => void;
  onRequestDnd: (room: Room) => void;
  onSetDnd: (room: Room, value: boolean) => void;
}

function CleaningCard({ room, now, onSetStatus, onRequestClean, onRequestDnd, onSetDnd }: CleaningCardProps) {
  const meta = STATUS_META[room.status];
  const group = GROUP_META[room.room_group];
  const inProgress = room.status === "in_pulizia";
  const blocked = room.do_not_disturb;

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 ${
        blocked
          ? "border-zinc-300 bg-zinc-100"
          : `${meta.card} ${room.urgent ? "ring-2 ring-red-500" : ""}`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {group.label}
          </p>
          {group.single ? (
            <p className="text-2xl font-semibold leading-tight">{room.name}</p>
          ) : (
            <p className="text-3xl font-semibold leading-none tabular-nums">
              {room.name}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {room.status === "da_pulire" && !blocked && (
            <button
              type="button"
              onClick={() => onRequestDnd(room)}
              aria-label="Segna non disturbare"
              title="Non disturbare"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white/70 text-zinc-400 transition hover:border-red-300 hover:text-red-600 active:scale-95"
            >
              <DoNotDisturbIcon className="h-4 w-4" />
            </button>
          )}
          {blocked && <DndBadge />}
          {room.urgent && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
              Urgente
            </span>
          )}
          {room.service_type && <ServiceBadge type={room.service_type} />}
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${meta.text}`}>
            <span className={`h-2 w-2 rounded-full ${meta.swatch}`} />
            {meta.label}
          </span>
        </div>
      </div>

      {room.note && (
        <p className="rounded-xl bg-white/70 px-3 py-2 text-sm text-zinc-700">
          {room.note}
        </p>
      )}

      <p className="text-xs text-zinc-500">Aggiornata {timeAgo(room.updated_at, now)}</p>

      {blocked ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-600">
            Cliente in camera o cartello esposto.
          </p>
          <button
            type="button"
            onClick={() => onSetDnd(room, false)}
            className="flex h-14 items-center justify-center rounded-2xl border border-zinc-300 bg-white text-base font-semibold text-zinc-700 transition active:scale-[0.98] hover:bg-zinc-50"
          >
            Riprova
          </button>
        </div>
      ) : inProgress ? (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onRequestClean(room)}
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
            onClick={() => onRequestClean(room)}
            className="flex h-14 flex-1 items-center justify-center rounded-2xl border border-emerald-600 bg-white text-base font-semibold text-emerald-700 transition active:scale-[0.98] hover:bg-emerald-50"
          >
            Pulita
          </button>
        </div>
      )}
    </div>
  );
}

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
