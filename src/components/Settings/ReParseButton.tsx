import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useSummary } from '../../hooks/useSummary';
import { supabase } from '../../lib/supabase';
import { parseTransactionsWithGemini } from '../../lib/gemini';
import { useRules, applyRules } from '../../hooks/useRules';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';

export function ReParseButton() {
  const { session } = useAuth();
  const { insertTransactions } = useTransactions();
  const { buildAndUpsertSummary } = useSummary();
  const { rules, fetchRules } = useRules();
  const [sourceFiles, setSourceFiles] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchRules();
    supabase
      .from('transactions')
      .select('source_file')
      .not('source_file', 'is', null)
      .then(({ data }) => {
        if (!data) return;
        const unique = [...new Set(data.map(r => r.source_file as string))].filter(Boolean);
        setSourceFiles(unique);
        if (unique.length) setSelected(unique[0]);
      });
  }, [session]);

  const handleReParse = async () => {
    if (!selected || !session) return;
    setStatus('running');
    setError(null);
    try {
      // Fetch all transactions for that source file as CSV-like text
      const { data } = await supabase
        .from('transactions')
        .select('date,amount,currency,type,category,description')
        .eq('source_file', selected);
      if (!data?.length) throw new Error('No transactions found for this source file.');
      const csvText = [
        'date,amount,currency,type,category,description',
        ...data.map(r => `${r.date},${r.amount},${r.currency},${r.type},${r.category},${r.description}`),
      ].join('\n');
      const parsed = applyRules(await parseTransactionsWithGemini(csvText), rules);
      if (!parsed.length) throw new Error('Gemini returned no transactions — aborting so nothing is deleted.');
      // Delete existing transactions for that source file
      await supabase.from('transactions').delete().eq('source_file', selected);
      // Re-insert
      await insertTransactions(parsed, selected, session.user.id);
      // Rebuild summaries
      const months = [...new Set(parsed.map(t => t.date.slice(0, 7)))];
      await Promise.all(months.map(m => buildAndUpsertSummary(m, session.user.id)));
      setStatus('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Re-parse failed');
      setStatus('idle');
    }
  };

  if (!sourceFiles.length) return null;

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-slate-800">Re-Parse Uploaded File</h2>
      {error && <div className="mb-3"><ErrorBanner message={error} onDismiss={() => setError(null)} /></div>}
      {status === 'done' && (
        <div className="mb-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Re-parse complete!</div>
      )}
      <div className="flex gap-2">
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none"
        >
          {sourceFiles.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <button
          onClick={handleReParse}
          disabled={status === 'running'}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {status === 'running' ? <><Spinner size="sm" /> Running...</> : 'Re-Parse'}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">This will delete existing transactions from that file and re-run Gemini parsing.</p>
    </div>
  );
}
