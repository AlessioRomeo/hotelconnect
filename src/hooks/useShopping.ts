"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { CatalogItem, Role, ShoppingItem } from "@/lib/types";

export function useShopping(enabled: boolean) {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);

  const itemsRef = useRef<ShoppingItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const dismissSaveError = useCallback(() => setSaveError(null), []);

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    (async () => {
      const [catalogRes, itemsRes] = await Promise.all([
        supabase.from("catalog_items").select("*").order("sort_order"),
        supabase.from("shopping_items").select("*").order("created_at"),
      ]);
      if (!active) return;
      if (!catalogRes.error && catalogRes.data) {
        setCatalog(catalogRes.data as CatalogItem[]);
      }
      if (!itemsRes.error && itemsRes.data) {
        setItems(itemsRes.data as ShoppingItem[]);
      }
      if (!catalogRes.error && !itemsRes.error) setLoading(false);
    })();

    const channel = supabase
      .channel("shopping-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_items" },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") {
              const next = payload.new as ShoppingItem;
              // Dedupe: our own optimistic insert uses the same client id.
              if (prev.some((i) => i.id === next.id)) return prev;
              return [...prev, next];
            }
            if (payload.eventType === "UPDATE") {
              const next = payload.new as ShoppingItem;
              return prev.map((i) => (i.id === next.id ? next : i));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Partial<ShoppingItem>;
              return prev.filter((i) => i.id !== old.id);
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

  const setQuantity = useCallback(async (id: string, quantity: number) => {
    const prevItem = itemsRef.current.find((i) => i.id === id);
    if (!prevItem) return null;
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      const { error } = await supabase.from("shopping_items").delete().eq("id", id);
      if (error) {
        setItems((prev) => (prev.some((i) => i.id === id) ? prev : [...prev, prevItem]));
        setSaveError("Modifica non salvata. Controlla la connessione.");
      }
      return error;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    const { error } = await supabase
      .from("shopping_items")
      .update({ quantity })
      .eq("id", id);
    if (error) {
      setItems((prev) => prev.map((i) => (i.id === id ? prevItem : i)));
      setSaveError("Modifica non salvata. Controlla la connessione.");
    }
    return error;
  }, []);

  const addItem = useCallback(
    async (catalogItemId: string, by: Role) => {
      const existing = itemsRef.current.find(
        (i) => i.catalog_item_id === catalogItemId && !i.purchased_at,
      );
      if (existing) return setQuantity(existing.id, existing.quantity + 1);

      const id = crypto.randomUUID();
      const optimistic: ShoppingItem = {
        id,
        catalog_item_id: catalogItemId,
        quantity: 1,
        comment: null,
        created_at: new Date().toISOString(),
        created_by: by,
        purchased_at: null,
        purchased_by: null,
      };
      setItems((prev) => (prev.some((i) => i.id === id) ? prev : [...prev, optimistic]));
      const { error } = await supabase
        .from("shopping_items")
        .insert({ id, catalog_item_id: catalogItemId, created_by: by });
      if (error) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        setSaveError("Articolo non aggiunto. Controlla la connessione.");
      }
      return error;
    },
    [setQuantity],
  );

  const setComment = useCallback(async (id: string, comment: string) => {
    const prevItem = itemsRef.current.find((i) => i.id === id);
    if (!prevItem) return null;
    const next = comment.trim() || null;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, comment: next } : i)));
    const { error } = await supabase
      .from("shopping_items")
      .update({ comment: next })
      .eq("id", id);
    if (error) {
      setItems((prev) => prev.map((i) => (i.id === id ? prevItem : i)));
      setSaveError("Modifica non salvata. Controlla la connessione.");
    }
    return error;
  }, []);

  const setPurchased = useCallback(
    async (id: string, purchased: boolean, by: Role) => {
      const prevItem = itemsRef.current.find((i) => i.id === id);
      if (!prevItem) return null;
      const purchased_at = purchased ? new Date().toISOString() : null;
      const purchased_by = purchased ? by : null;
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, purchased_at, purchased_by } : i)),
      );
      const { error } = await supabase
        .from("shopping_items")
        .update({ purchased_at, purchased_by })
        .eq("id", id);
      if (error) {
        setItems((prev) => prev.map((i) => (i.id === id ? prevItem : i)));
        setSaveError("Modifica non salvata. Controlla la connessione.");
      }
      return error;
    },
    [],
  );

  const clearPurchased = useCallback(async () => {
    const purchased = itemsRef.current.filter((i) => i.purchased_at);
    if (purchased.length === 0) return null;
    const ids = purchased.map((i) => i.id);
    setItems((prev) => prev.filter((i) => !i.purchased_at));
    const { error } = await supabase.from("shopping_items").delete().in("id", ids);
    if (error) {
      setItems((prev) => [
        ...prev,
        ...purchased.filter((p) => !prev.some((i) => i.id === p.id)),
      ]);
      setSaveError("Lista non svuotata. Controlla la connessione.");
    }
    return error;
  }, []);

  return {
    catalog,
    items,
    loading,
    addItem,
    setQuantity,
    setComment,
    setPurchased,
    clearPurchased,
    saveError,
    dismissSaveError,
  };
}
