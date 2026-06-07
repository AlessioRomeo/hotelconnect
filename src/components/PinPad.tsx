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

const BackspaceIcon = (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
    <path d="m18 9-6 6M12 9l6 6" />
  </svg>
);

const CheckIcon = (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

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
        {BackspaceIcon}
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
        {CheckIcon}
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
