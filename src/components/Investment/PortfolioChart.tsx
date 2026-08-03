import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { usePortfolio } from '../../hooks/usePortfolio';
import type { PortfolioData } from '../../hooks/usePortfolio';
import { fmt } from '../../lib/format';

// --------------- palette (ref slots 1–3, adjacent-safe) ---------------
// light: blue #2a78d6, orange #eb6834, aqua #1baf7a
// dark:  blue #3987e5, orange #d95926, aqua #199e70

type ChartPoint = {
  date: string;
  stocks: number;
  crypto_invest: number;
  savings: number;
};

function toPoint(date: string, d: PortfolioData): ChartPoint {
  return {
    date,
    stocks: d.stocks.reduce((s, h) => s + h.value_idr, 0),
    crypto_invest: d.crypto_investing.reduce((s, c) => s + c.value_idr, 0),
    savings: d.savings.reduce((s, sv) => s + sv.value_idr, 0),
  };
}

function fmtJt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  const names: Record<string, string> = {
    stocks: 'Stocks',
    crypto_invest: 'Crypto Invest',
    savings: 'Savings',
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="mb-1.5 font-semibold text-slate-700">{label}</p>
      {[...payload].reverse().map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {names[p.name] ?? p.name}
          </span>
          <span className="font-medium tabular-nums text-slate-800">{fmt(p.value)}</span>
        </div>
      ))}
      <div className="mt-1.5 flex justify-between border-t border-slate-100 pt-1.5">
        <span className="text-slate-500">Total</span>
        <span className="font-semibold tabular-nums text-slate-900">{fmt(total)}</span>
      </div>
    </div>
  );
}

export function PortfolioChart({ currentPortfolio }: { currentPortfolio: PortfolioData }) {
  const { fetchAllSnapshots } = usePortfolio();
  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {
    fetchAllSnapshots().then(snapshots => {
      const history = snapshots.map(s => toPoint(s.snapshot_at, s.data));
      const current = toPoint(currentPortfolio.updated_at, currentPortfolio);
      const byDate = new Map<string, ChartPoint>();
      for (const p of [...history, current]) byDate.set(p.date, p);
      setData([...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)));
    }).catch(() => {
      setData([toPoint(currentPortfolio.updated_at, currentPortfolio)]);
    });
  }, [currentPortfolio.updated_at]);

  if (!data.length) return null;

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-slate-800">Portfolio Value — IDR</h2>
          <p className="mt-0.5 text-xs text-slate-400">Hyperliquid USD balance excluded (no historical FX)</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gStocks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#2a78d6" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="gCrypto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eb6834" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#eb6834" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="gSavings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1baf7a" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1baf7a" stopOpacity={0.03} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#898781' }}
            axisLine={{ stroke: '#c3c2b7' }}
            tickLine={false}
            dy={6}
          />
          <YAxis
            tickFormatter={fmtJt}
            tick={{ fontSize: 11, fill: '#898781' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />

          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />

          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => {
              const names: Record<string, string> = {
                stocks: 'Stocks',
                crypto_invest: 'Crypto Invest',
                savings: 'Savings',
              };
              return <span style={{ fontSize: 12, color: '#52514e' }}>{names[value] ?? value}</span>;
            }}
            wrapperStyle={{ paddingTop: 12 }}
          />

          <Area
            type="monotone"
            dataKey="savings"
            stackId="1"
            stroke="#1baf7a"
            strokeWidth={2}
            fill="url(#gSavings)"
            dot={{ r: 4, fill: '#1baf7a', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="crypto_invest"
            stackId="1"
            stroke="#eb6834"
            strokeWidth={2}
            fill="url(#gCrypto)"
            dot={{ r: 4, fill: '#eb6834', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
          />
          <Area
            type="monotone"
            dataKey="stocks"
            stackId="1"
            stroke="#2a78d6"
            strokeWidth={2}
            fill="url(#gStocks)"
            dot={{ r: 4, fill: '#2a78d6', strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
