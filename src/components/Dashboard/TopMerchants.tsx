import type { Transaction } from '../../types';

export function TopMerchants({ transactions }: { transactions: Transaction[] }) {
  const sorted = [...transactions].sort((a, b) => b.amount - a.amount);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">All Transactions</h2>
        <span className="text-xs text-gray-400">{transactions.length} records</span>
      </div>
      {!sorted.length ? (
        <p className="text-sm text-gray-400">No transactions this month</p>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="pb-2 pr-4 text-left font-medium">Date</th>
                <th className="pb-2 pr-4 text-left font-medium">Description</th>
                <th className="pb-2 pr-4 text-left font-medium">Category</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 pr-4 text-gray-400 tabular-nums">{t.date}</td>
                  <td className="max-w-xs py-2 pr-4">
                    <span className="truncate block text-gray-700">{t.description ?? '—'}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{t.category}</span>
                  </td>
                  <td className={`py-2 text-right tabular-nums font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {t.type === 'income' ? '+' : '−'}{t.amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
