
import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Transaction, Account, Category, TransactionType } from '../types';
import { DaySummary } from '../components/TransactionListItems';
import { format } from 'date-fns';

interface AccountDetailsProps {
  account: Account | null;
  transactions: Transaction[];
  categories: Category[];
  onBack: () => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (t: Transaction) => void;
  onViewTransaction: (t: Transaction) => void;
  onViewStats: (t: Transaction) => void;
}

export const AccountDetails: React.FC<AccountDetailsProps> = ({
  account,
  transactions,
  categories,
  onBack,
  onDeleteTransaction,
  onEditTransaction,
  onViewTransaction,
  onViewStats
}) => {
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (expandedTransactionId) setExpandedTransactionId(null);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [expandedTransactionId]);

  const accountTransactions = useMemo(() => {
    if (!account) return [];
    return transactions.filter(t => {
        // Filter out Loan Parent records (virtual facility headers)
        if (t.isLoanParent) return false;
        
        return t.accountId === account.id || t.toAccountId === account.id;
    });
  }, [transactions, account]);

  // Group transactions by day
  const dailyTransactions = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    // Sort descending by date, then by creation ID to ensure newest appear top
    const sorted = [...accountTransactions].sort((a, b) => {
        const timeDiff = b.date.getTime() - a.date.getTime();
        if (timeDiff !== 0) return timeDiff;
        if (a.id < b.id) return 1;
        if (a.id > b.id) return -1;
        return 0;
    });

    sorted.forEach(t => {
      const dateKey = format(t.date, 'yyyy-MM-dd');
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)?.push(t);
    });

    return Array.from(grouped.entries()).map(([dateStr, txs]) => {
       const date = new Date(dateStr);
       const dayIncome = txs.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
       const dayExpense = txs.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
       
       return {
         date,
         transactions: txs,
         income: dayIncome,
         expense: dayExpense
       };
    });
  }, [accountTransactions]);

  const getCategory = (id: string) => categories.find(c => c.id === id);

  if (!account) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background" onClick={() => setExpandedTransactionId(null)}>
      {/* Header */}
      <div className="pt-6 pb-4 px-4 flex items-center gap-4 bg-white dark:bg-surface sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col">
            <span className="text-xl font-bold dark:text-white">{account.name}</span>
            <span className="text-xs text-gray-500">Transaction History</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
         <div className="flex flex-col gap-3 pb-20">
            {dailyTransactions.map((day) => (
                <DaySummary 
                key={day.date.toISOString()} 
                dayData={day} 
                getCategory={getCategory}
                expandedTransactionId={expandedTransactionId}
                setExpandedTransactionId={setExpandedTransactionId}
                onViewTransaction={onViewTransaction}
                onViewStats={onViewStats}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
                allTransactions={transactions}
                />
            ))}
            {dailyTransactions.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">
                No transactions found for this account.
                </div>
            )}
         </div>
      </div>
    </div>
  );
};
