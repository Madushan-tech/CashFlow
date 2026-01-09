
import { LucideIcon } from 'lucide-react';

export enum TransactionType {
  INCOME = 'Income',
  EXPENSE = 'Expense',
  TRANSFER = 'Transfer',
}

export enum AccountType {
  CASH = 'Cash',
  SAVINGS = 'Savings',
  FIXED_DEPOSIT = 'Fixed Deposit',
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Name of the lucide icon
  subCategories?: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  subCategory?: string;
  accountId: string; 
  toAccountId?: string; 
  date: Date;
  note?: string;
  description?: string;
  status?: 'verified' | 'pending';
  originalAmount?: number;
  rescheduledFrom?: Date;
  
  // Loan Specific Fields
  relatedTransactionId?: string; 
  isLoan?: boolean; 
  isSettled?: boolean; 
  settledAmount?: number; 
  isSettlement?: boolean; // Flag to identify a repayment that shouldn't increase total expense

  // Loan Extension Fields
  loanType?: 'CASH' | 'ASSET';
  totalInstallments?: number;
  remainingInstallments?: number;
  installmentFee?: number;
  downPayment?: number;
  isLoanParent?: boolean; // The main loan record
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  theme: 'light' | 'dark';
  currentView: ViewState;
  hasOnboarded: boolean;
  securityPin?: string;
  notificationsEnabled: boolean;
  lastNotificationDate?: number; // Timestamp
}

export type ViewState = 'HOME' | 'STATS' | 'EDIT' | 'SETTINGS' | 'TRANSACTION_STATS' | 'FUTURE_TRANSACTIONS' | 'ACCOUNT_DETAILS' | 'ACCOUNTS';
