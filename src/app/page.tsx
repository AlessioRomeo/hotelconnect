"use client";

import { useAuth } from "@/hooks/useAuth";
import { LoginScreen } from "@/components/LoginScreen";
import { ReceptionView } from "@/components/ReceptionView";
import { CleaningView } from "@/components/CleaningView";
import { ColazioneView } from "@/components/ColazioneView";
import { AdminView } from "@/components/AdminView";

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

  if (role === "colazione") {
    return <ColazioneView onSignOut={signOut} />;
  }

  if (role === "admin") {
    return <AdminView onSignOut={signOut} />;
  }

  return <CleaningView onSignOut={signOut} />;
}
