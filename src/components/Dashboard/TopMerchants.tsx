import { SectionCard } from '../shared/Card';
import { fmt } from '../../lib/format';
import type { Transaction } from '../../types';

export function TopMerchants({ transactions }: { transactions: Transaction[] }) {
  const sorted = [...transactions].sort((a, b) => b.amount - a.amount);

  return (
    <SectionCard
      title="All Transactions"
      action={<span className="text-xs text-slate-400">{transactions.length} records</span>}
    >
      {!sorted.length ? (
        <p className="text-sm text-slate-400">No transactions this month</p>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-4 text-left font-medium">Date</th>
                <th className="pb-2 pr-4 text-left font-medium">Description</th>
                <th className="pb-2 pr-4 text-left font-medium">Category</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-2 pr-4 text-slate-400 tabular-nums">{t.date}</td>
                  <td className="max-w-xs py-2 pr-4">
                    <span className="truncate block text-slate-700">{t.description ?? '—'}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">{t.category}</span>
                  </td>
                  <td className={`py-2 text-right tabular-nums font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
