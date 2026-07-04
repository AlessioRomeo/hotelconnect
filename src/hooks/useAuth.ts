"use client";

import { useCallback, useEffect, useState } from "react";
import type { AuthError, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Role } from "@/lib/types";

const ROLE_EMAILS: Record<Role, string> = {
  reception: process.env.NEXT_PUBLIC_RECEPTION_EMAIL!,
  pulizie: process.env.NEXT_PUBLIC_PULIZIE_EMAIL!,
  colazione: process.env.NEXT_PUBLIC_COLAZIONE_EMAIL!,
  admin: process.env.NEXT_PUBLIC_ADMIN_EMAIL!,
};

function roleFromEmail(email?: string | null): Role | null {
  if (!email) return null;
  const match = (Object.keys(ROLE_EMAILS) as Role[]).find(
    (role) => ROLE_EMAILS[role] === email,
  );
  return match ?? null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
