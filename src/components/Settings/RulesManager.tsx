import { useEffect, useState } from 'react';
import { useRules } from '../../hooks/useRules';
import type { TransactionType } from '../../types';
import { useCategories } from '../../hooks/useCategories';
import { useAuth } from '../../hooks/useAuth';

export function RulesManager() {
  const { session } = useAuth();
  const { rules, loading, fetchRules, addRule, deleteRule } = useRules();
  const { categories, fetchCategories } = useCategories();

  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newType, setNewType] = useState<TransactionType | ''>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetchRules();
    fetchCategories();
  }, [session]);

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

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">Auto-categorization Rules</h2>
        <p className="mt-1 text-xs text-gray-500">
          Rules are applied after Gemini parsing. If a description contains the pattern,
          the category (and optionally type) is overridden automatically.
        </p>
      </div>

      {/* Existing rules */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="mb-4 text-sm text-gray-400">No rules yet. Create one below.</p>
      ) : (
        <div className="mb-4 overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Pattern</th>
                <th className="px-3 py-2 text-left font-medium">→ Category</th>
                <th className="px-3 py-2 text-left font-medium">Type</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs text-gray-700">{r.pattern}</td>
                  <td className="px-3 py-2 text-gray-700">{r.category}</td>
                  <td className="px-3 py-2 text-gray-400">{r.type ?? '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => deleteRule(r.id)}
                      className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
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
      <div className="rounded-lg border border-dashed border-gray-300 p-3">
        <p className="mb-2 text-xs font-medium text-gray-600">Add rule</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Pattern (e.g. Alfagift)"
            value={newPattern}
            onChange={e => setNewPattern(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 min-w-0 rounded border border-gray-300 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          />
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">— category —</option>
            {categoryNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as TransactionType | '')}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
          >
            <option value="">any type</option>
            <option value="income">income</option>
            <option value="expense">expense</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={saving || !newPattern.trim() || !newCategory}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
