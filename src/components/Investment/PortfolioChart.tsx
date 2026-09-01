import { useEffect, useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip,
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
  label: string;
  stocks: number;
  crypto_invest: number;
  savings: number;
  pnl_pct: number;
  pnl_idr: number;
};

function fmtDate(d: string): string {
  const parts = d.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const m = parseInt(parts[1]);
  const day = parseInt(parts[2] ?? '1');
  return `${day} ${months[m] ?? ''}`;
}

function toPoint(date: string, d: PortfolioData): ChartPoint {
  return {
    date,
    label: fmtDate(date),
    stocks: d.stocks.reduce((s, h) => s + h.value_idr, 0),
    crypto_invest: d.crypto_investing.reduce((s, c) => s + c.value_idr, 0),
    savings: d.savings.reduce((s, sv) => s + sv.value_idr, 0),
    pnl_pct: d.stocks_pnl_pct,
    pnl_idr: d.stocks_pnl_idr,
  };
}

function fmtJt(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

function ValueTooltip({ active, payload, label }: {
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

function PnlTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; payload: ChartPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const pct = payload[0]?.value ?? 0;
  const idr = payload[0]?.payload?.pnl_idr ?? 0;
  const neg = pct < 0;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-md text-xs">
      <p className="mb-1.5 font-semibold text-slate-700">{label}</p>
      <p className={`tabular-nums font-semibold ${neg ? 'text-rose-600' : 'text-emerald-600'}`}>
        PnL: {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
      </p>
      <p className={`tabular-nums ${neg ? 'text-rose-400' : 'text-emerald-400'}`}>
        {idr < 0 ? '−' : '+'} {fmt(Math.abs(idr))} IDR
      </p>
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

  const first = data[0];
  const last = data[data.length - 1];
  const recovery = data.length > 1 ? last.pnl_pct - first.pnl_pct : 0;
  const improving = recovery > 0;

  return (
    <>
      {/* ── Portfolio Value ── */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Portfolio Value — IDR</h2>
            <p className="mt-0.5 text-xs text-slate-400">Hyperliquid USD excluded (no historical FX)</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
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
              dataKey="label"
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
            <Tooltip content={<ValueTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />
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
            <Area type="monotone" dataKey="savings" stackId="1" stroke="#1baf7a" strokeWidth={2}
              fill="url(#gSavings)" dot={{ r: 4, fill: '#1baf7a', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
            <Area type="monotone" dataKey="crypto_invest" stackId="1" stroke="#eb6834" strokeWidth={2}
              fill="url(#gCrypto)" dot={{ r: 4, fill: '#eb6834', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
            <Area type="monotone" dataKey="stocks" stackId="1" stroke="#2a78d6" strokeWidth={2}
              fill="url(#gStocks)" dot={{ r: 4, fill: '#2a78d6', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Stocks PnL Trend ── */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-800">Stocks PnL — Tren</h2>
            <p className="mt-0.5 text-xs text-slate-400">Unrealised PnL saham per snapshot</p>
          </div>
          {data.length > 1 && (
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
              improving ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
            }`}>
              {improving ? '↑' : '↓'} {Math.abs(recovery).toFixed(2)} pp sejak {first.label}
            </span>
          )}
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#898781' }}
              axisLine={{ stroke: '#c3c2b7' }}
              tickLine={false}
              dy={6}
            />
            <YAxis
              tickFormatter={v => v + '%'}
              tick={{ fontSize: 11, fill: '#898781' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <ReferenceLine y={0} stroke="#c3c2b7" strokeDasharray="4 3" label={{ value: '0%', position: 'right', fontSize: 10, fill: '#c3c2b7' }} />
            <Tooltip content={<PnlTooltip />} cursor={{ stroke: '#c3c2b7', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="pnl_pct"
              stroke="#e05252"
              strokeWidth={2.5}
              dot={(dotProps: any) => {
                const { cx, cy, index, payload } = dotProps;
                const isLast = index === data.length - 1;
                const color = payload.pnl_pct >= 0 ? '#1baf7a' : '#e05252';
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx} cy={cy}
                    r={isLast ? 5 : 4}
                    fill={isLast ? color : '#fff'}
                    stroke={color}
                    strokeWidth={2}
                  />
                );
              }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#e05252' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
