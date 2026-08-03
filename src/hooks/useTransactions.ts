import { useState, useCallback } from 'react';
import { ghGet, ghPut, ghList } from '../lib/github';
import { useAuth } from './useAuth';
import type { Transaction, ParsedTransaction } from '../types/index';

export interface TransactionFilters {
  month?: string;
  type?: string;
  category?: string;
}

function txPath(month: string) {
  return `transactions/${month}.md`;
}

async function loadMonth(month: string): Promise<Transaction[]> {
  return (await ghGet<Transaction[]>(txPath(month))) ?? [];
}

async function saveMonth(pat: string, month: string, txns: Transaction[]): Promise<void> {
  const sorted = [...txns].sort((a, b) => b.date.localeCompare(a.date));
  await ghPut(pat, txPath(month), sorted);
}

async function listMonths(): Promise<string[]> {
  const files = await ghList('transactions');
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace('.md', ''))
    .sort()
    .reverse();
}

export function useTransactions() {
  const { pat } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (filters: TransactionFilters = {}): Promise<Transaction[]> => {
    setLoading(true);
    setError(null);
    try {
      let txns: Transaction[];
      if (filters.month) {
        txns = await loadMonth(filters.month);
      } else {
        const months = await listMonths();
        const results = await Promise.all(months.map(m => loadMonth(m)));
        txns = results.flat();
      }
      if (filters.type) txns = txns.filter(t => t.type === filters.type);
      if (filters.category) txns = txns.filter(t => t.category === filters.category);
      txns.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(txns);
      return txns;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load transactions');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const insertTransactions = useCallback(async (
    parsed: ParsedTransaction[],
    sourceFile: string,
    _userId?: string,
  ) => {
    const byMonth = new Map<string, ParsedTransaction[]>();
    for (const t of parsed) {
      const m = t.date.slice(0, 7);
      if (!byMonth.has(m)) byMonth.set(m, []);
      byMonth.get(m)!.push(t);
    }
    for (const [month, newTxns] of byMonth) {
      const existing = await loadMonth(month);
      const withIds: Transaction[] = newTxns.map(t => ({
        ...t,
        id: crypto.randomUUID(),
        source_file: sourceFile,
        created_at: new Date().toISOString(),
      }));
      await saveMonth(pat, month, [...existing, ...withIds]);
    }
  }, [pat]);

  const updateTransaction = useCallback(async (
    id: string,
    patch: Partial<Pick<Transaction, 'category' | 'type' | 'description' | 'amount'>>,
  ) => {
    const txn = transactions.find(t => t.id === id);
    if (!txn) throw new Error('Transaction not found');
    const month = txn.date.slice(0, 7);
    const txns = await loadMonth(month);
    await saveMonth(pat, month, txns.map(t => t.id === id ? { ...t, ...patch } : t));
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, [pat, transactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    const txn = transactions.find(t => t.id === id);
    if (!txn) return;
    const month = txn.date.slice(0, 7);
    const txns = await loadMonth(month);
    await saveMonth(pat, month, txns.filter(t => t.id !== id));
    setTransactions(prev => prev.filter(t => t.id !== id));
  }, [pat, transactions]);

  const getAvailableMonths = useCallback(async (): Promise<string[]> => {
    return listMonths();
  }, []);

  const getSourceFiles = useCallback(async (): Promise<string[]> => {
    const months = await listMonths();
    const results = await Promise.all(months.map(m => loadMonth(m)));
    const files = results.flat().map(t => t.source_file).filter(Boolean) as string[];
    return [...new Set(files)];
  }, []);

  const getTransactionsBySourceFile = useCallback(async (sourceFile: string): Promise<Transaction[]> => {
    const months = await listMonths();
    const results = await Promise.all(months.map(m => loadMonth(m)));
    return results.flat().filter(t => t.source_file === sourceFile);
  }, []);

  const deleteBySourceFile = useCallback(async (sourceFile: string): Promise<void> => {
    const months = await listMonths();
    await Promise.all(months.map(async (month) => {
      const txns = await loadMonth(month);
      const filtered = txns.filter(t => t.source_file !== sourceFile);
      if (filtered.length !== txns.length) {
        await saveMonth(pat, month, filtered);
      }
    }));
  }, [pat]);

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    insertTransactions,
    updateTransaction,
    deleteTransaction,
    getAvailableMonths,
    getSourceFiles,
    getTransactionsBySourceFile,
    deleteBySourceFile,
  };
}
