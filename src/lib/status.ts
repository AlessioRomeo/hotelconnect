// Display metadata for room statuses, kept out of `types.ts` so the domain
// types stay free of UI concerns. Shared by the reception and cleaning views.
import type { RoomStatus } from "./types";

export interface StatusMeta {
  label: string;
  card: string; // card background + border — the whole card carries the color
  text: string; // status label text color
  swatch: string; // solid dot color
  ring: string; // ring color when this status is selected
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
    card: "border-amber-300 bg-amber-100",
    text: "text-amber-800",
    swatch: "bg-amber-500",
    ring: "ring-amber-500",
  },
  in_pulizia: {
    label: "In pulizia",
    card: "border-blue-300 bg-blue-100",
    text: "text-blue-800",
    swatch: "bg-blue-500",
    ring: "ring-blue-500",
  },
};

// The order statuses appear in the sheet's selector.
export const STATUS_ORDER: RoomStatus[] = ["pulita", "da_pulire", "in_pulizia"];
