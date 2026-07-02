import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { usePortfolio } from '../../hooks/usePortfolio';
import { generateSpendingInsights } from '../../lib/gemini';
import type { AIInsight } from '../../lib/gemini';
import { Spinner } from '../shared/Spinner';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts';
import type { Transaction } from '../../types';
import type { PortfolioData, PortfolioSnapshot } from '../../hooks/usePortfolio';

const EXCLUDE = ['Third-Party Transfer', 'Housing', 'Investment', 'Reimbursable'];
const INCOME_CATS = ['Family', 'Salary'];
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
const ALLOC_COLORS = { Stocks: '#3b82f6', Crypto: '#f97316', Hyperliquid: '#a855f7', Savings: '#10b981' };
const SECTOR_COLORS = ['#3b82f6','#6366f1','#10b981','#f59e0b','#f43f5e'];

function fmt(v: number) { return Math.round(v).toLocaleString('id-ID'); }
function fmtK(v: number) {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toString();
}
function pct(v: number, total: number) { return ((v / total) * 100).toFixed(1); }
function allocPct(v: number, total: number) { return total ? Math.round((v / total) * 1000) / 10 : 0; }

interface MonthStats {
  label: string;
  month: string;
  income: number;
  expense: number;
  net: number;
  byCategory: Record<string, number>;
  investment: number;
  rent: number;
  insurance: number;
  uncategorized: number;
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
        month, income: 0, expense: 0, net: 0, byCategory: {},
        investment: 0, rent: 0, insurance: 0, uncategorized: 0,
      });
    }
    const m = map.get(month)!;
    if (t.type === 'income' && INCOME_CATS.includes(t.category)) m.income += t.amount;
    if (t.type === 'expense' && !EXCLUDE.includes(t.category)) {
      m.expense += t.amount;
      m.byCategory[t.category] = (m.byCategory[t.category] ?? 0) + t.amount;
    }
    if (t.type === 'expense' && t.category === 'Investment') m.investment += t.amount;
    if (t.type === 'expense' && t.category === 'Housing') m.rent += t.amount;
    if (t.type === 'expense' && t.category === 'Insurance') m.insurance += t.amount;
    if (t.category === 'Uncategorized') m.uncategorized += 1;
  }
  for (const m of map.values()) m.net = m.income - m.expense;
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function computeInsights(months: MonthStats[], totalCats: Record<string, number>): Insight[] {
  const insights: Insight[] = [];
  const avgExpense = months.reduce((s, m) => s + m.expense, 0) / months.length;
  const normalMonths = months.filter(m => m.income < 20_000_000);
  const avgNormalIncome = normalMonths.length
    ? normalMonths.reduce((s, m) => s + m.income, 0) / normalMonths.length : avgExpense;

  if (avgExpense > avgNormalIncome) {
    insights.push({
      type: 'warning',
      title: 'Spending exceeds regular income',
      body: `Normal monthly income ≈ ${fmt(Math.round(avgNormalIncome))} vs avg spending ${fmt(Math.round(avgExpense))} — deficit of ~${fmt(Math.round(avgExpense - avgNormalIncome))}/month on normal months.`,
    });
  }
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
  const surplusMonths = months.filter(m => m.net > 0);
  if (surplusMonths.length > 0) {
    const totalSurplus = surplusMonths.reduce((s, m) => s + m.net, 0);
    insights.push({
      type: 'positive',
      title: `${surplusMonths.length} surplus month${surplusMonths.length > 1 ? 's' : ''} built +${fmt(Math.round(totalSurplus))} buffer`,
      body: surplusMonths.map(m => `${m.label}: +${fmt(m.net)}`).join(' · ') + ' (THR + extra income)',
    });
  }
  const cashTotal = totalCats['Cash'] ?? 0;
  if (cashTotal > 0) {
    insights.push({
      type: 'info',
      title: 'Cash withdrawals reduce visibility',
      body: `${fmt(Math.round(cashTotal))} total left as untracked cash (${fmt(Math.round(cashTotal / months.length))}/month avg).`,
    });
  }
  const totalNet = months.reduce((s, m) => s + m.net, 0);
  insights.push({
    type: totalNet >= 0 ? 'positive' : 'warning',
    title: `4-month net: ${totalNet >= 0 ? '+' : '−'}${fmt(Math.abs(Math.round(totalNet)))}`,
    body: totalNet < 0
      ? `Total outflows exceeded income by ${fmt(Math.abs(Math.round(totalNet)))} since January. Covered by THR and Deviota savings.`
      : `Income exceeded variable spending by ${fmt(Math.round(totalNet))} since January.`,
  });
  return insights;
}

function computeInvestmentInsights(
  p: PortfolioData,
  nw: { stocks: number; btc: number; hl: number; savings: number; total: number },
): Insight[] {
  const insights: Insight[] = [];
  const cryptoTotal = nw.btc + nw.hl;
  const cryptoPct = (cryptoTotal / nw.total) * 100;
  const savingsPct = (nw.savings / nw.total) * 100;
  const bankPct = p.stocks_sectors['Bank'] ?? 0;

  insights.push({
    type: cryptoPct > 40 ? 'warning' : 'info',
    title: `Crypto allocation: ${cryptoPct.toFixed(1)}% of portfolio`,
    body: `Crypto investing ${pct(nw.btc, nw.total)}% (${[...new Set(p.crypto_investing.map(c => c.symbol))].join(' + ')}) + Hyperliquid ${pct(nw.hl, nw.total)}% (active trading). ${cryptoPct > 40 ? 'Above typical 10–20% recommended allocation — high volatility risk.' : 'Within manageable range.'}`,
  });

  insights.push({
    type: 'info',
    title: `Banking concentration: ${bankPct}% of stock portfolio`,
    body: `BMRI + BBRI + BBCA are all banking sector. Strong blue-chip picks (government-backed) but single-sector risk. EMAS (gold mining), SINI (industrial), and SSIA (property/construction) add some diversification.`,
  });

  if (p.stocks_pnl_pct < -10) {
    insights.push({
      type: 'info',
      title: `Stocks underwater: ${p.stocks_pnl_pct}% (−${fmt(Math.abs(p.stocks_pnl_idr))} IDR)`,
      body: `Unrealized loss. Indonesian bank stocks are historically resilient long-term. Selling now locks in the loss — hold and consider DCA if cash flow allows.`,
    });
  }

  insights.push({
    type: savingsPct >= 25 ? 'positive' : 'warning',
    title: `Savings: ${savingsPct.toFixed(1)}% liquid (${fmt(nw.savings)} IDR)`,
    body: `Deviota savings cover ~${(nw.savings / 7_300_000).toFixed(1)} months of current spending. ${savingsPct >= 25 ? 'Healthy buffer.' : 'Consider building to 3–6 months of expenses (21–44M).'}`,
  });

  if (p.crypto_investing.length > 1) {
    const symbols = [...new Set(p.crypto_investing.map(c => c.symbol))];
    insights.push({
      type: 'info',
      title: symbols.length > 1
        ? 'Crypto investing split across exchanges'
        : `${symbols[0]} split across ${p.crypto_investing.length} exchanges`,
      body: `${p.crypto_investing.map(c => `${c.platform}: ${c.amount.toFixed(8)} ${c.symbol}`).join(' · ')}. Consider consolidating to reduce exchange counterparty risk.`,
    });
  }

  insights.push({
    type: 'info',
    title: 'No fixed-income / bond exposure',
    body: 'Portfolio is 100% equity + crypto + cash. Indonesian government bonds (ORI/SBN) offer 6–7% annual IDR yield with near-zero default risk — good for the stable portion of your portfolio.',
  });

  return insights;
}

export function AnalysisPage() {
  const { session } = useAuth();
  const { portfolio, fetchPortfolio, fetchPreviousSnapshot } = usePortfolio();
  const [prevSnapshot, setPrevSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [usdIdr, setUsdIdr] = useState<number>(16500);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const refreshInsights = async (txnData: Transaction[]) => {
    if (!txnData.length) return;
    setAiLoading(true);
    const m = buildMonthlyStats(txnData);
    const cats = m.reduce<Record<string, number>>((acc, mo) => {
      for (const [k, v] of Object.entries(mo.byCategory)) acc[k] = (acc[k] ?? 0) + v;
      return acc;
    }, {});
    try {
      const insights = await generateSpendingInsights(m, cats);
      setAiInsights(insights);
    } catch {
      setAiInsights(computeInsights(m, cats));
    } finally {
      setAiLoading(false);
    }
  };

  const load = async () => {
    if (!session) return;
    setLoading(true);
    const [{ data }, rate] = await Promise.all([
      supabase.from('transactions').select('*').order('date'),
      fetchUsdIdr(),
    ]);
    const txnData = (data ?? []) as Transaction[];
    setTxns(txnData);
    setUsdIdr(rate);
    fetchPortfolio();
    fetchPreviousSnapshot().then(setPrevSnapshot).catch(() => setPrevSnapshot(null));
    setLastRefresh(new Date());
    setLoading(false);
    refreshInsights(txnData);
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

  const allCategoryNames = useMemo(() => {
    const set = new Set<string>();
    for (const m of months) for (const k of Object.keys(m.byCategory)) set.add(k);
    return [...set].sort((a, b) => (allTimeCats[b] ?? 0) - (allTimeCats[a] ?? 0));
  }, [months, allTimeCats]);

  const totalUncategorized = useMemo(() => months.reduce((s, m) => s + m.uncategorized, 0), [months]);
  const totalInvestment = useMemo(() => months.reduce((s, m) => s + m.investment, 0), [months]);
  const totalFixedCosts = useMemo(() => months.reduce((s, m) => s + m.rent + m.insurance, 0), [months]);

  const reimbursableData = useMemo(() => {
    const paid = txns
      .filter(t => t.type === 'expense' && t.category === 'Reimbursable')
      .sort((a, b) => b.date.localeCompare(a.date));
    const received = txns
      .filter(t => t.type === 'income' && t.category === 'Reimbursement')
      .sort((a, b) => b.date.localeCompare(a.date));
    const totalPaid = paid.reduce((s, t) => s + t.amount, 0);
    const totalReceived = received.reduce((s, t) => s + t.amount, 0);
    return { paid, received, totalPaid, totalReceived, outstanding: totalPaid - totalReceived };
  }, [txns]);

  // Net worth
  const netWorth = useMemo(() => {
    if (!portfolio) return null;
    const stocks = portfolio.stocks.reduce((s, h) => s + h.value_idr, 0);
    const btc = portfolio.crypto_investing.reduce((s, c) => s + c.value_idr, 0);
    const hl = portfolio.crypto_trading.total_equity_usd * usdIdr;
    const savings = portfolio.savings.reduce((s, sv) => s + sv.value_idr, 0);
    return { stocks, btc, hl, savings, total: stocks + btc + hl + savings };
  }, [portfolio, usdIdr]);

  const investmentInsights = useMemo(() => {
    if (!portfolio || !netWorth) return [];
    return computeInvestmentInsights(portfolio, netWorth);
  }, [portfolio, netWorth]);

  // Net worth at the previous snapshot, for "vs last time" comparisons.
  const prevNetWorth = useMemo(() => {
    if (!prevSnapshot) return null;
    const p = prevSnapshot.data;
    const stocks = p.stocks.reduce((s, h) => s + h.value_idr, 0);
    const btc = p.crypto_investing.reduce((s, c) => s + c.value_idr, 0);
    const hl = p.crypto_trading.total_equity_usd * usdIdr;
    const savings = p.savings.reduce((s, sv) => s + sv.value_idr, 0);
    return { stocks, btc, hl, savings, total: stocks + btc + hl + savings };
  }, [prevSnapshot, usdIdr]);

  // Per-holding before/after deltas, matched by symbol (stocks), platform (crypto), name (savings).
  const holdingDeltas = useMemo(() => {
    if (!portfolio || !prevSnapshot || !netWorth || !prevNetWorth) return [];
    const prev = prevSnapshot.data;
    const rows: { group: string; label: string; before: number; now: number; nowExtra?: string }[] = [];

    const stockSymbols = new Set([...prev.stocks.map(s => s.symbol), ...portfolio.stocks.map(s => s.symbol)]);
    for (const sym of stockSymbols) {
      rows.push({
        group: 'Stocks',
        label: sym,
        before: prev.stocks.find(s => s.symbol === sym)?.value_idr ?? 0,
        now: portfolio.stocks.find(s => s.symbol === sym)?.value_idr ?? 0,
      });
    }

    const platforms = new Set([...prev.crypto_investing.map(c => c.platform), ...portfolio.crypto_investing.map(c => c.platform)]);
    for (const plat of platforms) {
      const before = prev.crypto_investing.find(c => c.platform === plat);
      const now = portfolio.crypto_investing.find(c => c.platform === plat);
      rows.push({
        group: 'Crypto',
        label: plat,
        before: before?.value_idr ?? 0,
        now: now?.value_idr ?? 0,
        nowExtra: now ? `${now.amount.toFixed(8)} ${now.symbol}` : undefined,
      });
    }

    rows.push({ group: 'Crypto', label: portfolio.crypto_trading.platform, before: prevNetWorth.hl, now: netWorth.hl });

    const savingsNames = new Set([...prev.savings.map(s => s.name), ...portfolio.savings.map(s => s.name)]);
    for (const name of savingsNames) {
      rows.push({
        group: 'Savings',
        label: name,
        before: prev.savings.find(s => s.name === name)?.value_idr ?? 0,
        now: portfolio.savings.find(s => s.name === name)?.value_idr ?? 0,
      });
    }

    return rows;
  }, [portfolio, prevSnapshot, netWorth, prevNetWorth]);

  const allocData = netWorth ? [
    { name: 'Stocks', value: netWorth.stocks },
    { name: 'Crypto', value: netWorth.btc },
    { name: 'Hyperliquid', value: netWorth.hl },
    { name: 'Savings', value: netWorth.savings },
  ] : [];

  const sectorData = portfolio
    ? Object.entries(portfolio.stocks_sectors).map(([name, value]) => ({ name, value }))
    : [];

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Analysis</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {months.length ? `${months[0].label}–${months[months.length - 1].label} ${months[months.length - 1].month.slice(0, 4)}` : 'No data'} · {txns.length} transactions · refreshed {lastRefresh.toLocaleTimeString('id-ID')}
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

      {totalUncategorized > 0 && (
        <a
          href="#/transactions?category=Uncategorized"
          className="mb-6 flex items-center justify-between rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2.5 text-sm text-yellow-800 hover:bg-yellow-100"
        >
          <span>⚠️ {totalUncategorized} uncategorized transaction{totalUncategorized > 1 ? 's' : ''} across this period</span>
          <span className="font-medium underline">Review →</span>
        </a>
      )}

      {/* KPI row */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Avg Monthly Income', value: avgIncome, color: 'text-emerald-600', note: 'Family + Salary' },
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

      {/* Category totals by month */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 overflow-x-auto">
        <h2 className="mb-4 font-semibold text-gray-800">Spending by Category — Monthly Totals</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 text-left font-medium">Category</th>
              {months.map(m => <th key={m.month} className="pb-2 text-right font-medium">{m.label}</th>)}
              <th className="pb-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allCategoryNames.map(cat => (
              <tr key={cat} className="hover:bg-gray-50">
                <td className="py-2 font-medium text-gray-800">{cat}</td>
                {months.map(m => (
                  <td key={m.month} className="py-2 text-right tabular-nums text-gray-600">
                    {m.byCategory[cat] ? fmt(m.byCategory[cat]) : '—'}
                  </td>
                ))}
                <td className="py-2 text-right tabular-nums font-semibold text-gray-800">{fmt(allTimeCats[cat] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td className="pt-2 font-bold text-gray-800">Total</td>
              {months.map(m => <td key={m.month} className="pt-2 text-right tabular-nums font-bold text-gray-800">{fmt(m.expense)}</td>)}
              <td className="pt-2 text-right tabular-nums font-bold text-gray-800">{fmt(months.reduce((s, m) => s + m.expense, 0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Fixed costs + Investment contributions by month */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 overflow-x-auto">
          <h2 className="mb-4 font-semibold text-gray-800">Fixed Costs — Monthly</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="pb-2 text-left font-medium">Month</th>
                <th className="pb-2 text-right font-medium">Rent</th>
                <th className="pb-2 text-right font-medium">Insurance</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {months.map(m => (
                <tr key={m.month} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-800">{m.label}</td>
                  <td className="py-2 text-right tabular-nums text-gray-600">{m.rent ? fmt(m.rent) : '—'}</td>
                  <td className="py-2 text-right tabular-nums text-gray-600">{m.insurance ? fmt(m.insurance) : '—'}</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-gray-800">{fmt(m.rent + m.insurance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td className="pt-2 font-bold text-gray-800">Total</td>
                <td className="pt-2 text-right tabular-nums font-bold text-gray-800">{fmt(months.reduce((s, m) => s + m.rent, 0))}</td>
                <td className="pt-2 text-right tabular-nums font-bold text-gray-800">{fmt(months.reduce((s, m) => s + m.insurance, 0))}</td>
                <td className="pt-2 text-right tabular-nums font-bold text-gray-800">{fmt(totalFixedCosts)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-2 text-xs text-gray-400">Rent is a pass-through (excluded from Expenses KPI); Insurance is counted as a real expense.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 overflow-x-auto">
          <h2 className="mb-4 font-semibold text-gray-800">Investment Contributions — Monthly</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="pb-2 text-left font-medium">Month</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {months.map(m => (
                <tr key={m.month} className="hover:bg-gray-50">
                  <td className="py-2 font-medium text-gray-800">{m.label}</td>
                  <td className="py-2 text-right tabular-nums text-gray-600">{m.investment ? fmt(m.investment) : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td className="pt-2 font-bold text-gray-800">Total</td>
                <td className="pt-2 text-right tabular-nums font-bold text-gray-800">{fmt(totalInvestment)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="mt-2 text-xs text-gray-400">Transfers into investment accounts (excluded from Expenses KPI).</p>
        </div>
      </div>

      {/* Reimbursable Tracker */}
      {(reimbursableData.paid.length > 0 || reimbursableData.received.length > 0) && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Reimbursable Tracker</h2>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
              reimbursableData.outstanding > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {reimbursableData.outstanding > 0 ? `${fmt(reimbursableData.outstanding)} outstanding` : 'Fully settled'}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Total Paid Out', value: reimbursableData.totalPaid, color: 'text-red-500' },
              { label: 'Total Received Back', value: reimbursableData.totalReceived, color: 'text-emerald-600' },
              { label: 'Still Outstanding', value: reimbursableData.outstanding, color: reimbursableData.outstanding > 0 ? 'text-amber-600' : 'text-emerald-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
                <p className={`mt-1 text-lg font-bold tabular-nums ${color}`}>{fmt(value)}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-500">Paid Out (Reimbursable)</p>
              <div className="space-y-1.5">
                {reimbursableData.paid.map(t => (
                  <div key={t.id} className="flex items-start justify-between gap-2 rounded-lg border border-red-50 bg-red-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-700">{t.description}</p>
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-red-600">−{fmt(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">Received Back (Reimbursement)</p>
              <div className="space-y-1.5">
                {reimbursableData.received.map(t => (
                  <div key={t.id} className="flex items-start justify-between gap-2 rounded-lg border border-emerald-50 bg-emerald-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-700">{t.description}</p>
                      <p className="text-xs text-gray-400">{t.date}</p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600">+{fmt(t.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {reimbursableData.outstanding > 0 && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              ⚠️ {fmt(reimbursableData.outstanding)} paid for others is still owed back to you — this directly reduces your available cash.
            </p>
          )}
        </div>
      )}

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
                { label: 'Crypto (Indodax + FLOQ)', value: netWorth.btc, note: 'Crypto investing', color: 'bg-orange-400' },
                { label: 'Hyperliquid', value: netWorth.hl, note: `$${portfolio!.crypto_trading.total_equity_usd} @ ${fmt(usdIdr)}`, color: 'bg-purple-400' },
                { label: 'Deviota Savings', value: netWorth.savings, note: 'Liquid savings', color: 'bg-emerald-400' },
              ].map(({ label, value, note, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${color}`} />
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-sm text-gray-700">{label}</span>
                      <span className="ml-2 hidden text-xs text-gray-400 sm:inline">{note}</span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-gray-800 tabular-nums">{fmt(Math.round(value))}</span>
                  </div>
                  <div className="hidden h-1.5 w-24 shrink-0 rounded-full bg-gray-100 sm:block">
                    <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${(value / netWorth.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">1 USD = {fmt(usdIdr)} IDR (live)</p>
          </div>
        )}

        {/* AI Insights */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">Key Insights</h2>
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">✨ AI</span>
            </div>
            <button
              onClick={() => refreshInsights(txns)}
              disabled={aiLoading}
              title="Regenerate insights"
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40 transition-colors"
            >
              <svg className={`h-4 w-4 ${aiLoading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          {aiLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3 animate-pulse">
                  <div className="mb-2 h-3 w-3/4 rounded bg-gray-200" />
                  <div className="mb-1.5 h-2.5 w-full rounded bg-gray-100" />
                  <div className="h-2.5 w-2/3 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {(aiInsights.length ? aiInsights : insights).map((ins, i) => (
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
          )}
        </div>
      </div>

      {/* Portfolio Allocation */}
      {netWorth && portfolio && (
        <>
          <div className="mt-8 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Portfolio Allocation</h2>
            <p className="text-xs text-gray-400">Asset class breakdown · data as of {portfolio.updated_at}</p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Allocation donut */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-gray-800">Asset Allocation</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={allocData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
                    {allocData.map((entry) => (
                      <Cell key={entry.name} fill={ALLOC_COLORS[entry.name as keyof typeof ALLOC_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${fmt(v as number)} (${pct(v as number, netWorth.total)}%)`} />
                  <Legend iconType="circle" iconSize={8} formatter={(v) => {
                    const val = allocData.find(d => d.name === v)?.value ?? 0;
                    return <span className="text-xs text-gray-600">{v}: {pct(val, netWorth.total)}%</span>;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stock sector breakdown */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-gray-800">Stock Sector Mix</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {sectorData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-3">
                {sectorData.map(({ name, value }, i) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-sm text-gray-600">{name}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100">
                      <div
                        className="h-2.5 rounded-full"
                        style={{ width: `${value}%`, backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-medium text-gray-700">{value}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                {portfolio.stocks.map(s => (
                  <div key={s.symbol} className="flex flex-col items-center rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-xs font-bold text-gray-700">{s.symbol}</span>
                    <span className="text-xs text-gray-400">{fmt(s.value_idr)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Investment Analyst */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Asset performance table */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-gray-800">Asset Performance</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                    <th className="pb-2 text-left font-medium">Asset</th>
                    <th className="pb-2 text-right font-medium">Value (IDR)</th>
                    <th className="pb-2 text-right font-medium">% Total</th>
                    <th className="pb-2 text-right font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {portfolio.stocks.map(s => (
                    <tr key={s.symbol} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-800">{s.symbol}</td>
                      <td className="py-2 text-right tabular-nums text-gray-600">{fmt(s.value_idr)}</td>
                      <td className="py-2 text-right tabular-nums text-gray-500">{pct(s.value_idr, netWorth.total)}%</td>
                      <td className="py-2 text-right">
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Medium</span>
                      </td>
                    </tr>
                  ))}
                  {portfolio.crypto_investing.map(c => (
                    <tr key={c.platform} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-800">{c.symbol} · {c.platform}</td>
                      <td className="py-2 text-right tabular-nums text-gray-600">{fmt(c.value_idr)}</td>
                      <td className="py-2 text-right tabular-nums text-gray-500">{pct(c.value_idr, netWorth.total)}%</td>
                      <td className="py-2 text-right">
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">High</span>
                      </td>
                    </tr>
                  ))}
                  <tr className="hover:bg-gray-50">
                    <td className="py-2 font-medium text-gray-800">Hyperliquid</td>
                    <td className="py-2 text-right tabular-nums text-gray-600">{fmt(netWorth.hl)}</td>
                    <td className="py-2 text-right tabular-nums text-gray-500">{pct(netWorth.hl, netWorth.total)}%</td>
                    <td className="py-2 text-right">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Very High</span>
                    </td>
                  </tr>
                  {portfolio.savings.map(sv => (
                    <tr key={sv.name} className="hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-800">{sv.name}</td>
                      <td className="py-2 text-right tabular-nums text-gray-600">{fmt(sv.value_idr)}</td>
                      <td className="py-2 text-right tabular-nums text-gray-500">{pct(sv.value_idr, netWorth.total)}%</td>
                      <td className="py-2 text-right">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Low</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td className="pt-2 font-bold text-gray-800">Total</td>
                    <td className="pt-2 text-right tabular-nums font-bold text-gray-800">{fmt(netWorth.total)}</td>
                    <td className="pt-2 text-right text-gray-400 text-xs">100%</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              <p className="mt-2 text-xs text-gray-400">
                Stocks PnL: {portfolio.stocks_pnl_pct > 0 ? '+' : ''}{portfolio.stocks_pnl_pct}%
                ({portfolio.stocks_pnl_idr >= 0 ? '+' : '−'}{fmt(Math.abs(portfolio.stocks_pnl_idr))} IDR unrealized)
              </p>
            </div>

            {/* Investment analyst insights */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-gray-800">Investment Analyst</h3>
              <div className="space-y-3">
                {investmentInsights.map((ins, i) => (
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

          {/* Portfolio Changes vs last snapshot */}
          {prevSnapshot && prevNetWorth && (
            <>
              <div className="mt-8 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Portfolio Changes</h2>
                <p className="text-xs text-gray-400">
                  vs snapshot from {new Date(prevSnapshot.snapshot_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              {/* Delta KPIs */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Net Worth', now: netWorth.total, before: prevNetWorth.total },
                  { label: 'Stocks', now: netWorth.stocks, before: prevNetWorth.stocks },
                  { label: 'Crypto Investing', now: netWorth.btc, before: prevNetWorth.btc },
                  { label: 'Hyperliquid', now: netWorth.hl, before: prevNetWorth.hl },
                ].map(({ label, now, before }) => {
                  const delta = now - before;
                  const deltaPct = before !== 0 ? (delta / before) * 100 : 0;
                  return (
                    <div key={label} className="rounded-xl border border-gray-200 bg-white p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</p>
                      <p className="mt-1 text-lg font-bold text-gray-900">{fmt(now)}</p>
                      <p className={`mt-0.5 text-xs font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {delta >= 0 ? '▲' : '▼'} {fmt(Math.abs(delta))} ({delta >= 0 ? '+' : '−'}{Math.abs(deltaPct).toFixed(1)}%)
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Net worth trend */}
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="mb-4 font-semibold text-gray-800">Net Worth Trend</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={[
                        { name: 'Last', value: prevNetWorth.total },
                        { name: 'Now', value: netWorth.total },
                      ]}
                      margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmt(v as number)} />
                      <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fill="#6366f1" fillOpacity={0.15} dot={{ r: 4 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Allocation shift */}
                <div className="rounded-xl border border-gray-200 bg-white p-5">
                  <h3 className="mb-4 font-semibold text-gray-800">Capital Allocation Shift</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <ComposedChart
                      data={[
                        { name: 'Stocks', Last: allocPct(prevNetWorth.stocks, prevNetWorth.total), Now: allocPct(netWorth.stocks, netWorth.total) },
                        { name: 'Crypto', Last: allocPct(prevNetWorth.btc, prevNetWorth.total), Now: allocPct(netWorth.btc, netWorth.total) },
                        { name: 'Hyperliquid', Last: allocPct(prevNetWorth.hl, prevNetWorth.total), Now: allocPct(netWorth.hl, netWorth.total) },
                        { name: 'Savings', Last: allocPct(prevNetWorth.savings, prevNetWorth.total), Now: allocPct(netWorth.savings, netWorth.total) },
                      ]}
                      margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `${v}%`} />
                      <Legend iconType="circle" iconSize={8} />
                      <Bar dataKey="Last" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Now" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Holding-by-holding delta table */}
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 overflow-x-auto">
                <h3 className="mb-4 font-semibold text-gray-800">Holding-by-Holding Change</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                      <th className="pb-2 text-left font-medium">Asset</th>
                      <th className="pb-2 text-right font-medium">Last</th>
                      <th className="pb-2 text-right font-medium">Now</th>
                      <th className="pb-2 text-right font-medium">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {holdingDeltas.map(({ group, label, before, now, nowExtra }) => {
                      const delta = now - before;
                      const deltaPct = before !== 0 ? (delta / before) * 100 : (now !== 0 ? 100 : 0);
                      return (
                        <tr key={`${group}-${label}`} className="hover:bg-gray-50">
                          <td className="py-2 font-medium text-gray-800">
                            {group} · {label}
                            {nowExtra && <span className="ml-1.5 text-xs text-gray-400">({nowExtra})</span>}
                          </td>
                          <td className="py-2 text-right tabular-nums text-gray-500">{fmt(before)}</td>
                          <td className="py-2 text-right tabular-nums text-gray-800">{fmt(now)}</td>
                          <td className={`py-2 text-right tabular-nums font-medium ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {delta >= 0 ? '+' : '−'}{fmt(Math.abs(delta))} ({delta >= 0 ? '+' : '−'}{Math.abs(deltaPct).toFixed(1)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
