"use client";

import { useMemo, useState } from "react";
import { useNotes } from "@/hooks/useNotes";
import { useRooms } from "@/hooks/useRooms";
import { useShopping } from "@/hooks/useShopping";
import { useTick } from "@/hooks/useTick";
import { GROUP_META, GROUP_ORDER, roomLabel } from "@/lib/groups";
import { STATUS_META } from "@/lib/status";
import type { Room, RoomGroup, RoomStatus } from "@/lib/types";
import { BottomNav } from "./BottomNav";
import {
  CartIcon,
  ChartIcon,
  CoffeeIcon,
  NoteIcon,
  PersonIcon,
} from "./icons";
import { NoteComposer } from "./NoteComposer";
import { NotesPanel } from "./NotesPanel";
import { ShoppingPanel } from "./ShoppingPanel";
import { Toast } from "./Toast";

type Tab = "panoramica" | "spesa" | "note";

const TITLES: Record<Tab, string> = {
  panoramica: "Panoramica",
  spesa: "Spesa",
  note: "Note",
};

const dateFormat = new Intl.DateTimeFormat("it-IT", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

const CLEAN_FLOW: RoomStatus[] = ["da_pulire", "in_pulizia", "pulita"];

interface GroupStat {
  group: RoomGroup;
  rooms: Room[];
  total: number;
  counts: Record<RoomStatus, number>;
  urgent: number;
}

export function AdminView({ onSignOut }: { onSignOut: () => void }) {
  const { rooms, loading } = useRooms(true);
  const notes = useNotes(true);
  const shopping = useShopping(true);
  const now = useTick(60_000);
  const [tab, setTab] = useState<Tab>("panoramica");
  const [composerOpen, setComposerOpen] = useState(false);

  const stats = useMemo(() => {
    const by = { pulita: 0, da_pulire: 0, in_pulizia: 0, urgent: 0 };
    for (const r of rooms) {
      by[r.status]++;
      if (r.urgent) by.urgent++;
    }
    return by;
  }, [rooms]);

  const groupStats = useMemo<GroupStat[]>(
    () =>
      GROUP_ORDER.map((group) => {
        const groupRooms = rooms.filter((r) => r.room_group === group);
        const counts: Record<RoomStatus, number> = {
          pulita: 0,
          da_pulire: 0,
          in_pulizia: 0,
        };
        let urgent = 0;
        for (const r of groupRooms) {
          counts[r.status]++;
          if (r.urgent) urgent++;
        }
        return { group, rooms: groupRooms, total: groupRooms.length, counts, urgent };
      }).filter((g) => g.total > 0),
    [rooms],
  );

  const breakfastRooms = useMemo(() => rooms.filter((r) => r.breakfast), [rooms]);
  const breakfastGuests = breakfastRooms.reduce(
    (n, r) => n + (r.breakfast_guests ?? 0),
    0,
  );

  const pendingShopping = useMemo(
    () => shopping.items.filter((i) => !i.purchased_at),
    [shopping.items],
  );
  const openNotes = useMemo(
    () => notes.notes.filter((n) => !n.resolved_at),
    [notes.notes],
  );

  const catalogNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of shopping.catalog) map.set(c.id, c.name);
    return map;
  }, [shopping.catalog]);

  const date = dateFormat.format(new Date(now));

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-semibold leading-tight">{TITLES[tab]}</h1>
            {tab === "panoramica" && (
              <p className="text-xs capitalize text-zinc-400">{date}</p>
            )}
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        {tab === "note" ? (
          <NotesPanel
            rooms={rooms}
            now={now}
            notes={notes.notes}
            loading={notes.loading}
            onAddNote={() => setComposerOpen(true)}
            onResolve={(id) => notes.setResolved(id, true, "admin")}
            onReopen={(id) => notes.setResolved(id, false, "admin")}
            onDelete={notes.deleteNote}
          />
        ) : tab === "spesa" ? (
          <ShoppingPanel
            catalog={shopping.catalog}
            items={shopping.items}
            loading={shopping.loading}
            now={now}
            onAdd={(catalogItemId) => shopping.addItem(catalogItemId, "admin")}
            onSetQuantity={shopping.setQuantity}
            onSetComment={shopping.setComment}
            onSetPurchased={(id, purchased) =>
              shopping.setPurchased(id, purchased, "admin")
            }
            onClearPurchased={shopping.clearPurchased}
          />
        ) : loading ? (
          <p className="py-20 text-center text-zinc-400">Caricamento…</p>
        ) : (
          <div className="flex flex-col gap-6">
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Camere
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile label="Da pulire" value={stats.da_pulire} status="da_pulire" />
                <StatTile label="In pulizia" value={stats.in_pulizia} status="in_pulizia" />
                <StatTile label="Pulite" value={stats.pulita} status="pulita" />
                <StatTile label="Urgenti" value={stats.urgent} swatch="bg-red-500" />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Per categoria
              </h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {groupStats.map((g) =>
                  GROUP_META[g.group].single
                    ? g.rooms.map((r) => <SingleSpaceCard key={r.id} room={r} />)
                    : <GroupCard key={g.group} stat={g} />,
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Oggi
              </h2>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="card-shadow rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center gap-2 text-amber-800">
                    <CoffeeIcon className="h-5 w-5" />
                    <p className="font-semibold">Colazione</p>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-amber-900">
                    {breakfastRooms.length}{" "}
                    <span className="text-base font-medium text-amber-700">
                      {breakfastRooms.length === 1 ? "camera" : "camere"}
                    </span>{" "}
                    · {breakfastGuests}{" "}
                    <span className="text-base font-medium text-amber-700">
                      {breakfastGuests === 1 ? "ospite" : "ospiti"}
                    </span>
                  </p>
                  {breakfastRooms.length === 0 ? (
                    <p className="mt-2 text-sm text-amber-700/80">
                      Nessuna camera con colazione.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {breakfastRooms.map((r) => (
                        <BreakfastChip key={r.id} room={r} />
                      ))}
                    </div>
                  )}
                </div>

                <SummaryCard
                  icon={<CartIcon className="h-5 w-5" />}
                  title="Spesa"
                  count={pendingShopping.length}
                  countLabel={
                    pendingShopping.length === 1
                      ? "articolo da comprare"
                      : "articoli da comprare"
                  }
                  preview={
                    pendingShopping.length === 0
                      ? "Niente da comprare."
                      : previewList(
                          pendingShopping.map(
                            (i) => catalogNames.get(i.catalog_item_id) ?? "Articolo",
                          ),
                        )
                  }
                  onOpen={() => setTab("spesa")}
                />

                <SummaryCard
                  icon={<NoteIcon className="h-5 w-5" />}
                  title="Note"
                  count={openNotes.length}
                  countLabel={openNotes.length === 1 ? "nota aperta" : "note aperte"}
                  preview={
                    openNotes.length === 0
                      ? "Nessuna nota aperta."
                      : previewList(openNotes.map((n) => n.text))
                  }
                  onOpen={() => setTab("note")}
                />
              </div>
            </section>
          </div>
        )}
      </main>

      <BottomNav
        tabs={[
          { key: "panoramica", label: "Panoramica", icon: <ChartIcon className="h-6 w-6" /> },
          { key: "spesa", label: "Spesa", icon: <CartIcon className="h-6 w-6" />, badge: pendingShopping.length },
          { key: "note", label: "Note", icon: <NoteIcon className="h-6 w-6" />, badge: openNotes.length },
        ]}
        active={tab}
        onSelect={setTab}
      />

      {composerOpen && (
        <NoteComposer
          rooms={rooms}
          onClose={() => setComposerOpen(false)}
          onSubmit={(text, roomId) => notes.addNote(text, roomId, "admin")}
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

function previewList(names: string[]): string {
  const shown = names.slice(0, 3);
  const rest = names.length - shown.length;
  return shown.join(", ") + (rest > 0 ? ` e altri ${rest}` : "");
}

function StatTile({
  label,
  value,
  status,
  swatch,
}: {
  label: string;
  value: number;
  status?: RoomStatus;
  swatch?: string;
}) {
  return (
    <div className="card-shadow rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-500">
        <span
          className={`h-2 w-2 rounded-full ${status ? STATUS_META[status].swatch : swatch}`}
        />
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function GroupCard({ stat }: { stat: GroupStat }) {
  const { group, total, counts, urgent } = stat;
  return (
    <div className="card-shadow rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-semibold">{GROUP_META[group].label}</p>
        <p className="text-sm text-zinc-400">
          <span className="font-semibold tabular-nums text-zinc-700">{counts.pulita}</span>
          <span className="tabular-nums">/{total}</span> pulite
        </p>
      </div>

      <div className="mt-3 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-zinc-100">
        {CLEAN_FLOW.map((s) =>
          counts[s] > 0 ? (
            <div key={s} className={STATUS_META[s].swatch} style={{ flexGrow: counts[s] }} />
          ) : null,
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5">
        {CLEAN_FLOW.map((s) =>
          counts[s] > 0 ? <StatusCount key={s} status={s} value={counts[s]} /> : null,
        )}
        {urgent > 0 && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="tabular-nums">{urgent}</span> urgenti
          </span>
        )}
      </div>
    </div>
  );
}

function StatusCount({ status, value }: { status: RoomStatus; value: number }) {
  const meta = STATUS_META[status];
  const label = status === "pulita" ? (value === 1 ? "Pulita" : "Pulite") : meta.label;
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600">
      <span className={`h-2 w-2 rounded-full ${meta.swatch}`} />
      <span className="tabular-nums">{value}</span> {label}
    </span>
  );
}

function SingleSpaceCard({ room }: { room: Room }) {
  const meta = STATUS_META[room.status];
  return (
    <div className="card-shadow flex items-center justify-between gap-2 rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="font-semibold">{room.name}</p>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.card} ${meta.text}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.swatch}`} />
        {meta.label}
        {room.urgent && <span className="ml-0.5 text-red-600">· Urgente</span>}
      </span>
    </div>
  );
}

function BreakfastChip({ room }: { room: Room }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-900">
      {roomLabel(room)}
      <span className="inline-flex items-center gap-0.5 text-amber-600">
        <PersonIcon className="h-3 w-3" />
        {room.breakfast_guests ?? "—"}
      </span>
    </span>
  );
}

function SummaryCard({
  icon,
  title,
  count,
  countLabel,
  preview,
  onOpen,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  countLabel: string;
  preview: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card-shadow flex flex-col items-start rounded-2xl border border-zinc-200 bg-white p-4 text-left transition active:scale-[0.99] hover:bg-zinc-50"
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-zinc-700">
          {icon}
          <p className="font-semibold">{title}</p>
        </div>
        <span className="text-sm font-medium text-zinc-400">Apri →</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {count}{" "}
        <span className="text-base font-medium text-zinc-500">{countLabel}</span>
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{preview}</p>
    </button>
  );
}
