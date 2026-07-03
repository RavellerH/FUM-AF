import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, SectionCard } from '../shared/Card';
import { fmt } from '../../lib/format';

const COLORS = ['#6366f1', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

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
      <Card className="flex h-64 items-center justify-center p-6">
        <p className="text-sm text-slate-400">No expense data for this month</p>
      </Card>
    );
  }

  return (
    <SectionCard title="Spending by Category">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => fmt(v as number)} />
          <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-slate-600">{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </SectionCard>
  );
}
