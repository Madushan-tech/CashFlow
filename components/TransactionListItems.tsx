
import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Eye, BarChart2, Edit2, Trash2, Clock, Banknote, Layers, ShieldAlert, AlertTriangle, ShieldCheck, Play, Coins, CalendarClock, Zap } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { Transaction, TransactionType, Account } from '../types';
import { Icon } from './Icon';

export const ExpandableItem: React.FC<{
  transaction: Transaction;
  category: any;
  getAccount?: (id: string) => Account | undefined;
  formatAmount: (n: number) => string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onView: () => void;
  onViewRelated?: (id: string) => void;
  onStats: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSettleLoan?: (t: Transaction) => void;
  allTransactions?: Transaction[]; 
  onProcessTransaction?: (t: Transaction) => void;
}> = ({ 
  transaction, category, getAccount, formatAmount, 
  isExpanded, onToggleExpand, 
  onView, onViewRelated, onStats, onEdit, onDelete, onSettleLoan,
  allTransactions, onProcessTransaction
}) => {
  const isIncome = transaction.type === TransactionType.INCOME;
  const isTransfer = transaction.type === TransactionType.TRANSFER;
  const isPending = transaction.status === 'pending';
  const isOverdue = isPending && transaction.date <= new Date();
  
  const isDownPayment = transaction.subCategory === 'Down Payment';
  const isInstallment = transaction.subCategory === 'Installment';
  const isTransferFee = transaction.id.startsWith('fee-');
  const isOpeningBalance = category?.id === '0';
  
  // Specific check for Cash Loan (Income type with loan_category)
  const isCashLoan = transaction.categoryId === 'loan_category' && transaction.type === TransactionType.INCOME;
  
  const hasSettlement = transaction.type === TransactionType.EXPENSE && !transaction.isSettled;
  const isCoveredExpense = hasSettlement;
  const isSettlementPayment = transaction.isSettlement && !isDownPayment && !isInstallment; 

  const amountColorClass = isPending 
    ? 'text-gray-400 dark:text-gray-500'
    : isSettlementPayment
        ? 'text-blue-500'
        : isCoveredExpense
            ? 'text-gray-400 dark:text-gray-500 font-bold' 
            : isIncome 
                ? 'text-primary' 
                : isTransfer 
                    ? 'text-gray-500 dark:text-gray-400' 
                    : 'text-danger';

  let loanTotal = transaction.originalAmount || transaction.amount;
  let loanDue = transaction.settledAmount || 0;

  // Find parent facility name if available
  const parentTransaction = allTransactions?.find(t => t.id === transaction.relatedTransactionId);
  const facilityName = parentTransaction?.note;

  const getTitle = () => {
      if (isTransferFee) return 'Transfer Fee';
      if (isCashLoan) return 'Cash Loan';
      if (isSettlementPayment) return 'Debt Settlement';
      if (isDownPayment) return 'Down Payment';
      if (isInstallment) return 'Loan Installment';
      if (isTransfer) return 'Fund Transfer';
      return category?.name || 'Unknown';
  };

  const getSubTitle = () => {
      // Priority 1: Show Facility Name for Loan parts
      if ((isDownPayment || isInstallment) && facilityName) return facilityName;
      if (isCashLoan && facilityName) return facilityName; 
      if (isCashLoan) return 'Cash Received';

      if (isOpeningBalance && getAccount) {
          const acc = getAccount(transaction.accountId);
          return acc ? acc.name : null;
      }
      
      if (isTransferFee) return 'Bank Charge';

      if (transaction.subCategory) return transaction.subCategory;
      if (isSettlementPayment) return 'Repayment';
      return null;
  };

  // Hide chart button for loan components and fees
  const showChartButton = !isDownPayment && !isInstallment && !isCashLoan && !isTransferFee && !isOpeningBalance;
  
  // Disable deletion for scheduled installments to prevent facility breakage, but keep button visible (disabled)
  const allowDelete = !isInstallment;

  return (
    <div className={`w-full flex flex-col bg-white dark:bg-surface border-b border-gray-50 dark:border-gray-800/50 ${isPending ? 'bg-stripes-gray opacity-90' : ''}`}>
         <div className="flex items-center justify-between px-4 py-3 select-none active:bg-gray-50 dark:active:bg-gray-800/50 transition-colors" onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}>
            <div className="flex items-center gap-4 min-w-0">
                <div className="relative">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isTransferFee ? 'bg-red-500/10 text-red-500' :
                        isSettlementPayment ? 'bg-blue-500/10 text-blue-500' :
                        isDownPayment ? 'bg-red-500/10 text-red-500' :
                        isInstallment ? 'bg-red-500/10 text-red-500' :
                        isIncome ? 'bg-blue-500/10 text-blue-500' : 
                        isTransfer ? 'bg-gray-500/10 text-gray-500' : 
                        'bg-red-500/10 text-red-500'
                    }`}>
                        {isTransferFee ? (
                            <Zap size={18} />
                        ) : isDownPayment ? (
                            <Coins size={18} />
                        ) : isInstallment ? (
                            <CalendarClock size={18} />
                        ) : (
                            <Icon name={isSettlementPayment ? 'ShieldCheck' : isCashLoan ? 'Banknote' : category?.icon || (isTransfer ? 'ArrowRightLeft' : 'HelpCircle')} size={18} />
                        )}
                    </div>
                    {isCoveredExpense && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white dark:border-surface">
                            <AlertTriangle size={10} strokeWidth={3} />
                        </div>
                    )}
                    {isPending && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white dark:border-surface">
                            <Clock size={10} strokeWidth={3} />
                        </div>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium truncate leading-tight dark:text-gray-200`}>
                          {getTitle()}
                      </span>
                      {isPending && <span className="text-[9px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">FUTURE</span>}
                  </div>
                  {getSubTitle() && <span className={`text-[10px] truncate ${isSettlementPayment ? 'text-blue-400 font-bold uppercase tracking-tighter' : 'text-gray-400'}`}>{getSubTitle()}</span>}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold whitespace-nowrap ${amountColorClass}`}>
                  {isCoveredExpense ? (
                      <span className="flex items-center gap-1">
                          {formatAmount(loanTotal)} <span className="text-gray-300 font-normal mx-0.5">|</span> <span className="text-amber-500">{formatAmount(loanDue)}</span>
                      </span>
                  ) : (
                      <>{isIncome ? '+' : isTransfer ? '' : '-'}{formatAmount(transaction.amount)}</>
                  )}
                </span>
            </div>
         </div>

         <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="flex items-center justify-end gap-3 pb-3 px-4 pt-1">
                {isOverdue && onProcessTransaction && (
                  <button onClick={(e) => { e.stopPropagation(); onProcessTransaction(transaction); }} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white transition-colors shadow-sm animate-pulse"><Play size={16} fill="white" /></button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onView(); }} className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white transition-colors shadow-sm"><Eye size={16} /></button>
                {isCoveredExpense && onSettleLoan && (
                    <button onClick={(e) => { e.stopPropagation(); onSettleLoan(transaction); }} className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-white transition-colors shadow-sm"><Banknote size={16} /></button>
                )}
                {showChartButton && (
                    <button onClick={(e) => { e.stopPropagation(); onStats(); }} className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white transition-colors shadow-sm"><BarChart2 size={16} /></button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white transition-colors shadow-sm"><Edit2 size={16} /></button>
                <button 
                  onClick={(e) => { e.stopPropagation(); if(allowDelete) onDelete(); }} 
                  disabled={!allowDelete}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition-colors shadow-sm ${allowDelete ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-50'}`}
                >
                    <Trash2 size={16} />
                </button>
            </div>
         </div>
    </div>
  );
};

export const DaySummary: React.FC<{ 
  dayData: any, 
  getCategory: (id: string) => any,
  getAccount?: (id: string) => Account | undefined,
  expandedTransactionId: string | null,
  setExpandedTransactionId: (id: string | null) => void,
  onViewTransaction: (t: Transaction) => void,
  onViewRelated?: (id: string) => void,
  onViewStats: (t: Transaction) => void,
  onEdit: (t: Transaction) => void,
  onDelete: (id: string) => void,
  onSettleLoan?: (t: Transaction) => void,
  allTransactions?: Transaction[],
  onProcessTransaction?: (t: Transaction) => void;
}> = ({ dayData, getCategory, getAccount, expandedTransactionId, setExpandedTransactionId, onViewTransaction, onViewRelated, onViewStats, onEdit, onDelete, onSettleLoan, allTransactions, onProcessTransaction }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isToday = isSameDay(dayData.date, new Date());
  const formatAmount = (amt: number) => amt.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' });

  return (
    <div className="bg-white dark:bg-surface rounded-xl border border-gray-100 dark:border-gray-800/50 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-3 py-3 cursor-pointer bg-white dark:bg-surface" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg py-1">
            <span className="text-2xl font-bold dark:text-white leading-none">{format(dayData.date, 'd')}</span>
            <span className="text-[10px] uppercase font-bold text-gray-500 leading-none mt-0.5">{format(dayData.date, 'EEE')}</span>
          </div>
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{isToday ? 'Today' : format(dayData.date, 'MMMM d')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right flex items-center gap-2 text-sm font-medium">
             {dayData.income > 0 && <span className="text-primary">+{formatAmount(dayData.income)}</span>}
             {dayData.income > 0 && dayData.expense > 0 && <span className="text-gray-300">|</span>}
             {dayData.expense > 0 && <span className="text-danger">-{formatAmount(dayData.expense)}</span>}
          </div>
          {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>
      {isOpen && (
        <div className="border-t border-gray-100 dark:border-gray-800 flex flex-col">
          {dayData.transactions.map((t: Transaction) => (
             <ExpandableItem 
              key={t.id} 
              transaction={t} 
              category={getCategory(t.categoryId)}
              getAccount={getAccount}
              formatAmount={formatAmount} 
              isExpanded={expandedTransactionId === t.id} 
              onToggleExpand={() => setExpandedTransactionId(expandedTransactionId === t.id ? null : t.id)} 
              onView={() => onViewTransaction(t)} 
              onViewRelated={onViewRelated} 
              onStats={() => onViewStats(t)} 
              onEdit={() => onEdit(t)} 
              onDelete={() => onDelete(t.id)} 
              onSettleLoan={onSettleLoan} 
              allTransactions={allTransactions}
              onProcessTransaction={onProcessTransaction}
            />
          ))}
        </div>
      )}
    </div>
  );
};
