import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data ?? []);
    setLoading(false);
  }, []);

  const addCategory = useCallback(async (name: string, userId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return { categories, loading, fetchCategories, addCategory, deleteCategory };
}
