"use client";

import { useCallback, useEffect, useState } from "react";
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
      setRooms((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
      const { error } = await supabase
        .from("rooms")
        .update({ ...patch, updated_by: by })
        .eq("id", id);
      return error;
    },
    [],
  );

  return { rooms, loading, updateRoom };
}
