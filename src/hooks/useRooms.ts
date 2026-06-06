"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Role, Room } from "@/lib/types";

function sortRooms(a: Room, b: Room): number {
  if (a.room_group !== b.room_group) return a.room_group < b.room_group ? -1 : 1;
  return a.sort_order - b.sort_order;
}

// Loads all rooms once, then subscribes to realtime changes so every connected
// device stays in sync. `enabled` should be true only once authenticated
// (RLS blocks reads and realtime delivery otherwise).
export function useRooms(enabled: boolean) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Mirror of `rooms` so updateRoom can read the pre-edit value synchronously
  // (to roll back) without depending on it and being recreated every change.
  const roomsRef = useRef<Room[]>([]);
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  const dismissSaveError = useCallback(() => setSaveError(null), []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_group")
        .order("sort_order");
      if (active && !error && data) {
        setRooms(data as Room[]);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel("rooms-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        (payload) => {
          setRooms((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Room].sort(sortRooms);
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Room;
              return prev.map((r) => (r.id === next.id ? next : r));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<Room>;
              return prev.filter((r) => r.id !== old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  // Optimistically update the local row first, then persist. The realtime echo
  // will reconcile to the authoritative server value.
  const updateRoom = useCallback(
    async (id: string, patch: Partial<Room>, by: Role) => {
      // Invariant: a clean room is never urgent — urgent only means "needs
      // cleaning right away", so it makes no sense once a room is pulita.
      // Enforced here so every caller (both views) obeys it.
      const next: Partial<Room> =
        patch.status === "pulita" ? { ...patch, urgent: false } : patch;
      const prevRoom = roomsRef.current.find((r) => r.id === id);
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...next } : r)),
      );
      const { error } = await supabase
        .from("rooms")
        .update({ ...next, updated_by: by })
        .eq("id", id);
      if (error && prevRoom) {
        // The write failed (e.g. dropped wifi) — undo the optimistic change so
        // the screen reflects reality, and tell the user it didn't save.
        setRooms((prev) => prev.map((r) => (r.id === id ? prevRoom : r)));
        setSaveError("Modifica non salvata. Controlla la connessione.");
      }
      return error;
    },
    [],
  );

  return { rooms, loading, updateRoom, saveError, dismissSaveError };
}
