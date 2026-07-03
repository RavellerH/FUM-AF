import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const ALLOWED_EMAIL = (import.meta.env.VITE_ALLOWED_EMAIL as string | undefined)?.toLowerCase();

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
      },
    });

  const signOut = () => supabase.auth.signOut();

  // Client-side gate is UX only — the DB whitelist trigger is the real guard.
  // Enforced only when VITE_ALLOWED_EMAIL is set, so a missing secret can't lock you out.
  const isWhitelisted = !ALLOWED_EMAIL || session?.user?.email?.toLowerCase() === ALLOWED_EMAIL;

  return { session, loading, signIn, signOut, isWhitelisted };
}
