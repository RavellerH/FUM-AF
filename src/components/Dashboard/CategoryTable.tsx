import { SectionCard } from '../shared/Card';
import { fmt } from '../../lib/format';

interface Props {
  byCategory: Record<string, number>;
  month: string;
}

export function CategoryTable({ byCategory, month }: Props) {
  const total = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const rows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  return (
    <SectionCard title="Category Totals">
      {!rows.length ? (
        <p className="text-sm text-slate-400">No expense data for this month</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 text-left font-medium">Category</th>
              <th className="pb-2 text-right font-medium">Amount</th>
              <th className="pb-2 text-right font-medium">% of total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map(([name, value]) => (
              <tr key={name} className="group cursor-pointer hover:bg-brand-50/60">
                <td className="py-2 text-slate-700">
                  <a href={`#/transactions?month=${month}&category=${encodeURIComponent(name)}`} className="block group-hover:text-brand-700 group-hover:underline">
                    {name}
                  </a>
                </td>
                <td className="py-2 text-right tabular-nums font-medium text-slate-800 group-hover:text-brand-700">{fmt(value)}</td>
                <td className="py-2 text-right tabular-nums text-slate-400">{((value / total) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200">
              <td className="pt-2 font-bold text-slate-800">Total</td>
              <td className="pt-2 text-right tabular-nums font-bold text-slate-800">{fmt(total)}</td>
              <td className="pt-2 text-right text-xs text-slate-400">100%</td>
            </tr>
          </tfoot>
        </table>
      )}
    </SectionCard>
  );
}
