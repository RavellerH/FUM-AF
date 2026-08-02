import { useState, useCallback } from 'react';
import { ghGet, ghPut, ghList } from '../lib/github';
import { useAuth } from './useAuth';
import type { Rule, TransactionType, ParsedTransaction } from '../types/index';

const PATH = 'rules.md';

export function applyRules(transactions: ParsedTransaction[], rules: Rule[]): ParsedTransaction[] {
  if (!rules.length) return transactions;
  return transactions.map(t => {
    const match = rules.find(r =>
      (t.description ?? '').toLowerCase().includes(r.pattern.toLowerCase())
    );
    if (!match) return t;
    return { ...t, category: match.category, ...(match.type ? { type: match.type } : {}) };
  });
}

async function loadRules(): Promise<Rule[]> {
  return (await ghGet<Rule[]>(PATH)) ?? [];
}

export function useRules() {
  const { pat } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      setRules(await loadRules());
    } finally {
      setLoading(false);
    }
  }, []);

  const addRule = useCallback(async (
    pattern: string,
    category: string,
    type?: TransactionType | null,
  ): Promise<Rule> => {
    const trimmed = pattern.trim();
    const existing = await loadRules();
    const newRule: Rule = {
      id: crypto.randomUUID(),
      pattern: trimmed,
      category,
      type: type ?? null,
      created_at: new Date().toISOString(),
    };
    const updated = [newRule, ...existing.filter(r => r.pattern.toLowerCase() !== trimmed.toLowerCase())];
    await ghPut(pat, PATH, updated);
    setRules(updated);
    return newRule;
  }, [pat]);

  const deleteRule = useCallback(async (id: string) => {
    const existing = await loadRules();
    const updated = existing.filter(r => r.id !== id);
    await ghPut(pat, PATH, updated);
    setRules(updated);
  }, [pat]);

  const applyRulesToUncategorized = useCallback(async (): Promise<number> => {
    const allRules = await loadRules();
    if (!allRules.length) return 0;

    const files = await ghList('transactions');
    const months = files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));

    let updated = 0;
    for (const month of months) {
      const txns = (await ghGet<import('../types/index').Transaction[]>(`transactions/${month}.md`)) ?? [];
      let changed = false;
      const patched = txns.map(t => {
        if (t.category !== 'Uncategorized') return t;
        const match = allRules.find(r =>
          (t.description ?? '').toLowerCase().includes(r.pattern.toLowerCase())
        );
        if (!match) return t;
        changed = true;
        updated++;
        return { ...t, category: match.category, ...(match.type ? { type: match.type as TransactionType } : {}) };
      });
      if (changed) {
        await ghPut(pat, `transactions/${month}.md`, patched);
      }
    }
    return updated;
  }, [pat]);

  return { rules, loading, fetchRules, addRule, deleteRule, applyRulesToUncategorized };
}
