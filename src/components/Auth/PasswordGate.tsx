import { useState, useEffect, type ReactNode } from 'react';

const HASH = 'd6a401483d6023d596201d7185b2d442f5438e305ee54553a8a7d912b459b297';
const SESSION_KEY = 'fum_unlocked';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (unlocked) sessionStorage.setItem(SESSION_KEY, '1');
  }, [unlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError(false);
    const hash = await sha256(input);
    if (hash === HASH) {
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
    }
    setChecking(false);
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-3 text-3xl">💰</div>
          <h1 className="text-xl font-bold text-slate-900">FUM-AF</h1>
          <p className="mt-1 text-sm text-slate-500">Enter the password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            placeholder="Password"
            autoFocus
            className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 ${
              error
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
            }`}
          />
          {error && (
            <p className="text-xs text-rose-500">Incorrect password.</p>
          )}
          <button
            type="submit"
            disabled={!input || checking}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {checking ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
