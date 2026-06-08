import type { RoomStatus } from "./types";

export interface StatusMeta {
  label: string;
  card: string;
  text: string;
  swatch: string;
  ring: string;
}

export const STATUS_META: Record<RoomStatus, StatusMeta> = {
  pulita: {
    label: "Pulita",
    card: "border-emerald-200 bg-emerald-50",
    text: "text-emerald-700",
    swatch: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  da_pulire: {
    label: "Da pulire",
    card: "border-orange-300 bg-orange-100",
    text: "text-orange-800",
    swatch: "bg-orange-500",
    ring: "ring-orange-500",
  },
  in_pulizia: {
    label: "In pulizia",
    card: "border-blue-300 bg-blue-100",
    text: "text-blue-800",
    swatch: "bg-blue-500",
    ring: "ring-blue-500",
  },
};

export const STATUS_ORDER: RoomStatus[] = ["pulita", "da_pulire", "in_pulizia"];
