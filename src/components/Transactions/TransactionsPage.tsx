import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useRules } from '../../hooks/useRules';
import { supabase } from '../../lib/supabase';
import { TransactionFilters } from './TransactionFilters';
import type { PageFilters } from './TransactionFilters';
import { TransactionRow } from './TransactionRow';
import { TransactionCard } from './TransactionCard';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';
import type { Transaction, TransactionType } from '../../types';

type SortKey = 'date' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

function fmt(v: number) {
  return v.toLocaleString('id-ID');
}

function groupByDate(txns: Transaction[]) {
  const groups = new Map<string, Transaction[]>();
  for (const t of txns) {
    const list = groups.get(t.date) ?? [];
    list.push(t);
    groups.set(t.date, list);
  }
  return groups;
}

export function TransactionsPage() {
  const { session } = useAuth();
  const { transactions, loading, error, fetchTransactions, updateTransaction, deleteTransaction } = useTransactions();
  const { categories, fetchCategories } = useCategories();
  const { addRule } = useRules();
  const [months, setMonths] = useState<string[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<PageFilters>(() => ({
    dateFrom: searchParams.get('dateFrom') ?? '',
    dateTo: searchParams.get('dateTo') ?? '',
    months: searchParams.getAll('month'),
    type: (searchParams.get('type') as TransactionType | '') ?? '',
    categories: searchParams.getAll('category'),
    amountMin: searchParams.get('amountMin') ?? '',
    amountMax: searchParams.get('amountMax') ?? '',
  }));
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [uncategorizedOnly, setUncategorizedOnly] = useState(searchParams.get('uncategorized') === '1');
  const [sortKey, setSortKey] = useState<SortKey>((searchParams.get('sort') as SortKey) || 'date');
  const [sortDir, setSortDir] = useState<SortDir>((searchParams.get('dir') as SortDir) || 'desc');

  // Keep URL in sync with filter state
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    for (const m of filters.months) params.append('month', m);
    if (filters.type) params.set('type', filters.type);
    for (const c of filters.categories) params.append('category', c);
    if (filters.amountMin) params.set('amountMin', filters.amountMin);
    if (filters.amountMax) params.set('amountMax', filters.amountMax);
    if (search) params.set('q', search);
    if (uncategorizedOnly) params.set('uncategorized', '1');
    if (sortKey !== 'date') params.set('sort', sortKey);
    if (sortDir !== 'desc') params.set('dir', sortDir);
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, search, uncategorizedOnly, sortKey, sortDir]);

  useEffect(() => {
    if (!session) return;
    fetchCategories();
    fetchTransactions({});
    supabase
      .from('transactions')
      .select('date')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setMonths([...new Set(data.map(r => r.date.slice(0, 7)))]);
      });
  }, [session]);

  const categoryNames = categories.map(c => c.name);

  const visible = useMemo(() => {
    let list = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.description?.toLowerCase().includes(q));
    }
    if (filters.dateFrom) list = list.filter(t => t.date >= filters.dateFrom);
    if (filters.dateTo) list = list.filter(t => t.date <= filters.dateTo);
    if (filters.months.length) list = list.filter(t => filters.months.includes(t.date.slice(0, 7)));
    if (filters.type) list = list.filter(t => t.type === filters.type);
    if (filters.categories.length) list = list.filter(t => filters.categories.includes(t.category));
    const min = filters.amountMin ? Number(filters.amountMin) : undefined;
    const max = filters.amountMax ? Number(filters.amountMax) : undefined;
    if (min !== undefined) list = list.filter(t => t.amount >= min);
    if (max !== undefined) list = list.filter(t => t.amount <= max);
    if (uncategorizedOnly) list = list.filter(t => t.category === 'Uncategorized');
    return list;
  }, [transactions, search, filters, uncategorizedOnly]);

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...visible].sort((a, b) => {
      if (sortKey === 'amount') return (a.amount - b.amount) * dir;
      if (sortKey === 'category') return a.category.localeCompare(b.category) * dir;
      return a.date.localeCompare(b.date) * dir;
    });
  }, [visible, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'date' ? 'desc' : 'desc');
    }
  }, [sortKey]);

  const EXCLUDE = ['Third-Party Transfer', 'Housing', 'Investment', 'Reimbursable'];

  // Summary stats — exclude passthroughs and non-personal categories
  const stats = useMemo(() => {
    const income  = visible.filter(t => t.type === 'income'  && t.category === 'Family').reduce((s, t) => s + t.amount, 0);
    const expense = visible.filter(t => t.type === 'expense' && !EXCLUDE.includes(t.category)).reduce((s, t) => s + t.amount, 0);
    const uncategorized = visible.filter(t => t.category === 'Uncategorized').length;
    return { income, expense, net: income - expense, uncategorized };
  }, [visible]);

  const isDateSort = sortKey === 'date';
  const grouped = isDateSort ? groupByDate(sorted) : null;
  const dates = grouped ? [...grouped.keys()].sort((a, b) => (sortDir === 'asc' ? a.localeCompare(b) : b.localeCompare(a))) : [];

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <span className="text-sm text-gray-500">{visible.length} of {transactions.length} records</span>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <TransactionFilters
          filters={filters}
          months={months}
          categories={categoryNames}
          search={search}
          uncategorizedOnly={uncategorizedOnly}
          onChange={setFilters}
          onSearch={setSearch}
          onUncategorizedOnly={setUncategorizedOnly}
        />
      </div>

      {/* Stats bar */}
      {visible.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-3">
          {/* Income + Expense side by side in one card */}
          <div className="flex flex-1 min-w-[200px] overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="flex-1 border-r border-gray-100 px-5 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Income</p>
              <p className="text-lg font-bold text-emerald-600">+{fmt(stats.income)}</p>
            </div>
            <div className="flex-1 px-5 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Expense</p>
              <p className="text-lg font-bold text-red-500">−{fmt(stats.expense)}</p>
            </div>
          </div>

          {/* Net */}
          <div className="flex-1 min-w-[140px] rounded-lg border border-gray-200 bg-white px-5 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Net</p>
            <p className={`text-lg font-bold ${stats.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {stats.net >= 0 ? '+' : '−'}{fmt(Math.abs(stats.net))}
            </p>
          </div>

          {/* Uncategorized */}
          <div className={`flex-1 min-w-[140px] rounded-lg border px-5 py-3 ${stats.uncategorized > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Uncategorized</p>
            <p className={`text-lg font-bold ${stats.uncategorized > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
              {stats.uncategorized}
            </p>
          </div>
        </div>
      )}

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {/* Transactions */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : !visible.length ? (
          <div className="py-20 text-center text-sm text-gray-400">No transactions found.</div>
        ) : (
          <>
            {/* Mobile: stacked cards, no horizontal scrolling */}
            <div className="divide-y divide-gray-100 sm:hidden">
              {isDateSort ? dates.map(date => {
                const rows = grouped!.get(date)!;
                const dayIncome  = rows.filter(t => t.type === 'income'  && t.category === 'Family').reduce((s, t) => s + t.amount, 0);
                const dayExpense = rows.filter(t => t.type === 'expense' && !EXCLUDE.includes(t.category)).reduce((s, t) => s + t.amount, 0);
                return (
                  <div key={`date-${date}`}>
                    <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50/70 px-3 py-1.5">
                      <span className="text-xs font-semibold text-blue-700">
                        {new Date(date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' })}
                        <span className="ml-1.5 font-normal text-blue-400">({rows.length})</span>
                      </span>
                      <span className="flex gap-3 text-xs">
                        {dayIncome > 0 && <span className="font-medium text-emerald-600">+{fmt(dayIncome)}</span>}
                        {dayExpense > 0 && <span className="font-medium text-red-500">−{fmt(dayExpense)}</span>}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {rows.map(t => (
                        <TransactionCard
                          key={t.id}
                          transaction={t}
                          categories={categoryNames}
                          onUpdate={updateTransaction}
                          onDelete={deleteTransaction}
                          onAddRule={addRule}
                        />
                      ))}
                    </div>
                  </div>
                );
              }) : sorted.map(t => (
                <TransactionCard
                  key={t.id}
                  transaction={t}
                  categories={categoryNames}
                  onUpdate={updateTransaction}
                  onDelete={deleteTransaction}
                  onAddRule={addRule}
                />
              ))}
            </div>

            {/* Desktop/tablet: full table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full">
                <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('date')}>
                      Date{sortIndicator('date')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('amount')}>
                      Amount{sortIndicator('amount')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Curr</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => toggleSort('category')}>
                      Category{sortIndicator('category')}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                    <th className="px-4 py-3 text-left font-medium">Source</th>
                    <th className="px-4 py-3 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {isDateSort ? dates.map(date => {
                    const rows = grouped!.get(date)!;
                    const dayIncome  = rows.filter(t => t.type === 'income'  && t.category === 'Family').reduce((s, t) => s + t.amount, 0);
                    const dayExpense = rows.filter(t => t.type === 'expense' && !EXCLUDE.includes(t.category)).reduce((s, t) => s + t.amount, 0);
                    return (
                      <>
                        <tr key={`date-${date}`} className="border-b border-blue-100 bg-blue-50/70">
                          <td colSpan={8} className="px-4 py-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-blue-700">
                                {new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
                                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}
                                <span className="ml-2 font-normal text-blue-400">({rows.length})</span>
                              </span>
                              <span className="flex gap-4 text-xs">
                                {dayIncome > 0 && <span className="font-medium text-emerald-600">+{fmt(dayIncome)}</span>}
                                {dayExpense > 0 && <span className="font-medium text-red-500">−{fmt(dayExpense)}</span>}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {rows.map(t => (
                          <TransactionRow
                            key={t.id}
                            transaction={t}
                            categories={categoryNames}
                            onUpdate={updateTransaction}
                            onDelete={deleteTransaction}
                            onAddRule={addRule}
                          />
                        ))}
                      </>
                    );
                  }) : sorted.map(t => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      categories={categoryNames}
                      onUpdate={updateTransaction}
                      onDelete={deleteTransaction}
                      onAddRule={addRule}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
