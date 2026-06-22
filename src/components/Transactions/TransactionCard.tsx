import { useState } from 'react';
import type { Transaction } from '../../types';
import { categoryPillCls, suggestPattern } from './categoryStyles';

interface Props {
  transaction: Transaction;
  categories: string[];
  onUpdate: (id: string, patch: Partial<Pick<Transaction, 'category' | 'type'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddRule?: (pattern: string, category: string) => Promise<unknown>;
}

export function TransactionCard({ transaction: t, categories, onUpdate, onDelete, onAddRule }: Props) {
  const [editField, setEditField] = useState<'category' | 'type' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rulePrompt, setRulePrompt] = useState<{ pattern: string; category: string } | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  const isUncategorized = t.category === 'Uncategorized';

  const handleEdit = async (field: 'category' | 'type', value: string) => {
    await onUpdate(t.id, { [field]: value });
    setEditField(null);
    if (field === 'category' && onAddRule && t.description && value !== 'Uncategorized') {
      setRulePrompt({ pattern: suggestPattern(t.description), category: value });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this transaction?')) return;
    setDeleting(true);
    await onDelete(t.id);
  };

  const handleSaveRule = async () => {
    if (!rulePrompt || !onAddRule) return;
    setSavingRule(true);
    try {
      await onAddRule(rulePrompt.pattern, rulePrompt.category);
    } finally {
      setSavingRule(false);
      setRulePrompt(null);
    }
  };

  return (
    <div className={`p-3 ${deleting ? 'opacity-40' : ''} ${isUncategorized ? 'border-l-2 border-l-yellow-400 bg-yellow-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-700">{t.description ?? '—'}</p>
          <p className="mt-0.5 text-xs text-gray-400">{t.date}{t.source_file ? ` · ${t.source_file}` : ''}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`text-sm font-semibold tabular-nums ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
            {t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString('id-ID')}
          </p>
          <p className="text-xs text-gray-400">{t.currency}</p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {editField === 'category' ? (
            <select
              autoFocus
              defaultValue={t.category}
              onBlur={e => handleEdit('category', e.target.value)}
              onChange={e => handleEdit('category', e.target.value)}
              className="rounded border border-blue-400 px-1.5 py-1 text-xs focus:outline-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <button
              onClick={() => setEditField('category')}
              className={`rounded-full px-2 py-1 text-xs font-medium ${categoryPillCls(t.category)}`}
            >
              {t.category}
            </button>
          )}

          {editField === 'type' ? (
            <select
              autoFocus
              defaultValue={t.type}
              onBlur={e => handleEdit('type', e.target.value)}
              onChange={e => handleEdit('type', e.target.value)}
              className="rounded border border-blue-400 px-1.5 py-1 text-xs focus:outline-none"
            >
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>
          ) : (
            <button
              onClick={() => setEditField('type')}
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {t.type}
            </button>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {rulePrompt && (
        <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-blue-50 px-2.5 py-2 text-xs text-blue-800">
          <span className="flex-1">
            Auto-categorize <strong className="font-semibold">"{rulePrompt.pattern}"</strong> → {rulePrompt.category} next time?
          </span>
          <button
            onClick={handleSaveRule}
            disabled={savingRule}
            className="shrink-0 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
          >
            {savingRule ? '…' : 'Save'}
          </button>
          <button onClick={() => setRulePrompt(null)} className="shrink-0 text-blue-400 hover:text-blue-600">✕</button>
        </div>
      )}
    </div>
  );
}
