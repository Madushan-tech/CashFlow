export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isCustom?: boolean;
  subCategories?: string[];
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'savings' | 'deposit' | 'salary';
  currency: string;
  balance: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  subCategory?: string;
  accountId: string;
  toAccountId?: string;
  fee?: number;
  date: string;
  note?: string;
  description?: string;
}

export interface DaySummary {
  date: string;
  income: number;
  expense: number;
  transactions: Transaction[];
}
