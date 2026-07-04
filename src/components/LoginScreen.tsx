"use client";

import { useState } from "react";
import type { AuthError } from "@supabase/supabase-js";
import type { Role } from "@/lib/types";
import { EyeIcon, EyeOffIcon } from "./icons";
import { PinPad } from "./PinPad";

interface RoleConfig {
  role: Role;
  label: string;
  auth: "pin" | "password";
  button: string;
  accent: string;
  dot: string;
}

const ROLES: RoleConfig[] = [
  { role: "reception", label: "Reception", auth: "pin", button: "bg-blue-600 hover:bg-blue-700", accent: "text-blue-600", dot: "bg-blue-600" },
  { role: "pulizie", label: "Pulizie", auth: "pin", button: "bg-emerald-600 hover:bg-emerald-700", accent: "text-emerald-600", dot: "bg-emerald-600" },
  { role: "colazione", label: "Colazione", auth: "pin", button: "bg-amber-500 hover:bg-amber-600", accent: "text-amber-600", dot: "bg-amber-500" },
  { role: "admin", label: "Titolare", auth: "password", button: "bg-zinc-900 hover:bg-zinc-800", accent: "text-zinc-900", dot: "bg-zinc-900" },
];

interface LoginScreenProps {
  signIn: (role: Role, secret: string) => Promise<AuthError | null>;
}

export function LoginScreen({ signIn }: LoginScreenProps) {
  const [selected, setSelected] = useState<RoleConfig | null>(null);
  const [secret, setSecret] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const back = () => {
    setSelected(null);
    setSecret("");
    setShowPassword(false);
    setError(null);
  };

  const choose = (config: RoleConfig) => {
    setSelected(config);
    setSecret("");
    setShowPassword(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selected || submitting || secret.length === 0) return;
    setSubmitting(true);
    setError(null);

    const err = await signIn(selected.role, secret);
    if (err) {
      setError(
        err.message.includes("Invalid")
          ? selected.auth === "password"
            ? "Password non corretta. Riprova."
            : "PIN non corretto. Riprova."
          : "Errore di connessione. Riprova.",
      );
      setSecret("");
      setAttempt((a) => a + 1);
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 text-zinc-900">
      <div className="w-full max-w-xs">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Hotel Villa Romeo</h1>
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
            Gestione interna
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

            {selected.auth === "password" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <div key={attempt} className={error ? "animate-shake" : undefined}>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={secret}
                      onChange={(e) => {
                        setSecret(e.target.value);
                        if (error) setError(null);
                      }}
                      autoFocus
                      autoComplete="current-password"
                      placeholder="Password"
                      aria-label="Password"
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 pr-12 text-base outline-none transition focus:border-zinc-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                      className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-zinc-400 transition hover:text-zinc-600"
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 flex h-5 items-center justify-center">
                    {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || secret.length === 0}
                  className="mt-3 flex h-14 w-full items-center justify-center rounded-2xl bg-zinc-900 text-base font-semibold text-white transition active:scale-[0.98] hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  Accedi
                </button>
              </form>
            ) : (
              <>
                <div key={attempt} className={error ? "animate-shake" : undefined}>
                  <div className="mb-2 flex h-5 items-center justify-center gap-3">
                    {secret.length === 0 ? (
                      <span className="text-sm tracking-widest text-zinc-300">• • • •</span>
                    ) : (
                      Array.from({ length: secret.length }).map((_, i) => (
                        <span key={i} className={`h-3.5 w-3.5 rounded-full ${selected.dot}`} />
                      ))
                    )}
                  </div>
                  <div className="mb-6 flex h-5 items-center justify-center">
                    {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                  </div>
                </div>

                <PinPad
                  value={secret}
                  onChange={(next) => {
                    setSecret(next);
                    if (error) setError(null);
                  }}
                  onSubmit={handleSubmit}
                  disabled={submitting}
                />
              </>
            )}

            <div className="mt-6 flex h-5 items-center justify-center">
              {submitting ? (
                <p className="text-sm text-zinc-400">Accesso in corso…</p>
              ) : (
                <button
                  type="button"
                  onClick={back}
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
                >
                  Cambia ruolo
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
