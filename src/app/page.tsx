"use client";

import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { ReceptionView } from "@/components/ReceptionView";

// Single entry point. Swaps between the login screen and the role views based
// on the auth session. Phase 6 will replace the Pulizie placeholder below with
// the real cleaning view.
export default function Home() {
  const { session, role, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center bg-white text-zinc-400">
        Caricamento…
      </main>
    );
  }

  if (!session) {
    return <LoginScreen signIn={signIn} />;
  }

  if (role === "reception") {
    return <ReceptionView onSignOut={signOut} />;
  }

  // role === "pulizie" — temporary placeholder until Phase 6.
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-white px-6 text-center text-zinc-900">
      <p className="text-zinc-500">Accesso effettuato come</p>
      <p className="text-2xl font-semibold">Pulizie</p>
      <p className="max-w-xs text-sm text-zinc-400">
        La vista pulizie arriverà nella prossima fase.
      </p>
      <button
        type="button"
        onClick={signOut}
        className="mt-2 rounded-full border border-zinc-200 px-5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
      >
        Esci
      </button>
    </main>
  );
}
