
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { 
  format, addWeeks, subWeeks, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, addMonths, subMonths,
  isWithinInterval, isSameWeek, getWeekOfMonth, isSameMonth
} from 'date-fns';
import { Transaction, TransactionType, Account, AccountType } from '../types';
import { DaySummary } from '../components/TransactionListItems';

interface HomeProps {
  transactions: Transaction[];
  categories: any[];
  accounts: Account[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (t: Transaction) => void;
  onViewTransaction: (t: Transaction) => void;
  onViewStats: (t: Transaction) => void;
  onSettleLoan?: (t: Transaction) => void;
  onViewAccounts?: () => void;
  onProcessTransaction?: (t: Transaction) => void;
}

export const Home: React.FC<HomeProps> = ({ 
  transactions, categories, accounts, onDeleteTransaction, onEditTransaction, onViewTransaction, onViewStats, onSettleLoan, onViewAccounts, onProcessTransaction
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => { if (expandedTransactionId) setExpandedTransactionId(null); };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [expandedTransactionId]);
  
  const today = new Date();
  const isCurrentMonth = isSameMonth(currentDate, today);

  const handlePrev = () => {
    if (isCurrentMonth) {
        const prevWeek = subWeeks(currentDate, 1);
        if (!isSameMonth(prevWeek, today)) setCurrentDate(startOfMonth(subMonths(currentDate, 1)));
        else setCurrentDate(prevWeek);
    } else {
        const prevMonth = subMonths(currentDate, 1);
        if (isSameMonth(prevMonth, today)) setCurrentDate(endOfMonth(prevMonth));
        else setCurrentDate(startOfMonth(prevMonth));
    }
  };

  const handleNext = () => {
      if (isCurrentMonth) {
          const nextWeek = addWeeks(currentDate, 1);
          if (!isSameMonth(nextWeek, today)) setCurrentDate(startOfMonth(addMonths(currentDate, 1)));
          else setCurrentDate(nextWeek);
      } else {
          const nextMonth = addMonths(currentDate, 1);
          if (isSameMonth(nextMonth, today)) setCurrentDate(startOfMonth(nextMonth));
          else setCurrentDate(startOfMonth(nextMonth));
      }
  };

  const formatLKR = (amount: number) => {
    return amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 });
  };

  const formatCompactLKR = (amount: number) => {
    if (amount >= 100000) {
      return 'LKR ' + (amount / 1000).toFixed(1) + 'K';
    }
    return formatLKR(amount);
  };

  const fdAccountIds = useMemo(() => new Set(
    accounts.filter(a => a.type === AccountType.FIXED_DEPOSIT).map(a => a.id)
  ), [accounts]);

  const initialLiquidBalance = useMemo(() => 
    accounts.filter(a => a.type !== AccountType.FIXED_DEPOSIT).reduce((acc, a) => acc + a.balance, 0),
  [accounts]);

  const dateRange = useMemo(() => {
      if (isCurrentMonth) return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
  }, [currentDate, isCurrentMonth]);

  const viewTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (t.isLoanParent) return false;
      if (fdAccountIds.has(t.accountId)) return false;
      return isWithinInterval(t.date, dateRange);
    });
  }, [transactions, dateRange, fdAccountIds]);

  const incomeTotal = viewTransactions
    .filter(t => t.status !== 'pending' && t.type === TransactionType.INCOME)
    // Filter out Loans unless it's a cash loan income
    .filter(t => t.categoryId !== 'loan_category' || t.description?.includes('Principal')) 
    .reduce((acc, t) => acc + t.amount, 0);

  const expenseTotal = viewTransactions
    .filter(t => t.status !== 'pending' && t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + (t.originalAmount || t.amount), 0);

  // Updated Liquid Calculation to strictly follow account types
  const liquidRunningBalance = useMemo(() => {
    // Sum balances of non-FD accounts
    let total = 0;
    accounts.forEach(acc => {
        if (acc.type === AccountType.FIXED_DEPOSIT) return;
        let accBal = acc.balance;
        transactions.forEach(t => {
            if (t.status === 'pending' || t.isLoanParent) return;
            if (t.accountId === acc.id) {
                if (t.type === TransactionType.INCOME) accBal += t.amount; // Includes Cash Loan Income
                if (t.type === TransactionType.EXPENSE) accBal -= t.amount;
                if (t.type === TransactionType.TRANSFER) accBal -= t.amount;
            }
            if (t.toAccountId === acc.id && t.type === TransactionType.TRANSFER) {
                accBal += t.amount;
            }
        });
        total += Math.max(0, accBal); // Ensure no negative cash
    });
    return total;
  }, [transactions, accounts, fdAccountIds]);

  const dailyTransactions = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    
    // Sort logic: 
    // 1. Date descending (Newest date first)
    // 2. ID descending (Newest created entry first within same day)
    const sorted = [...viewTransactions].sort((a, b) => {
        const timeDiff = b.date.getTime() - a.date.getTime();
        if (timeDiff !== 0) return timeDiff;
        // String comparison for IDs (assuming timestamps or UUIDs where lex order usually correlates with creation)
        if (a.id < b.id) return 1;
        if (a.id > b.id) return -1;
        return 0;
    });

    sorted.forEach(t => {
      const dateKey = format(t.date, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) grouped.set(dateKey, []);
      grouped.get(dateKey)?.push(t);
    });
    return Array.from(grouped.entries()).map(([dateStr, txs]) => {
       // Include Cash Loan Income in daily total
       const dayIncome = txs.filter(t => t.status !== 'pending' && t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
       const dayExpense = txs.filter(t => t.status !== 'pending' && t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + (t.originalAmount || t.amount), 0);
       return { date: new Date(dateStr), transactions: txs, income: dayIncome, expense: dayExpense };
    });
  }, [viewTransactions]); 

  const headerLabel = isCurrentMonth 
    ? `${format(currentDate, 'MMM yyyy')} W${getWeekOfMonth(currentDate, { weekStartsOn: 1 })}`
    : format(currentDate, 'MMM yyyy');

  const getAccount = (id: string) => accounts.find(a => a.id === id);

  return (
    <div className="flex flex-col h-full pb-20" onClick={() => setExpandedTransactionId(null)}>
      <div className="pt-6 pb-2 px-4 flex items-center justify-between bg-white dark:bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center"><TrendingUp className="text-white w-5 h-5" /></div>
           <span className="font-bold text-xl tracking-tight dark:text-white">CashFlow</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-surface px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700">
          <button onClick={(e) => { e.stopPropagation(); handlePrev(); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><ChevronLeft size={20} className="text-gray-600 dark:text-gray-300"/></button>
          <div className="flex items-center justify-center gap-2 min-w-[110px]">
             {isSameWeek(currentDate, today, { weekStartsOn: 1 }) && isCurrentMonth && <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
             <span className="text-sm font-semibold text-center dark:text-white">{headerLabel}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleNext(); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"><ChevronRight size={20} className="text-gray-600 dark:text-gray-300"/></button>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col p-2 rounded-xl bg-white dark:bg-surface border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <span className="text-[9px] text-primary font-bold uppercase mb-1 opacity-80 truncate">Income {isCurrentMonth ? '(Wk)' : '(Mo)'}</span>
            <span className="text-sm font-bold text-primary truncate">{formatCompactLKR(incomeTotal)}</span>
          </div>
          <div className="flex flex-col p-2 rounded-xl bg-white dark:bg-surface border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <span className="text-[9px] text-danger font-bold uppercase mb-1 opacity-80 truncate">Expenses {isCurrentMonth ? '(Wk)' : '(Mo)'}</span>
            <span className="text-sm font-bold text-danger truncate">{formatCompactLKR(expenseTotal)}</span>
          </div>
          <button onClick={onViewAccounts} className="flex flex-col p-2 rounded-xl bg-gray-900 dark:bg-gray-700 border border-gray-800 dark:border-gray-600 shadow-sm text-left hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors relative overflow-hidden">
             <span className="text-[9px] text-gray-300 font-bold uppercase mb-1 opacity-80 truncate">Liquid Cash</span>
             <div className="flex items-center justify-between">
                <span className="text-sm font-bold truncate text-white">{formatCompactLKR(liquidRunningBalance)}</span>
                <ChevronRight size={14} className="text-gray-400 shrink-0" />
             </div>
          </button>
        </div>
      </div>

      <div className="flex-1 px-4">
        <h3 className="text-xs font-bold text-gray-50 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">Activity Log</h3>
        <div className="flex flex-col gap-3">
          {dailyTransactions.map((day) => (
            <DaySummary 
              key={day.date.toISOString()} 
              dayData={day} 
              getCategory={(id: string) => categories.find(c => c.id === id)} 
              getAccount={getAccount}
              expandedTransactionId={expandedTransactionId} 
              setExpandedTransactionId={setExpandedTransactionId} 
              onViewTransaction={onViewTransaction} 
              onViewStats={onViewStats} 
              onEdit={onEditTransaction} 
              onDelete={onDeleteTransaction} 
              onSettleLoan={onSettleLoan} 
              allTransactions={transactions}
              onProcessTransaction={onProcessTransaction}
            />
          ))}
          {dailyTransactions.length === 0 && <div className="text-center py-10 text-gray-400 text-sm italic">No records for this period.</div>}
        </div>
      </div>
    </div>
  );
};
