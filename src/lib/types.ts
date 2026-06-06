// Shared domain types for HotelConnect.

export type RoomGroup = "hotel" | "bnb";

// Italian status values, matching the DB check constraint.
export type RoomStatus = "pulita" | "da_pulire" | "in_pulizia";

export type Role = "reception" | "pulizie";

export interface Room {
  id: string;
  name: string;
  room_group: RoomGroup;
  status: RoomStatus;
  urgent: boolean;
  note: string | null;
  updated_at: string; // ISO timestamp
  updated_by: Role | null;
  sort_order: number;
}

// Italian labels for statuses, for display.
export const STATUS_LABELS: Record<RoomStatus, string> = {
  pulita: "Pulita",
  da_pulire: "Da pulire",
  in_pulizia: "In pulizia",
};
