import { useEffect, useState, useCallback } from 'react';
import { ghVerifyPat } from '../lib/github';

const PAT_KEY = 'gh_pat';

export interface AuthState {
  pat: string;
  verified: boolean;
  loading: boolean;
  signIn: (pat: string) => Promise<void>;
  signOut: () => void;
}

export function useAuth(): AuthState {
  const [pat, setPat] = useState<string>(() => localStorage.getItem(PAT_KEY) ?? '');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(!!localStorage.getItem(PAT_KEY));

  useEffect(() => {
    const stored = localStorage.getItem(PAT_KEY);
    if (!stored) { setLoading(false); return; }
    ghVerifyPat(stored).then(ok => {
      setVerified(ok);
      if (!ok) localStorage.removeItem(PAT_KEY);
      setLoading(false);
    }).catch(() => { setVerified(false); setLoading(false); });
  }, []);

  const signIn = useCallback(async (newPat: string) => {
    const trimmed = newPat.trim();
    const ok = await ghVerifyPat(trimmed);
    if (!ok) throw new Error('Invalid token — verify the PAT has repo scope and try again');
    localStorage.setItem(PAT_KEY, trimmed);
    setPat(trimmed);
    setVerified(true);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(PAT_KEY);
    setPat('');
    setVerified(false);
  }, []);

  return { pat, verified, loading, signIn, signOut };
}
