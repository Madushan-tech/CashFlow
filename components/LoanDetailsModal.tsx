
import React, { useMemo } from 'react';
import { X, CalendarDays, CheckCircle2, Coins, Banknote, Calendar } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { format } from 'date-fns';

interface LoanDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Transaction | null;
  allTransactions: Transaction[];
  onDelete?: (id: string) => void;
}

export const LoanDetailsModal: React.FC<LoanDetailsModalProps> = ({ isOpen, onClose, loan, allTransactions, onDelete }) => {
  if (!isOpen || !loan) return null;

  const getLoanStats = (parent: Transaction) => {
    const parts = allTransactions.filter(t => t.relatedTransactionId === parent.id);
    const downPaymentTx = parts.find(t => t.subCategory === 'Down Payment');
    
    // Total Facility (DP + Installments)
    const totalFacility = parent.amount;

    // Repayable Amount (Installments * Fee)
    const repayableTotal = (parent.totalInstallments || 0) * (parent.installmentFee || 0);
    
    // Repaid calculation: Sum of Verified Installments ONLY (excluding DP)
    const repaid = parts
        .filter(t => t.status === 'verified' && t.type === TransactionType.EXPENSE && t.subCategory !== 'Down Payment')
        .reduce((acc, t) => acc + t.amount, 0);
        
    const remaining = Math.max(0, repayableTotal - repaid);
    const progress = repayableTotal > 0 ? (repaid / repayableTotal) * 100 : 0;
    
    const nextInstallment = parts
        .filter(t => t.status === 'pending' && t.type === TransactionType.EXPENSE)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
    
    // Get list of completed repayments for the details view
    const repaymentList = parts
        .filter(t => t.status === 'verified' && t.type === TransactionType.EXPENSE && t.subCategory !== 'Down Payment')
        .sort((a, b) => b.date.getTime() - a.date.getTime());
        
    return { totalFacility, repayableTotal, repaid, remaining, progress, downPaymentTx, nextInstallment, repaymentList };
  };

  const { totalFacility, repayableTotal, repaid, remaining, progress, downPaymentTx, nextInstallment, repaymentList } = getLoanStats(loan);
  const formatLKR = (amount: number) => amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 });

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm animate-fade-in flex flex-col h-full w-full">
        <div className="bg-white dark:bg-background flex-1 mt-12 rounded-t-[40px] shadow-2xl flex flex-col overflow-hidden animate-slide-up relative">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Facility Details</span>
                    <h2 className="text-xl font-bold dark:text-white leading-tight">{loan.note}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <Calendar size={12} className="text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400">Created on {format(loan.date, 'MMM d, yyyy')}</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full dark:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">Total Facility</span>
                            <span className="text-lg font-black text-blue-600 dark:text-blue-400">{formatLKR(totalFacility)}</span>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/20">
                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider block mb-1">Total Repaid</span>
                            <span className="text-lg font-black text-green-600 dark:text-green-400">{formatLKR(repaid)}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-surface p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex justify-between items-end mb-3">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Repayment Progress</span>
                            <span className="text-2xl font-black text-primary">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-4 mb-3 overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all duration-700 ease-out relative" style={{ width: `${progress}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                            <span>Remaining Balance</span>
                            <span className="text-primary">{formatLKR(remaining)}</span>
                        </div>
                    </div>

                    {nextInstallment ? (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/20 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600">
                                    <CalendarDays size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-amber-600/70 uppercase tracking-wider">Next Installment</span>
                                    <span className="text-sm font-bold text-amber-700 dark:text-amber-500">Due {format(nextInstallment.date, 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-amber-200/30 pt-3">
                                <span className="text-xs font-bold text-amber-600/60 uppercase">Amount Due</span>
                                <span className="text-xl font-black text-amber-600 dark:text-amber-500">{formatLKR(nextInstallment.amount)}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-green-50 dark:bg-green-900/10 p-5 rounded-3xl border border-green-100 dark:border-green-900/20 flex items-center gap-4">
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600"><CheckCircle2 size={24} /></div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-green-700 dark:text-green-500">All Caught Up!</span>
                                <span className="text-xs text-green-600/70 font-medium">No pending installments found.</span>
                            </div>
                        </div>
                    )}

                    {downPaymentTx && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500"><Coins size={20} /></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Down Payment</span>
                                    <span className="text-xs font-bold dark:text-gray-300">{format(downPaymentTx.date, 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                            <span className="font-bold text-gray-600 dark:text-gray-200">{formatLKR(downPaymentTx.amount)}</span>
                        </div>
                    )}
                    
                    {repaymentList.length > 0 && (
                        <div className="mt-2 pb-10">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Repayment History</h3>
                            <div className="flex flex-col gap-2">
                                {repaymentList.map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center bg-gray-50 dark:bg-surface p-3 rounded-xl border border-gray-100 dark:border-gray-800/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            <span className="text-xs font-bold dark:text-gray-300">{format(tx.date, 'MMM d, yyyy')}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{formatLKR(tx.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {repaymentList.length === 0 && !downPaymentTx && (
                        <div className="text-center py-10 text-gray-400 text-xs">
                             No repayments made yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
