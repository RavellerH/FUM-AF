import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useSummary } from '../../hooks/useSummary';
import { supabase } from '../../lib/supabase';
import { MonthSelector } from './MonthSelector';
import { IncomeExpenseBar } from './IncomeExpenseBar';
import { CategoryDonut } from './CategoryDonut';
import { CategoryTable } from './CategoryTable';
import { TopMerchants } from './TopMerchants';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';
import type { Transaction } from '../../types';

const EXCLUDE_FROM_EXPENSE = ['Third-Party Transfer', 'Housing', 'Investment', 'Reimbursable'];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function fmt(v: number) {
  return v.toLocaleString('id-ID');
}

function computeStats(txns: Transaction[]) {
  const income = txns
    .filter(t => t.type === 'income' && t.category === 'Family')
    .reduce((s, t) => s + t.amount, 0);

  const rent = txns
    .filter(t => t.type === 'expense' && t.category === 'Housing')
    .reduce((s, t) => s + t.amount, 0);

  const expense = txns
    .filter(t => t.type === 'expense' && !EXCLUDE_FROM_EXPENSE.includes(t.category))
    .reduce((s, t) => s + t.amount, 0);

  const byCategory = txns.reduce<Record<string, number>>((acc, t) => {
    if (t.type === 'expense' && !EXCLUDE_FROM_EXPENSE.includes(t.category)) {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount;
    }
    return acc;
  }, {});

  // Aid/reimbursements received (e.g. family covering a medical bill or purchase).
  // Kept out of the Income KPI and NOT subtracted from Expenses — the spending still happened.
  const aid = txns
    .filter(t => t.type === 'income' && t.category === 'Reimbursement')
    .reduce((s, t) => s + t.amount, 0);

  return { income, rent, expense, byCategory, aid };
}

export function DashboardPage() {
  const { session } = useAuth();
  const { transactions, fetchTransactions } = useTransactions();
  const { loading, error, fetchSummary, buildAndUpsertSummary } = useSummary();
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) return;
    supabase
      .from('transactions')
      .select('date')
      .order('date', { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const unique = [...new Set(data.map(r => r.date.slice(0, 7)))];
        setMonths(unique);
        setHasData(unique.length > 0);
        if (unique.length && !unique.includes(selectedMonth)) setSelectedMonth(unique[0]);
      });
  }, [session]);

  useEffect(() => {
    if (!selectedMonth || !session) return;
    fetchTransactions({ month: selectedMonth });
    fetchSummary(selectedMonth).then(() => {
      buildAndUpsertSummary(selectedMonth, session.user.id).catch(() => {});
    });
  }, [selectedMonth, session]);

  const stats = computeStats(transactions);
  const net = stats.income - stats.expense;
  const hasTransactions = transactions.length > 0;
  const fixedCosts = stats.rent + (stats.byCategory['Insurance'] ?? 0);
  const uncategorizedCount = transactions.filter(t => t.category === 'Uncategorized').length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <MonthSelector months={months} value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {loading && !hasTransactions ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : hasData === false ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-gray-500">No data yet.</p>
          <a href="#/upload" className="text-sm text-blue-600 hover:underline">Upload your first file →</a>
        </div>
      ) : (
        <>
          {uncategorizedCount > 0 && (
            <a
              href={`#/transactions?month=${selectedMonth}&category=Uncategorized`}
              className="mb-4 flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-800 hover:bg-yellow-100"
            >
              <span>⚠️ {uncategorizedCount} uncategorized transaction{uncategorizedCount > 1 ? 's' : ''} this month</span>
              <span className="font-medium underline">Review →</span>
            </a>
          )}

          {stats.aid > 0 && (
            <a
              href={`#/transactions?month=${selectedMonth}&category=Reimbursement`}
              className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-800 hover:bg-blue-100"
            >
              <span>💙 {fmt(stats.aid)} received this month as family aid/reimbursement — already counted in full in Expenses below, since the spending was real</span>
              <span className="font-medium underline">View →</span>
            </a>
          )}

          {/* KPI row */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Income</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{fmt(stats.income)}</p>
              <p className="mt-1 text-xs text-gray-400">Family transfers</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Fixed Costs</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{fmt(fixedCosts)}</p>
              <p className="mt-1 text-xs text-amber-500">
                Rent {fmt(stats.rent)} (pass-through) + Insurance {fmt(stats.byCategory['Insurance'] ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Expenses</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{fmt(stats.expense)}</p>
              <p className="mt-1 text-xs text-gray-400">Variable spending</p>
            </div>
            <div className={`rounded-xl border p-5 ${net >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Net</p>
              <p className={`mt-1 text-2xl font-bold ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(net)}</p>
              <p className="mt-1 text-xs text-gray-400">Income − expenses</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <IncomeExpenseBar month={selectedMonth} income={stats.income} expense={stats.expense} />
            <CategoryDonut byCategory={stats.byCategory} />
          </div>
          <div className="mt-6">
            <CategoryTable byCategory={stats.byCategory} month={selectedMonth} />
          </div>
          <div className="mt-6">
            <TopMerchants transactions={transactions} />
          </div>
        </>
      )}
    </div>
  );
}
