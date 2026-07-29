import { useState, useCallback } from 'react';
import { ghGet, ghPut } from '../lib/github';
import { useAuth } from './useAuth';
import type { Category } from '../types/index';

const PATH = 'categories.md';

const DEFAULT_CATEGORIES = [
  'Cash', 'Entertainment', 'Family', 'Food & Dining', 'Healthcare',
  'Housing', 'Income', 'Insurance', 'Investment', 'Reimbursable',
  'Reimbursement', 'Salary', 'Shopping', 'Third-Party Transfer',
  'Transport', 'Uncategorized', 'Utilities',
];

function namesToCategories(names: string[]): Category[] {
  return names.map(name => ({ id: name, name }));
}

async function loadCategories(pat: string): Promise<string[]> {
  const data = await ghGet<string[]>(pat, PATH);
  if (data) return data;
  // First access — seed defaults
  await ghPut(pat, PATH, DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function useCategories() {
  const { pat } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const names = await loadCategories(pat);
      setCategories(namesToCategories(names.sort()));
    } finally {
      setLoading(false);
    }
  }, [pat]);

  const addCategory = useCallback(async (name: string, _userId?: string) => {
    const names = await loadCategories(pat);
    if (names.includes(name)) return;
    const updated = [...names, name].sort();
    await ghPut(pat, PATH, updated);
    setCategories(namesToCategories(updated));
  }, [pat]);

  const deleteCategory = useCallback(async (id: string) => {
    // id === name for GitHub-backed categories
    const names = await loadCategories(pat);
    const updated = names.filter(n => n !== id);
    await ghPut(pat, PATH, updated);
    setCategories(namesToCategories(updated));
  }, [pat]);

  return { categories, loading, fetchCategories, addCategory, deleteCategory };
}
