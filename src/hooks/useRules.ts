import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Rule, TransactionType, ParsedTransaction } from '../types';

export function applyRules(transactions: ParsedTransaction[], rules: Rule[]): ParsedTransaction[] {
  if (!rules.length) return transactions;
  return transactions.map(t => {
    const match = rules.find(r =>
      (t.description ?? '').toLowerCase().includes(r.pattern.toLowerCase())
    );
    if (!match) return t;
    return {
      ...t,
      category: match.category,
      ...(match.type ? { type: match.type } : {}),
    };
  });
}

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRules(data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  const addRule = useCallback(async (
    pattern: string,
    category: string,
    type?: TransactionType | null,
  ): Promise<Rule> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const trimmed = pattern.trim();
    const { data, error } = await supabase
      .from('rules')
      .upsert(
        { user_id: user.id, pattern: trimmed, category, type: type ?? null },
        { onConflict: 'user_id,pattern' },
      )
      .select()
      .single();
    if (error) throw error;
    setRules(prev => [data, ...prev.filter(r => r.pattern.toLowerCase() !== trimmed.toLowerCase())]);
    return data;
  }, []);

  const deleteRule = useCallback(async (id: string) => {
    const { error } = await supabase.from('rules').delete().eq('id', id);
    if (error) throw error;
    setRules(prev => prev.filter(r => r.id !== id));
  }, []);

  return { rules, loading, fetchRules, addRule, deleteRule };
}
