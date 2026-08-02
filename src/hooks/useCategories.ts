import { useState, useCallback } from 'react';
import { ghGet, ghPut } from '../lib/github';
import { useAuth } from './useAuth';
import type { Category } from '../types/index';

const PATH = 'categories.md';

const DEFAULT_CATEGORIES = [
  'Admin Fee', 'Cash', 'Entertainment', 'Family', 'Food & Dining', 'Freelance',
  'Healthcare', 'Home Maintenance', 'Household', 'Housing', 'Income',
  'Insurance', 'Investment', 'Loan', 'Refund', 'Reimbursable',
  'Reimbursement', 'Salary', 'Services', 'Shopping', 'Third-Party Transfer',
  'Transport', 'Uncategorized', 'Utilities', 'Work',
];

function namesToCategories(names: string[]): Category[] {
  return names.map(name => ({ id: name, name }));
}

async function loadCategories(): Promise<string[]> {
  return (await ghGet<string[]>(PATH)) ?? DEFAULT_CATEGORIES;
}

export function useCategories() {
  const { pat } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const names = await loadCategories();
      setCategories(namesToCategories(names.sort()));
    } finally {
      setLoading(false);
    }
  }, []);

  const addCategory = useCallback(async (name: string, _userId?: string) => {
    const names = await loadCategories();
    if (names.includes(name)) return;
    const updated = [...names, name].sort();
    await ghPut(pat, PATH, updated);
    setCategories(namesToCategories(updated));
  }, [pat]);

  const deleteCategory = useCallback(async (id: string) => {
    const names = await loadCategories();
    const updated = names.filter(n => n !== id);
    await ghPut(pat, PATH, updated);
    setCategories(namesToCategories(updated));
  }, [pat]);

  return { categories, loading, fetchCategories, addCategory, deleteCategory };
}
