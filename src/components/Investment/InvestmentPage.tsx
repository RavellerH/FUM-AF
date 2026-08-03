import { useEffect, useState } from 'react';
import { usePortfolio } from '../../hooks/usePortfolio';
import { Spinner } from '../shared/Spinner';
import { fmt, fmtPct } from '../../lib/format';
import { fetchUsdIdr } from '../../lib/fx';
import type { PortfolioData, StockHolding, CryptoInvesting } from '../../hooks/usePortfolio';
import { PortfolioChart } from './PortfolioChart';

// ---------- Edit helpers ----------
function NumInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      defaultValue={value}
      onBlur={e => onChange(parseFloat(e.target.value) || 0)}
      className="w-32 rounded border border-brand-400 px-2 py-0.5 text-sm focus:outline-none"
    />
  );
}

// ---------- Sub-components ----------
function SectorBar({ sectors }: { sectors: Record<string, number> }) {
  const colors = ['bg-brand-500', 'bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-rose-400'];
  const entries = Object.entries(sectors);
  return (
    <div className="mt-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {entries.map(([, pct], i) => (
          <div key={i} className={colors[i % colors.length]} style={{ width: `${pct}%` }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3">
        {entries.map(([name, pct], i) => (
          <span key={name} className="flex items-center gap-1 text-xs text-slate-600">
            <span className={`h-2 w-2 rounded-full ${colors[i % colors.length]}`} />
            {name} {pct}%
          </span>
        ))}
      </div>
    </div>
  );
}

export function InvestmentPage() {
  const { portfolio, loading, error, fetchPortfolio, savePortfolio } = usePortfolio();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PortfolioData | null>(null);
  const [saving, setSaving] = useState(false);
  const [usdIdr, setUsdIdr] = useState<number | null>(null);

  useEffect(() => {
    fetchPortfolio();
    fetchUsdIdr().then(setUsdIdr).catch(() => {});
  }, []);

  const startEditing = () => {
    if (!portfolio) return;
    setDraft(JSON.parse(JSON.stringify(portfolio)));
    setEditing(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await savePortfolio(undefined, draft);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(null);
    setEditing(false);
  };

  const updateStock = (i: number, field: keyof StockHolding, value: string | number) => {
    if (!draft) return;
    const stocks = [...draft.stocks];
    stocks[i] = { ...stocks[i], [field]: value };
    setDraft({ ...draft, stocks });
  };

  const updateCryptoInvest = (i: number, field: keyof CryptoInvesting, value: string | number) => {
    if (!draft) return;
    const ci = [...draft.crypto_investing];
    ci[i] = { ...ci[i], [field]: value };
    setDraft({ ...draft, crypto_investing: ci });
  };

  const p = editing ? draft : portfolio;

  if (loading || !p) return <div className="flex justify-center py-20"><Spinner /></div>;
  if (error) return <div className="mx-auto max-w-4xl px-4 py-8 text-rose-500">{error}</div>;

  const stockTotal = p.stocks.reduce((s, h) => s + h.value_idr, 0);
  const cryptoInvestTotal = p.crypto_investing.reduce((s, c) => s + c.value_idr, 0);
  const savingsTotal = p.savings.reduce((s, sv) => s + sv.value_idr, 0);
  const cryptoTradingIdr = usdIdr ? p.crypto_trading.total_equity_usd * usdIdr : 0;
  const totalIdr = stockTotal + cryptoInvestTotal + savingsTotal + cryptoTradingIdr;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Portfolio</h1>
          <p className="text-xs text-slate-400 mt-0.5">Last updated: {p.updated_at}</p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleCancel} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          ) : (
            <button onClick={startEditing} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Update snapshot
            </button>
          )}
        </div>
      </div>

      {/* History chart */}
      <PortfolioChart currentPortfolio={p} />

      {/* Total summary */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Total Portfolio (IDR)</p>
        <p className="mt-1 text-3xl font-bold text-slate-900">{fmt(totalIdr)}</p>
        <div className="mt-3 flex gap-6 text-sm text-slate-500">
          <span>Stocks <span className="font-medium text-slate-800">{fmt(stockTotal)}</span></span>
          <span>Crypto <span className="font-medium text-slate-800">{fmt(cryptoInvestTotal + cryptoTradingIdr)}</span></span>
          <span>Savings <span className="font-medium text-slate-800">{fmt(savingsTotal)}</span></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Stocks */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Stocks — StockBit</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.stocks_pnl_pct < 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
              {fmtPct(editing ? draft!.stocks_pnl_pct : p.stocks_pnl_pct)} / {fmt(Math.abs(editing ? draft!.stocks_pnl_idr : p.stocks_pnl_idr))} IDR
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 text-left">Symbol</th>
                <th className="pb-2 text-center">Lot</th>
                <th className="pb-2 text-right">Value (IDR)</th>
              </tr>
            </thead>
            <tbody>
              {p.stocks.map((h, i) => (
                <tr key={h.symbol} className="border-b border-slate-50">
                  <td className="py-2 font-medium text-slate-800">{h.symbol}</td>
                  <td className="py-2 text-center text-slate-500">
                    {editing ? (
                      <input type="number" defaultValue={h.lots} onBlur={e => updateStock(i, 'lots', parseInt(e.target.value) || 0)}
                        className="w-14 rounded border border-brand-400 px-1 text-center text-sm focus:outline-none" />
                    ) : h.lots}
                  </td>
                  <td className="py-2 text-right tabular-nums text-slate-800">
                    {editing ? (
                      <NumInput value={h.value_idr} onChange={v => updateStock(i, 'value_idr', v)} />
                    ) : fmt(h.value_idr)}
                  </td>
                </tr>
              ))}
              <tr className="font-semibold text-slate-800">
                <td className="pt-2" colSpan={2}>Total</td>
                <td className="pt-2 text-right tabular-nums">{fmt(stockTotal)}</td>
              </tr>
            </tbody>
          </table>
          {editing ? (
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              {Object.entries(draft!.stocks_sectors).map(([name, pct]) => (
                <label key={name} className="flex flex-col gap-0.5">
                  <span className="text-slate-500">{name} %</span>
                  <input type="number" defaultValue={pct} onBlur={e => {
                    const sectors = { ...draft!.stocks_sectors, [name]: parseFloat(e.target.value) || 0 };
                    setDraft({ ...draft!, stocks_sectors: sectors });
                  }} className="rounded border border-brand-400 px-1.5 py-0.5 text-sm focus:outline-none" />
                </label>
              ))}
            </div>
          ) : (
            <SectorBar sectors={p.stocks_sectors} />
          )}
          {editing && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-0.5 text-xs">
                <span className="text-slate-500">PnL %</span>
                <input type="number" step="0.01" defaultValue={draft!.stocks_pnl_pct}
                  onBlur={e => setDraft({ ...draft!, stocks_pnl_pct: parseFloat(e.target.value) || 0 })}
                  className="rounded border border-brand-400 px-1.5 py-0.5 text-sm focus:outline-none" />
              </label>
              <label className="flex flex-col gap-0.5 text-xs">
                <span className="text-slate-500">PnL IDR</span>
                <input type="number" defaultValue={draft!.stocks_pnl_idr}
                  onBlur={e => setDraft({ ...draft!, stocks_pnl_idr: parseFloat(e.target.value) || 0 })}
                  className="rounded border border-brand-400 px-1.5 py-0.5 text-sm focus:outline-none" />
              </label>
            </div>
          )}
        </div>

        {/* Crypto + Savings column */}
        <div className="flex flex-col gap-4">

          {/* Hyperliquid */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Crypto Trading — Hyperliquid</h2>
              {usdIdr && (
                <span className="text-xs text-slate-400">
                  1 USD = {fmt(usdIdr)} IDR
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {([
                { label: 'Total Equity', key: 'total_equity_usd' },
                { label: 'Trading', key: 'trading_equity_usd' },
                { label: 'Vault', key: 'vault_equity_usd' },
                { label: 'Earn', key: 'earn_balance_usd' },
              ] as const).map(({ label, key }) => {
                const usdVal = p.crypto_trading[key];
                return (
                  <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-400">{label}</p>
                    {editing ? (
                      <input type="number" step="0.01" defaultValue={draft!.crypto_trading[key]}
                        onBlur={e => setDraft({ ...draft!, crypto_trading: { ...draft!.crypto_trading, [key]: parseFloat(e.target.value) || 0 } })}
                        className="mt-0.5 w-full rounded border border-brand-400 px-1.5 py-0.5 text-sm font-semibold focus:outline-none" />
                    ) : (
                      <>
                        <p className="mt-0.5 font-semibold text-slate-800">${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        {usdIdr && <p className="text-xs text-slate-400">{fmt(usdVal * usdIdr)} IDR</p>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-lg bg-purple-50 px-3 py-2 text-sm">
              <p className="text-xs text-purple-500">Staking</p>
              {editing ? (
                <input type="number" step="0.0001" defaultValue={draft!.crypto_trading.staking_hype}
                  onBlur={e => setDraft({ ...draft!, crypto_trading: { ...draft!.crypto_trading, staking_hype: parseFloat(e.target.value) || 0 } })}
                  className="mt-0.5 w-full rounded border border-brand-400 px-1.5 py-0.5 text-sm font-semibold focus:outline-none" />
              ) : (
                <p className="mt-0.5 font-semibold text-purple-700">{p.crypto_trading.staking_hype} HYPE</p>
              )}
            </div>
          </div>

          {/* Crypto Investing */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Crypto Investing</h2>
            <div className="flex flex-col gap-2">
              {p.crypto_investing.map((c, i) => (
                <div key={c.platform + c.symbol} className="rounded-lg bg-orange-50 px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-orange-700">{c.platform}</span>
                    <span className="text-xs text-orange-400">{c.symbol}</span>
                  </div>
                  {editing ? (
                    <div className="mt-1 grid grid-cols-2 gap-2">
                      <label className="flex flex-col gap-0.5 text-xs">
                        <span className="text-slate-500">Amount</span>
                        <input type="number" step="0.00000001" defaultValue={c.amount}
                          onBlur={e => updateCryptoInvest(i, 'amount', parseFloat(e.target.value) || 0)}
                          className="rounded border border-brand-400 px-1.5 py-0.5 text-sm focus:outline-none" />
                      </label>
                      <label className="flex flex-col gap-0.5 text-xs">
                        <span className="text-slate-500">Value IDR</span>
                        <input type="number" defaultValue={c.value_idr}
                          onBlur={e => updateCryptoInvest(i, 'value_idr', parseFloat(e.target.value) || 0)}
                          className="rounded border border-brand-400 px-1.5 py-0.5 text-sm focus:outline-none" />
                      </label>
                    </div>
                  ) : (
                    <div className="mt-0.5 flex items-end justify-between">
                      <span className="text-xs text-orange-600">{c.symbol === 'IDR' ? `Rp ${c.amount.toLocaleString('id-ID')}` : `${c.amount.toFixed(8)} ${c.symbol}`}</span>
                      <span className="font-semibold text-orange-800">{fmt(c.value_idr)} IDR</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Savings */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Savings</h2>
            {p.savings.map((sv, i) => (
              <div key={sv.name} className="rounded-lg bg-emerald-50 px-3 py-2.5">
                <p className="text-xs text-emerald-600">{sv.name}</p>
                {editing ? (
                  <input type="number" defaultValue={sv.value_idr}
                    onBlur={e => {
                      const savings = [...draft!.savings];
                      savings[i] = { ...savings[i], value_idr: parseFloat(e.target.value) || 0 };
                      setDraft({ ...draft!, savings });
                    }}
                    className="mt-1 w-full rounded border border-brand-400 px-1.5 py-0.5 text-sm font-semibold focus:outline-none" />
                ) : (
                  <p className="mt-0.5 font-semibold text-emerald-800">{fmt(sv.value_idr)} IDR</p>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
