export const CATEGORY_COLORS: Record<string, string> = {
  'Third-Party Transfer': 'bg-blue-100 text-blue-700',
  'Reimbursable':        'bg-lime-100 text-lime-700',
  'Investment':        'bg-purple-100 text-purple-700',
  'Family':            'bg-emerald-100 text-emerald-700',
  'Freelance':         'bg-teal-100 text-teal-700',
  'Reimbursement':     'bg-cyan-100 text-cyan-700',
  'Refund':            'bg-cyan-100 text-cyan-700',
  'Housing':           'bg-orange-100 text-orange-700',
  'Household':         'bg-orange-100 text-orange-700',
  'Home Maintenance':  'bg-orange-100 text-orange-700',
  'Food & Dining':     'bg-amber-100 text-amber-700',
  'Healthcare':        'bg-rose-100 text-rose-700',
  'Insurance':         'bg-fuchsia-100 text-fuchsia-700',
  'Admin Fee':         'bg-stone-100 text-stone-600',
  'Transport':         'bg-sky-100 text-sky-700',
  'Shopping':          'bg-pink-100 text-pink-700',
  'Entertainment':     'bg-violet-100 text-violet-700',
  'Work':              'bg-indigo-100 text-indigo-700',
  'Services':          'bg-indigo-100 text-indigo-700',
  'Loan':              'bg-red-100 text-red-700',
  'Cash':              'bg-gray-100 text-gray-600',
  'Uncategorized':     'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400',
};

export function categoryPillCls(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-600';
}

export function suggestPattern(description: string): string {
  const parts = description.split(' | ');
  const base = parts.length > 1 ? parts[parts.length - 1] : description;
  // Strip trailing long account numbers
  return base.replace(/\s+\d{8,}$/, '').trim();
}
