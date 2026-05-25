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

  const savePortfolio = useCallback(async (userId: string, data: PortfolioData) => {
    data.updated_at = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from('portfolio')
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    setPortfolio(data);
  }, []);

  return { portfolio, loading, error, fetchPortfolio, savePortfolio };
}
