import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { PortfolioData } from '../../hooks/usePortfolio';
import { fmt } from '../../lib/format';

// Categorical slots 1–6 in fixed order (validated: light surface, adjacent CVD ΔE ≥ 9).
const SLOTS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'];
const OTHER = '#a3a29c';
const MAX_SLICES = 6;

type Slice = { name: string; detail: string; value: number; color: string; pct: number };

function buildSlices(p: PortfolioData, usdIdr: number | null): Slice[] {
  const items: Array<{ name: string; detail: string; value: number }> = [];
  for (const s of p.stocks) items.push({ name: s.symbol, detail: `${s.lots} lot`, value: s.value_idr });

  const bySymbol = new Map<string, { amount: number; value: number; platforms: Set<string> }>();
  for (const c of p.crypto_investing) {
    const e = bySymbol.get(c.symbol) ?? { amount: 0, value: 0, platforms: new Set<string>() };
    e.amount += c.amount;
    e.value += c.value_idr;
    e.platforms.add(c.platform);
    bySymbol.set(c.symbol, e);
  }
  for (const [symbol, e] of bySymbol) {
    items.push({ name: symbol, detail: `${+e.amount.toPrecision(6)} ${symbol} · ${[...e.platforms].join(', ')}`, value: e.value });
  }

  if (usdIdr && p.crypto_trading.total_equity_usd > 0) {
    items.push({
      name: p.crypto_trading.platform,
      detail: `$${p.crypto_trading.total_equity_usd}`,
      value: p.crypto_trading.total_equity_usd * usdIdr,
    });
  }
  for (const sv of p.savings) items.push({ name: sv.name, detail: 'cash', value: sv.value_idr });

  const positive = items.filter(i => i.value > 0).sort((a, b) => b.value - a.value);
  const total = positive.reduce((s, i) => s + i.value, 0);
  if (!total) return [];

  const shown = positive.length > MAX_SLICES ? positive.slice(0, MAX_SLICES - 1) : positive;
  const rest = positive.slice(shown.length);
  const slices: Slice[] = shown.map((i, idx) => ({ ...i, color: SLOTS[idx], pct: (i.value / total) * 100 }));
  if (rest.length) {
    const value = rest.reduce((s, i) => s + i.value, 0);
    slices.push({ name: 'Lainnya', detail: rest.map(i => i.name).join(', '), value, color: OTHER, pct: (value / total) * 100 });
  }
  return slices;
}

function SliceTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Slice }> }) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{s.name} · {s.pct.toFixed(1)}%</p>
      <p className="tabular-nums text-slate-600">{fmt(s.value)}</p>
      <p className="text-slate-400">{s.detail}</p>
    </div>
  );
}

export function AllocationPie({ portfolio, usdIdr }: { portfolio: PortfolioData; usdIdr: number | null }) {
  const slices = buildSlices(portfolio, usdIdr);
  if (!slices.length) return null;

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-800">Alokasi Portofolio</h2>
      <p className="mt-0.5 text-xs text-slate-400">
        Persentase per aset, {portfolio.updated_at}{usdIdr ? '' : ' · saldo USD menunggu kurs'}
      </p>
      <div className="mt-4 grid grid-cols-1 items-center gap-6 sm:grid-cols-[220px_1fr]">
        <div className="mx-auto h-[220px] w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={100}
                startAngle={90}
                endAngle={-270}
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map(s => <Cell key={s.name} fill={s.color} />)}
              </Pie>
              <Tooltip content={<SliceTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <table className="w-full text-sm">
          <tbody>
            {slices.map(s => (
              <tr key={s.name} className="border-b border-slate-100 last:border-0">
                <td className="py-1.5 pr-2">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="min-w-0">
                      <span className="font-medium">{s.name}</span>
                      <span className="block truncate text-xs text-slate-400">{s.detail}</span>
                    </span>
                  </span>
                </td>
                <td className="py-1.5 pr-2 text-right font-semibold tabular-nums text-slate-800">{s.pct.toFixed(1)}%</td>
                <td className="py-1.5 text-right tabular-nums text-slate-500">{fmt(s.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
