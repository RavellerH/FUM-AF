import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { usePortfolio } from '../../hooks/usePortfolio';
import { Spinner } from '../shared/Spinner';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area
} from 'recharts';
import type { Transaction } from '../../types';

const EXCLUDE = ['Third-Party Transfer', 'Housing', 'Investment', 'Reimbursable'];
const INCOME_CAT = 'Family';
const TOP_CATS = ['Shopping', 'Food & Dining', 'Healthcare', 'Utilities', 'Cash'];
const CAT_COLORS: Record<string, string> = {
  Shopping:        '#ec4899',
  'Food & Dining': '#f59e0b',
  Healthcare:      '#f43f5e',
  Utilities:       '#06b6d4',
  Cash:            '#94a3b8',
  Other:           '#cbd5e1',
};
const DONUT_COLORS = ['#ec4899','#f59e0b','#f43f5e','#06b6d4','#94a3b8','#6366f1','#10b981','#8b5cf6'];

function fmt(v: number) { return Math.round(v).toLocaleString('id-ID'); }
function fmtK(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}

interface MonthStats {
  label: string;     // "Jan", "Feb" etc.
  month: string;     // "2026-01"
  income: number;
  expense: number;
  net: number;
  byCategory: Record<string, number>;
}

interface Insight {
  type: 'warning' | 'positive' | 'info';
  title: string;
  body: string;
}

async function fetchUsdIdr(): Promise<number> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const j = await res.json();
    return j.rates.IDR as number;
  } catch { return 16500; }
}

function buildMonthlyStats(txns: Transaction[]): MonthStats[] {
  const map = new Map<string, MonthStats>();
  for (const t of txns) {
    const month = t.date.slice(0, 7);
    if (!map.has(month)) {
      const d = new Date(month + '-01');
      map.set(month, {
        label: d.toLocaleString('id-ID', { month: 'short' }),
        month,
        income: 0,
        expense: 0,
        net: 0,
        byCategory: {},
      });
    }
    const m = map.get(month)!;
    if (t.type === 'income' && t.category === INCOME_CAT) {
      m.income += t.amount;
    }
    if (t.type === 'expense' && !EXCLUDE.includes(t.category)) {
      m.expense += t.amount;
      m.byCategory[t.category] = (m.byCategory[t.category] ?? 0) + t.amount;
    }
  }
  for (const m of map.values()) m.net = m.income - m.expense;
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function computeInsights(months: MonthStats[], totalCats: Record<string, number>): Insight[] {
  const insights: Insight[] = [];

  // Income vs expense gap
  const avgIncome = months.reduce((s, m) => s + m.income, 0) / months.length;
  const avgExpense = months.reduce((s, m) => s + m.expense, 0) / months.length;
  const normalMonths = months.filter(m => m.income < 7_000_000);
  const avgNormalIncome = normalMonths.length
    ? normalMonths.reduce((s, m) => s + m.income, 0) / normalMonths.length
    : avgIncome;

  if (avgExpense > avgNormalIncome) {
    insights.push({
      type: 'warning',
      title: 'Spending exceeds regular income',
      body: `Normal monthly income ≈ ${fmt(Math.round(avgNormalIncome))} vs avg spending ${fmt(Math.round(avgExpense))} — deficit of ~${fmt(Math.round(avgExpense - avgNormalIncome))}/month on normal months.`,
    });
  }

  // Shopping trend
  const shopVals = months.map(m => m.byCategory['Shopping'] ?? 0);
  if (shopVals.length >= 2 && shopVals[0] > 0) {
    const growth = ((shopVals[shopVals.length - 1] / shopVals[0]) - 1) * 100;
    if (growth > 20) {
      insights.push({
        type: 'warning',
        title: `Shopping up +${growth.toFixed(0)}% over ${months.length} months`,
        body: `${months[0].label} ${fmt(shopVals[0])} → ${months[months.length-1].label} ${fmt(shopVals[shopVals.length-1])}. Largest single expense category (${fmt(totalCats['Shopping'] ?? 0)} total).`,
      });
    }
  }

  // Surplus months
  const surplusMonths = months.filter(m => m.net > 0);
  if (surplusMonths.length > 0) {
    const totalSurplus = surplusMonths.reduce((s, m) => s + m.net, 0);
    insights.push({
      type: 'positive',
      title: `${surplusMonths.length} surplus month${surplusMonths.length > 1 ? 's' : ''} built +${fmt(Math.round(totalSurplus))} buffer`,
      body: surplusMonths.map(m => `${m.label}: +${fmt(m.net)}`).join(' · ') + ' (THR + extra income)',
    });
  }

  // Cash withdrawals
  const cashTotal = totalCats['Cash'] ?? 0;
  if (cashTotal > 0) {
    insights.push({
      type: 'info',
      title: 'Cash withdrawals reduce visibility',
      body: `${fmt(Math.round(cashTotal))} total left as untracked cash (${fmt(Math.round(cashTotal / months.length))}/month avg). Reduces your ability to see where money goes.`,
    });
  }

  // Healthcare
  const healthTotal = totalCats['Healthcare'] ?? 0;
  if (healthTotal > 3_000_000) {
    insights.push({
      type: 'info',
      title: `Healthcare: ${fmt(Math.round(healthTotal))} over ${months.length} months`,
      body: `Averaging ${fmt(Math.round(healthTotal / months.length))}/month. Verify which are recurring (BPJS, check-ups) vs one-off. Some may qualify as reimbursable.`,
    });
  }

  // 4-month net
  const totalNet = months.reduce((s, m) => s + m.net, 0);
  if (totalNet < 0) {
    insights.push({
      type: 'warning',
      title: `4-month net: −${fmt(Math.abs(Math.round(totalNet)))}`,
      body: `Total outflows exceeded family income by ${fmt(Math.abs(Math.round(totalNet)))} since January. Covered by THR and Deviota savings.`,
    });
  } else {
    insights.push({
      type: 'positive',
      title: `4-month net: +${fmt(Math.round(totalNet))}`,
      body: `Family income exceeded variable spending by ${fmt(Math.round(totalNet))} since January.`,
    });
  }

  return insights;
}

export function AnalysisPage() {
  const { session } = useAuth();
  const { portfolio, fetchPortfolio } = usePortfolio();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [usdIdr, setUsdIdr] = useState<number>(16500);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = async () => {
    if (!session) return;
    setLoading(true);
    const [{ data }, rate] = await Promise.all([
      supabase.from('transactions').select('*').order('date'),
      fetchUsdIdr(),
    ]);
    setTxns((data ?? []) as Transaction[]);
    setUsdIdr(rate);
    fetchPortfolio();
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, [session]);

  const months = useMemo(() => buildMonthlyStats(txns), [txns]);

  const allTimeCats = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const m of months) {
      for (const [k, v] of Object.entries(m.byCategory)) {
        acc[k] = (acc[k] ?? 0) + v;
      }
    }
    return acc;
  }, [months]);

  const insights = useMemo(() => computeInsights(months, allTimeCats), [months, allTimeCats]);

  // Net worth
  const netWorth = useMemo(() => {
    if (!portfolio) return null;
    const stocks = portfolio.stocks.reduce((s, h) => s + h.value_idr, 0);
    const btc = portfolio.crypto_investing.reduce((s, c) => s + c.value_idr, 0);
    const hl = portfolio.crypto_trading.total_equity_usd * usdIdr;
    const savings = portfolio.savings.reduce((s, sv) => s + sv.value_idr, 0);
    return { stocks, btc, hl, savings, total: stocks + btc + hl + savings };
  }, [portfolio, usdIdr]);

  // Chart data
  const cashFlowData = months.map(m => ({
    name: m.label,
    Income: m.income,
    Expense: m.expense,
    Net: m.net,
  }));

  const stackedData = months.map(m => {
    const row: Record<string, number | string> = { name: m.label };
    let other = 0;
    for (const [k, v] of Object.entries(m.byCategory)) {
      if (TOP_CATS.includes(k)) row[k] = v;
      else other += v;
    }
    if (other > 0) row['Other'] = other;
    return row;
  });

  const donutData = Object.entries(allTimeCats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }));

  const avgIncome = months.length ? months.reduce((s, m) => s + m.income, 0) / months.length : 0;
  const avgExpense = months.length ? months.reduce((s, m) => s + m.expense, 0) / months.length : 0;
  const totalNet = months.reduce((s, m) => s + m.net, 0);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Analysis</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Jan–Apr 2026 · {txns.length} transactions · refreshed {lastRefresh.toLocaleTimeString('id-ID')}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Avg Monthly Income', value: avgIncome, color: 'text-emerald-600', note: 'Family transfers only' },
          { label: 'Avg Monthly Expense', value: avgExpense, color: 'text-red-500', note: 'Variable spending' },
          { label: '4-Month Net', value: totalNet, color: totalNet >= 0 ? 'text-emerald-600' : 'text-red-500', note: 'Income − expense' },
          { label: 'Monthly Gap', value: avgIncome - avgExpense, color: (avgIncome - avgExpense) >= 0 ? 'text-emerald-600' : 'text-red-500', note: 'avg income − avg expense' },
        ].map(({ label, value, color, note }) => (
          <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
            <p className={`mt-1 text-xl font-bold ${color}`}>
              {value >= 0 ? '+' : '−'}{fmt(Math.abs(Math.round(value)))}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">{note}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Cash flow chart */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-800">Monthly Cash Flow</h2>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={cashFlowData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => fmt(v as number)} />
              <Legend />
              <Bar dataKey="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              <Line dataKey="Net" type="monotone" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Donut */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-800">Spending Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v as number)} />
              <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-xs text-gray-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category trend */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-gray-800">Spending by Category — Monthly Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={stackedData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => fmt(v as number)} />
            <Legend iconType="circle" iconSize={8} />
            {[...TOP_CATS, 'Other'].map(cat => (
              <Area key={cat} type="monotone" dataKey={cat} stackId="1"
                stroke={CAT_COLORS[cat]} fill={CAT_COLORS[cat]} fillOpacity={0.8} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Net worth + Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Net worth */}
        {netWorth && (
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gray-800">Net Worth Snapshot</h2>
            <p className="text-3xl font-bold text-gray-900 mb-4">{fmt(Math.round(netWorth.total))} IDR</p>
            <div className="space-y-2">
              {[
                { label: 'Stocks (StockBit)', value: netWorth.stocks, note: `${portfolio!.stocks_pnl_pct}% unrealized`, color: 'bg-blue-500' },
                { label: 'BTC (Indodax + FLOQ)', value: netWorth.btc, note: 'Crypto investing', color: 'bg-orange-400' },
                { label: 'Hyperliquid', value: netWorth.hl, note: `$${portfolio!.crypto_trading.total_equity_usd} @ ${fmt(usdIdr)}`, color: 'bg-purple-400' },
                { label: 'Deviota Savings', value: netWorth.savings, note: 'Liquid savings', color: 'bg-emerald-400' },
              ].map(({ label, value, note, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${color}`} />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className="ml-2 text-xs text-gray-400">{note}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800 tabular-nums">{fmt(Math.round(value))}</span>
                  </div>
                  <div className="w-24 h-1.5 rounded-full bg-gray-100">
                    <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(value / netWorth.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">1 USD = {fmt(usdIdr)} IDR (live)</p>
          </div>
        )}

        {/* Insights */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 font-semibold text-gray-800">Key Insights</h2>
          <div className="space-y-3">
            {insights.map((ins, i) => (
              <div key={i} className={`rounded-lg p-3 ${
                ins.type === 'warning' ? 'bg-red-50 border border-red-100'
                : ins.type === 'positive' ? 'bg-emerald-50 border border-emerald-100'
                : 'bg-blue-50 border border-blue-100'
              }`}>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-base leading-none">
                    {ins.type === 'warning' ? '⚠️' : ins.type === 'positive' ? '✅' : 'ℹ️'}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${
                      ins.type === 'warning' ? 'text-red-700'
                      : ins.type === 'positive' ? 'text-emerald-700'
                      : 'text-blue-700'
                    }`}>{ins.title}</p>
                    <p className="mt-0.5 text-xs text-gray-600">{ins.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
