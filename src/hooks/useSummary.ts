import { useState, useCallback } from 'react';
import { EXCLUDE_FROM_EXPENSE, INCOME_CATEGORIES } from '../lib/constants';
import type { Summary, Transaction } from '../types/index';

// Summaries are no longer persisted — they are computed in-memory from transactions.
// This hook retains the same interface so callers need minimal changes.
export function useSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // No-op: summary is derived from transactions which callers already hold
  const fetchSummary = useCallback(async (_month: string) => {}, []);

  // Compute summary from a set of transactions and set it in state.
  // The userId param is kept for call-site compatibility but is not used.
  const buildAndUpsertSummary = useCallback(async (
    month: string,
    _userIdOrTxns?: string | Transaction[],
    txnsArg?: Transaction[],
  ): Promise<Summary> => {
    // Accept either (month, userId) legacy or (month, transactions) new form
    const rows: Transaction[] = Array.isArray(_userIdOrTxns)
      ? _userIdOrTxns
      : (txnsArg ?? []);

    const total_income = rows
      .filter(t => t.type === 'income' && INCOME_CATEGORIES.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);

    const total_expense = rows
      .filter(t => t.type === 'expense' && !EXCLUDE_FROM_EXPENSE.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);

    const by_category = rows.reduce<Record<string, number>>((acc, t) => {
      if (t.type === 'expense' && !EXCLUDE_FROM_EXPENSE.includes(t.category)) {
        acc[t.category] = (acc[t.category] ?? 0) + t.amount;
      }
      return acc;
    }, {});

    const result: Summary = {
      id: month,
      month,
      total_income,
      total_expense,
      by_category,
      created_at: new Date().toISOString(),
    };
    setSummary(result);
    return result;
  }, []);

  return { summary, loading, error, fetchSummary, buildAndUpsertSummary };
}
