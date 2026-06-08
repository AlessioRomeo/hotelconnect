export type RoomGroup = "hotel" | "bnb" | "sala";

export type RoomStatus = "pulita" | "da_pulire" | "in_pulizia";

export type Role = "reception" | "pulizie";

export type ServiceType = "fermata" | "partenza";

export interface Room {
  id: string;
  name: string;
  room_group: RoomGroup;
  status: RoomStatus;
  urgent: boolean;
  service_type: ServiceType | null;
  do_not_disturb: boolean;
  guest_in_room: boolean;
  note: string | null;
  updated_at: string; // ISO timestamp
  updated_by: Role | null;
  sort_order: number;
}

export const STATUS_LABELS: Record<RoomStatus, string> = {
  pulita: "Pulita",
  da_pulire: "Da pulire",
  in_pulizia: "In pulizia",
};

export const ROLE_LABELS: Record<Role, string> = {
  reception: "Reception",
  pulizie: "Pulizie",
};

// A free-standing note/segnalazione (e.g. "Lampadina fulminata"). Independent of
// room status; optionally tied to a room. Resolved ones are kept for tracking.
// "Resolved" is derived from resolved_at being set (no separate boolean).
export interface Note {
  id: string;
  text: string;
  room_id: string | null;
  created_at: string; // ISO timestamp
  created_by: Role | null;
  resolved_at: string | null; // null = aperta; ISO timestamp once risolta
  resolved_by: Role | null;
}
