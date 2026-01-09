
import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { format, isFuture } from 'date-fns';
import { ArrowRight, Check, X, TrendingUp, TrendingDown, AlertTriangle, CalendarClock, Wallet, Layers } from 'lucide-react';
import { CustomDatePicker } from './CustomDatePicker';

interface RealizationModalProps {
  transaction: Transaction | null;
  categoryName?: string;
  accountName?: string;
  accountBalance?: number;
  onConfirm: (id: string, actualAmount: number, actualDate: Date, loanDeficit?: number) => void;
  onSkip: () => void;
  onReschedule?: (date: Date) => void;
}

export const RealizationModal: React.FC<RealizationModalProps> = ({ 
  transaction, 
  categoryName,
  accountName,
  accountBalance = 0,
  onConfirm, 
  onSkip,
  onReschedule
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [actualDate, setActualDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [proceedAsSettlement, setProceedAsSettlement] = useState(false);
  const [paidFromBalanceStr, setPaidFromBalanceStr] = useState('0');
  
  // Track if date picker is for the confirmation date or for rescheduling
  const [datePickerMode, setDatePickerMode] = useState<'CONFIRM' | 'RESCHEDULE'>('CONFIRM');

  useEffect(() => {
    if (transaction) {
      setAmountStr(transaction.amount.toString());
      setActualDate(transaction.date);
      setProceedAsSettlement(false);
      setPaidFromBalanceStr(Math.max(0, accountBalance).toString());
    }
  }, [transaction, accountBalance]);

  if (!transaction) return null;

  const actualAmount = parseFloat(amountStr) || 0;
  const isExpense = transaction.type === TransactionType.EXPENSE || transaction.type === TransactionType.TRANSFER;
  const hasInsufficientFunds = isExpense && actualAmount > accountBalance;
  const isRescheduling = isFuture(actualDate);

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
        setAmountStr(clean);
    }
  };

  const handlePaidFromBalanceChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
        setPaidFromBalanceStr(clean);
    }
  };

  const formatLKR = (num: number) => num.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' });

  const handleConfirmClick = () => {
      const paid = parseFloat(paidFromBalanceStr) || 0;
      if (proceedAsSettlement) {
          onConfirm(transaction.id, paid, actualDate, actualAmount - paid);
      } else {
          onConfirm(transaction.id, actualAmount, actualDate, undefined);
      }
  };

  const handleDecideLater = () => {
      // Open date picker in reschedule mode
      setActualDate(new Date()); // Reset to today before opening to allow easy time selection from now
      setDatePickerMode('RESCHEDULE');
      setIsDatePickerOpen(true);
  };

  const handleDateConfirm = (date: Date) => {
      if (datePickerMode === 'RESCHEDULE') {
          if (onReschedule) {
              onReschedule(date);
          } else {
              onSkip();
          }
      } else {
          setActualDate(date);
      }
      setIsDatePickerOpen(false);
  };

  const formatNumber = (numStr: string) => {
    if (!numStr) return '';
    const clean = numStr.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="bg-white dark:bg-surface w-full max-w-sm rounded-3xl shadow-2xl animate-scale-up border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Fixed Header */}
        <div className="shrink-0 p-6 pb-2 relative">
            <button onClick={onSkip} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10">
                <X size={20} />
            </button>
            <div className="flex flex-col items-center mt-2">
                <div className="bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3">
                    Action Required
                </div>
                <h3 className="text-xl font-bold dark:text-white text-center mb-1">
                    {isRescheduling ? 'Reschedule Transaction' : 'Verify Transaction'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-4">
                   {isRescheduling ? 'Move this transaction to a future date.' : 'Confirm the final amount and date.'}
                </p>
            </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-background p-3 rounded-xl mb-2 border border-gray-100 dark:border-gray-800">
                 <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-white dark:bg-surface rounded-lg text-primary">
                         <Wallet size={16} />
                     </div>
                     <div className="flex flex-col">
                         <span className="text-[10px] uppercase font-bold text-gray-400">Account</span>
                         <span className="text-xs font-bold dark:text-white">{accountName}</span>
                     </div>
                 </div>
                 <div className="flex flex-col items-end">
                     <span className="text-[10px] uppercase font-bold text-gray-400">Available</span>
                     <span className={`text-xs font-bold ${hasInsufficientFunds ? 'text-danger' : 'text-success'}`}>
                         {formatLKR(accountBalance)}
                     </span>
                 </div>
            </div>

            <div className="bg-gray-50 dark:bg-background p-3 rounded-xl mb-6 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                     <div className={`p-1.5 rounded-lg ${transaction.type === TransactionType.INCOME ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                         <Layers size={16} />
                     </div>
                     <div className="flex flex-col">
                         <span className="text-[10px] uppercase font-bold text-gray-400">Transaction</span>
                         <span className="text-xs font-bold dark:text-white">{categoryName || 'Unknown Category'}</span>
                     </div>
                 </div>
            </div>

            {hasInsufficientFunds && !isRescheduling && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex flex-col gap-1 text-danger text-[11px] font-bold mb-4 animate-shake">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={14} />
                        <span>Insufficient funds to complete full payment.</span>
                    </div>
                </div>
            )}

            <div className="space-y-4 mb-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Actual Total Amount</label>
                    <div className="flex items-center gap-2 border-b-2 border-gray-200 dark:border-gray-700 focus-within:border-primary transition-colors pb-1">
                        <span className="text-xl font-bold text-gray-400">LKR</span>
                        <input 
                            type="text" 
                            inputMode="decimal"
                            value={formatNumber(amountStr)}
                            onChange={(e) => handleAmountChange(e.target.value.replace(/,/g, ''))}
                            className="bg-transparent text-2xl font-bold dark:text-white outline-none w-full"
                        />
                    </div>
                </div>

                {hasInsufficientFunds && !isRescheduling && (
                     <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 animate-slide-up">
                        <label className="flex items-center gap-3 cursor-pointer mb-3">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${proceedAsSettlement ? 'bg-primary border-primary' : 'border-gray-300 bg-white'}`}>
                                {proceedAsSettlement && <Check size={18} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={proceedAsSettlement} onChange={(e) => setProceedAsSettlement(e.target.checked)} />
                            <span className="text-sm font-bold dark:text-white">Proceed as a settlement</span>
                        </label>

                        {proceedAsSettlement && (
                            <div className="flex flex-col gap-4 pl-9 border-l-2 border-primary/20 animate-fade-in">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Pay from current balance</label>
                                    <div className="flex items-center gap-2 bg-white dark:bg-surface border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                                        <span className="text-sm font-bold text-gray-400">LKR</span>
                                        <input type="text" inputMode="decimal" value={formatNumber(paidFromBalanceStr)} onChange={(e) => handlePaidFromBalanceChange(e.target.value.replace(/,/g, ''))} className="bg-transparent text-lg font-bold dark:text-white outline-none w-full" />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Remaining Due</span>
                                    <span className="text-lg font-bold text-primary">LKR {(actualAmount - (parseFloat(paidFromBalanceStr) || 0)).toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                     </div>
                )}

                <div 
                    className={`flex items-center gap-2 text-xs font-medium cursor-pointer p-3 rounded-xl transition-colors border ${isRescheduling ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-background border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    onClick={() => { setDatePickerMode('CONFIRM'); setIsDatePickerOpen(true); }}
                >
                    <CalendarClock size={16} className="text-primary" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-tight">Post Date</span>
                        <span className="dark:text-white">{format(actualDate, 'MMM d, yyyy h:mm a')}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 p-6 pt-2">
            <div className="space-y-3">
                 <button 
                    onClick={handleConfirmClick}
                    disabled={hasInsufficientFunds && !proceedAsSettlement && !isRescheduling}
                    className={`w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl transition-all ${
                        (hasInsufficientFunds && !proceedAsSettlement && !isRescheduling)
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-primary text-white shadow-blue-500/20 active:scale-[0.98]'
                    }`}
                 >
                    <Check size={20} />
                    <span>{isRescheduling ? 'Reschedule Now' : 'Verify & Post'}</span>
                 </button>
                 <button 
                    onClick={handleDecideLater}
                    className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all"
                 >
                    Decide Later
                 </button>
            </div>
        </div>
      </div>

      <CustomDatePicker 
        isOpen={isDatePickerOpen}
        value={actualDate}
        onChange={handleDateConfirm}
        onClose={() => setIsDatePickerOpen(false)}
        initialView={datePickerMode === 'RESCHEDULE' ? 'TIME' : 'DATE'}
      />
    </div>
  );
};
