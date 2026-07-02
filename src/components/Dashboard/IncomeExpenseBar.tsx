import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

function fmt(v: number) {
  return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

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
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-800">Income vs Variable Expenses</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => (v as number).toLocaleString('id-ID')} />
          <Legend />
          <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 flex gap-6 text-sm">
        <div>
          <span className="text-gray-500">Net</span>
          <span className={`ml-2 font-semibold ${netValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netValue.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}
