import { useState, useCallback } from 'react';
import { ghVerifyPat } from '../lib/github';

const PAT_KEY = 'gh_pat';

export interface AuthState {
  pat: string;
  hasPat: boolean;
  savePat: (pat: string) => Promise<void>;
  clearPat: () => void;
}

export function useAuth(): AuthState {
  const [pat, setPat] = useState<string>(() => localStorage.getItem(PAT_KEY) ?? '');

  const savePat = useCallback(async (newPat: string) => {
    const trimmed = newPat.trim();
    const ok = await ghVerifyPat(trimmed);
    if (!ok) throw new Error('Invalid token — verify the PAT has repo scope and try again');
    localStorage.setItem(PAT_KEY, trimmed);
    setPat(trimmed);
  }, []);

  const clearPat = useCallback(() => {
    localStorage.removeItem(PAT_KEY);
    setPat('');
  }, []);

  return { pat, hasPat: !!pat, savePat, clearPat };
}
