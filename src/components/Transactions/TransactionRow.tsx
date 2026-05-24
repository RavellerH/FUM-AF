import { useState } from 'react';
import type { Transaction } from '../../types';

interface Props {
  transaction: Transaction;
  categories: string[];
  onUpdate: (id: string, patch: Partial<Pick<Transaction, 'category' | 'type'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TransactionRow({ transaction: t, categories, onUpdate, onDelete }: Props) {
  const [editField, setEditField] = useState<'category' | 'type' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = async (field: 'category' | 'type', value: string) => {
    await onUpdate(t.id, { [field]: value });
    setEditField(null);
  };

  const handleDelete = async () => {
    if (!confirm('Delete this transaction?')) return;
    setDeleting(true);
    await onDelete(t.id);
  };

  return (
    <tr className={`border-b border-gray-100 hover:bg-gray-50 ${deleting ? 'opacity-50' : ''}`}>
      <td className="px-4 py-3 text-sm text-gray-600">{t.date}</td>
      <td className="px-4 py-3 text-sm font-mono">{t.amount.toLocaleString('id-ID')}</td>
      <td className="px-4 py-3 text-xs text-gray-400">{t.currency}</td>
      <td className="px-4 py-3">
        {editField === 'type' ? (
          <select
            autoFocus
            defaultValue={t.type}
            onBlur={e => handleEdit('type', e.target.value)}
            onChange={e => handleEdit('type', e.target.value)}
            className="rounded border border-blue-400 px-1 py-0.5 text-xs"
          >
            <option value="income">income</option>
            <option value="expense">expense</option>
          </select>
        ) : (
          <button
            onClick={() => setEditField('type')}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {t.type}
          </button>
        )}
      </td>
      <td className="px-4 py-3">
        {editField === 'category' ? (
          <select
            autoFocus
            defaultValue={t.category}
            onBlur={e => handleEdit('category', e.target.value)}
            onChange={e => handleEdit('category', e.target.value)}
            className="rounded border border-blue-400 px-1 py-0.5 text-xs"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        ) : (
          <button
            onClick={() => setEditField('category')}
            className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
          >
            {t.category}
          </button>
        )}
      </td>
      <td className="max-w-xs truncate px-4 py-3 text-sm text-gray-600">{t.description}</td>
      <td className="px-4 py-3 text-xs text-gray-400">{t.source_file}</td>
      <td className="px-4 py-3">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
