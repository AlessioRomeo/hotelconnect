import type { RoomGroup } from "./types";

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
