import { GROUP_META } from "@/lib/groups";
import { STATUS_META } from "@/lib/status";
import { timeAgo } from "@/lib/time";
import type { Room } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { ServiceBadge, DndBadge, GuestBadge } from "./RoomTags";

interface RoomCardProps {
  room: Room;
  now: number;
  onSelect: (room: Room) => void;
}

export function RoomCard({ room, now, onSelect }: RoomCardProps) {
  const meta = STATUS_META[room.status];
  const single = GROUP_META[room.room_group].single;
  // Occupied rooms (hidden from cleaning) get a distinct soft-rose "on hold" card
  // (a "do not enter" feel) so reception can clearly tell which "da pulire" rooms
  // aren't shown to cleaners yet; matches the rose occupata badge.
  const cardStyle = room.guest_in_room ? "border-rose-300 bg-rose-100" : meta.card;
  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      className={`card-shadow flex flex-col gap-2 rounded-2xl border p-3 text-left transition active:scale-[0.98] ${cardStyle} ${
        room.urgent ? "ring-2 ring-red-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        {single ? (
          <span className="text-base font-semibold leading-tight">{room.name}</span>
        ) : (
          <span className="text-xl font-semibold tabular-nums">{room.name}</span>
        )}
        {room.urgent && (
          <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Urgente
          </span>
        )}
      </div>

      <StatusBadge status={room.status} />

      {(room.service_type || room.do_not_disturb || room.guest_in_room) && (
        <div className="flex flex-wrap gap-1">
          {room.guest_in_room && <GuestBadge />}
          {room.service_type && <ServiceBadge type={room.service_type} />}
          {room.do_not_disturb && <DndBadge compact />}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-1 text-xs text-zinc-500">
        <span>{timeAgo(room.updated_at, now)}</span>
        {room.note && (
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-label="Nota presente"
          >
            <path d="M4 6h16M4 12h10M4 18h7" />
          </svg>
        )}
      </div>
    </button>
  );
}
