import { useEffect, useState } from 'react';
import { useRules } from '../../hooks/useRules';
import type { TransactionType } from '../../types';
import { useCategories } from '../../hooks/useCategories';

export function RulesManager() {
  const { rules, loading, fetchRules, addRule, deleteRule, applyRulesToUncategorized } = useRules();
  const { categories, fetchCategories } = useCategories();

  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newType, setNewType] = useState<TransactionType | ''>('');
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRules();
    fetchCategories();
  }, []);

  const categoryNames = categories.map(c => c.name);

  const handleAdd = async () => {
    if (!newPattern.trim() || !newCategory) return;
    setSaving(true);
    setError(null);
    try {
      await addRule(newPattern, newCategory, (newType as TransactionType) || null);
      setNewPattern('');
      setNewCategory('');
      setNewType('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save rule');
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToExisting = async () => {
    setApplying(true);
    setApplyResult(null);
    setError(null);
    try {
      const n = await applyRulesToUncategorized();
      setApplyResult(n > 0
        ? `Updated ${n} uncategorized transaction${n > 1 ? 's' : ''}.`
        : 'No uncategorized transactions matched any rule.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply rules');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Auto-categorization Rules</h2>
          <p className="mt-1 text-xs text-slate-500">
            Rules are applied after Gemini parsing. If a description contains the pattern,
            the category (and optionally type) is overridden automatically.
          </p>
        </div>
        {rules.length > 0 && (
          <button
            onClick={handleApplyToExisting}
            disabled={applying}
            className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
          >
            {applying ? 'Applying…' : 'Apply to existing uncategorized'}
          </button>
        )}
      </div>
      {applyResult && (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{applyResult}</p>
      )}

      {/* Existing rules */}
      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">No rules yet. Create one below.</p>
      ) : (
        <div className="mb-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Pattern</th>
                <th className="px-3 py-2 text-left font-medium">→ Category</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs text-slate-700">{r.pattern}</td>
                  <td className="px-3 py-2 text-slate-700">{r.category}</td>
                  <td className="px-3 py-2 text-slate-400">{r.type ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => deleteRule(r.id)}
                      className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      title="Delete rule"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add new rule */}
      <div className="rounded-lg border border-dashed border-slate-300 p-3">
        <p className="mb-2 text-xs font-medium text-slate-600">Add rule</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Pattern (e.g. Alfagift)"
            value={newPattern}
            onChange={e => setNewPattern(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 min-w-0 rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="">— category —</option>
            {categoryNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as TransactionType | '')}
            className="rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          >
            <option value="">any type</option>
            <option value="income">income</option>
            <option value="expense">expense</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={saving || !newPattern.trim() || !newCategory}
            className="rounded bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
      </div>
    </div>
  );
}
