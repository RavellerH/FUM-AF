import { useEffect, useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { EXCLUDE_FROM_EXPENSE, INCOME_CATEGORIES, UNCATEGORIZED } from '../../lib/constants';
import { fmt } from '../../lib/format';
import { MonthSelector } from './MonthSelector';
import { IncomeExpenseBar } from './IncomeExpenseBar';
import { CategoryDonut } from './CategoryDonut';
import { CategoryTable } from './CategoryTable';
import { TopMerchants } from './TopMerchants';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';
import { KpiCard } from '../shared/KpiCard';
import { PageHeader } from '../shared/PageHeader';
import type { Transaction } from '../../types';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function computeStats(txns: Transaction[]) {
  const income = txns
    .filter(t => t.type === 'income' && INCOME_CATEGORIES.includes(t.category))
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
  const { transactions, loading, error, fetchTransactions, getAvailableMonths } = useTransactions();
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    getAvailableMonths().then(avail => {
      setMonths(avail);
      setHasData(avail.length > 0);
      if (avail.length && !avail.includes(selectedMonth)) setSelectedMonth(avail[0]);
    });
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    fetchTransactions({ month: selectedMonth });
  }, [selectedMonth]);

  const stats = computeStats(transactions);
  const expenseAfterAid = stats.expense - stats.aid;
  const net = stats.income - expenseAfterAid;
  const hasTransactions = transactions.length > 0;
  const fixedCosts = stats.rent + (stats.byCategory['Insurance'] ?? 0);
  const uncategorizedCount = transactions.filter(t => t.category === UNCATEGORIZED).length;
  const showAid = stats.aid > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Dashboard"
        action={<MonthSelector months={months} value={selectedMonth} onChange={setSelectedMonth} />}
      />

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {loading && !hasTransactions ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : hasData === false ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-slate-500">No data yet.</p>
          <a href="#/upload" className="text-sm font-medium text-brand-600 hover:underline">Upload your first file →</a>
        </div>
      ) : (
        <>
          {uncategorizedCount > 0 && (
            <a
              href={`#/transactions?month=${selectedMonth}&category=Uncategorized`}
              className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-100"
            >
              <span>⚠️ {uncategorizedCount} uncategorized transaction{uncategorizedCount > 1 ? 's' : ''} this month</span>
              <span className="font-medium underline">Review →</span>
            </a>
          )}

          {showAid && (
            <a
              href={`#/transactions?month=${selectedMonth}&category=Reimbursement`}
              className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-800 hover:bg-brand-100"
            >
              <span>💙 {fmt(stats.aid)} received this month as family aid/reimbursement — already counted in full in Expenses below, since the spending was real</span>
              <span className="font-medium underline">View →</span>
            </a>
          )}

          {/* KPI row */}
          <div className={`mb-6 grid grid-cols-2 gap-3 sm:gap-4 ${showAid ? 'sm:grid-cols-5' : 'sm:grid-cols-4'}`}>
            <KpiCard label="Income" value={fmt(stats.income)} note="Family + Salary" valueTone="positive" />
            <KpiCard
              label="Fixed Costs"
              value={fmt(fixedCosts)}
              note={`Rent ${fmt(stats.rent)} (pass-through) + Insurance ${fmt(stats.byCategory['Insurance'] ?? 0)}`}
              tone="warning"
            />
            <KpiCard label="Expenses" value={fmt(stats.expense)} note="Variable spending" valueTone="negative" />
            {showAid && (
              <KpiCard
                label="Expenses − Aid"
                value={fmt(expenseAfterAid)}
                note={`Expenses ${fmt(stats.expense)} − aid received ${fmt(stats.aid)}`}
                tone="info"
              />
            )}
            <KpiCard
              label="Net"
              value={fmt(net)}
              note="Income − (expenses − aid)"
              tone={net >= 0 ? 'positive' : 'negative'}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <IncomeExpenseBar month={selectedMonth} income={stats.income} expense={stats.expense} net={net} />
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
