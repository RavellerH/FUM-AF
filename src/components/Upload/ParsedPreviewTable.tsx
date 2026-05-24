import type { ParsedTransaction } from '../../types';

export function ParsedPreviewTable({ transactions }: { transactions: ParsedTransaction[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        Preview — {transactions.length} transactions parsed
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500">
            <tr>
              {['Date', 'Amount', 'Currency', 'Type', 'Category', 'Description'].map(h => (
                <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.slice(0, 20).map((t, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-600">{t.date}</td>
                <td className="px-3 py-2 font-mono">{t.amount.toLocaleString()}</td>
                <td className="px-3 py-2 text-gray-500">{t.currency}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600">{t.category}</td>
                <td className="max-w-xs truncate px-3 py-2 text-gray-600">{t.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length > 20 && (
          <p className="px-4 py-2 text-center text-xs text-gray-400">
            ...and {transactions.length - 20} more
          </p>
        )}
      </div>
    </div>
  );
}
