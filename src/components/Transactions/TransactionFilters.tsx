import type { TransactionFilters } from '../../hooks/useTransactions';

interface Props {
  filters: TransactionFilters;
  months: string[];
  categories: string[];
  onChange: (f: TransactionFilters) => void;
}

export function TransactionFilters({ filters, months, categories, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={filters.month ?? ''}
        onChange={e => onChange({ ...filters, month: e.target.value || undefined })}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="">All months</option>
        {months.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      <select
        value={filters.type ?? ''}
        onChange={e => onChange({ ...filters, type: e.target.value as TransactionFilters['type'] })}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>

      <select
        value={filters.category ?? ''}
        onChange={e => onChange({ ...filters, category: e.target.value || undefined })}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none"
      >
        <option value="">All categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}
