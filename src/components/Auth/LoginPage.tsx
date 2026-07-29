import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../shared/Spinner';

export function LoginPage() {
  const { signIn } = useAuth();
  const [pat, setPat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pat.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await signIn(pat);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">FinanceAF</h1>
        <p className="mb-6 text-sm text-slate-500">Enter your GitHub Personal Access Token to access your data.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={pat}
            onChange={e => setPat(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:outline-none"
          />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !pat.trim()}
            className="flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" /> : null}
            {loading ? 'Verifying…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-slate-50 p-4 text-xs text-slate-500">
          <p className="mb-1 font-medium text-slate-600">How to get a PAT</p>
          <ol className="list-decimal space-y-1 pl-4">
            <li>GitHub → Settings → Developer settings → Personal access tokens</li>
            <li>Generate new token (classic) with <code className="rounded bg-slate-200 px-1">repo</code> scope</li>
            <li>Your data lives in the private <code className="rounded bg-slate-200 px-1">fum-af-data</code> repo</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
