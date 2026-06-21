interface Props {
  byCategory: Record<string, number>;
  month: string;
}

function fmt(v: number) {
  return v.toLocaleString('id-ID');
}

export function CategoryTable({ byCategory, month }: Props) {
  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-800">Category Totals</h2>
      {!rows.length ? (
        <p className="text-sm text-gray-400">No expense data for this month</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="pb-2 text-left font-medium">Category</th>
              <th className="pb-2 text-right font-medium">Amount</th>
              <th className="pb-2 text-right font-medium">% of total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(([name, value]) => (
              <tr key={name} className="group cursor-pointer hover:bg-blue-50">
                <td className="py-2 text-gray-700">
                  <a href={`#/transactions?month=${month}&category=${encodeURIComponent(name)}`} className="block group-hover:text-blue-700 group-hover:underline">
                    {name}
                  </a>
                </td>
                <td className="py-2 text-right tabular-nums font-medium text-gray-800 group-hover:text-blue-700">{fmt(value)}</td>
                <td className="py-2 text-right tabular-nums text-gray-400">{((value / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="pt-2 font-bold text-gray-800">Total</td>
              <td className="pt-2 text-right tabular-nums font-bold text-gray-800">{fmt(total)}</td>
              <td className="pt-2 text-right text-xs text-gray-400">100%</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
