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
  iconBg: string; // role icon chip background
  icon: React.ReactNode;
}

const BellIcon = (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const SparklesIcon = (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.94 15.5A2 2 0 0 0 8.5 14.06l-6.14-1.58a.5.5 0 0 1 0-.96L8.5 9.94A2 2 0 0 0 9.94 8.5l1.58-6.14a.5.5 0 0 1 .96 0L14.06 8.5a2 2 0 0 0 1.44 1.44l6.14 1.58a.5.5 0 0 1 0 .96l-6.14 1.58a2 2 0 0 0-1.44 1.44l-1.58 6.14a.5.5 0 0 1-.96 0z" />
    <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
  </svg>
);

const ROLES: RoleConfig[] = [
  {
    role: "reception",
    label: "Reception",
    hint: "Segna le camere da pulire",
    dot: "bg-blue-600",
    iconBg: "bg-blue-600",
    icon: BellIcon,
  },
  {
    role: "pulizie",
    label: "Pulizie",
    hint: "Segna le camere pulite",
    dot: "bg-emerald-600",
    iconBg: "bg-emerald-600",
    icon: SparklesIcon,
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
    <main className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-emerald-50 via-white to-white px-6 py-10 text-zinc-900">
      <div className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl shadow-zinc-300/40 ring-1 ring-zinc-100 sm:p-8">
        {/* Brand mark */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-600/25">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 21h18" />
              <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
              <path d="M19 21V9a2 2 0 0 0-2-2h-2" />
              <path d="M9 7h2M9 11h2M9 15h2" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Hotel Villa Romeo
          </h1>
          <p className="mt-1 text-sm text-zinc-500">Gestione pulizie camere</p>
        </div>

        {!selected ? (
          <div>
            <p className="mb-3 text-center text-sm font-medium text-zinc-400">
              Chi sei?
            </p>
            <div className="flex flex-col gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => choose(r)}
                  className="group flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] hover:border-zinc-200 hover:shadow-md"
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${r.iconBg}`}>
                    {r.icon}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold">{r.label}</span>
                    <span className="block text-sm text-zinc-500">{r.hint}</span>
                  </span>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-zinc-300 transition group-hover:text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <button
                type="button"
                onClick={back}
                aria-label="Indietro"
                className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-zinc-500 transition hover:bg-zinc-100"
              >
                ←
              </button>
              <div>
                <p className="text-xs text-zinc-400">Accesso come</p>
                <p className="font-semibold">{selected.label}</p>
              </div>
            </div>

            <p className="mb-4 text-center text-sm text-zinc-500">
              Inserisci il PIN
            </p>

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
          </div>
        )}
      </div>
    </main>
  );
}
