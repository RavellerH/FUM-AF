import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { supabase } from '../../lib/supabase';
import { TransactionFilters } from './TransactionFilters';
import { TransactionRow } from './TransactionRow';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';
import type { TransactionFilters as Filters } from '../../hooks/useTransactions';

function groupByDate(transactions: ReturnType<typeof useTransactions>['transactions']) {
  const groups = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const existing = groups.get(t.date) ?? [];
    existing.push(t);
    groups.set(t.date, existing);
  }
  return groups;
}

export function TransactionsPage() {
  const { session } = useAuth();
  const { transactions, loading, error, fetchTransactions, updateTransaction, deleteTransaction } = useTransactions();
  const { categories, fetchCategories } = useCategories();
  const [months, setMonths] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({});

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
  const grouped = groupByDate(transactions);
  const dates = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <span className="text-sm text-gray-500">{transactions.length} records</span>
      </div>

      <div className="mb-4">
        <TransactionFilters
          filters={filters}
          months={months}
          categories={categoryNames}
          onChange={f => setFilters(f)}
        />
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : !transactions.length ? (
          <div className="py-20 text-center text-sm text-gray-400">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  {['Date', 'Amount', 'Curr', 'Type', 'Category', 'Description', 'Source', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dates.map(date => (
                  <>
                    <tr key={`date-${date}`} className="bg-blue-50 border-b border-blue-100">
                      <td colSpan={8} className="px-4 py-2 text-xs font-semibold text-blue-700 tracking-wide">
                        {new Date(date + 'T00:00:00').toLocaleDateString('id-ID', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                        <span className="ml-2 font-normal text-blue-400">
                          ({grouped.get(date)!.length} transactions)
                        </span>
                      </td>
                    </tr>
                    {grouped.get(date)!.map(t => (
                      <TransactionRow
                        key={t.id}
                        transaction={t}
                        categories={categoryNames}
                        onUpdate={updateTransaction}
                        onDelete={deleteTransaction}
                      />
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
