
import React, { useMemo } from 'react';
import { Account, AccountType, Transaction, TransactionType, Category } from '../types';
import { ArrowLeft, Wallet, Landmark, Building2, ShieldAlert, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Icon } from '../components/Icon';

interface AccountsProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  onBack: () => void;
  onViewAccount: (account: Account) => void;
}

export const Accounts: React.FC<AccountsProps> = ({ accounts, transactions, onBack, onViewAccount }) => {
  
  const getAccountIcon = (type: AccountType) => {
      switch (type) {
          case AccountType.CASH: return 'Wallet';
          case AccountType.SAVINGS: return 'Landmark';
          case AccountType.FIXED_DEPOSIT: return 'Building2';
          default: return 'Wallet';
      }
  };

  const accountBalances = useMemo(() => {
    return accounts.map(acc => {
       let balance = acc.balance; 
       transactions.forEach(t => {
          if (t.status === 'pending') return;
          
          // CRITICAL FIX: Ignore Loan Parent records. They are virtual facility headers.
          // The actual money movement is tracked via the 'Income' (Cash Loan) or 'Down Payment'/'Installments' (Expense).
          if (t.isLoanParent) return;

          if (t.accountId === acc.id) {
              if (t.type === TransactionType.INCOME) balance += t.amount;
              if (t.type === TransactionType.EXPENSE) balance -= t.amount;
              if (t.type === TransactionType.TRANSFER) balance -= t.amount;
          }
          if (t.toAccountId === acc.id && t.type === TransactionType.TRANSFER) {
              balance += t.amount;
          }
      });
      return { ...acc, currentBalance: balance };
    });
  }, [accounts, transactions]);

  const totalLiabilities = useMemo(() => {
      return transactions
        .filter(t => !t.isSettled && t.settledAmount && t.settledAmount > 0)
        .reduce((acc, t) => acc + (t.settledAmount || 0), 0);
  }, [transactions]);

  const totalAssets = accountBalances.reduce((acc, curr) => acc + Math.max(0, curr.currentBalance), 0);
  const netWorth = totalAssets - totalLiabilities;

  const formatLKR = (amount: number) => {
    return amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background">
      <div className="pt-6 pb-4 px-4 flex items-center gap-4 bg-white dark:bg-surface sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col">
            <span className="text-xl font-bold dark:text-white">Accounts & Assets</span>
            <span className="text-xs text-gray-500">Financial Overview</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
         <div className="bg-gray-900 dark:bg-surface border border-gray-800 rounded-3xl p-6 shadow-xl mb-8">
             <div className="mb-6">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Total Net Worth</span>
                <h2 className={`text-4xl font-extrabold ${netWorth >= 0 ? 'text-white' : 'text-red-400'}`}>
                    {formatLKR(netWorth)}
                </h2>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-800">
                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 mb-1">
                        <ArrowUpRight size={14} className="text-green-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total Assets</span>
                    </div>
                    <span className="text-lg font-bold text-green-500">{formatLKR(totalAssets)}</span>
                </div>
                <div className="flex flex-col text-right">
                    <div className="flex items-center gap-1.5 mb-1 justify-end">
                        <ArrowDownRight size={14} className="text-red-400" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Liabilities</span>
                    </div>
                    <span className="text-lg font-bold text-red-400">{formatLKR(totalLiabilities)}</span>
                </div>
             </div>
         </div>

         <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Liquid Assets
            </h3>
         </div>
         <div className="flex flex-col gap-3 mb-8">
             {accountBalances.map(acc => (
                 <button
                    key={acc.id}
                    onClick={() => onViewAccount(acc)}
                    className="flex items-center justify-between p-4 bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary/30 transition-all shadow-sm group"
                 >
                     <div className="flex items-center gap-4">
                         <div className={`p-3 rounded-xl ${acc.type === AccountType.CASH ? 'bg-emerald-100 text-emerald-600' : acc.type === AccountType.SAVINGS ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                             <Icon name={getAccountIcon(acc.type)} size={24} />
                         </div>
                         <div className="flex flex-col items-start">
                             <span className="font-bold dark:text-white text-base group-hover:text-primary transition-colors">{acc.name}</span>
                             <span className="text-xs text-gray-500 font-medium">{acc.type}</span>
                         </div>
                     </div>
                     <div className="flex flex-col items-end">
                         <span className="font-bold text-gray-900 dark:text-gray-100 text-base">
                             {formatLKR(acc.type === AccountType.CASH ? Math.max(0, acc.currentBalance) : acc.currentBalance)}
                         </span>
                         {acc.type === AccountType.CASH && acc.currentBalance < 0 && (
                             <span className="text-[9px] font-bold text-red-400 uppercase tracking-tighter">Negative Flow</span>
                         )}
                     </div>
                 </button>
             ))}
         </div>

         {totalLiabilities > 0 && (
             <div className="animate-fade-in">
                 <h3 className="text-xs font-bold text-red-500/80 uppercase tracking-wider mb-4 px-1 flex items-center gap-2">
                    <ShieldAlert size={14} /> Outstanding Liabilities
                 </h3>
                 <div className="bg-red-500/5 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-5">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Debt Balance</p>
                            <p className="text-xs text-gray-500">Unsettled loan amounts across all categories.</p>
                        </div>
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">{formatLKR(totalLiabilities)}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-red-100 dark:border-red-900/30 text-[10px] text-gray-400 font-medium">
                        Go to Home and look for transactions with amber warning icons to settle these.
                    </div>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
