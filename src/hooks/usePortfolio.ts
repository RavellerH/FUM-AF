import { useState, useCallback } from 'react';
import { ghGet, ghPut, ghList } from '../lib/github';
import { useAuth } from './useAuth';

export interface StockHolding {
  symbol: string;
  lots: number;
  value_idr: number;
}

export interface CryptoInvesting {
  platform: string;
  symbol: string;
  amount: number;
  value_idr: number;
}

export interface PortfolioData {
  stocks: StockHolding[];
  stocks_pnl_pct: number;
  stocks_pnl_idr: number;
  stocks_sectors: Record<string, number>;
  crypto_trading: {
    platform: string;
    total_equity_usd: number;
    trading_equity_usd: number;
    vault_equity_usd: number;
    earn_balance_usd: number;
    staking_hype: number;
  };
  crypto_investing: CryptoInvesting[];
  savings: Array<{ name: string; value_idr: number }>;
  updated_at: string;
}

export interface PortfolioSnapshot {
  data: PortfolioData;
  snapshot_at: string;
}

const CURRENT_PATH = 'portfolio.md';
const HISTORY_DIR = 'portfolio_history';

export function usePortfolio() {
  const { pat } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ghGet<PortfolioData>(pat, CURRENT_PATH);
      setPortfolio(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, [pat]);

  const fetchPreviousSnapshot = useCallback(async (): Promise<PortfolioSnapshot | null> => {
    const files = await ghList(pat, HISTORY_DIR);
    if (!files.length) return null;
    // Files named YYYY-MM-DD.md — take the latest
    const latest = files.filter(f => f.endsWith('.md')).sort().at(-1);
    if (!latest) return null;
    const data = await ghGet<PortfolioData>(pat, `${HISTORY_DIR}/${latest}`);
    if (!data) return null;
    return { data, snapshot_at: latest.replace('.md', '') };
  }, [pat]);

  const savePortfolio = useCallback(async (_userId: string | undefined, data: PortfolioData) => {
    data.updated_at = new Date().toISOString().slice(0, 10);

    // Archive current state before overwriting
    const existing = await ghGet<PortfolioData>(pat, CURRENT_PATH);
    if (existing) {
      const snapshotName = `${existing.updated_at ?? new Date().toISOString().slice(0, 10)}.md`;
      await ghPut(pat, `${HISTORY_DIR}/${snapshotName}`, existing);
    }

    await ghPut(pat, CURRENT_PATH, data);
    setPortfolio(data);
  }, [pat]);

  return { portfolio, loading, error, fetchPortfolio, savePortfolio, fetchPreviousSnapshot };
}
