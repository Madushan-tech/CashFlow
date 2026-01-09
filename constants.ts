
import { AccountType, Category, TransactionType, Account } from './types';

// Zero level accounts - balances will be set during onboarding
export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'Cash in Hand', type: AccountType.CASH, balance: 0 },
  { id: '2', name: 'Savings Account', type: AccountType.SAVINGS, balance: 0 },
  { id: '3', name: 'Fixed Deposit', type: AccountType.FIXED_DEPOSIT, balance: 0 },
];

export const OPENING_BALANCE_CATEGORY: Category = {
  id: '0',
  name: 'Opening Balance',
  type: TransactionType.INCOME,
  icon: 'Wallet',
  subCategories: []
};

// Loan category definition kept for internal use but removed from default list if desired, 
// or we can remove it entirely if it's not used for manual entry.
export const LOAN_CATEGORY: Category = {
  id: 'loan_category',
  name: 'Loans',
  type: TransactionType.INCOME, // Loans received are inflow
  icon: 'Banknote',
  subCategories: ['Personal Loan', 'Credit', 'Adjustment']
};

export const INITIAL_CATEGORIES: Category[] = [
  OPENING_BALANCE_CATEGORY,
  // LOAN_CATEGORY removed from here to hide from income section
  { 
    id: '1', 
    name: 'Salary', 
    type: TransactionType.INCOME, 
    icon: 'Briefcase',
    subCategories: ['Monthly Salary', 'Bonus', 'Overtime']
  },
  { 
    id: '2', 
    name: 'Freelance', 
    type: TransactionType.INCOME, 
    icon: 'Laptop',
    subCategories: ['Project', 'Hourly', 'Consulting']
  },
  { 
    id: '3', 
    name: 'Gifts', 
    type: TransactionType.INCOME, 
    icon: 'Gift',
    subCategories: ['Birthday', 'Wedding', 'Donation'] 
  },
  { 
    id: '4', 
    name: 'Food', 
    type: TransactionType.EXPENSE, 
    icon: 'Utensils',
    subCategories: ['Groceries', 'Restaurants', 'Coffee & Snacks', 'Delivery'] 
  },
  { 
    id: '5', 
    name: 'Transport', 
    type: TransactionType.EXPENSE, 
    icon: 'Car',
    subCategories: ['Fuel', 'Public Transport', 'Taxi/Uber', 'Maintenance', 'Parking'] 
  },
  { 
    id: '6', 
    name: 'Housing', 
    type: TransactionType.EXPENSE, 
    icon: 'Home',
    subCategories: ['Rent', 'Utilities', 'Maintenance', 'Internet', 'Furniture'] 
  },
  { 
    id: '7', 
    name: 'Entertainment', 
    type: TransactionType.EXPENSE, 
    icon: 'Film',
    subCategories: ['Movies', 'Games', 'Subscriptions', 'Hobbies', 'Events'] 
  },
  { 
    id: '8', 
    name: 'Shopping', 
    type: TransactionType.EXPENSE, 
    icon: 'ShoppingBag',
    subCategories: ['Clothing', 'Electronics', 'Personal Care', 'Health & Beauty'] 
  },
];

export const AVAILABLE_ICONS = [
  'Briefcase', 'Laptop', 'Gift', 'Utensils', 'Car', 'Home', 'Film', 'ShoppingBag', 
  'Zap', 'Wifi', 'Coffee', 'Smartphone', 'Dumbbell', 'Heart', 'Plane', 'Music', 'Wallet', 'Banknote'
];
