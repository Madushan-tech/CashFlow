import { Category, TransactionType, Account } from './types';

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: '1', name: 'Cash in Hand', type: 'cash', currency: 'LKR', balance: 0 },
  { id: '3', name: 'Savings Account', type: 'savings', currency: 'LKR', balance: 0 },
  { id: '4', name: 'Fixed Deposit', type: 'deposit', currency: 'LKR', balance: 0 },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { 
    id: 'inc-1', name: 'Salary', type: TransactionType.INCOME, icon: 'Briefcase', color: '#258cf4',
    subCategories: ['Monthly', 'Bonus', 'Overtime']
  },
  { 
    id: 'inc-2', name: 'Freelance', type: TransactionType.INCOME, icon: 'Laptop', color: '#34D399',
    subCategories: ['Project', 'Hourly', 'Consulting'] 
  },
  { id: 'inc-3', name: 'Gifts', type: TransactionType.INCOME, icon: 'Gift', color: '#F472B6', subCategories: ['Birthday', 'Wedding'] },
  { id: 'inc-4', name: 'Investment', type: TransactionType.INCOME, icon: 'TrendingUp', color: '#FBBF24', subCategories: ['Dividends', 'Interest'] },
  { id: 'inc-5', name: 'Initial Balance', type: TransactionType.INCOME, icon: 'Wallet', color: '#94A3B8' },
  
  { 
    id: 'exp-1', name: 'Food', type: TransactionType.EXPENSE, icon: 'Utensils', color: '#EF4444',
    subCategories: ['Breakfast', 'Lunch', 'Dinner', 'Groceries', 'Snacks', 'Dining Out']
  },
  { 
    id: 'exp-2', name: 'Transport', type: TransactionType.EXPENSE, icon: 'Car', color: '#F59E0B',
    subCategories: ['Fuel', 'Public Transport', 'Taxi', 'Maintenance', 'Parking'] 
  },
  { 
    id: 'exp-3', name: 'Shopping', type: TransactionType.EXPENSE, icon: 'ShoppingBag', color: '#8B5CF6',
    subCategories: ['Clothing', 'Electronics', 'Home', 'Beauty']
  },
  { 
    id: 'exp-4', name: 'Housing', type: TransactionType.EXPENSE, icon: 'Home', color: '#6366F1',
    subCategories: ['Rent', 'Utilities', 'Internet', 'Repairs']
  },
  { 
    id: 'exp-5', name: 'Entertainment', type: TransactionType.EXPENSE, icon: 'Film', color: '#EC4899',
    subCategories: ['Movies', 'Games', 'Events', 'Subscriptions']
  },
  { 
    id: 'exp-6', name: 'Health', type: TransactionType.EXPENSE, icon: 'Heart', color: '#10B981',
    subCategories: ['Doctor', 'Pharmacy', 'Fitness']
  },
];

export const MOCK_TRANSACTIONS = [];
