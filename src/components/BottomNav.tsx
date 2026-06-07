"use client";

import type { ReactNode } from "react";
import { GridIcon, NoteIcon } from "./icons";

export type Tab = "rooms" | "notes";

interface BottomNavProps {
  tab: Tab;
  onTab: (tab: Tab) => void;
  roomsLabel: string;
  notesCount: number;
}

// Bottom tab bar — the obvious, phone-friendly way to switch between the rooms
// list and the notes. Kept separate from the top filters on purpose.
export function BottomNav({ tab, onTab, roomsLabel, notesCount }: BottomNavProps) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex w-full max-w-5xl">
        <NavItem
          active={tab === "rooms"}
          onClick={() => onTab("rooms")}
          label={roomsLabel}
          icon={<GridIcon className="h-6 w-6" />}
        />
        <NavItem
          active={tab === "notes"}
          onClick={() => onTab("notes")}
          label="Note"
          icon={<NoteIcon className="h-6 w-6" />}
          badge={notesCount}
        />
      </div>
    </nav>
  );
}

function NavItem({
  active,
  onClick,
  label,
  icon,
  badge = 0,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: ReactNode;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className="flex flex-1 flex-col items-center gap-1 py-2"
    >
      <span
        className={`relative flex h-8 w-16 items-center justify-center rounded-full transition ${
          active ? "bg-zinc-900 text-white" : "text-zinc-500"
        }`}
      >
        {icon}
        {badge > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold tabular-nums text-white">
            {badge}
          </span>
        )}
      </span>
      <span className={`text-xs font-medium ${active ? "text-zinc-900" : "text-zinc-500"}`}>
        {label}
      </span>
    </button>
  );
}
