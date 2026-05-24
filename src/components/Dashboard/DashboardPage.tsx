import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTransactions } from '../../hooks/useTransactions';
import { useSummary } from '../../hooks/useSummary';
import { supabase } from '../../lib/supabase';
import { MonthSelector } from './MonthSelector';
import { IncomeExpenseBar } from './IncomeExpenseBar';
import { CategoryDonut } from './CategoryDonut';
import { TopMerchants } from './TopMerchants';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function DashboardPage() {
  const { session } = useAuth();
  const { transactions, fetchTransactions } = useTransactions();
  const { summary, loading, error, fetchSummary, buildAndUpsertSummary } = useSummary();
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  // Load distinct months available
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
        if (unique.length && !unique.includes(selectedMonth)) setSelectedMonth(unique[0]);
      });
  }, [session]);

  useEffect(() => {
    if (!selectedMonth || !session) return;
    fetchTransactions({ month: selectedMonth });
    fetchSummary(selectedMonth).then(async () => {
      // Auto-build summary if missing
    });
  }, [selectedMonth, session]);

  // If no summary cached, build it
  useEffect(() => {
    if (!loading && !summary && selectedMonth && session) {
      buildAndUpsertSummary(selectedMonth, session.user.id);
    }
  }, [loading, summary]);

  const handleMonthChange = (m: string) => setSelectedMonth(m);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <MonthSelector months={months} value={selectedMonth} onChange={handleMonthChange} />
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {loading && !summary ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : !summary ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-gray-500">No data yet for {selectedMonth}.</p>
          <a href="#/upload" className="text-sm text-blue-600 hover:underline">Upload your first file →</a>
        </div>
      ) : (
        <>
          {/* KPI row */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            {[
              { label: 'Income', value: summary.total_income, color: 'text-green-600' },
              { label: 'Expenses', value: summary.total_expense, color: 'text-red-600' },
              { label: 'Net', value: summary.total_income - summary.total_expense, color: summary.total_income - summary.total_expense >= 0 ? 'text-green-600' : 'text-red-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-gray-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
                <p className={`mt-1 text-2xl font-bold ${color}`}>{value.toLocaleString('id-ID')}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <IncomeExpenseBar summary={summary} />
            <CategoryDonut summary={summary} />
          </div>
          <div className="mt-6">
            <TopMerchants transactions={transactions} />
          </div>
        </>
      )}
    </div>
  );
}
