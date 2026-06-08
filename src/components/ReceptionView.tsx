"use client";

import { useMemo, useState } from "react";
import { useRooms } from "@/hooks/useRooms";
import { useNotes } from "@/hooks/useNotes";
import { useTick } from "@/hooks/useTick";
import { GROUP_META, GROUP_ORDER } from "@/lib/groups";
import type { Room, RoomGroup, RoomStatus } from "@/lib/types";
import { RoomCard } from "./RoomCard";
import { RoomSheet } from "./RoomSheet";
import { NotesPanel } from "./NotesPanel";
import { NoteComposer } from "./NoteComposer";
import { BottomNav, type Tab } from "./BottomNav";
import { Toast } from "./Toast";

type FilterKey = "all" | RoomStatus | "urgent";

const FILTERS: { key: FilterKey; label: string; dot?: string }[] = [
  { key: "all", label: "Tutte" },
  { key: "da_pulire", label: "Da pulire", dot: "bg-amber-500" },
  { key: "in_pulizia", label: "In pulizia", dot: "bg-blue-500" },
  { key: "pulita", label: "Pulite", dot: "bg-emerald-500" },
  { key: "urgent", label: "Urgenti", dot: "bg-red-500" },
];

export function ReceptionView({ onSignOut }: { onSignOut: () => void }) {
  const { rooms, loading, updateRoom, saveError, dismissSaveError } = useRooms(true);
  const notes = useNotes(true);
  const now = useTick(60_000);
  const [tab, setTab] = useState<Tab>("rooms");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const counts = useMemo(() => {
    const by = { all: rooms.length, urgent: 0, pulita: 0, da_pulire: 0, in_pulizia: 0 };
    for (const r of rooms) {
      by[r.status]++;
      if (r.urgent) by.urgent++;
    }
    return by as Record<FilterKey, number>;
  }, [rooms]);

  const openNotes = notes.notes.reduce((n, note) => n + (note.resolved_at ? 0 : 1), 0);

  const matches = (r: Room) =>
    filter === "all" ? true : filter === "urgent" ? r.urgent : r.status === filter;

  const sections = GROUP_ORDER.map((group) => ({
    group,
    rooms: rooms.filter((r) => r.room_group === group && matches(r)),
  }));
  const isEmpty = sections.every((s) => s.rooms.length === 0);
  const selected = selectedId ? rooms.find((r) => r.id === selectedId) ?? null : null;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold leading-tight">
            {tab === "notes" ? "Note" : "Camere"}
          </h1>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Esci
          </button>
        </div>

        {tab === "rooms" && (
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilter(f.key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {f.dot && <span className={`h-2 w-2 rounded-full ${f.dot}`} />}
                    {f.label}
                    <span className={active ? "text-white/70" : "text-zinc-400"}>
                      {counts[f.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {tab === "notes" ? (
          <NotesPanel
            rooms={rooms}
            now={now}
            notes={notes.notes}
            loading={notes.loading}
            onAddNote={() => setComposerOpen(true)}
            onResolve={(id) => notes.setResolved(id, true, "reception")}
            onReopen={(id) => notes.setResolved(id, false, "reception")}
            onDelete={notes.deleteNote}
          />
        ) : loading ? (
          <p className="py-20 text-center text-zinc-400">Caricamento camere…</p>
        ) : isEmpty ? (
          <p className="py-20 text-center text-zinc-400">
            Nessuna camera in questa categoria.
          </p>
        ) : (
          <div className="flex flex-col gap-7">
            {sections.map(({ group, rooms }) => (
              <Section
                key={group}
                group={group}
                rooms={rooms}
                now={now}
                onSelect={(r) => setSelectedId(r.id)}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav
        tab={tab}
        onTab={setTab}
        roomsLabel="Camere"
        notesCount={openNotes}
        onAddNote={tab === "rooms" ? () => setComposerOpen(true) : undefined}
      />

      {selected && (
        <RoomSheet
          key={selected.id}
          room={selected}
          now={now}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => updateRoom(selected.id, patch, "reception")}
        />
      )}

      {composerOpen && (
        <NoteComposer
          rooms={rooms}
          onClose={() => setComposerOpen(false)}
          onSubmit={(text, roomId) => notes.addNote(text, roomId, "reception")}
        />
      )}

      {saveError && <Toast message={saveError} onDismiss={dismissSaveError} />}
      {notes.saveError && (
        <Toast message={notes.saveError} onDismiss={notes.dismissSaveError} />
      )}
    </div>
  );
}

function Section({
  group,
  rooms,
  now,
  onSelect,
}: {
  group: RoomGroup;
  rooms: Room[];
  now: number;
  onSelect: (room: Room) => void;
}) {
  if (rooms.length === 0) return null;
  const { label, single } = GROUP_META[group];
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {label}
        <span className="font-normal text-zinc-400">{rooms.length}</span>
      </h2>
      <div
        className={
          single
            ? "grid grid-cols-1 gap-3 sm:max-w-sm"
            : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
        }
      >
        {rooms.map((r) => (
          <RoomCard key={r.id} room={r} now={now} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
