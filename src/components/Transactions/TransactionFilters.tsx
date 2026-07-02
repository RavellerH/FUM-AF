import { MultiSelectDropdown } from './MultiSelectDropdown';
import type { TransactionType } from '../../types';

export interface PageFilters {
  dateFrom: string;
  dateTo: string;
  months: string[];
  type: TransactionType | '';
  categories: string[];
  amountMin: string;
  amountMax: string;
}

interface Props {
  filters: PageFilters;
  months: string[];
  categories: string[];
  search: string;
  uncategorizedOnly: boolean;
  onChange: (f: PageFilters) => void;
  onSearch: (s: string) => void;
  onUncategorizedOnly: (v: boolean) => void;
}

export function TransactionFilters({
  filters, months, categories, search, uncategorizedOnly,
  onChange, onSearch, onUncategorizedOnly,
}: Props) {
  const selectCls = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none";
  const inputCls = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none";

  const hasActiveFilters = filters.dateFrom || filters.dateTo || filters.months.length || filters.type
    || filters.categories.length || filters.amountMin || filters.amountMax || uncategorizedOnly || search;

  const clearAll = () => {
    onChange({ dateFrom: '', dateTo: '', months: [], type: '', categories: [], amountMin: '', amountMax: '' });
    onSearch('');
    onUncategorizedOnly(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Description search */}
      <div className="relative w-full sm:w-auto">
        <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search description…"
          value={search}
          onChange={e => onSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none sm:w-52"
        />
        {search && (
          <button onClick={() => onSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Date range */}
      <div className="flex w-full items-center gap-1.5 sm:w-auto">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={e => onChange({ ...filters, dateFrom: e.target.value })}
          className={`${inputCls} min-w-0 flex-1 sm:flex-none`}
          title="From date"
        />
        <span className="shrink-0 text-xs text-gray-400">to</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={e => onChange({ ...filters, dateTo: e.target.value })}
          className={`${inputCls} min-w-0 flex-1 sm:flex-none`}
          title="To date"
        />
      </div>

      {/* Month multi-select */}
      <MultiSelectDropdown
        label="Months"
        options={months}
        selected={filters.months}
        onChange={vals => onChange({ ...filters, months: vals })}
      />

      <select value={filters.type} onChange={e => onChange({ ...filters, type: e.target.value as PageFilters['type'] })} className={selectCls}>
        <option value="">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
      </select>

      {/* Category multi-select */}
      <MultiSelectDropdown
        label="Categories"
        options={categories}
        selected={filters.categories}
        onChange={vals => onChange({ ...filters, categories: vals })}
      />

      {/* Amount range */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          placeholder="Min amount"
          value={filters.amountMin}
          onChange={e => onChange({ ...filters, amountMin: e.target.value })}
          className={`${inputCls} w-28`}
        />
        <span className="text-xs text-gray-400">–</span>
        <input
          type="number"
          placeholder="Max amount"
          value={filters.amountMax}
          onChange={e => onChange({ ...filters, amountMax: e.target.value })}
          className={`${inputCls} w-28`}
        />
      </div>

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

      {hasActiveFilters && (
        <button onClick={clearAll} className="text-sm text-gray-400 hover:text-gray-600 underline">
          Clear filters
        </button>
      )}
    </div>
  );
}
