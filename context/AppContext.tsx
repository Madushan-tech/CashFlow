import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Transaction, Category, Account, TransactionType } from '../types';
import { DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES } from '../constants';

interface AppContextType {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  isOnboarded: boolean;
  completeOnboarding: (balances: { cash: number; savings: number; deposit: number }) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  editTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  clearData: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Security
  password: string | null;
  setPassword: (pwd: string | null) => void;
  isAppLockEnabled: boolean;
  setAppLockEnabled: (enabled: boolean) => void;
  requestAuth: (onSuccess: () => void) => void; // Function to trigger auth modal
  authModalState: { isOpen: boolean; onSuccess: () => void; onClose: () => void }; // Internal use for Modal
  closeAuthModal: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('cf_onboarded') === 'true';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('cf_transactions');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('cf_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('cf_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('cf_theme') as 'light' | 'dark') || 'dark';
  });

  // Security State
  const [password, setPasswordState] = useState<string | null>(() => {
      return localStorage.getItem('cf_password');
  });
  const [isAppLockEnabled, setAppLockEnabledState] = useState<boolean>(() => {
      return localStorage.getItem('cf_applock') === 'true';
  });

  // Auth Modal State
  const [authModalState, setAuthModalState] = useState({
      isOpen: false,
      onSuccess: () => {},
      onClose: () => {}
  });

  useEffect(() => {
    localStorage.setItem('cf_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('cf_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('cf_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('cf_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const setPassword = (pwd: string | null) => {
      if (pwd === null) {
          localStorage.removeItem('cf_password');
      } else {
          localStorage.setItem('cf_password', pwd);
      }
      setPasswordState(pwd);
  };

  const setAppLockEnabled = (enabled: boolean) => {
      localStorage.setItem('cf_applock', String(enabled));
      setAppLockEnabledState(enabled);
  };

  const requestAuth = (onSuccess: () => void) => {
      if (!password) {
          onSuccess(); // No password set, proceed
      } else {
          setAuthModalState({
              isOpen: true,
              onSuccess: () => {
                  setAuthModalState(prev => ({ ...prev, isOpen: false }));
                  onSuccess();
              },
              onClose: () => setAuthModalState(prev => ({ ...prev, isOpen: false }))
          });
      }
  };

  const closeAuthModal = () => {
      authModalState.onClose();
  };

  const completeOnboarding = (balances: { cash: number; savings: number; deposit: number }) => {
    const newTransactions: Transaction[] = [];
    const date = new Date().toISOString();
    
    // Helper to add initial balance transaction
    const addInitTx = (amount: number, accId: string) => {
        if (amount > 0) {
            newTransactions.push({
                id: crypto.randomUUID(),
                amount,
                type: TransactionType.INCOME,
                categoryId: 'inc-5', // Initial Balance Category
                accountId: accId,
                date,
                note: 'Initial Balance'
            });
        }
    };

    addInitTx(balances.cash, '1');
    addInitTx(balances.savings, '3');
    addInitTx(balances.deposit, '4');

    setTransactions(prev => [...newTransactions, ...prev]);
    setIsOnboarded(true);
    localStorage.setItem('cf_onboarded', 'true');
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction = { ...t, id: crypto.randomUUID() };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const editTransaction = (id: string, t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => prev.map(item => item.id === id ? { ...t, id } : item));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addCategory = (c: Omit<Category, 'id'>) => {
    const newCategory = { ...c, id: crypto.randomUUID() };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, c: Partial<Category>) => {
    setCategories(prev => prev.map(item => item.id === id ? { ...item, ...c } : item));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addAccount = (a: Omit<Account, 'id'>) => {
    const newAccount = { ...a, id: crypto.randomUUID() };
    setAccounts(prev => [...prev, newAccount]);
  };

  const updateAccount = (id: string, a: Partial<Account>) => {
    setAccounts(prev => prev.map(item => item.id === id ? { ...item, ...a } : item));
  };

  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const clearData = () => {
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
    setAccounts(DEFAULT_ACCOUNTS);
    setIsOnboarded(false);
    localStorage.removeItem('cf_transactions');
    localStorage.removeItem('cf_categories');
    localStorage.removeItem('cf_accounts');
    localStorage.removeItem('cf_onboarded');
    // Keep password settings
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <AppContext.Provider value={{
      transactions,
      categories,
      accounts,
      isOnboarded,
      completeOnboarding,
      addTransaction,
      editTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addAccount,
      updateAccount,
      deleteAccount,
      clearData,
      theme,
      toggleTheme,
      password,
      setPassword,
      isAppLockEnabled,
      setAppLockEnabled,
      requestAuth,
      authModalState,
      closeAuthModal
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
