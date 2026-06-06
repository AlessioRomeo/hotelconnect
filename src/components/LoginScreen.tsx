"use client";

import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import type { Role } from "@/lib/types";
import { PinPad } from "./PinPad";

interface RoleConfig {
  role: Role;
  label: string;
  hint: string;
  dot: string; // accent for the masked PIN dots
  button: string; // role-selection button background
}

const ROLES: RoleConfig[] = [
  {
    role: "reception",
    label: "Reception",
    hint: "Segna le camere da pulire",
    dot: "bg-blue-600",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  {
    role: "pulizie",
    label: "Pulizie",
    hint: "Segna le camere pulite",
    dot: "bg-emerald-600",
    button: "bg-emerald-600 hover:bg-emerald-700",
  },
];

interface LoginScreenProps {
  signIn: (role: Role, pin: string) => Promise<AuthError | null>;
}

// Step 1: choose a role. Step 2: type the role's PIN. On success the parent
// observes the new auth session and swaps this screen out, so there is nothing
// to navigate to here.
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
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-10 text-zinc-900">
      <div className="w-full max-w-sm">
        {!selected ? (
          <>
            <header className="mb-10 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">
                HotelConnect
              </h1>
              <p className="mt-2 text-zinc-500">Chi sei?</p>
            </header>
            <div className="flex flex-col gap-4">
              {ROLES.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => choose(r)}
                  className={`flex flex-col rounded-2xl px-6 py-5 text-left text-white transition active:scale-[0.98] ${r.button}`}
                >
                  <span className="text-xl font-semibold">{r.label}</span>
                  <span className="text-sm text-white/80">{r.hint}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <header className="mb-8 flex items-center gap-3">
              <button
                type="button"
                onClick={back}
                aria-label="Indietro"
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-zinc-500 transition hover:bg-zinc-100"
              >
                ←
              </button>
              <div>
                <p className="text-sm text-zinc-500">Accesso come</p>
                <p className="text-lg font-semibold">{selected.label}</p>
              </div>
            </header>

            <p className="mb-4 text-center text-zinc-500">Inserisci il PIN</p>

            <div key={attempt} className={error ? "animate-shake" : undefined}>
              <div className="mb-2 flex h-5 items-center justify-center gap-3">
                {pin.length === 0 ? (
                  <span className="text-sm tracking-widest text-zinc-300">
                    • • • •
                  </span>
                ) : (
                  Array.from({ length: pin.length }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-3.5 w-3.5 rounded-full ${selected.dot}`}
                    />
                  ))
                )}
              </div>
              <div className="mb-6 flex h-5 items-center justify-center">
                {error && (
                  <p className="text-sm font-medium text-red-600">{error}</p>
                )}
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

            <p className="mt-6 h-5 text-center text-sm text-zinc-400">
              {submitting ? "Accesso in corso…" : ""}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
