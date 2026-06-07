"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Note, Role } from "@/lib/types";

export function useNotes(enabled: boolean) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const notesRef = useRef<Note[]>([]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const dismissSaveError = useCallback(() => setSaveError(null), []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    (async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });
      if (active && !error && data) {
        setNotes(data as Note[]);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel("notes-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notes" },
        (payload) => {
          setNotes((prev) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as Note;
              // Dedupe: our own optimistic insert uses the same client id.
              if (prev.some((n) => n.id === next.id)) return prev;
              return [next, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as Note;
              return prev.map((n) => (n.id === next.id ? next : n));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<Note>;
              return prev.filter((n) => n.id !== old.id);
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

  const addNote = useCallback(
    async (text: string, roomId: string | null, by: Role) => {
      const id = crypto.randomUUID();
      const optimistic: Note = {
        id,
        text,
        room_id: roomId,
        created_at: new Date().toISOString(),
        created_by: by,
        resolved_at: null,
        resolved_by: null,
      };
      setNotes((prev) => (prev.some((n) => n.id === id) ? prev : [optimistic, ...prev]));
      const { error } = await supabase
        .from("notes")
        .insert({ id, text, room_id: roomId, created_by: by });
      if (error) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setSaveError("Nota non salvata. Controlla la connessione.");
      }
      return error;
    },
    [],
  );

  const setResolved = useCallback(
    async (id: string, resolved: boolean, by: Role) => {
      const prevNote = notesRef.current.find((n) => n.id === id);
      const resolved_at = resolved ? new Date().toISOString() : null;
      const resolved_by = resolved ? by : null;
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, resolved_at, resolved_by } : n)),
      );
      const { error } = await supabase
        .from("notes")
        .update({ resolved_at, resolved_by })
        .eq("id", id);
      if (error && prevNote) {
        setNotes((prev) => prev.map((n) => (n.id === id ? prevNote : n)));
        setSaveError("Modifica non salvata. Controlla la connessione.");
      }
      return error;
    },
    [],
  );

  const deleteNote = useCallback(async (id: string) => {
    const prevNote = notesRef.current.find((n) => n.id === id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error && prevNote) {
      setNotes((prev) => (prev.some((n) => n.id === id) ? prev : [prevNote, ...prev]));
      setSaveError("Nota non eliminata. Controlla la connessione.");
    }
    return error;
  }, []);

  return { notes, loading, addNote, setResolved, deleteNote, saveError, dismissSaveError };
}
