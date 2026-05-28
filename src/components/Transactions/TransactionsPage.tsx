import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useRules } from '../../hooks/useRules';
import { supabase } from '../../lib/supabase';
import { TransactionFilters } from './TransactionFilters';
import { TransactionRow } from './TransactionRow';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';
import type { Transaction } from '../../types';
import type { TransactionFilters as Filters } from '../../hooks/useTransactions';

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
  const [filters, setFilters] = useState<Filters>({});
  const [search, setSearch] = useState('');
  const [uncategorizedOnly, setUncategorizedOnly] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchCategories();
    supabase
      .from('transactions')
      .select('date')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        setMonths([...new Set(data.map(r => r.date.slice(0, 7)))]);
      });
  }, [session]);

  useEffect(() => {
    fetchTransactions(filters);
  }, [filters]);

  const categoryNames = categories.map(c => c.name);

  // Client-side filtering on top of DB filters
  const visible = useMemo(() => {
    let list = transactions;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t => t.description?.toLowerCase().includes(q));
    }
    if (uncategorizedOnly) {
      list = list.filter(t => t.category === 'Uncategorized');
    }
    return list;
  }, [transactions, search, uncategorizedOnly]);

  const EXCLUDE = ['Third-Party Transfer', 'Housing', 'Investment', 'Reimbursable'];

  // Summary stats — exclude passthroughs and non-personal categories
  const stats = useMemo(() => {
    const income  = visible.filter(t => t.type === 'income'  && t.category === 'Family').reduce((s, t) => s + t.amount, 0);
    const expense = visible.filter(t => t.type === 'expense' && !EXCLUDE.includes(t.category)).reduce((s, t) => s + t.amount, 0);
    const uncategorized = visible.filter(t => t.category === 'Uncategorized').length;
    return { income, expense, net: income - expense, uncategorized };
  }, [visible]);

  const grouped = groupByDate(visible);
  const dates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
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
          onChange={f => setFilters(f)}
          onSearch={setSearch}
          onUncategorizedOnly={setUncategorizedOnly}
        />
      </div>

      {/* Stats bar */}
      {visible.length > 0 && (
        <div className="mb-4 flex gap-3">
          {/* Income + Expense side by side in one card */}
          <div className="flex flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white">
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
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-3">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Net</p>
            <p className={`text-lg font-bold ${stats.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {stats.net >= 0 ? '+' : '−'}{fmt(Math.abs(stats.net))}
            </p>
          </div>

          {/* Uncategorized */}
          <div className={`rounded-lg border px-5 py-3 ${stats.uncategorized > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
            <p className="text-xs text-gray-400 uppercase tracking-wide">Uncategorized</p>
            <p className={`text-lg font-bold ${stats.uncategorized > 0 ? 'text-yellow-700' : 'text-gray-400'}`}>
              {stats.uncategorized}
            </p>
          </div>
        </div>
      )}

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : !visible.length ? (
          <div className="py-20 text-center text-sm text-gray-400">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500 shadow-sm">
                <tr>
                  {['Date', 'Amount', 'Curr', 'Type', 'Category', 'Description', 'Source', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dates.map(date => {
                  const rows = grouped.get(date)!;
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
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
