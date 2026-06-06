"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// A small centered confirmation modal for irreversible-feeling actions
// (e.g. marking a room clean, which removes it from the cleaner's list).
// Esc or tapping the backdrop cancels.
export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Annulla",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={onCancel}
        className="absolute inset-0 animate-fade-in bg-black/40"
      />

      <div className="relative z-10 w-full max-w-xs animate-fade-in rounded-3xl bg-white p-6 text-center text-zinc-900 shadow-xl">
        <h2 className="text-lg font-semibold leading-snug">{title}</h2>
        {message && <p className="mt-2 text-sm text-zinc-500">{message}</p>}

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-14 items-center justify-center rounded-2xl bg-emerald-600 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-emerald-700"
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-12 items-center justify-center rounded-2xl text-base font-medium text-zinc-500 transition hover:bg-zinc-100"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
