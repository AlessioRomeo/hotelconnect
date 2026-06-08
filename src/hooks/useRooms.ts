"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Role, Room } from "@/lib/types";

function sortRooms(a: Room, b: Room): number {
  if (a.room_group !== b.room_group) return a.room_group < b.room_group ? -1 : 1;
  return a.sort_order - b.sort_order;
}

export function useRooms(enabled: boolean) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const updateRoom = useCallback(
    async (id: string, patch: Partial<Room>, by: Role) => {
      let next: Partial<Room> = patch;
      if (patch.status === "pulita") {
        // A clean room carries nothing over: a room note only lives while the
        // room needs cleaning. For a permanent note, use the Note tab instead.
        next = {
          ...patch,
          urgent: false,
          service_type: null,
          do_not_disturb: false,
          guest_in_room: false,
          note: null,
        };
      } else if (patch.status === "in_pulizia") {
        next = { ...patch, do_not_disturb: false };
      }
      const prevRoom = roomsRef.current.find((r) => r.id === id);
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...next } : r)),
      );
      const { error } = await supabase
        .from("rooms")
        .update({ ...next, updated_by: by })
        .eq("id", id);
      if (error && prevRoom) {
        setRooms((prev) => prev.map((r) => (r.id === id ? prevRoom : r)));
        setSaveError("Modifica non salvata. Controlla la connessione.");
      }
      return error;
    },
    [],
  );

  return { rooms, loading, updateRoom, saveError, dismissSaveError };
}
