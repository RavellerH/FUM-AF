import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Summary, Transaction } from '../types';

export function useSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (month: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('month', month)
        .maybeSingle();
      if (error) throw error;
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const buildAndUpsertSummary = useCallback(async (month: string, userId: string) => {
    const [year, mon] = month.split('-');
    const start = `${year}-${mon}-01`;
    const end = new Date(Number(year), Number(mon), 0).toISOString().split('T')[0];

    const { data: txns, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', start)
      .lte('date', end);
    if (txErr) throw txErr;

    const rows = (txns ?? []) as Transaction[];
    const total_income = rows.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const total_expense = rows.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const by_category = rows.reduce<Record<string, number>>((acc, t) => {
      if (t.type === 'expense') acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      return acc;
    }, {});

    const { data, error } = await supabase
      .from('summaries')
      .upsert({ user_id: userId, month, total_income, total_expense, by_category }, { onConflict: 'user_id,month' })
      .select()
      .single();
    if (error) throw error;
    setSummary(data);
    return data as Summary;
  }, []);

  return { summary, loading, error, fetchSummary, buildAndUpsertSummary };
}
