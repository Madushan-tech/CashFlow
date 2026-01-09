
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Info, Clock } from 'lucide-react';
import { Account, Transaction, TransactionType } from '../types';
import { format, addMonths } from 'date-fns';
import { CustomDatePicker } from './CustomDatePicker';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onSave: (loan: Omit<Transaction, 'id'>) => void;
  initialData?: Transaction | null;
}

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, onClose, accounts, onSave, initialData }) => {
  const [loanType, setLoanType] = useState<'CASH' | 'ASSET'>('CASH');
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date()); // Setup Date
  const [startDate, setStartDate] = useState(addMonths(new Date(), 1)); // First Installment Date
  const [downPayment, setDownPayment] = useState('');
  const [installments, setInstallments] = useState('');
  const [installmentFee, setInstallmentFee] = useState('');
  const [totalLoanAmount, setTotalLoanAmount] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [note, setNote] = useState('');
  
  const [activeDatePicker, setActiveDatePicker] = useState<'SETUP' | 'START' | null>(null);

  // Load initial data for editing
  useEffect(() => {
    if (isOpen && initialData) {
        setLoanType(initialData.loanType || 'CASH');
        setName(initialData.note || '');
        setDate(initialData.date);
        // Load the repayment start date if available, otherwise default to +1 month from setup
        setStartDate(initialData.rescheduledFrom ? new Date(initialData.rescheduledFrom) : addMonths(initialData.date, 1)); 
        setTotalLoanAmount(initialData.amount.toString());
        setInstallments(initialData.totalInstallments?.toString() || '');
        setInstallmentFee(initialData.installmentFee?.toString() || '');
        setDownPayment(initialData.downPayment?.toString() || '');
        setAccountId(initialData.accountId);
        setNote(initialData.description || '');
    } else if (isOpen) {
        // Reset defaults
        setLoanType('CASH');
        setName('');
        setDate(new Date());
        setStartDate(addMonths(new Date(), 1));
        setDownPayment('');
        setInstallments('');
        setInstallmentFee('');
        setTotalLoanAmount('');
        setNote('');
    }
  }, [isOpen, initialData]);

  // Auto-clear DP if switching to CASH
  useEffect(() => {
    if (loanType === 'CASH') setDownPayment('');
  }, [loanType]);

  const formatWithCommas = (val: string) => {
    if (!val) return '';
    const clean = val.replace(/,/g, '');
    if (isNaN(Number(clean))) return val;
    const parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleInput = (setter: (v: string) => void) => (val: string) => {
    const clean = val.replace(/,/g, '');
    if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
      setter(clean);
    }
  };

  // Update Total when Components Change
  // Formula: Total = Down Payment + (Installments * Fee)
  useEffect(() => {
    const inst = parseFloat(installments) || 0;
    const fee = parseFloat(installmentFee) || 0;
    const dp = parseFloat(downPayment) || 0;
    
    if (inst >= 0 && fee >= 0) {
        const total = dp + (inst * fee);
        setTotalLoanAmount(total > 0 ? total.toString() : '');
    }
  }, [installments, installmentFee, downPayment]);

  const handleSave = () => {
    if (!name.trim() || !totalLoanAmount || parseFloat(totalLoanAmount) <= 0) return;

    const totalAmount = parseFloat(totalLoanAmount);
    const dp = loanType === 'ASSET' ? (parseFloat(downPayment) || 0) : 0;
    
    // Repayment Amount (Debt) is Total - Down Payment (because DP is paid upfront)
    const repaymentAmount = totalAmount - dp;

    onSave({
      amount: totalAmount,
      type: TransactionType.EXPENSE,
      categoryId: 'loan_category',
      accountId,
      date: date,
      rescheduledFrom: startDate, 
      note: name,
      description: note || `${loanType} Loan Facility`,
      status: 'verified',
      isLoan: true,
      isLoanParent: true,
      loanType,
      totalInstallments: parseInt(installments) || 0,
      remainingInstallments: parseInt(installments) || 0,
      installmentFee: parseFloat(installmentFee) || 0,
      downPayment: dp,
      isSettled: false,
      settledAmount: repaymentAmount // Only the installments part is considered "Debt"
    });
    
    onClose();
  };

  if (!isOpen) return null;

  const sectionClass = "bg-white dark:bg-surface rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm mb-4";
  const labelClass = "text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block";
  const inputClass = "bg-transparent text-lg font-medium dark:text-white outline-none w-full placeholder-gray-300 dark:placeholder-gray-600";

  return (
    <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-background flex flex-col h-full w-full animate-fade-in">
        <div className="flex items-center justify-between p-4 bg-white dark:bg-surface border-b border-gray-100 dark:border-gray-800 shrink-0">
            <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors dark:text-white">
                <ArrowLeft />
            </button>
            <h2 className="text-xl font-bold dark:text-white">{initialData ? 'Edit Facility' : 'Setup Loan'}</h2>
            <div className="w-8"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-28 flex flex-col no-scrollbar">
            <div className="grid grid-cols-2 bg-gray-200 dark:bg-gray-800/50 rounded-xl p-1 mb-6 shrink-0">
                <button onClick={() => setLoanType('CASH')} className={`py-2.5 text-xs font-bold rounded-lg transition-all ${loanType === 'CASH' ? 'bg-white dark:bg-surface text-primary shadow-sm' : 'text-gray-500'}`}>CASH LOAN</button>
                <button onClick={() => setLoanType('ASSET')} className={`py-2.5 text-xs font-bold rounded-lg transition-all ${loanType === 'ASSET' ? 'bg-white dark:bg-surface text-primary shadow-sm' : 'text-gray-500'}`}>ASSET LOAN</button>
            </div>

            <div className={sectionClass}>
                <label className={labelClass}>Facility Name</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                    className="w-full bg-transparent text-lg font-bold dark:text-white outline-none placeholder-gray-400"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setActiveDatePicker('SETUP')} className={sectionClass + " flex flex-col items-start gap-1 text-left"}>
                    <label className={labelClass}>Setup Date</label>
                    <div className="flex items-center gap-2 text-sm font-bold dark:text-white">
                        <Calendar size={16} className="text-gray-400" />
                        {format(date, 'MMM d, yyyy')}
                    </div>
                </button>
                <button onClick={() => setActiveDatePicker('START')} className={sectionClass + " flex flex-col items-start gap-1 text-left"}>
                    <label className={labelClass}>Repayment Date</label>
                    <div className="flex items-center gap-2 text-sm font-bold dark:text-white">
                        <Clock size={16} className="text-primary" />
                        {format(startDate, 'MMM d, yyyy')}
                    </div>
                </button>
            </div>

            {/* Installments & Fee */}
            <div className={sectionClass}>
                <div className="grid grid-cols-2 gap-0 items-center">
                    <div className="flex flex-col pr-4 border-r border-gray-100 dark:border-gray-800">
                        <label className={labelClass}>Installments</label>
                        <input 
                            type="text" 
                            inputMode="numeric"
                            value={installments}
                            onChange={(e) => handleInput(setInstallments)(e.target.value)}
                            placeholder="Months"
                            className={inputClass}
                        />
                    </div>
                    <div className="flex flex-col pl-4">
                        <label className={labelClass}>Monthly Fee</label>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-400">LKR</span>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={formatWithCommas(installmentFee)}
                                onChange={(e) => handleInput(setInstallmentFee)(e.target.value)}
                                placeholder="0"
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Down Payment & Total */}
            <div className={sectionClass}>
                <div className="grid grid-cols-2 gap-0 items-center">
                    <div className={`flex flex-col pr-4 border-r border-gray-100 dark:border-gray-800 ${loanType === 'CASH' ? 'opacity-30 pointer-events-none' : ''}`}>
                        <label className={labelClass}>Down Payment</label>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-400">LKR</span>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={formatWithCommas(downPayment)}
                                onChange={(e) => handleInput(setDownPayment)(e.target.value)}
                                placeholder="0"
                                disabled={loanType === 'CASH'}
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col pl-4">
                        <label className={labelClass}>Total Facility</label>
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-400">LKR</span>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={formatWithCommas(totalLoanAmount)}
                                readOnly
                                placeholder="0"
                                className="bg-transparent text-lg font-bold text-primary outline-none w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className={sectionClass}>
                <label className={labelClass}>Source Account</label>
                <div className="flex flex-wrap gap-2">
                    {accounts.map(acc => (
                        <button key={acc.id} onClick={() => setAccountId(acc.id)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition-all ${accountId === acc.id ? 'bg-primary border-primary text-white shadow-md' : 'border-gray-100 dark:border-gray-800 text-gray-400'}`}>
                            {acc.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className={sectionClass}>
                <label className={labelClass}>Description</label>
                <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Details about this facility..."
                    className="w-full bg-transparent text-sm font-medium dark:text-white outline-none resize-none h-20 placeholder-gray-400"
                />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl flex gap-3 border border-blue-100 dark:border-blue-900/30 mb-8">
                <Info size={20} className="text-primary shrink-0" />
                <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                    {loanType === 'ASSET' ? 'A Down Payment expense will be created.' : 'Principal amount will be added as Income.'} Installments will be scheduled starting from {format(startDate, 'MMM d')}.
                </p>
            </div>
        </div>

        <div className="absolute bottom-6 left-4 right-4 z-20 flex gap-4 pointer-events-none">
             <button onClick={onClose} className="pointer-events-auto flex-1 py-3.5 rounded-2xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-surface border border-gray-100 dark:border-gray-800 shadow-2xl active:scale-[0.98] transition-all">Cancel</button>
             <button onClick={handleSave} className="pointer-events-auto flex-1 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/40 active:scale-[0.98] transition-all">Save Loan</button>
        </div>

        <CustomDatePicker 
            isOpen={!!activeDatePicker}
            onClose={() => setActiveDatePicker(null)}
            value={activeDatePicker === 'SETUP' ? date : startDate}
            onChange={(d) => activeDatePicker === 'SETUP' ? setDate(d) : setStartDate(d)}
        />
    </div>
  );
};
