"use client";

import { useMemo, useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import { useRooms } from "@/hooks/useRooms";
import { useShopping } from "@/hooks/useShopping";
import { useTick } from "@/hooks/useTick";
import { GROUP_META, GROUP_ORDER } from "@/lib/groups";
import type { Room } from "@/lib/types";
import { BottomNav } from "./BottomNav";
import { CartIcon, CoffeeIcon, NoteIcon, PersonIcon } from "./icons";
import { NoteComposer } from "./NoteComposer";
import { NotesPanel } from "./NotesPanel";
import { ShoppingPanel } from "./ShoppingPanel";
import { Toast } from "./Toast";

type Tab = "colazione" | "spesa" | "note";

const TITLES: Record<Tab, string> = {
  colazione: "Colazione",
  spesa: "Spesa",
  note: "Note",
};

export function ColazioneView({ onSignOut }: { onSignOut: () => void }) {
  const { rooms, loading } = useRooms(true);
  const notes = useNotes(true);
  const shopping = useShopping(true);
  const now = useTick(60_000);
  const [tab, setTab] = useState<Tab>("colazione");
  const [composerOpen, setComposerOpen] = useState(false);

  const breakfastRooms = useMemo(
    () => rooms.filter((r) => r.breakfast),
    [rooms],
  );
  const totalGuests = breakfastRooms.reduce(
    (n, r) => n + (r.breakfast_guests ?? 0),
    0,
  );

  const pendingCount = shopping.items.reduce(
    (n, i) => n + (i.purchased_at ? 0 : 1),
    0,
  );
  const openNotes = notes.notes.reduce((n, note) => n + (note.resolved_at ? 0 : 1), 0);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <h1 className="flex items-center gap-2 text-xl font-semibold leading-tight">
            {TITLES[tab]}
            {tab === "colazione" && !loading && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold tabular-nums text-amber-700">
                {breakfastRooms.length}
              </span>
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
        {tab === "note" ? (
          <NotesPanel
            rooms={rooms}
            now={now}
            notes={notes.notes}
            loading={notes.loading}
            onAddNote={() => setComposerOpen(true)}
            onResolve={(id) => notes.setResolved(id, true, "colazione")}
            onReopen={(id) => notes.setResolved(id, false, "colazione")}
            onDelete={notes.deleteNote}
          />
        ) : tab === "spesa" ? (
          <ShoppingPanel
            catalog={shopping.catalog}
            items={shopping.items}
            loading={shopping.loading}
            now={now}
            onAdd={(catalogItemId) => shopping.addItem(catalogItemId, "colazione")}
            onSetQuantity={shopping.setQuantity}
            onSetComment={shopping.setComment}
            onSetPurchased={(id, purchased) =>
              shopping.setPurchased(id, purchased, "colazione")
            }
            onClearPurchased={shopping.clearPurchased}
          />
        ) : loading ? (
          <p className="py-20 text-center text-zinc-400">Caricamento camere…</p>
        ) : breakfastRooms.length === 0 ? (
          <NoBreakfast />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="card-shadow flex items-stretch rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex flex-1 flex-col items-center gap-1">
                <p className="text-4xl font-semibold tabular-nums text-amber-900">
                  {breakfastRooms.length}
                </p>
                <p className="text-sm font-medium text-amber-700">
                  {breakfastRooms.length === 1 ? "Camera" : "Camere"}
                </p>
              </div>
              <div className="w-px bg-amber-200" />
              <div className="flex flex-1 flex-col items-center gap-1">
                <p className="text-4xl font-semibold tabular-nums text-amber-900">
                  {totalGuests}
                </p>
                <p className="text-sm font-medium text-amber-700">
                  {totalGuests === 1 ? "Ospite" : "Ospiti"}
                </p>
              </div>
            </div>

            {GROUP_ORDER.map((group) => (
              <BreakfastSection
                key={group}
                group={group}
                rooms={breakfastRooms.filter((r) => r.room_group === group)}
              />
            ))}
          </div>
        )}
      </main>

      <BottomNav
        tabs={[
          { key: "colazione", label: "Colazione", icon: <CoffeeIcon className="h-6 w-6" /> },
          { key: "spesa", label: "Spesa", icon: <CartIcon className="h-6 w-6" />, badge: pendingCount },
          { key: "note", label: "Note", icon: <NoteIcon className="h-6 w-6" />, badge: openNotes },
        ]}
        active={tab}
        onSelect={setTab}
      />

      {composerOpen && (
        <NoteComposer
          rooms={rooms}
          onClose={() => setComposerOpen(false)}
          onSubmit={(text, roomId) => notes.addNote(text, roomId, "colazione")}
        />
      )}

      {notes.saveError && (
        <Toast message={notes.saveError} onDismiss={notes.dismissSaveError} />
      )}
      {shopping.saveError && (
        <Toast message={shopping.saveError} onDismiss={shopping.dismissSaveError} />
      )}
    </div>
  );
}

function BreakfastSection({ group, rooms }: { group: Room["room_group"]; rooms: Room[] }) {
  if (rooms.length === 0) return null;
  const { label, single } = GROUP_META[group];
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {label}
        <span className="font-normal text-zinc-400">{rooms.length}</span>
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => (
          <li
            key={r.id}
            className="card-shadow flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5"
          >
            {single ? (
              <span className="text-base font-semibold">{r.name}</span>
            ) : (
              <span className="text-xl font-semibold tabular-nums">{r.name}</span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-amber-800">
              <PersonIcon className="h-3.5 w-3.5" />
              {r.breakfast_guests ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NoBreakfast() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <CoffeeIcon className="h-8 w-8 text-amber-600" />
      </div>
      <p className="text-lg font-semibold">Nessuna colazione</p>
      <p className="max-w-xs text-sm text-zinc-500">
        La reception non ha ancora segnato camere con colazione.
      </p>
    </div>
  );
}
