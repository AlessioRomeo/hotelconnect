"use client";

import { useEffect } from "react";

interface PinPadProps {
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  maxLength?: number;
  disabled?: boolean;
}

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

// A finger-friendly numeric keypad. It is intentionally role-agnostic: the
// caller owns the PIN value (so it can clear it on a wrong attempt) and styles
// the masked display. A custom pad — rather than a text <input> — gives large,
// consistent tap targets on phones and sidesteps the iOS "zoom on focus" jump.
// Physical keyboards (desktop/tablet) still work via the window key listener.
export function PinPad({
  value,
  onChange,
  onSubmit,
  maxLength = 8,
  disabled = false,
}: PinPadProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key >= "0" && e.key <= "9") {
        if (value.length < maxLength) onChange(value + e.key);
      } else if (e.key === "Backspace") {
        onChange(value.slice(0, -1));
      } else if (e.key === "Enter") {
        onSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [value, maxLength, disabled, onChange, onSubmit]);

  const press = (digit: string) => {
    if (disabled || value.length >= maxLength) return;
    onChange(value + digit);
  };

  return (
    <div className="grid select-none grid-cols-3 gap-3">
      {DIGITS.map((d) => (
        <PadButton key={d} onClick={() => press(d)} disabled={disabled}>
          {d}
        </PadButton>
      ))}
      <PadButton
        onClick={() => onChange(value.slice(0, -1))}
        disabled={disabled || value.length === 0}
        ariaLabel="Cancella"
        variant="muted"
      >
        ⌫
      </PadButton>
      <PadButton onClick={() => press("0")} disabled={disabled}>
        0
      </PadButton>
      <PadButton
        onClick={onSubmit}
        disabled={disabled || value.length === 0}
        ariaLabel="Conferma"
        variant="accent"
      >
        ✓
      </PadButton>
    </div>
  );
}

type PadVariant = "default" | "muted" | "accent";

const VARIANTS: Record<PadVariant, string> = {
  default: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
  muted: "text-zinc-400 hover:bg-zinc-100",
  accent: "bg-zinc-900 text-white hover:bg-zinc-800",
};

function PadButton({
  children,
  onClick,
  disabled,
  ariaLabel,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  variant?: PadVariant;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-16 items-center justify-center rounded-2xl text-2xl font-medium transition active:scale-95 disabled:opacity-40 disabled:active:scale-100 sm:h-20 ${VARIANTS[variant]}`}
    >
      {children}
    </button>
  );
}
