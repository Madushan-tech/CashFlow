import React, { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Transaction, Category, TransactionType } from '../types';
import { DaySummary } from './TransactionListItems';
import { format } from 'date-fns';

interface FutureTransactionsDetailsProps {
  type: TransactionType;
  transactions: Transaction[];
  categories: Category[];
  onBack: () => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (t: Transaction) => void;
  onViewTransaction: (t: Transaction) => void;
  onViewStats: (t: Transaction) => void;
}

export const FutureTransactionsDetails: React.FC<FutureTransactionsDetailsProps> = ({
  type,
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

  const futureTransactions = useMemo(() => {
    return transactions.filter(t => t.status === 'pending' && t.type === type);
  }, [transactions, type]);

  // Group transactions by day
  const dailyTransactions = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    const sorted = [...futureTransactions].sort((a, b) => a.date.getTime() - b.date.getTime()); // Ascending for future? Or Descending? Usually lists are date desc.

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
  }, [futureTransactions]);

  const totalAmount = futureTransactions.reduce((acc, t) => acc + t.amount, 0);
  const getCategory = (id: string) => categories.find(c => c.id === id);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background" onClick={() => setExpandedTransactionId(null)}>
      {/* Header */}
      <div className="pt-6 pb-4 px-4 flex items-center gap-4 bg-white dark:bg-surface sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${type === TransactionType.INCOME ? 'bg-amber-100 text-amber-600' : 'bg-amber-100 text-amber-600'}`}>
                {type === TransactionType.INCOME ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-bold dark:text-white">{type === TransactionType.INCOME ? 'Future Income' : 'Future Expenses'}</span>
                <span className="text-xs text-gray-500 font-bold">{totalAmount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}</span>
            </div>
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
                />
            ))}
            {dailyTransactions.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm flex flex-col items-center gap-2">
                    <Clock size={32} className="opacity-20" />
                    <span>No scheduled {type.toLowerCase()} found.</span>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};