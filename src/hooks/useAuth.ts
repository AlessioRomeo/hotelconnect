"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/lib/types";

// Each role maps to a hidden backend account. The user types a PIN, which the
// app uses as that account's password. The role is derived from the signed-in
// email, so it survives reloads with no extra storage.
const ROLE_EMAILS: Record<Role, string> = {
  reception: process.env.NEXT_PUBLIC_RECEPTION_EMAIL!,
  pulizie: process.env.NEXT_PUBLIC_PULIZIE_EMAIL!,
};

function roleFromEmail(email?: string | null): Role | null {
  if (email === ROLE_EMAILS.reception) return "reception";
  if (email === ROLE_EMAILS.pulizie) return "pulizie";
  return null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabase persists the session in localStorage by default, so a returning
    // device is already logged in.
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (role: Role, pin: string): Promise<AuthError | null> => {
      const { error } = await supabase.auth.signInWithPassword({
        email: ROLE_EMAILS[role],
        password: pin,
      });
      return error;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    role: roleFromEmail(session?.user?.email),
    loading,
    signIn,
    signOut,
  };
}
