import { useState } from 'react';
import type { Transaction } from '../../types';

interface Props {
  transaction: Transaction;
  categories: string[];
  onUpdate: (id: string, patch: Partial<Pick<Transaction, 'category' | 'type'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddRule?: (pattern: string, category: string) => Promise<unknown>;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Third-Party Transfer': 'bg-blue-100 text-blue-700',
  'Reimbursable':        'bg-lime-100 text-lime-700',
  'Investment':        'bg-purple-100 text-purple-700',
  'Family':            'bg-emerald-100 text-emerald-700',
  'Freelance':         'bg-teal-100 text-teal-700',
  'Reimbursement':     'bg-cyan-100 text-cyan-700',
  'Refund':            'bg-cyan-100 text-cyan-700',
  'Housing':           'bg-orange-100 text-orange-700',
  'Household':         'bg-orange-100 text-orange-700',
  'Home Maintenance':  'bg-orange-100 text-orange-700',
  'Food & Dining':     'bg-amber-100 text-amber-700',
  'Healthcare':        'bg-rose-100 text-rose-700',
  'Insurance':         'bg-fuchsia-100 text-fuchsia-700',
  'Admin Fee':         'bg-stone-100 text-stone-600',
  'Transport':         'bg-sky-100 text-sky-700',
  'Shopping':          'bg-pink-100 text-pink-700',
  'Entertainment':     'bg-violet-100 text-violet-700',
  'Work':              'bg-indigo-100 text-indigo-700',
  'Services':          'bg-indigo-100 text-indigo-700',
  'Loan':              'bg-red-100 text-red-700',
  'Cash':              'bg-gray-100 text-gray-600',
  'Uncategorized':     'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400',
};

function categoryPillCls(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600';
}

function suggestPattern(description: string): string {
  const parts = description.split(' | ');
  const base = parts.length > 1 ? parts[parts.length - 1] : description;
  // Strip trailing long account numbers
  return base.replace(/\s+\d{8,}$/, '').trim();
}

export function TransactionRow({ transaction: t, categories, onUpdate, onDelete, onAddRule }: Props) {
  const [editField, setEditField] = useState<'category' | 'type' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [rulePrompt, setRulePrompt] = useState<{ pattern: string; category: string } | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  const isUncategorized = t.category === 'Uncategorized';

  const handleEdit = async (field: 'category' | 'type', value: string) => {
    await onUpdate(t.id, { [field]: value });
    setEditField(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
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

  const rowCls = [
    'border-b transition-colors',
    deleting ? 'opacity-40' : '',
    saved ? 'bg-green-50' : isUncategorized
      ? 'bg-yellow-50 border-l-2 border-l-yellow-400'
      : t.type === 'income'
        ? 'hover:bg-green-50/40'
        : 'hover:bg-red-50/30',
    'border-b-gray-100',
  ].join(' ');

  return (
    <>
      <tr className={rowCls}>
        {/* Date */}
        <td className="px-4 py-2.5 text-xs tabular-nums text-gray-500 whitespace-nowrap">{t.date}</td>

        {/* Amount */}
        <td className={`px-4 py-2.5 text-sm font-semibold tabular-nums whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
          {t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString('id-ID')}
        </td>

        {/* Currency */}
        <td className="px-4 py-2.5 text-xs text-gray-400">{t.currency}</td>

        {/* Type */}
        <td className="px-4 py-2.5">
          {editField === 'type' ? (
            <select
              autoFocus
              defaultValue={t.type}
              onBlur={e => handleEdit('type', e.target.value)}
              onChange={e => handleEdit('type', e.target.value)}
              className="rounded border border-blue-400 px-1.5 py-0.5 text-xs focus:outline-none"
            >
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>
          ) : (
            <button
              onClick={() => setEditField('type')}
              title="Click to edit"
              className={`group flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition hover:ring-2 ${
                t.type === 'income'
                  ? 'bg-green-100 text-green-700 hover:ring-green-300'
                  : 'bg-red-100 text-red-700 hover:ring-red-300'
              }`}
            >
              {t.type}
              <svg className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
              </svg>
            </button>
          )}
        </td>

        {/* Category */}
        <td className="px-4 py-2.5">
          {editField === 'category' ? (
            <select
              autoFocus
              defaultValue={t.category}
              onBlur={e => handleEdit('category', e.target.value)}
              onChange={e => handleEdit('category', e.target.value)}
              className="rounded border border-blue-400 px-1.5 py-0.5 text-xs focus:outline-none"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <button
              onClick={() => setEditField('category')}
              title="Click to edit"
              className={`group flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition hover:ring-2 hover:ring-offset-1 ${categoryPillCls(t.category)}`}
            >
              {saved
                ? <><svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> saved</>
                : <>{t.category}
                    <svg className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                    </svg>
                  </>
              }
            </button>
          )}
        </td>

        {/* Description */}
        <td className="px-4 py-2.5 text-sm text-gray-700">
          <span className="block max-w-xs truncate" title={t.description ?? ''}>{t.description ?? '—'}</span>
        </td>

        {/* Source */}
        <td className="px-4 py-2.5 text-xs text-gray-400 max-w-[120px] truncate" title={t.source_file ?? ''}>{t.source_file}</td>

        {/* Delete */}
        <td className="px-4 py-2.5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </td>
      </tr>

      {rulePrompt && (
        <tr className="border-b border-blue-100 bg-blue-50/70">
          <td colSpan={8} className="px-4 py-2">
            <div className="flex items-center gap-2 text-xs text-blue-800">
              <svg className="h-3.5 w-3.5 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                Auto-categorize <strong className="font-semibold">"{rulePrompt.pattern}"</strong>
                {' → '}
                <span className="font-medium">{rulePrompt.category}</span>
                {' '}next time?
              </span>
              <button
                onClick={handleSaveRule}
                disabled={savingRule}
                className="rounded bg-blue-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingRule ? 'Saving…' : 'Save rule'}
              </button>
              <button
                onClick={() => setRulePrompt(null)}
                className="ml-0.5 text-blue-400 hover:text-blue-600"
              >
                ✕
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
