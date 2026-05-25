import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface Props {
  byCategory: Record<string, number>;
}

export function CategoryDonut({ byCategory }: Props) {
  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm text-gray-400">No expense data for this month</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-800">Spending by Category</h2>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => (v as number).toLocaleString('id-ID')} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
