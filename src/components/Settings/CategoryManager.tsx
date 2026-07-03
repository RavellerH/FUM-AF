import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCategories } from '../../hooks/useCategories';
import { Spinner } from '../shared/Spinner';
import { ErrorBanner } from '../shared/ErrorBanner';

export function CategoryManager() {
  const { session } = useAuth();
  const { categories, loading, fetchCategories, addCategory, deleteCategory } = useCategories();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name || !session) return;
    setAdding(true);
    setError(null);
    try {
      await addCategory(name, session.user.id);
      setNewName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete category');
    }
  };

  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-slate-800">Categories</h2>
      {error && <div className="mb-3"><ErrorBanner message={error} onDismiss={() => setError(null)} /></div>}

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="New category name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {adding ? <Spinner size="sm" /> : 'Add'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {categories.map(c => (
            <li key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-slate-700">{c.name}</span>
              <button
                onClick={() => handleDelete(c.id)}
                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
          {!categories.length && (
            <li className="px-4 py-8 text-center text-sm text-slate-400">No categories yet.</li>
          )}
        </ul>
      )}
    </div>
  );
}
