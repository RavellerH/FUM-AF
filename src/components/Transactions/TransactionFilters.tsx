import type { TransactionFilters } from '../../hooks/useTransactions';

interface Props {
  filters: TransactionFilters;
  months: string[];
  categories: string[];
  search: string;
  uncategorizedOnly: boolean;
  onChange: (f: TransactionFilters) => void;
  onSearch: (s: string) => void;
  onUncategorizedOnly: (v: boolean) => void;
}

export function TransactionFilters({
  filters, months, categories, search, uncategorizedOnly,
  onChange, onSearch, onUncategorizedOnly,
}: Props) {
  const selectCls = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Description search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search description…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none w-52"
        />
        {search && (
          <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <select value={filters.month ?? ''} onChange={e => onChange({ ...filters, month: e.target.value || undefined })} className={selectCls}>
        <option value="">All months</option>
        {months.map(m => <option key={m} value={m}>{m}</option>)}
      </select>

      <select value={filters.type ?? ''} onChange={e => onChange({ ...filters, type: e.target.value as TransactionFilters['type'] })} className={selectCls}>
        <option value="">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>

      <select value={filters.category ?? ''} onChange={e => onChange({ ...filters, category: e.target.value || undefined })} className={selectCls}>
        <option value="">All categories</option>
        {categories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Uncategorized toggle */}
      <button
        onClick={() => onUncategorizedOnly(!uncategorizedOnly)}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
          uncategorizedOnly
            ? 'border-yellow-400 bg-yellow-50 text-yellow-800'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${uncategorizedOnly ? 'bg-yellow-500' : 'bg-gray-300'}`} />
        Uncategorized only
      </button>
    </div>
  );
}
