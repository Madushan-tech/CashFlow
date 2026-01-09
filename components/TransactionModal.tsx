
import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Calculator as CalculatorIcon, ChevronDown, Check, Calendar, Clock, AlertTriangle, X, LayoutGrid } from 'lucide-react';
import { TransactionType, Category, Account, Transaction, AccountType } from '../types';
import { format, isFuture } from 'date-fns';
import { Calculator } from './Calculator';
import { CustomDatePicker } from './CustomDatePicker';
import { Icon } from './Icon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (t: Omit<Transaction, 'id'> & { transferFee?: number }) => void;
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  initialData?: Transaction;
  isSettlement?: boolean;
  settlementDueAmount?: number;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, onClose, onSave, categories, accounts, transactions, initialData, isSettlement = false, settlementDueAmount = 0
}) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string | undefined>(undefined);
  const [relatedTransactionId, setRelatedTransactionId] = useState<string | undefined>(undefined);
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  
  // Transfer Fee State
  const [transferFeeStr, setTransferFeeStr] = useState('');

  const [proceedAsSettlement, setProceedAsSettlement] = useState(false);
  const [paidFromBalanceStr, setPaidFromBalanceStr] = useState('0');
  
  const [balanceWarning, setBalanceWarning] = useState<{ msg: string, balance: number } | null>(null);
  const [futureWarning, setFutureWarning] = useState<string | null>(null);
  
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setType(initialData.type);
            setAmountStr(initialData.amount.toString());
            setCategoryId(initialData.categoryId);
            setSubCategory(initialData.subCategory);
            setRelatedTransactionId(initialData.relatedTransactionId);
            setAccountId(initialData.accountId);
            setToAccountId(initialData.toAccountId || '');
            setNote(initialData.note || '');
            setDate(initialData.date);
            setTransferFeeStr('');
        } else {
            setAmountStr('');
            setType(TransactionType.EXPENSE);
            setNote('');
            setDate(new Date());
            setSubCategory(undefined);
            setRelatedTransactionId(undefined);
            setCategoryId('');
            setTransferFeeStr('');
            const valid = accounts.find(a => a.type !== AccountType.FIXED_DEPOSIT);
            if(valid) setAccountId(valid.id);
        }
        setError(null);
        setBalanceWarning(null);
        setFutureWarning(null);
        setProceedAsSettlement(false);
        setPaidFromBalanceStr('0');
        setIsCategoryPickerOpen(false);
    }
  }, [isOpen, initialData, accounts]); 

  const getAccountBalance = (accId: string) => {
      const account = accounts.find(a => a.id === accId);
      if (!account) return 0;
      let balance = account.balance;
      transactions.forEach(t => {
          if (initialData && t.id === initialData.id) return;
          if (t.status === 'pending') return; 
          
          if (t.accountId === accId) {
              if (t.type === TransactionType.INCOME) balance += t.amount;
              if (t.type === TransactionType.EXPENSE) balance -= t.amount;
              if (t.type === TransactionType.TRANSFER) balance -= t.amount;
          }
          if (t.toAccountId === accId && t.type === TransactionType.TRANSFER) balance += t.amount;
      });
      return balance;
  };

  useEffect(() => {
      if (!isOpen) return;
      const isFutureDate = isFuture(date);
      if (isFutureDate) setFutureWarning("Scheduled for future processing");
      else setFutureWarning(null);

      // FIX: Disable balance warnings and settlement option for future transactions
      if (!isFutureDate && (type === TransactionType.EXPENSE || type === TransactionType.TRANSFER) && amountStr && accountId) {
          const amount = parseFloat(amountStr);
          const fee = parseFloat(transferFeeStr) || 0;
          const totalDeduction = amount + fee;

          if (!isNaN(amount) && amount > 0) {
              const balance = getAccountBalance(accountId);
              if (totalDeduction > balance) {
                  setBalanceWarning({ msg: "Insufficient funds in selected account", balance });
                  if (!proceedAsSettlement) {
                      setPaidFromBalanceStr(Math.max(0, balance).toString());
                  }
              } else {
                  setBalanceWarning(null);
                  setProceedAsSettlement(false);
              }
          } else setBalanceWarning(null);
      } else {
          setBalanceWarning(null);
          setProceedAsSettlement(false);
      }
  }, [amountStr, transferFeeStr, accountId, date, type, isOpen, proceedAsSettlement]);

  const formatNumber = (numStr: string) => {
    if (!numStr) return '';
    const clean = numStr.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleSave = () => {
    const amount = parseFloat(amountStr);
    const fee = parseFloat(transferFeeStr) || 0;
    const paidFromBalance = parseFloat(paidFromBalanceStr) || 0;
    
    if (!amountStr || isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount.");
        return;
    }
    
    if (isSettlement && amount > (settlementDueAmount || 0)) {
        setError(`Amount exceeds due amount of LKR ${settlementDueAmount?.toLocaleString()}`);
        return;
    }
    
    if (type !== TransactionType.TRANSFER && !categoryId && !isSettlement) {
        setError("Please select a category.");
        return;
    }

    if (type === TransactionType.TRANSFER && !toAccountId) {
        setError("Please select a recipient account.");
        return;
    }

    const isFutureTransaction = isFuture(date);
    const status = isFutureTransaction ? 'pending' : 'verified';

    if ((type === TransactionType.EXPENSE || type === TransactionType.TRANSFER) && !isFutureTransaction && !proceedAsSettlement) {
        const currentBalance = getAccountBalance(accountId);
        if ((amount + fee) > currentBalance) { 
             setError("Insufficient funds (Amount + Fee exceeds balance).");
             return;
        }
    }

    const transactionData: any = {
      amount: proceedAsSettlement ? paidFromBalance : amount,
      type,
      categoryId: type === TransactionType.TRANSFER ? '' : categoryId,
      subCategory: type === TransactionType.TRANSFER ? undefined : subCategory,
      accountId,
      date,
      note,
      description: 'Transaction',
      status: status,
      originalAmount: amount,
      settlementDue: proceedAsSettlement ? (amount - paidFromBalance) : 0,
      relatedTransactionId,
      transferFee: fee > 0 ? fee : undefined
    };

    if (type === TransactionType.TRANSFER) transactionData.toAccountId = toAccountId;
    onSave(transactionData);
    onClose();
  };

  // Logic to show categories
  const displayedCategories = categories.filter(c => {
      if (c.id === '0') return false;
      if (c.id === 'loan_category') {
          return type === TransactionType.EXPENSE || type === TransactionType.INCOME;
      }
      return c.type === type;
  });

  const selectedCategoryData = categories.find(c => c.id === categoryId);
  const availableAccounts = accounts.filter(a => type === TransactionType.EXPENSE ? a.type !== AccountType.FIXED_DEPOSIT : true);
  
  const activeLoans = transactions.filter(t => t.isLoanParent && !t.isSettled);

  const labelClass = "text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2 block";
  const sectionClass = "bg-white dark:bg-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm";

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-background flex flex-col h-full w-full animate-fade-in">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-surface border-b border-gray-100 dark:border-gray-800 dark:text-white shrink-0">
            <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <ArrowLeft />
            </button>
            <h2 className="text-xl font-bold">
                {isSettlement ? 'Settle Loan' : initialData ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <div className="w-8"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col gap-4 no-scrollbar">
             {!isSettlement && (
                 <div className="grid grid-cols-3 bg-gray-200 dark:bg-gray-800/50 rounded-xl p-1 shrink-0">
                    {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER].map(t => (
                        <button key={t} onClick={() => { setType(t); setError(null); setSubCategory(undefined); setCategoryId(''); }}
                            className={`py-3 text-sm font-bold rounded-lg transition-all ${type === t ? (t === TransactionType.INCOME ? 'text-primary bg-white dark:bg-surface shadow-sm' : t === TransactionType.EXPENSE ? 'text-danger bg-white dark:bg-surface shadow-sm' : 'text-gray-800 dark:text-white bg-white dark:bg-surface shadow-sm') : 'text-gray-500'}`}>
                            {t}
                        </button>
                    ))}
                 </div>
             )}

             {error && (
                 <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-danger text-sm font-bold shrink-0 animate-shake">
                     <AlertCircle size={20} />{error}
                 </div>
             )}

             {balanceWarning && !isFuture(date) && (
                 <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex flex-col gap-2 text-yellow-600 dark:text-yellow-500 text-sm font-bold shrink-0">
                     <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="mt-0.5" />
                        <span>{balanceWarning.msg}</span>
                     </div>
                     <span className="pl-8 text-[10px] font-bold uppercase opacity-80 tracking-widest">Available Balance: LKR {balanceWarning.balance.toLocaleString()}</span>
                 </div>
             )}

             {futureWarning && (
                 <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3 text-primary text-sm font-bold shrink-0">
                     <Clock size={20} />{futureWarning}
                 </div>
             )}

             <button onClick={() => setIsDatePickerOpen(true)} className={sectionClass + " flex items-center justify-between active:scale-[0.98] transition-transform"}>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500">
                        <Calendar size={20} />
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-gray-500">Date & Time</span>
                        <span className="text-sm font-bold dark:text-white">{format(date, 'MMM d, yyyy h:mm a')}</span>
                    </div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <ChevronDown size={16} className="text-gray-400" />
                </div>
             </button>

             <div className={sectionClass}>
                <label className={labelClass}>Amount</label>
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400">LKR</span>
                    <input type="text" inputMode="decimal" value={formatNumber(amountStr)} onChange={(e) => { setError(null); setAmountStr(e.target.value.replace(/,/g, '')); }} placeholder="0" className={`bg-transparent text-3xl font-bold outline-none w-full ${type === TransactionType.INCOME ? 'text-primary' : 'text-danger'}`} />
                    <button onClick={() => setIsCalculatorOpen(true)} className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-500 active:bg-gray-200"><CalculatorIcon size={24} /></button>
                </div>
             </div>

             {(type === TransactionType.TRANSFER || type === TransactionType.EXPENSE) && !isSettlement && (
                 <div className={sectionClass}>
                    <label className={labelClass}>{type === TransactionType.TRANSFER ? 'Transfer Fee (Optional)' : 'Transaction Fee (Optional)'}</label>
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">LKR</span>
                        <input type="text" inputMode="decimal" value={formatNumber(transferFeeStr)} onChange={(e) => setTransferFeeStr(e.target.value.replace(/,/g, ''))} placeholder="0" className="bg-transparent text-xl font-bold dark:text-white outline-none w-full" />
                    </div>
                    <div className="mt-2 text-[10px] text-gray-400 font-medium">Fee will be deducted from the source account.</div>
                 </div>
             )}

             {balanceWarning && !isFuture(date) && (
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
                                    <input type="text" inputMode="decimal" value={formatNumber(paidFromBalanceStr)} onChange={(e) => setPaidFromBalanceStr(e.target.value.replace(/,/g, ''))} className="bg-transparent text-lg font-bold dark:text-white outline-none w-full" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Remaining Due</span>
                                <span className="text-lg font-bold text-primary">LKR {(parseFloat(amountStr) - (parseFloat(paidFromBalanceStr) || 0)).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                 </div>
             )}

             {type !== TransactionType.TRANSFER && !isSettlement && (
                <div className={sectionClass}>
                    <button onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                selectedCategoryData 
                                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                                : 'bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 text-gray-400'
                            }`}>
                                {selectedCategoryData ? (
                                    <Icon name={selectedCategoryData.icon} size={20} />
                                ) : (
                                    <LayoutGrid size={20} />
                                )}
                            </div>
                            <div className="flex flex-col items-start">
                                {selectedCategoryData ? (
                                    <>
                                        <span className="text-sm font-bold dark:text-white">{selectedCategoryData.name}</span>
                                        {subCategory && <span className="text-xs text-gray-500 font-medium">{subCategory}</span>}
                                    </>
                                ) : (
                                    <span className="text-gray-500 font-bold text-sm">Select Category</span>
                                )}
                            </div>
                        </div>
                        <ChevronDown className={`text-gray-400 transition-transform ${isCategoryPickerOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCategoryPickerOpen && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 h-64 flex animate-fade-in">
                            <div className="w-1/2 border-r border-gray-100 dark:border-gray-800 overflow-y-auto pr-2 no-scrollbar">
                                {displayedCategories.map(c => (
                                    <button key={c.id} onClick={() => { setCategoryId(c.id); setSubCategory(undefined); setRelatedTransactionId(undefined); }} className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left mb-1 transition-colors ${categoryId === c.id ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                        <Icon name={c.icon} size={18} /><span className="text-xs font-bold truncate">{c.name}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="w-1/2 pl-3 overflow-y-auto no-scrollbar">
                                {categoryId === 'loan_category' && type === TransactionType.EXPENSE ? (
                                    activeLoans.length > 0 ? (
                                        activeLoans.map(loan => (
                                            <button key={loan.id} onClick={() => { setSubCategory('Loan Repayment'); setRelatedTransactionId(loan.id); setIsCategoryPickerOpen(false); }} className={`w-full text-left p-2.5 rounded-xl text-xs font-bold mb-1 transition-colors ${relatedTransactionId === loan.id ? 'bg-primary/20 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{loan.note}</span>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${loan.loanType === 'ASSET' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>{loan.loanType || 'LOAN'}</span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <div className="p-4 text-[10px] text-gray-400 text-center">No active loan facilities found to repay.</div>
                                    )
                                ) : (
                                    selectedCategoryData?.subCategories?.map(sub => (
                                        <button key={sub} onClick={() => { setSubCategory(sub); setIsCategoryPickerOpen(false); }} className={`w-full text-left p-2.5 rounded-xl text-xs font-bold mb-1 transition-colors ${subCategory === sub ? 'bg-primary/20 text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                            <span>{sub}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
             )}

             <div className={sectionClass}>
                 <label className={labelClass}>{type === TransactionType.TRANSFER ? 'From Account' : 'Account'}</label>
                 <div className="flex flex-wrap gap-2 justify-end">
                     {availableAccounts.map(a => (
                         <button key={a.id} onClick={() => setAccountId(a.id)} className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${accountId === a.id ? 'bg-primary border-primary text-white shadow-lg shadow-blue-500/20' : 'bg-transparent border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                             {a.name}
                         </button>
                     ))}
                 </div>
                 {type === TransactionType.TRANSFER && (
                     <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <label className={labelClass}>To Account</label>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {accounts.filter(a => a.id !== accountId).map(a => (
                                <button key={a.id} onClick={() => setToAccountId(a.id)} className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${toAccountId === a.id ? 'bg-primary border-primary text-white shadow-lg shadow-blue-500/20' : 'bg-transparent border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                                    {a.name}
                                </button>
                            ))}
                        </div>
                     </div>
                 )}
             </div>

             <div className={sectionClass}>
                <label className={labelClass}>Note</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What was this for?" className="w-full bg-transparent dark:text-white font-bold text-sm outline-none placeholder-gray-400" />
             </div>
        </div>

        <div className="absolute bottom-6 left-4 right-4 z-20 flex gap-4 pointer-events-none">
             <button onClick={onClose} className="pointer-events-auto flex-1 py-3.5 rounded-2xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-surface border border-gray-100 dark:border-gray-800 shadow-2xl active:scale-[0.98] transition-all">Cancel</button>
             <button onClick={handleSave} className="pointer-events-auto flex-1 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/40 active:scale-[0.98] transition-all">
                {isSettlement ? 'Pay Now' : (proceedAsSettlement && !isFuture(date)) ? 'Initiate Loan' : isFuture(date) ? 'Schedule' : 'Save Record'}
             </button>
        </div>
    </div>
    <Calculator isOpen={isCalculatorOpen} onClose={() => setIsCalculatorOpen(false)} initialValue={amountStr || '0'} onResult={(val) => setAmountStr(val)} />
    <CustomDatePicker isOpen={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)} value={date} onChange={setDate} />
    </>
  );
};
