import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SectionCard } from '../shared/Card';
import { fmt, fmtCompact } from '../../lib/format';

interface Props {
  month: string;
  income: number;
  expense: number;
  net?: number;
}

export function IncomeExpenseBar({ month, income, expense, net }: Props) {
  const data = [{ name: month, Income: income, Expense: expense }];
  const netValue = net ?? income - expense;

  return (
    <SectionCard title="Income vs Variable Expenses">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => fmt(v as number)} />
          <Legend />
          <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex gap-6 text-sm">
        <div>
          <span className="text-slate-500">Net</span>
          <span className={`ml-2 font-semibold tabular-nums ${netValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {fmt(netValue)}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
