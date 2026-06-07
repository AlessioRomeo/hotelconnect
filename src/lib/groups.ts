import type { Room, RoomGroup } from "./types";

export interface GroupMeta {
  label: string;
  order: number;
  single: boolean;
}

export const GROUP_META: Record<RoomGroup, GroupMeta> = {
  hotel: { label: "Hotel", order: 0, single: false },
  bnb: { label: "B&B", order: 1, single: false },
  sala: { label: "Spazi comuni", order: 2, single: true },
};

export const GROUP_ORDER: RoomGroup[] = (
  Object.keys(GROUP_META) as RoomGroup[]
).sort((a, b) => GROUP_META[a].order - GROUP_META[b].order);

// Short human label for a room, e.g. "Hotel 101", "B&B 3", or just the name for
// single-space groups ("Sala colazione").
export function roomLabel(room: Room): string {
  const meta = GROUP_META[room.room_group];
  return meta.single ? room.name : `${meta.label} ${room.name}`;
}
