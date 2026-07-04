"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { timeAgo } from "@/lib/time";
import { ROLE_LABELS, type CatalogItem, type ShoppingItem } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  CartIcon,
  CheckIcon,
  ChevronDownIcon,
  MinusIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "./icons";

interface ShoppingPanelProps {
  catalog: CatalogItem[];
  items: ShoppingItem[];
  loading: boolean;
  now: number;
  onAdd: (catalogItemId: string) => void;
  onSetQuantity: (id: string, quantity: number) => void;
  onSetComment: (id: string, comment: string) => void;
  onSetPurchased: (id: string, purchased: boolean) => void;
  onClearPurchased: () => void;
}

// The "Spesa" tab content, shared by colazione and titolare: the current list
// up top (quantities, comments, "comprato"), the purchased history below it,
// and the fixed catalog to add from at the bottom.
export function ShoppingPanel({
  catalog,
  items,
  loading,
  now,
  onAdd,
  onSetQuantity,
  onSetComment,
  onSetPurchased,
  onClearPurchased,
}: ShoppingPanelProps) {
  const [commentTarget, setCommentTarget] = useState<ShoppingItem | null>(null);
  const [showPurchased, setShowPurchased] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const catalogById = useMemo(() => {
    const map = new Map<string, CatalogItem>();
    for (const c of catalog) map.set(c.id, c);
    return map;
  }, [catalog]);

  const categories = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const c of [...catalog].sort((a, b) => a.sort_order - b.sort_order)) {
      if (!c.active) continue;
      const list = map.get(c.category);
      if (list) list.push(c);
      else map.set(c.category, [c]);
    }
    return [...map.entries()];
  }, [catalog]);

  const { pending, purchased } = useMemo(() => {
    const order = (i: ShoppingItem) => catalogById.get(i.catalog_item_id)?.sort_order ?? 0;
    const pending = items
      .filter((i) => !i.purchased_at)
      .sort((a, b) => order(a) - order(b));
    const purchased = items
      .filter((i) => i.purchased_at)
      .sort((a, b) => ((a.purchased_at ?? "") < (b.purchased_at ?? "") ? 1 : -1));
    return { pending, purchased };
  }, [items, catalogById]);

  const pendingByCatalog = useMemo(() => {
    const map = new Map<string, ShoppingItem>();
    for (const i of pending) map.set(i.catalog_item_id, i);
    return map;
  }, [pending]);

  const nameOf = (item: ShoppingItem) =>
    catalogById.get(item.catalog_item_id)?.name ?? "Articolo";

  if (loading) {
    return <p className="py-20 text-center text-zinc-400">Caricamento spesa…</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Da comprare <span className="font-normal text-zinc-400">{pending.length}</span>
        </h2>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-300 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <CartIcon className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="font-semibold">Lista vuota</p>
            <p className="max-w-xs text-sm text-zinc-500">
              Aggiungi gli articoli da comprare dall&apos;elenco qui sotto.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map((item) => (
              <li
                key={item.id}
                className="card-shadow rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{nameOf(item)}</p>
                    {item.comment && (
                      <p className="mt-0.5 text-sm text-zinc-500">{item.comment}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => onSetQuantity(item.id, item.quantity - 1)}
                      aria-label={
                        item.quantity <= 1 ? "Rimuovi dalla lista" : "Diminuisci quantità"
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition active:scale-95 hover:bg-zinc-50"
                    >
                      {item.quantity <= 1 ? (
                        <TrashIcon className="h-4 w-4" />
                      ) : (
                        <MinusIcon className="h-4 w-4" />
                      )}
                    </button>
                    <span className="w-5 text-center text-lg font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdd(item.catalog_item_id)}
                      aria-label="Aumenta quantità"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-600 transition active:scale-95 hover:bg-zinc-50"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setCommentTarget(item)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                    {item.comment ? "Modifica nota" : "Nota"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSetPurchased(item.id, true)}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition active:scale-[0.98] hover:bg-emerald-700"
                  >
                    <CheckIcon className="h-4 w-4" />
                    Comprato
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {purchased.length > 0 && (
        <section className="border-t border-zinc-200 pt-5">
          <button
            type="button"
            onClick={() => setShowPurchased((v) => !v)}
            className="flex w-full items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 transition hover:bg-zinc-200/60"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <CheckIcon className="h-4 w-4 text-emerald-600" />
              Comprati
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-500">
                {purchased.length}
              </span>
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-zinc-400 transition ${showPurchased ? "rotate-180" : ""}`}
            />
          </button>

          {showPurchased && (
            <>
              <ul className="mt-3 flex flex-col gap-2">
                {purchased.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] text-zinc-400 line-through">
                        {nameOf(item)}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {item.purchased_at && timeAgo(item.purchased_at, now)}
                        {item.purchased_by && ` · ${ROLE_LABELS[item.purchased_by]}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onSetPurchased(item.id, false)}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100"
                      >
                        Riapri
                      </button>
                      <button
                        type="button"
                        onClick={() => onSetQuantity(item.id, 0)}
                        aria-label="Elimina articolo"
                        title="Elimina"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4" />
                Svuota comprati
              </button>
            </>
          )}
        </section>
      )}

      <section className="border-t border-zinc-200 pt-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Aggiungi articoli
        </h2>
        <div className="flex flex-col gap-4">
          {categories.map(([category, catalogItems]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {category}
              </h3>
              <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                {catalogItems.map((c) => {
                  const inList = pendingByCatalog.get(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onAdd(c.id)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition active:bg-zinc-100 hover:bg-zinc-50"
                      >
                        <span className="min-w-0 flex-1 truncate text-[15px]">
                          {c.name}
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          {inList && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-800">
                              ×{inList.quantity}
                            </span>
                          )}
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-600">
                            <PlusIcon className="h-4 w-4" />
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {commentTarget && (
        <CommentModal
          name={nameOf(commentTarget)}
          initial={commentTarget.comment ?? ""}
          onClose={() => setCommentTarget(null)}
          onSave={(text) => {
            onSetComment(commentTarget.id, text);
            setCommentTarget(null);
          }}
        />
      )}

      {confirmClear && (
        <ConfirmDialog
          title="Svuotare gli articoli comprati?"
          message="L'operazione non può essere annullata."
          confirmLabel="Sì, svuota"
          destructive
          onConfirm={() => {
            onClearPurchased();
            setConfirmClear(false);
          }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

// Same centered-modal shell as ConfirmDialog — a text field for the comment on
// a shopping item (e.g. "quelli della marca solita", "2 confezioni grandi").
function CommentModal({
  name,
  initial,
  onClose,
  onSave,
}: {
  name: string;
  initial: string;
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState(initial);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Nota per ${name}`}
    >
      <button
        type="button"
        aria-label="Annulla"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-black/40"
      />

      <div className="relative z-10 w-full max-w-sm animate-fade-in rounded-3xl bg-white p-6 text-zinc-900 shadow-xl">
        <h2 className="text-lg font-semibold">{name}</h2>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Es. marca solita, confezione grande…"
          className="mt-4 w-full resize-none rounded-2xl border border-zinc-200 p-3 text-base outline-none transition focus:border-zinc-400"
        />

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onSave(text)}
            className="flex h-14 items-center justify-center rounded-2xl bg-emerald-600 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-emerald-700"
          >
            Salva
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 items-center justify-center rounded-2xl text-base font-medium text-zinc-500 transition hover:bg-zinc-100"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
