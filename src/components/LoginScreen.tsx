"use client";

import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import type { Role } from "@/lib/types";
import { PinPad } from "./PinPad";

interface RoleConfig {
  role: Role;
  label: string;
  button: string; // role button background
  accent: string; // accent color for the role label / PIN dots context
  dot: string; // accent for the masked PIN dots
}

const ROLES: RoleConfig[] = [
  { role: "reception", label: "Reception", button: "bg-blue-600 hover:bg-blue-700", accent: "text-blue-600", dot: "bg-blue-600" },
  { role: "pulizie", label: "Pulizie", button: "bg-emerald-600 hover:bg-emerald-700", accent: "text-emerald-600", dot: "bg-emerald-600" },
];

interface LoginScreenProps {
  signIn: (role: Role, pin: string) => Promise<AuthError | null>;
}

// Step 1: choose a role. Step 2: type the role's PIN. On success the parent
// observes the new auth session and swaps this screen out.
export function LoginScreen({ signIn }: LoginScreenProps) {
  const [selected, setSelected] = useState<RoleConfig | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0); // bumps to replay the shake

  const back = () => {
    setSelected(null);
    setPin("");
    setError(null);
  };

  const choose = (config: RoleConfig) => {
    setSelected(config);
    setPin("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selected || submitting || pin.length === 0) return;
    setSubmitting(true);
    setError(null);

    const err = await signIn(selected.role, pin);
    if (err) {
      setError(
        err.message.includes("Invalid")
          ? "PIN non corretto. Riprova."
          : "Errore di connessione. Riprova.",
      );
      setPin("");
      setAttempt((a) => a + 1);
      setSubmitting(false);
    }
    // On success the auth listener swaps this view away — no cleanup needed.
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 text-zinc-900">
      <div className="w-full max-w-xs">
        {/* Wordmark */}
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Hotel Villa Romeo</h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Gestione pulizie
          </p>
        </div>

        {!selected ? (
          <div className="flex flex-col gap-3">
            {ROLES.map((r) => (
              <button
                key={r.role}
                type="button"
                onClick={() => choose(r)}
                className={`w-full rounded-2xl py-5 text-center text-lg font-semibold text-white shadow-sm transition active:scale-[0.99] ${r.button}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <p className="mb-6 text-center text-sm text-zinc-500">
              Accesso come{" "}
              <span className={`font-semibold ${selected.accent}`}>{selected.label}</span>
            </p>

            <div key={attempt} className={error ? "animate-shake" : undefined}>
              <div className="mb-2 flex h-5 items-center justify-center gap-3">
                {pin.length === 0 ? (
                  <span className="text-sm tracking-widest text-zinc-300">• • • •</span>
                ) : (
                  Array.from({ length: pin.length }).map((_, i) => (
                    <span key={i} className={`h-3.5 w-3.5 rounded-full ${selected.dot}`} />
                  ))
                )}
              </div>
              <div className="mb-6 flex h-5 items-center justify-center">
                {error && <p className="text-sm font-medium text-red-600">{error}</p>}
              </div>
            </div>

            <PinPad
              value={pin}
              onChange={(next) => {
                setPin(next);
                if (error) setError(null);
              }}
              onSubmit={handleSubmit}
              disabled={submitting}
            />

            <div className="mt-6 flex h-5 items-center justify-center">
              {submitting ? (
                <p className="text-sm text-zinc-400">Accesso in corso…</p>
              ) : (
                <button
                  type="button"
                  onClick={back}
                  className="text-sm font-medium text-zinc-400 transition hover:text-zinc-600"
                >
                  ← Cambia ruolo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
