import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction, ParsedTransaction, TransactionType } from '../types';

export interface TransactionFilters {
  month?: string;
  type?: TransactionType | '';
  category?: string;
}

const BATCH_SIZE = 100;

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (filters: TransactionFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('transactions').select('*').order('date', { ascending: false });
      if (filters.month) {
        const [year, month] = filters.month.split('-');
        const start = `${year}-${month}-01`;
        const lastDay = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
        const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        query = query.gte('date', start).lte('date', end);
      }
      if (filters.type) query = query.eq('type', filters.type);
      if (filters.category) query = query.eq('category', filters.category);

      const { data, error } = await query;
      if (error) throw error;
      setTransactions(data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const insertTransactions = useCallback(async (
    parsed: ParsedTransaction[],
    sourceFile: string,
    userId: string,
  ) => {
    const rows = parsed.map(t => ({ ...t, user_id: userId, source_file: sourceFile }));
    // Batch to stay under Supabase 1 MB limit
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const { error } = await supabase.from('transactions').insert(rows.slice(i, i + BATCH_SIZE));
      if (error) throw error;
    }
  }, []);

  const updateTransaction = useCallback(async (
    id: string,
    patch: Partial<Pick<Transaction, 'category' | 'type' | 'description' | 'amount'>>,
  ) => {
    const { error } = await supabase.from('transactions').update(patch).eq('id', id);
    if (error) throw error;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, []);

  return { transactions, loading, error, fetchTransactions, insertTransactions, updateTransaction, deleteTransaction };
}
