import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function PatSetting() {
  const { pat, hasPat, savePat, clearPat } = useAuth();
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await savePat(input.trim());
      setInput('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save token');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-slate-700">GitHub Token</h2>
      <p className="mb-4 text-xs text-slate-500">
        Required for writing data (uploading statements, editing transactions, updating categories).
        Reading is always available without a token.
      </p>

      {hasPat && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm">
          <span className="text-emerald-700">Token saved — ending in <code className="font-mono">{pat.slice(-4)}</code></span>
          <button
            onClick={clearPat}
            className="ml-auto text-xs text-slate-500 hover:text-rose-600"
          >
            Remove
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="flex gap-2">
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(null); setSaved(false); }}
          placeholder={hasPat ? 'Enter new token to replace' : 'ghp_xxxxxxxxxxxx'}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}
        </button>
      </form>

      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}

      <p className="mt-3 text-xs text-slate-400">
        GitHub → Settings → Developer settings → Personal access tokens → Classic → <code>repo</code> scope
      </p>
    </div>
  );
}
