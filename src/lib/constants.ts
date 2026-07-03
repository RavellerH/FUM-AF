// Single source of truth for KPI category rules.
// Pass-through categories: money that left the account but isn't personal
// variable spending (rent is reported separately, transfers/investments/
// fronted money are not consumption).
export const EXCLUDE_FROM_EXPENSE = [
  'Third-Party Transfer',
  'Housing',
  'Investment',
  'Reimbursable',
];

// Income categories counted in the Income KPI. Reimbursement income is
// deliberately excluded — it's money coming back, not earnings.
export const INCOME_CATEGORIES = ['Family', 'Salary'];

export const UNCATEGORIZED = 'Uncategorized';
