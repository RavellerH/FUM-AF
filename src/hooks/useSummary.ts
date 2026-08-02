import { useState, useCallback } from 'react';
import { EXCLUDE_FROM_EXPENSE, INCOME_CATEGORIES } from '../lib/constants';
import type { Summary, Transaction } from '../types/index';

// Summaries are no longer persisted — they are computed in-memory from transactions.
// This hook retains the same interface so callers need minimal changes.
export function useSummary() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Compute summary from a set of transactions and set it in state.
  const buildAndUpsertSummary = useCallback(async (
    month: string,
    rows: Transaction[] = [],
  ): Promise<Summary> => {
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

  return { summary, loading, error, buildAndUpsertSummary };
}
