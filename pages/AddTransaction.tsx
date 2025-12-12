import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { TransactionType } from '../types';
import { ArrowLeft, X, Calculator, Check, ChevronRight, Delete, Calendar, AlertCircle, Wallet, AlertTriangle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { formatAmountInput } from '../utils';

const AddTransaction = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTransaction, editTransaction, categories, accounts, requestAuth } = useApp();
  
  // Edit Mode Data
  const existingTransaction = location.state?.transaction;

  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subCategory, setSubCategory] = useState<string | undefined>(undefined);
  
  const [accountId, setAccountId] = useState(''); 
  const [toAccountId, setToAccountId] = useState(''); 
  const [note, setNote] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString());
  
  // Modes: 'form' | 'category' | 'account_source' | 'account_dest'
  const [selectionMode, setSelectionMode] = useState<'form' | 'category' | 'account_source' | 'account_dest'>('form');

  // Calculator Modal State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');
  const [calcResult, setCalcResult] = useState<string | null>(null);
  
  // Error Modal State
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; title: string; message: string }>({ isOpen: false, title: '', message: '' });

  // Selection State for Categories
  const [activeSelectionGroupId, setActiveSelectionGroupId] = useState<string | null>(null);
  
  // Hidden date input ref
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Initialize Data (Edit Mode)
  useEffect(() => {
    if (existingTransaction) {
        setType(existingTransaction.type);
        setAmountStr(formatAmountInput(existingTransaction.amount.toString()));
        setCategoryId(existingTransaction.categoryId || '');
        setSubCategory(existingTransaction.subCategory);
        setAccountId(existingTransaction.accountId);
        setToAccountId(existingTransaction.toAccountId || '');
        setNote(existingTransaction.note || '');
        setDescription(existingTransaction.description || '');
        setDate(existingTransaction.date);
    }
  }, [existingTransaction]);

  // Check editable permission on load
  useEffect(() => {
      if (existingTransaction) {
          const txDate = new Date(existingTransaction.date);
          const diffTime = Math.abs(new Date().getTime() - txDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays > 3) {
              requestAuth(() => {
                  // Authorized
              });
          }
      }
  }, [existingTransaction, requestAuth]);

  // Check for Future Date
  const isFutureDate = useMemo(() => {
      return new Date(date) > new Date();
  }, [date]);

  // Available Accounts Logic
  const availableAccounts = useMemo(() => {
      if (type === TransactionType.TRANSFER) return accounts;
      // Filter out 'deposit' type accounts for Income/Expense
      return accounts.filter(a => a.type !== 'deposit');
  }, [accounts, type]);

  // Color Helpers
  const getThemeColor = () => {
      switch (type) {
          case TransactionType.INCOME: return 'text-blue-500';
          case TransactionType.EXPENSE: return 'text-red-500';
          case TransactionType.TRANSFER: return 'text-slate-500';
          default: return 'text-slate-900';
      }
  };
  
  const getBorderColor = () => {
      switch (type) {
          case TransactionType.INCOME: return 'border-blue-500';
          case TransactionType.EXPENSE: return 'border-red-500';
          case TransactionType.TRANSFER: return 'border-slate-500';
          default: return 'border-slate-700';
      }
  };

  const getButtonColor = () => {
      switch (type) {
          case TransactionType.INCOME: return 'bg-blue-500';
          case TransactionType.EXPENSE: return 'bg-red-500';
          case TransactionType.TRANSFER: return 'bg-slate-500';
          default: return 'bg-primary';
      }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatAmountInput(e.target.value);
      setAmountStr(formatted);
  };

  const handleDateClick = () => {
      requestAuth(() => {
          // Try standard picker first, then fallback to click which usually triggers native picker
          if (dateInputRef.current) {
              try {
                  dateInputRef.current.showPicker();
              } catch (e) {
                  dateInputRef.current.click();
              }
          }
      });
  };

  // Calculator Logic
  const handleCalcPress = (val: string) => {
     setCalcExpression(prev => prev + val);
  };
  
  const handleCalcBackspace = () => {
     setCalcExpression(prev => prev.slice(0, -1));
     setCalcResult(null);
  };

  const calculateResult = () => {
      try {
          if (/[^0-9+\-*/.]/.test(calcExpression)) return null;
          // eslint-disable-next-line no-eval
          const res = Function(`"use strict"; return (${calcExpression})`)();
          const resStr = String(parseFloat(res.toFixed(2)));
          setCalcResult(resStr);
          return resStr;
      } catch (e) {
          return null;
      }
  };

  const confirmCalculator = () => {
      const res = calculateResult();
      if (res) {
          setAmountStr(formatAmountInput(res));
          setShowCalculator(false);
          setCalcExpression('');
          setCalcResult(null);
      }
  };

  const handleSubmit = (action: 'save' | 'continue') => {
    // Parse the comma separated string
    let finalAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (!finalAmount || finalAmount <= 0) return;
    
    // Validation
    if (!accountId) {
        setErrorModal({ isOpen: true, title: 'Missing Account', message: 'Please select an account to continue.' });
        return;
    }
    if (type !== TransactionType.TRANSFER && !categoryId) {
        setErrorModal({ isOpen: true, title: 'Missing Category', message: 'Please select a category to continue.' });
        return;
    }

    // Future Date Check
    if (isFutureDate) {
        setErrorModal({ isOpen: true, title: 'Invalid Date', message: 'Future transactions are not allowed.' });
        return;
    }

    // Insufficient Balance Check
    // For Expenses and Transfers (Source Account)
    if (type === TransactionType.EXPENSE || type === TransactionType.TRANSFER) {
        const acc = accounts.find(a => a.id === accountId);
        if (acc) {
            let available = acc.balance;
            // If editing, logic would be complex. For safety, just checking against current available.
            // (Strictly speaking, if editing, we might add back the old amount, but let's keep it safe)
            if (existingTransaction && existingTransaction.accountId === accountId) {
                available += existingTransaction.amount;
            }

            if (available < finalAmount) {
                setErrorModal({ 
                    isOpen: true, 
                    title: 'Insufficient Balance', 
                    message: `You do not have enough funds in "${acc.name}".\nAvailable: ${available.toLocaleString()} LKR` 
                });
                return;
            }
        }
    }

    const transactionData = {
      amount: finalAmount,
      type,
      categoryId: type === TransactionType.TRANSFER ? undefined : categoryId,
      subCategory: type === TransactionType.TRANSFER ? undefined : subCategory,
      accountId,
      toAccountId: type === TransactionType.TRANSFER ? toAccountId : undefined,
      date: date,
      note: note,
      description: description
    };

    const performSave = () => {
        if (existingTransaction) {
            editTransaction(existingTransaction.id, transactionData);
            navigate(-1); 
        } else {
            addTransaction(transactionData);
            if (action === 'save') {
                navigate(-1);
            } else {
                setAmountStr('');
                setNote('');
                setDescription('');
                setDate(new Date().toISOString());
            }
        }
    };

    // Check if saving for a past date (older than 3 days) if creating new
    if (!existingTransaction) {
        const txDate = new Date(date);
        const diffTime = Math.abs(new Date().getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays > 3) {
            requestAuth(performSave);
        } else {
            performSave();
        }
    } else {
        performSave();
    }
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedAccount = accounts.find(a => a.id === accountId);
  const selectedToAccount = accounts.find(a => a.id === toAccountId);

  // ------------------ SELECTION RENDERERS ------------------
  const renderSelectionView = () => {
      // 1. Account Selection View (Flex Layout)
      if (selectionMode === 'account_source' || selectionMode === 'account_dest') {
        let list = [];
        if (selectionMode === 'account_source') {
             list = availableAccounts;
        } else {
             list = accounts;
        }

        return (
            <div className="flex flex-wrap justify-center gap-3 p-6">
                {list.map(acc => {
                    const isSelected = (selectionMode === 'account_source' ? accountId : toAccountId) === acc.id;
                    // Disable logic
                    let isDisabled = false;
                    // Prevent transferring to same account
                    if (selectionMode === 'account_dest' && accountId === acc.id) isDisabled = true;
                    // Prevent transferring from same account (if we supported going back)
                    if (selectionMode === 'account_source' && type === TransactionType.TRANSFER && toAccountId === acc.id) isDisabled = true;

                    return (
                        <button
                            key={acc.id}
                            disabled={isDisabled}
                            onClick={() => {
                                if (selectionMode === 'account_source') setAccountId(acc.id);
                                else setToAccountId(acc.id);
                                setSelectionMode('form');
                            }}
                            className={`
                                flex items-center justify-center p-2 rounded-xl border-2 transition-all w-[45%] h-14
                                ${isSelected 
                                    ? 'border-primary bg-primary/5 text-primary' 
                                    : isDisabled 
                                        ? 'border-transparent bg-slate-100 dark:bg-white/5 opacity-40' 
                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                                }
                            `}
                        >
                            <span className="font-bold text-sm text-center truncate px-1">{acc.name}</span>
                        </button>
                    );
                })}
            </div>
        );
      }

      // 2. Category Selection View (Existing)
      if (selectionMode === 'category') {
        const availableCategories = categories.filter(c => c.type === type);
        return (
            <div className="flex h-full w-full">
                {/* Left: Main Cats */}
                <div className="w-1/3 border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 overflow-y-auto no-scrollbar">
                    {availableCategories.map(cat => {
                         const Icon = (LucideIcons as any)[cat.icon] || LucideIcons.HelpCircle;
                         const isActive = activeSelectionGroupId === cat.id;
                         return (
                            <button
                                key={cat.id}
                                onClick={() => setActiveSelectionGroupId(cat.id)}
                                className={`flex flex-col items-center justify-center p-3 w-full gap-1 transition-colors ${isActive ? 'bg-white dark:bg-card-dark border-l-4' : 'text-slate-500'}`}
                                style={{ borderLeftColor: isActive ? cat.color : 'transparent' }}
                            >
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? '' : 'grayscale opacity-70'}`} style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                                    <Icon size={16} />
                                </div>
                                <span className={`text-[10px] font-bold text-center leading-tight truncate w-full ${isActive ? 'text-slate-900 dark:text-white' : ''}`}>{cat.name}</span>
                            </button>
                         )
                    })}
                </div>
                {/* Right: Subs */}
                <div className="w-2/3 bg-background-light dark:bg-background-dark overflow-y-auto no-scrollbar p-2">
                    {activeSelectionGroupId && (
                        <>
                             {/* Select Main Category explicitly */}
                             <button 
                                onClick={() => { setCategoryId(activeSelectionGroupId); setSubCategory(undefined); setSelectionMode('form'); }}
                                className={`flex items-center justify-between w-full p-2 mb-1 rounded-lg text-left ${categoryId === activeSelectionGroupId && !subCategory ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                            >
                                <span className={`font-semibold text-sm ${categoryId === activeSelectionGroupId && !subCategory ? getThemeColor() : 'text-slate-900 dark:text-white'}`}>
                                    Select {categories.find(c => c.id === activeSelectionGroupId)?.name}
                                </span>
                                {categoryId === activeSelectionGroupId && !subCategory && <Check size={14} className={getThemeColor()} />}
                            </button>

                            {/* Sub Categories */}
                            {categories.find(c => c.id === activeSelectionGroupId)?.subCategories?.map(sub => (
                                <button 
                                    key={sub}
                                    onClick={() => { setCategoryId(activeSelectionGroupId); setSubCategory(sub); setSelectionMode('form'); }}
                                    className={`flex items-center justify-between w-full p-2 rounded-lg text-left ${categoryId === activeSelectionGroupId && subCategory === sub ? 'bg-black/5 dark:bg-white/5' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                >
                                    <span className={`font-medium text-sm ${categoryId === activeSelectionGroupId && subCategory === sub ? getThemeColor() : 'text-slate-700 dark:text-white'}`}>
                                        {sub}
                                    </span>
                                    {categoryId === activeSelectionGroupId && subCategory === sub && <Check size={14} className={getThemeColor()} />}
                                </button>
                            ))}
                        </>
                    )}
                </div>
            </div>
        );
      }
      return null;
  };

  const getSelectionTitle = () => {
      switch(selectionMode) {
          case 'category': return 'Select Category';
          case 'account_source': return type === TransactionType.TRANSFER ? 'Select From Account' : 'Select Account';
          case 'account_dest': return 'Select To Account';
          default: return '';
      }
  };

  return (
    <div className="flex h-screen flex-col bg-background-light dark:bg-background-dark overflow-hidden relative">
      
      {/* Top Header */}
      <header className="flex items-center justify-between p-4 bg-background-light dark:bg-background-dark shrink-0">
          <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-white">
              <ArrowLeft size={24} />
          </button>
          <span className="text-lg font-bold text-slate-900 dark:text-white capitalize">{existingTransaction ? 'Edit Transaction' : type}</span>
          <div className="w-6"></div>
      </header>

      {/* Tabs */}
      {!existingTransaction && (
          <div className="px-4 pb-4 shrink-0">
            <div className="grid grid-cols-3 rounded-lg border border-slate-700 p-0.5 overflow-hidden">
                {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.TRANSFER].map(t => (
                    <button
                        key={t}
                        onClick={() => { setType(t); setSelectionMode('form'); }}
                        className={`py-2 text-sm font-medium transition-colors uppercase ${
                            type === t 
                            ? (t === TransactionType.INCOME ? 'bg-blue-500 text-white' : t === TransactionType.EXPENSE ? 'bg-red-500 text-white' : 'bg-slate-500 text-white') 
                            : 'bg-transparent text-slate-500 hover:text-slate-300'
                        }`}
                        style={{ borderBottom: type === t ? `2px solid transparent` : 'none' }}
                    >
                        {t}
                    </button>
                ))}
            </div>
          </div>
      )}

      {/* Main Form Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 no-scrollbar">
          <div className="flex flex-col gap-6 text-slate-900 dark:text-white">
              
              {/* Date */}
              <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-500">Date</label>
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <span className="text-base font-medium">
                          {new Date(date).toLocaleString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit', weekday: 'short', hour: 'numeric', minute: 'numeric' })}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                           {/* Hidden Date Input for Picker */}
                           <input 
                                type="datetime-local" 
                                ref={dateInputRef} 
                                value={new Date(date).toISOString().slice(0, 16)}
                                onChange={(e) => {
                                    if(e.target.value) {
                                        setDate(e.target.value);
                                    }
                                }}
                                className="absolute opacity-0 z-0" 
                           />
                           <button onClick={handleDateClick} className="p-1 hover:bg-white/10 rounded">
                                <Calendar size={18} />
                           </button>
                      </div>
                  </div>
                  {isFutureDate && (
                      <div className="flex items-center gap-2 text-red-500 text-xs mt-1 animate-in fade-in">
                          <AlertCircle size={12} />
                          <span>Future transactions are not allowed</span>
                      </div>
                  )}
              </div>

              {/* Amount Input */}
              <div className="flex flex-col gap-1">
                  <label className={`text-sm ${getThemeColor()}`}>Amount</label>
                  <div className={`flex items-center border-b pb-2 relative ${getBorderColor()}`}>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={amountStr}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className={`w-full bg-transparent outline-none text-3xl font-bold placeholder-slate-600 appearance-none ${getThemeColor()}`}
                      />
                      <button 
                        onClick={() => setShowCalculator(true)}
                        className={`absolute right-0 p-2 hover:text-white active:scale-95 transition-colors ${type === TransactionType.INCOME ? 'text-blue-300' : type === TransactionType.EXPENSE ? 'text-red-300' : 'text-slate-400'}`}
                      >
                          <Calculator size={24} />
                      </button>
                  </div>
              </div>

              {/* Category Selector */}
              {type !== TransactionType.TRANSFER && (
                  <div className="flex flex-col gap-1 cursor-pointer" onClick={() => { setSelectionMode('category'); setActiveSelectionGroupId(categoryId || null); }}>
                      <label className="text-sm text-slate-500">Category</label>
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                          <div className="flex flex-col">
                            <span className={`text-base font-medium ${!selectedCategory ? 'text-slate-500' : ''}`}>
                                {selectedCategory?.name || `Select ${type === TransactionType.INCOME ? 'Income' : 'Expense'}`}
                            </span>
                            {subCategory && <span className="text-xs text-slate-400">{subCategory}</span>}
                          </div>
                          <ChevronRight size={16} className="text-slate-500" />
                      </div>
                  </div>
              )}

              {/* Account Selector (Clickable Row) */}
              <div className="flex flex-col gap-1 cursor-pointer" onClick={() => setSelectionMode('account_source')}>
                  <label className="text-sm text-slate-500">{type === TransactionType.TRANSFER ? 'From Account' : 'Account'}</label>
                  <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                      <div className="flex flex-col">
                        <span className={`text-base font-medium ${!selectedAccount ? 'text-slate-500' : ''}`}>
                            {selectedAccount?.name || 'Select Account'}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-slate-500" />
                  </div>
              </div>

              {/* To Account Selector (Transfer only) */}
              {type === TransactionType.TRANSFER && (
                  <div className="flex flex-col gap-1 cursor-pointer" onClick={() => setSelectionMode('account_dest')}>
                      <label className="text-sm text-slate-500">To Account</label>
                      <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                           <div className="flex flex-col">
                            <span className={`text-base font-medium ${!selectedToAccount ? 'text-slate-500' : ''}`}>
                                {selectedToAccount?.name || 'Select Account'}
                            </span>
                          </div>
                          <ChevronRight size={16} className="text-slate-500" />
                      </div>
                  </div>
              )}

              {/* Note */}
              <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-500">Note</label>
                  <div className="border-b border-slate-700 pb-2">
                      <input 
                        type="text" 
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full bg-transparent outline-none text-base font-medium placeholder-slate-600"
                        placeholder="Add a note"
                      />
                  </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                  <label className="text-sm text-slate-500">Description</label>
                  <div className="border-b border-slate-700 pb-2">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-transparent outline-none text-sm font-normal placeholder-slate-600 resize-none h-20"
                        placeholder="Add details..."
                      />
                  </div>
              </div>
          </div>
      </div>

      {/* Action Buttons (Pinned Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-white/5 p-4 z-10">
          <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleSubmit('save')}
                className={`rounded-lg py-4 text-center text-sm font-bold text-white shadow-lg active:scale-[0.98] ${getButtonColor()}`}
              >
                  {existingTransaction ? 'Update' : 'Save'}
              </button>
              {!existingTransaction && (
                  <button 
                    onClick={() => handleSubmit('continue')}
                    className="rounded-lg border border-slate-600 py-4 text-center text-sm font-bold text-slate-900 dark:text-white active:scale-[0.98] active:bg-slate-200 dark:active:bg-white/10"
                  >
                      Continue
                  </button>
              )}
          </div>
      </div>

      {/* Selection Bottom Sheet */}
      {selectionMode !== 'form' && (
          <div className="absolute bottom-0 left-0 right-0 z-20 h-[50vh] bg-background-light dark:bg-background-dark shadow-[0_-5px_20px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-200 flex flex-col rounded-t-2xl border-t border-slate-200 dark:border-white/10">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-white/5">
                  <span className="text-xs font-bold uppercase text-slate-500">
                      {getSelectionTitle()}
                  </span>
                  <button onClick={() => setSelectionMode('form')}>
                      <X size={20} className="text-slate-500" />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                  {renderSelectionView()}
              </div>
          </div>
      )}

      {/* Calculator Modal */}
      {showCalculator && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="w-full max-w-md bg-white dark:bg-card-dark rounded-t-3xl shadow-2xl p-4">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-white/5 pb-2">
                      <span className="text-sm font-bold text-slate-500 uppercase">Calculator</span>
                      <button onClick={() => setShowCalculator(false)}><X size={24} className="text-slate-900 dark:text-white" /></button>
                  </div>
                  <div className="bg-slate-100 dark:bg-background-dark rounded-xl p-4 mb-4 text-right">
                       <div className="text-sm text-slate-500 h-6">{calcResult ? `= ${calcResult}` : ''}</div>
                       <div className="text-3xl font-bold text-slate-900 dark:text-white truncate">{calcExpression || '0'}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 h-64">
                       {['C', '/', '*', 'back'].map(k => (
                           <button 
                                key={k}
                                onClick={() => { 
                                    if(k === 'C') { setCalcExpression(''); setCalcResult(null); }
                                    else if(k === 'back') handleCalcBackspace();
                                    else handleCalcPress(k);
                                }}
                                className="flex items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-bold text-xl active:scale-95"
                           >
                               {k === 'back' ? <Delete size={20} /> : k}
                           </button>
                       ))}
                       {['7', '8', '9', '-'].map(k => (
                            <button key={k} onClick={() => handleCalcPress(k)} className={`flex items-center justify-center rounded-lg text-xl font-bold active:scale-95 ${['+','-'].includes(k) ? 'bg-slate-200 dark:bg-white/10 text-primary' : 'bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white'}`}>{k}</button>
                       ))}
                       {['4', '5', '6', '+'].map(k => (
                            <button key={k} onClick={() => handleCalcPress(k)} className={`flex items-center justify-center rounded-lg text-xl font-bold active:scale-95 ${['+','-'].includes(k) ? 'bg-slate-200 dark:bg-white/10 text-primary' : 'bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white'}`}>{k}</button>
                       ))}
                       <div className="col-span-4 grid grid-cols-4 gap-2">
                           {['1', '2', '3'].map(k => <button key={k} onClick={() => handleCalcPress(k)} className="flex items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-bold text-xl active:scale-95">{k}</button>)}
                           <button onClick={confirmCalculator} className="row-span-2 bg-primary text-white font-bold text-2xl rounded-lg flex items-center justify-center active:scale-95">=</button>
                           <button onClick={() => handleCalcPress('0')} className="col-span-2 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-bold text-xl active:scale-95">0</button>
                           <button onClick={() => handleCalcPress('.')} className="flex items-center justify-center rounded-lg bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white font-bold text-xl active:scale-95">.</button>
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* Error Modal */}
      {errorModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-2xl p-6 shadow-xl relative">
                  <div className="flex flex-col items-center gap-3 text-center">
                      <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{errorModal.title}</h3>
                      <p className="text-sm text-slate-500 whitespace-pre-wrap">{errorModal.message}</p>
                      
                      <button 
                        onClick={() => setErrorModal({ ...errorModal, isOpen: false })}
                        className="w-full mt-4 py-3 rounded-xl bg-slate-200 dark:bg-white/10 font-bold text-slate-900 dark:text-white active:scale-95"
                      >
                          Okay, I understand
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AddTransaction;