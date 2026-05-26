export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  amount: number;
  currency: string;
  type: TransactionType;
  category: string;
  description?: string;
  source_file?: string;
  created_at: string;
}

export interface Summary {
  id: string;
  user_id: string;
  month: string;
  total_income: number;
  total_expense: number;
  by_category: Record<string, number>;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
}

export interface ParsedTransaction {
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  currency: string;
}

export interface Rule {
  id: string;
  user_id: string;
  pattern: string;
  category: string;
  type: TransactionType | null;
  created_at: string;
}
