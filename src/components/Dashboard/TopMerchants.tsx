import type { Transaction } from '../../types';

export function TopMerchants({ transactions }: { transactions: Transaction[] }) {
  const expenses = transactions.filter(t => t.type === 'expense' && !['Internal Transfer', 'Housing'].includes(t.category));
  const map = new Map<string, number>();
  for (const t of expenses) {
    map.set(t.description ?? 'Unknown', (map.get(t.description ?? 'Unknown') ?? 0) + t.amount);
  }
  const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const max = top[0]?.[1] ?? 1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-800">Top Merchants</h2>
      {!top.length ? (
        <p className="text-sm text-gray-400">No expenses this month</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {top.map(([name, amount]) => (
            <li key={name}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="max-w-xs truncate text-gray-700">{name}</span>
                <span className="font-medium text-gray-900">{amount.toLocaleString('id-ID')}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-blue-500"
                  style={{ width: `${(amount / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
