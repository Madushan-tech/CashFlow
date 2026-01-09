
import React from 'react';
import { X, Edit2, Trash2, Calendar, CreditCard, Info, CheckCircle2, Banknote, ShieldCheck, Coins, ShieldAlert, CalendarClock } from 'lucide-react';
import { Transaction, Category, Account, TransactionType } from '../types';
import { format } from 'date-fns';
import { Icon } from './Icon';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  category?: Category;
  account?: Account;
  toAccount?: Account;
  relatedTransaction?: Transaction;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onSettleLoan?: (t: Transaction) => void;
  onViewRelated?: (t: Transaction) => void; 
  allTransactions?: Transaction[]; 
  onProcess?: (t: Transaction) => void;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen, onClose, transaction, category, account, toAccount, relatedTransaction, onEdit, onDelete, onSettleLoan
}) => {
  if (!isOpen || !transaction) return null;

  const isIncome = transaction.type === TransactionType.INCOME;
  const isTransfer = transaction.type === TransactionType.TRANSFER;
  const isDownPayment = transaction.subCategory === 'Down Payment';
  const isInstallment = transaction.subCategory === 'Installment';
  const isLoanCategory = transaction.categoryId === 'loan_category';
  
  const colorClass = isIncome ? 'text-primary' : isTransfer ? 'text-gray-500 dark:text-gray-400' : 'text-danger';

  const handleDelete = (e: React.MouseEvent) => { e.stopPropagation(); onDelete(transaction.id); };
  const handleEdit = (e: React.MouseEvent) => { e.stopPropagation(); onEdit(transaction); onClose(); };
  const handleSettle = (e: React.MouseEvent) => { e.stopPropagation(); if (onSettleLoan) { onSettleLoan(transaction); onClose(); } };

  const formatLKR = (amt: number) => amt.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 });

  // Correcting Loan Summary Logic: 
  // It only makes sense for EXPENSES that were initiated with a loan component (settledAmount > 0)
  const hasLoanSummary = transaction.type === TransactionType.EXPENSE && (transaction.settledAmount !== undefined && transaction.settledAmount > 0 || !transaction.isSettled);
  
  // Total Purchase Value is Cash Paid + Remaining Debt
  const totalPaid = transaction.amount;
  const remainingDue = transaction.settledAmount || 0;
  const totalPurchaseValue = transaction.originalAmount || (totalPaid + remainingDue);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 pointer-events-auto animate-fade-in" onClick={onClose} />

      <div className="bg-white dark:bg-surface w-full sm:w-[420px] rounded-t-3xl sm:rounded-3xl pointer-events-auto transform transition-transform duration-300 animate-slide-up relative flex flex-col max-h-[90vh]">
        
        <div className="shrink-0 p-6 pb-2 relative border-b border-gray-100 dark:border-gray-800">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 z-50 shadow-sm transition-colors">
              <X size={20} />
            </button>
            <div className="flex flex-col items-center mt-4 mb-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${isDownPayment ? 'bg-red-500/10 text-red-500' : isIncome ? 'bg-blue-500/10 text-blue-500' : isTransfer ? 'bg-gray-500/10 text-gray-500' : 'bg-red-500/10 text-red-500'}`}>
                 {isDownPayment ? <Coins size={28} /> : 
                  isInstallment ? <CalendarClock size={28} /> :
                  isLoanCategory ? <Banknote size={28} /> :
                  <Icon name={transaction.isSettlement ? 'ShieldCheck' : category?.icon || (isTransfer ? 'ArrowRightLeft' : 'HelpCircle')} size={28} />
                 }
              </div>
              <h3 className="text-xl font-bold dark:text-white mb-1">
                 {isDownPayment ? 'Down Payment' : isInstallment ? 'Loan Installment' : transaction.isSettlement ? 'Debt Repayment' : category?.name || (isTransfer ? 'Fund Transfer' : (isLoanCategory && isIncome ? 'Cash Loan' : transaction.type))}
              </h3>
              <span className={`text-2xl font-bold ${colorClass}`}>
                {isIncome ? '+' : isTransfer ? '' : '-'} {formatLKR(totalPaid)}
              </span>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            <div className="space-y-4 mb-4">
                <div className="bg-gray-50 dark:bg-background rounded-xl p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-surface rounded-lg text-gray-500"><Info size={18} /></div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Status</span>
                                <div className="flex items-center gap-2">
                                    {transaction.status === 'pending' ? (
                                        <span className="text-xs font-bold text-amber-500">PENDING</span>
                                    ) : (
                                        <span className="text-xs font-bold text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> VERIFIED</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {hasLoanSummary && !isDownPayment && (
                            <div className={`flex flex-col items-end px-2 py-1 rounded-lg ${transaction.isSettled ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'}`}>
                                <div className="flex items-center gap-1 font-bold text-[9px] uppercase">
                                    <ShieldCheck size={12} />
                                    <span>{transaction.isSettled ? 'Fully Settled' : 'Has Outstanding'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-background rounded-xl">
                 <div className="p-2 bg-white dark:bg-surface rounded-lg text-gray-500"><Calendar size={18} /></div>
                 <div className="flex flex-col">
                   <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Date</span>
                   <span className="text-sm font-medium dark:text-gray-200">{format(transaction.date, 'MMMM d, yyyy h:mm a')}</span>
                 </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-background rounded-xl">
                 <div className="p-2 bg-white dark:bg-surface rounded-lg text-gray-500"><CreditCard size={18} /></div>
                 <div className="flex flex-col">
                   <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Account</span>
                   <span className="text-sm font-medium dark:text-gray-200">{transaction.type === TransactionType.TRANSFER ? `${account?.name} → ${toAccount?.name}` : account?.name}</span>
                 </div>
                </div>

                {(isDownPayment || isInstallment) && relatedTransaction && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                        <div className="p-2 bg-white dark:bg-surface rounded-lg text-blue-500"><ShieldAlert size={18} /></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-blue-500 uppercase font-bold tracking-tight">Related Facility</span>
                            <span className="text-sm font-bold dark:text-white">{relatedTransaction.note}</span>
                        </div>
                    </div>
                )}

                {hasLoanSummary && !isDownPayment && !isInstallment && (
                    <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-5">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Banknote size={14} /> LOAN SUMMARY
                        </h4>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-2">
                                <span className="text-xs text-gray-500">Total Purchase Value</span>
                                <span className="text-sm font-bold dark:text-white">{formatLKR(totalPurchaseValue)}</span>
                            </div>
                            <div className="flex justify-between items-center px-2">
                                <span className="text-xs text-gray-500">Total Cash Paid</span>
                                <span className="text-sm font-bold text-success">{formatLKR(totalPaid)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl border bg-surface/50 border-amber-500/30 shadow-inner">
                                <span className="text-xs font-bold text-amber-500 uppercase">REMAINING DUE</span>
                                <span className="text-base font-bold text-amber-500">{formatLKR(remainingDue)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        <div className="shrink-0 p-6 border-t border-gray-100 dark:border-gray-800">
            <div className="grid grid-cols-2 gap-4">
               {hasLoanSummary && !transaction.isSettled && (
                     <button onClick={handleSettle} className="col-span-2 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 active:scale-[0.98] transition-all">
                        <Banknote size={18} />
                        <span>Pay Installment</span>
                    </button>
               )}
               <button onClick={handleEdit} className="flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><Edit2 size={18} /><span>Edit</span></button>
               <button onClick={handleDelete} className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500/20 transition-colors"><Trash2 size={18} /><span>Delete</span></button>
            </div>
        </div>
      </div>
    </div>
  );
};
