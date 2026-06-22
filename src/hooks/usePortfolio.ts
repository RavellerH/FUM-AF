import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('portfolio').select('data').maybeSingle();
      if (error) throw error;
      setPortfolio(data?.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreviousSnapshot = useCallback(async (): Promise<PortfolioSnapshot | null> => {
    const { data, error } = await supabase
      .from('portfolio_history')
      .select('data, snapshot_at')
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as PortfolioSnapshot | null) ?? null;
  }, []);

  const savePortfolio = useCallback(async (userId: string, data: PortfolioData) => {
    data.updated_at = new Date().toISOString().slice(0, 10);

    // Archive the current state before overwriting, so "vs last time" always has a baseline.
    const { data: existing } = await supabase.from('portfolio').select('data').maybeSingle();
    if (existing?.data) {
      await supabase.from('portfolio_history').insert({ user_id: userId, data: existing.data });
    }

    const { error } = await supabase
      .from('portfolio')
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    setPortfolio(data);
  }, []);

  return { portfolio, loading, error, fetchPortfolio, savePortfolio, fetchPreviousSnapshot };
}
