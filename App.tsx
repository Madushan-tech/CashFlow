
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, ViewState, Transaction, Account, TransactionType, AccountType, Category } from './types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, OPENING_BALANCE_CATEGORY } from './constants';
import { loadState, saveState, clearState } from './services/storage';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Stats } from './pages/Stats';
import { EditCategories } from './pages/EditCategories';
import { Settings } from './pages/Settings';
import { TransactionStats } from './pages/TransactionStats';
import { AccountDetails } from './pages/AccountDetails';
import { Accounts } from './pages/Accounts';
import { FutureTransactionsDetails } from './components/FutureTransactionsDetails';
import { TransactionModal } from './components/TransactionModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { RealizationModal } from './components/RealizationModal';
import { LoanDetailsModal } from './components/LoanDetailsModal';
import { SplashScreen } from './components/SplashScreen';
import { Onboarding } from './components/Onboarding';
import { ConfirmModal } from './components/ConfirmModal';
import { PinModal } from './components/PinModal';
import { isFuture, addMonths, startOfDay, isBefore } from 'date-fns';
import { sendNotification } from './services/notifications';

const INITIAL_STATE: AppState = {
  transactions: [],
  categories: INITIAL_CATEGORIES,
  accounts: INITIAL_ACCOUNTS,
  theme: 'dark',
  currentView: 'HOME',
  hasOnboarded: false,
  notificationsEnabled: false,
};

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  const [pendingRealizationQueue, setPendingRealizationQueue] = useState<Transaction[]>([]);
  const [currentRealizationTransaction, setCurrentRealizationTransaction] = useState<Transaction | null>(null);

  const [settlingLoanId, setSettlingLoanId] = useState<string | null>(null);
  const [settlementDueAmount, setSettlementDueAmount] = useState<number>(0);

  const [pinVerifyMode, setPinVerifyMode] = useState<{ isOpen: boolean, action: 'DELETE' | 'EDIT', transactionId: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [viewingLoanParent, setViewingLoanParent] = useState<Transaction | null>(null); // For Loan Details Modal
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [futureViewType, setFutureViewType] = useState<TransactionType>(TransactionType.INCOME);

  useEffect(() => {
    const loaded = loadState(INITIAL_STATE);
    if (!loaded.categories.find(c => c.id === '0')) loaded.categories = [OPENING_BALANCE_CATEGORY, ...loaded.categories];
    if (!loaded.categories.find(c => c.id === 'loan_category')) {
        const loanCat = INITIAL_CATEGORIES.find(c => c.id === 'loan_category');
        if(loanCat) loaded.categories = [...loaded.categories, loanCat];
    }
    loaded.transactions = loaded.transactions.map(t => ({ ...t, status: t.status || 'verified' }));
    setState(loaded);
    if (loaded.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    if (loaded.securityPin) setIsLocked(true);
  }, []);

  useEffect(() => { 
    if (state.hasOnboarded) {
      saveState(state); 
    }
  }, [state]);

  // Check for notifications and pending realization
  useEffect(() => {
     if (state.transactions.length > 0 && !isLocked && !showSplash) {
         const now = new Date();
         const pending = state.transactions.filter(t => t.status === 'pending' && t.date <= now);
         
         // 1. Process Queue Logic
         if (pending.length > 0) {
             const toAdd = pending.filter(p => !pendingRealizationQueue.find(q => q.id === p.id) && currentRealizationTransaction?.id !== p.id);
             if (toAdd.length > 0) {
                toAdd.sort((a, b) => a.date.getTime() - b.date.getTime());
                setPendingRealizationQueue(prevQueue => {
                    if (prevQueue.length === 0 && !currentRealizationTransaction) {
                       setCurrentRealizationTransaction(toAdd[0]);
                       return toAdd.slice(1);
                    }
                    return [...prevQueue, ...toAdd];
                });
             }
         }

         // 2. Notification Logic
         const checkNotifications = async () => {
              if (!state.notificationsEnabled) return;
              
              const lastCheck = state.lastNotificationDate || 0;
              const lastDate = new Date(lastCheck);
              const today = new Date();
              
              const isSameDay = lastDate.getDate() === today.getDate() && 
                                lastDate.getMonth() === today.getMonth() && 
                                lastDate.getFullYear() === today.getFullYear();

              if (isSameDay) return;

              if (pending.length > 0) {
                  const count = pending.length;
                  const title = "Action Required";
                  const body = `You have ${count} scheduled transaction${count > 1 ? 's' : ''} pending realization.`;
                  
                  await sendNotification(title, body);
                  
                  setState(prev => {
                      const newState = { ...prev, lastNotificationDate: Date.now() };
                      saveState(newState);
                      return newState;
                  });
              }
         };
         
         if (state.hasOnboarded) {
             checkNotifications();
         }
     }
  }, [state.transactions, isLocked, showSplash, currentRealizationTransaction, pendingRealizationQueue, state.notificationsEnabled, state.lastNotificationDate, state.hasOnboarded]);

  const getAccountBalance = useCallback((accId: string) => {
      const account = state.accounts.find(a => a.id === accId);
      if (!account) return 0;
      let balance = account.balance;
      
      const onboardingTx = state.transactions.find(t => t.accountId === accId && t.categoryId === '0');
      const onboardingDate = onboardingTx?.date || new Date(0);

      state.transactions.forEach(t => {
          if (t.status === 'pending') return;
          // IMPORTANT: Loan facility parents are virtual setups and do not affect balance.
          // Only their components (DP, Installments, or Cash Income) affect the balance.
          if (t.isLoanParent) return;
          
          // IMPORTANT: Ignore any verified transaction that happened BEFORE the opening balance was set.
          if (t.date < onboardingDate) return; 

          if (t.accountId === accId) {
              if (t.type === TransactionType.INCOME) balance += t.amount;
              if (t.type === TransactionType.EXPENSE) balance -= t.amount;
              if (t.type === TransactionType.TRANSFER) balance -= t.amount;
          }
          if (t.toAccountId === accId && t.type === TransactionType.TRANSFER) balance += t.amount;
      });
      return account.type === AccountType.CASH ? Math.max(0, balance) : balance;
  }, [state.accounts, state.transactions]);

  const handleSaveTransaction = (t: Omit<Transaction, 'id'> & { settlementDue?: number, transferFee?: number }) => {
    const { settlementDue, transferFee, ...transactionData } = t;
    
    if (settlingLoanId) {
        setState(prev => {
            const updatedTransactions = prev.transactions.map(tr => {
                if (tr.id === settlingLoanId) {
                    const currentDue = (tr.settledAmount || 0);
                    const newDue = Math.max(0, currentDue - transactionData.amount);
                    return {
                        ...tr,
                        settledAmount: newDue,
                        isSettled: newDue <= 0
                    };
                }
                return tr;
            });
            
            const newRepayment: Transaction = {
                ...transactionData as any,
                id: Date.now().toString(),
                relatedTransactionId: settlingLoanId,
                isSettlement: true
            };

            return { ...prev, transactions: [newRepayment, ...updatedTransactions] };
        });
        
        setSettlingLoanId(null);
        setSettlementDueAmount(0);
        setIsModalOpen(false);
        return;
    }

    if (editingTransaction) {
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map(tr => tr.id === editingTransaction.id ? { ...transactionData, id: editingTransaction.id } : tr)
      }));
      setEditingTransaction(null);
    } 
    else {
      const newId = Date.now().toString();
      const newTransactions: Transaction[] = [];

      // Main Transaction
      const newTransaction: Transaction = { 
        ...transactionData, 
        id: newId,
        isSettled: settlementDue && settlementDue > 0 ? false : true,
        settledAmount: settlementDue || 0 
      };
      newTransactions.push(newTransaction);

      // Transfer Fee Logic
      if ((transactionData.type === TransactionType.TRANSFER || transactionData.type === TransactionType.EXPENSE) && transferFee && transferFee > 0) {
          const feeTransaction: Transaction = {
              id: `fee-${newId}`,
              amount: transferFee,
              type: TransactionType.EXPENSE,
              accountId: transactionData.accountId,
              categoryId: '', // Uncategorized or we could define a specific one
              date: transactionData.date,
              note: `Fee: ${transactionData.note || (transactionData.type === TransactionType.TRANSFER ? 'Fund Transfer' : 'Expense')}`,
              description: 'Bank Charge',
              status: transactionData.status,
              isSettled: true
          };
          newTransactions.push(feeTransaction);
      }
      
      setState(prev => ({ ...prev, transactions: [...newTransactions, ...prev.transactions] }));
    }
    setIsModalOpen(false);
  };

  const handleAddLoan = (loanData: Omit<Transaction, 'id'>, existingId?: string) => {
    setState(prev => {
        let currentTransactions = prev.transactions;
        let parentId = Date.now().toString();

        // If editing, remove the old facility and all its children first
        if (existingId) {
            parentId = existingId; // Preserve original ID if editing
            currentTransactions = currentTransactions.filter(t => t.id !== existingId && t.relatedTransactionId !== existingId);
        }

        const newParts: Transaction[] = [];
        const now = new Date();
        
        // We used rescheduledFrom to pass the First Installment Date from the modal
        const firstInstallmentDate = loanData.rescheduledFrom || addMonths(loanData.date, 1);

        // 1. The Facility Record (isLoanParent=true)
        const parent: Transaction = {
            ...loanData,
            id: parentId,
            isLoanParent: true,
            status: 'verified',
            rescheduledFrom: firstInstallmentDate // Keep this so we can edit the date later if needed
        };
        newParts.push(parent);

        // 2. Cash Loan Income (If Applicable)
        if (loanData.loanType === 'CASH') {
            newParts.push({
                id: `income-${parentId}`,
                amount: loanData.amount, 
                type: TransactionType.INCOME,
                categoryId: loanData.categoryId,
                accountId: loanData.accountId,
                date: loanData.date,
                note: `Loan Received: ${loanData.note}`,
                description: `Principal amount for ${loanData.note}`,
                status: 'verified',
                relatedTransactionId: parentId,
                isSettled: true // Mark as settled so it doesn't appear as a loan-owed item
            });
        }

        // 3. Downpayment - ACTS AS A STANDARD EXPENSE on SETUP DATE
        if (loanData.downPayment && loanData.downPayment > 0) {
            newParts.push({
                id: `dp-${parentId}`,
                amount: loanData.downPayment,
                type: TransactionType.EXPENSE,
                categoryId: loanData.categoryId,
                subCategory: 'Down Payment', // Mark specifically
                accountId: loanData.accountId,
                date: loanData.date, // Expense occurs on setup date
                note: `Downpayment: ${loanData.note}`,
                description: `Setup cost for ${loanData.note}`,
                status: 'verified',
                relatedTransactionId: parentId,
                isSettled: true // Mark as settled (paid) expense, so it doesn't trigger "Has Outstanding"
            });
        }

        // 4. Installments - SCHEDULED EXPENSES
        if (loanData.totalInstallments && loanData.totalInstallments > 0) {
            for (let i = 0; i < loanData.totalInstallments; i++) {
                // Calculate date based on First Installment Date
                const instDate = addMonths(firstInstallmentDate, i);
                const isPast = isBefore(instDate, now);
                const num = i + 1;
                
                newParts.push({
                    id: `inst-${num}-${parentId}`,
                    amount: loanData.installmentFee || 0,
                    type: TransactionType.EXPENSE,
                    categoryId: loanData.categoryId,
                    subCategory: 'Installment', // Explicitly label for Stats
                    accountId: loanData.accountId,
                    date: instDate,
                    note: `Installment ${num}/${loanData.totalInstallments}: ${loanData.note}`,
                    description: `Monthly repayment for ${loanData.note}`,
                    status: isPast ? 'verified' : 'pending',
                    relatedTransactionId: parentId,
                    isSettlement: true
                });
            }
        }
        
        return { ...prev, transactions: [...newParts, ...currentTransactions] };
    });
  };

  const handleRealizeConfirm = (id: string, actualAmount: number, actualDate: Date, loanDeficit?: number) => {
    setState(prev => {
      const tx = prev.transactions.find(t => t.id === id);
      if (!tx) return prev;
      
      const isActuallyFuture = isFuture(actualDate);
      const updatedTx: Transaction = {
        ...tx,
        amount: actualAmount,
        originalAmount: loanDeficit ? (actualAmount + loanDeficit) : actualAmount,
        settledAmount: loanDeficit || 0,
        isSettled: !loanDeficit,
        date: actualDate,
        status: isActuallyFuture ? 'pending' : 'verified' as const,
      };
      return { ...prev, transactions: prev.transactions.map(t => t.id === id ? updatedTx : t) };
    });
    
    setPendingRealizationQueue(prev => {
        const next = prev[0] || null;
        setCurrentRealizationTransaction(next);
        return prev.slice(1);
    });
  };

  const handleSkipRealization = () => {
    setPendingRealizationQueue(prev => {
        const next = prev[0] || null;
        setCurrentRealizationTransaction(next);
        return prev.slice(1);
    });
  };

  const handleRescheduleTransaction = (id: string, newDate: Date) => {
      setState(prev => ({
          ...prev,
          transactions: prev.transactions.map(t => t.id === id ? { ...t, date: newDate, status: 'pending' } : t)
      }));
      
      // Move to next in queue
      setPendingRealizationQueue(prev => {
        const next = prev[0] || null;
        setCurrentRealizationTransaction(next);
        return prev.slice(1);
    });
  };

  const handleInitiateDelete = (id: string) => { setDeleteConfirmation({ isOpen: true, id }); };
  const handleConfirmDelete = () => {
    if (deleteConfirmation.id) {
        setState(prev => {
            const isParent = prev.transactions.find(t => t.id === deleteConfirmation.id)?.isLoanParent;
            if (isParent) {
                // Delete parent and all related parts
                return { ...prev, transactions: prev.transactions.filter(t => t.id !== deleteConfirmation.id && t.relatedTransactionId !== deleteConfirmation.id) };
            }
            return { ...prev, transactions: prev.transactions.filter(t => t.id !== deleteConfirmation.id) };
        });
        if (selectedTransaction?.id === deleteConfirmation.id) setIsDetailsOpen(false);
    }
    setDeleteConfirmation({ isOpen: false, id: null });
  };

  const handleEditClick = (t: Transaction) => { setEditingTransaction(t); setIsModalOpen(true); };
  const handleAddClick = () => { setEditingTransaction(null); setSettlingLoanId(null); setIsModalOpen(true); };
  
  // Updated view handler to intercept Loan Component clicks
  const handleViewTransaction = (t: Transaction) => { 
      // If it's a loan component (Installment, DP, Cash Loan Body), open the Facility Modal
      if (t.categoryId === 'loan_category' && t.relatedTransactionId) {
          const parent = state.transactions.find(p => p.id === t.relatedTransactionId);
          if (parent) {
              setViewingLoanParent(parent);
              return;
          }
      }
      setSelectedTransaction(t); 
      setIsDetailsOpen(true); 
  };
  
  const handleViewStats = (t: Transaction) => { setSelectedTransaction(t); setState(prev => ({ ...prev, currentView: 'TRANSACTION_STATS' })); };
  const handleViewAccount = (account: Account) => { setSelectedAccount(account); setState(prev => ({ ...prev, currentView: 'ACCOUNT_DETAILS' })); };
  const handleViewAccountsList = () => { setState(prev => ({ ...prev, currentView: 'ACCOUNTS' })); };
  const handleViewFuture = (type: TransactionType) => { setFutureViewType(type); setState(prev => ({ ...prev, currentView: 'FUTURE_TRANSACTIONS' })); };
  const handleProcessTransaction = (t: Transaction) => { setCurrentRealizationTransaction(t); setIsDetailsOpen(false); };
  
  const handleClearData = () => {
    clearState();
    // Soft reset state instead of window.location.reload()
    setState(INITIAL_STATE);
    setIsModalOpen(false);
    setIsDetailsOpen(false);
    setViewingLoanParent(null);
    setShowSplash(true);
    setIsLocked(false);
    setPendingRealizationQueue([]);
    setCurrentRealizationTransaction(null);
    setSettlingLoanId(null);
    setSettlementDueAmount(0);
    setPinVerifyMode(null);
    setDeleteConfirmation({ isOpen: false, id: null });
    setEditingTransaction(null);
    setSelectedTransaction(null);
    setSelectedAccount(null);
    setFutureViewType(TransactionType.INCOME);
    
    // Reset theme to default (dark)
    document.documentElement.classList.add('dark');
  };

  const handleSettleLoan = (tx: Transaction) => {
      const due = tx.settledAmount || 0;
      if (due <= 0) return;
      
      // Fix: Default to installment fee if available, otherwise full debt
      const defaultAmount = tx.installmentFee && tx.installmentFee > 0 ? tx.installmentFee : due;

      setSettlingLoanId(tx.id);
      setSettlementDueAmount(due);
      setEditingTransaction({
          id: '', 
          amount: defaultAmount, // Default to 1 installment amount, not full debt
          type: TransactionType.EXPENSE, 
          categoryId: tx.categoryId, 
          accountId: tx.accountId, 
          date: new Date(), 
          note: `Settlement: ${tx.note || 'Expense'}`,
          description: 'Repayment', 
          status: 'verified', 
          isSettlement: true
      });
      setIsModalOpen(true);
  };

  if (showSplash) return <SplashScreen onFinish={() => setShowSplash(false)} />;
  if (isLocked) return <PinModal isOpen={true} mode="UNLOCK" existingPin={state.securityPin} onSuccess={() => setIsLocked(false)} />;
  if (!state.hasOnboarded) return <Onboarding accounts={state.accounts} onComplete={(accs) => {
      const opening = accs.filter(a => a.balance > 0).map(a => ({
          id: `init-${a.id}`, amount: a.balance, type: TransactionType.INCOME, categoryId: '0', 
          accountId: a.id, date: new Date(), note: 'Opening Balance', status: 'verified' as const
      }));
      setState(prev => {
          const newState = { ...prev, accounts: accs.map(a => ({...a, balance: 0})), transactions: [...opening, ...prev.transactions], hasOnboarded: true };
          saveState(newState); 
          return newState;
      });
  }} />;

  const renderView = () => {
    switch (state.currentView) {
      case 'HOME': return <Home transactions={state.transactions} categories={state.categories} accounts={state.accounts} onDeleteTransaction={handleInitiateDelete} onEditTransaction={handleEditClick} onViewTransaction={handleViewTransaction} onViewStats={handleViewStats} onSettleLoan={handleSettleLoan} onViewAccounts={handleViewAccountsList} onProcessTransaction={handleProcessTransaction} />;
      case 'STATS': return <Stats transactions={state.transactions} categories={state.categories} accounts={state.accounts} onViewTrend={(catId, type) => { setSelectedTransaction({ id: '', amount: 0, type, categoryId: catId, accountId: '', date: new Date() }); setState(p => ({ ...p, currentView: 'TRANSACTION_STATS' })); }} onViewAccount={handleViewAccount} onViewFuture={handleViewFuture} />;
      case 'EDIT': return <EditCategories categories={state.categories} transactions={state.transactions} accounts={state.accounts} onAddCategory={(c) => setState(p => ({ ...p, categories: [...p.categories, { ...c, id: Date.now().toString() }] }))} onUpdateCategory={(c) => setState(p => ({ ...p, categories: p.categories.map(cat => cat.id === c.id ? c : cat) }))} onDeleteCategory={(id) => setState(p => ({ ...p, categories: p.categories.filter(c => c.id !== id) }))} onAddLoan={(loan, id) => { 
          // Updated to pass ID correctly for edits
          handleAddLoan(loan, id); 
      }} onDeleteTransaction={handleInitiateDelete} />;
      case 'SETTINGS': return <Settings 
          theme={state.theme} 
          onToggleTheme={() => { const next = state.theme === 'dark' ? 'light' : 'dark'; document.documentElement.classList.toggle('dark'); setState(p => ({ ...p, theme: next as any })); }} 
          onClearData={handleClearData} 
          securityPin={state.securityPin} 
          onSetPin={(pin) => setState(p => ({ ...p, securityPin: pin }))} 
          transactions={state.transactions} 
          accounts={state.accounts} 
          categories={state.categories}
          notificationsEnabled={state.notificationsEnabled}
          onToggleNotifications={(enabled) => setState(p => ({ ...p, notificationsEnabled: enabled }))}
      />;
      case 'TRANSACTION_STATS': return <TransactionStats transaction={selectedTransaction} allTransactions={state.transactions} categories={state.categories} onBack={() => setState(p => ({ ...p, currentView: 'STATS' }))} />;
      case 'ACCOUNT_DETAILS': return <AccountDetails account={selectedAccount} transactions={state.transactions} categories={state.categories} onBack={() => setState(p => ({ ...p, currentView: 'ACCOUNTS' }))} onDeleteTransaction={handleInitiateDelete} onEditTransaction={handleEditClick} onViewTransaction={handleViewTransaction} onViewStats={handleViewStats} />;
      case 'ACCOUNTS': return <Accounts accounts={state.accounts} transactions={state.transactions} categories={state.categories} onBack={() => setState(p => ({ ...p, currentView: 'HOME' }))} onViewAccount={handleViewAccount} />;
      case 'FUTURE_TRANSACTIONS': return <FutureTransactionsDetails type={futureViewType} transactions={state.transactions} categories={state.categories} onBack={() => setState(p => ({ ...p, currentView: 'STATS' }))} onDeleteTransaction={handleInitiateDelete} onEditTransaction={handleEditClick} onViewTransaction={handleViewTransaction} onViewStats={handleViewStats} />;
      default: return <Home transactions={state.transactions} categories={state.categories} accounts={state.accounts} onDeleteTransaction={handleInitiateDelete} onEditTransaction={handleEditClick} onViewTransaction={handleViewTransaction} onViewStats={handleViewStats} onSettleLoan={handleSettleLoan} onViewAccounts={handleViewAccountsList} onProcessTransaction={handleProcessTransaction} />;
    }
  };

  // Determine correct category name for Realization Modal
  const getRealizationCategoryName = () => {
      if (!currentRealizationTransaction) return undefined;
      if (currentRealizationTransaction.categoryId === 'loan_category' && currentRealizationTransaction.subCategory === 'Installment') {
          return "Loan Installment";
      }
      return state.categories.find(c => c.id === currentRealizationTransaction.categoryId)?.name;
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 dark:bg-background text-slate-900 dark:text-text overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar relative">{renderView()}</div>
      
      {state.currentView !== 'TRANSACTION_STATS' && state.currentView !== 'ACCOUNT_DETAILS' && state.currentView !== 'ACCOUNTS' && state.currentView !== 'FUTURE_TRANSACTIONS' && (
        <BottomNav currentView={state.currentView} onChangeView={(view) => setState(p => ({ ...p, currentView: view }))} onAddClick={handleAddClick} />
      )}

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTransaction} 
        categories={state.categories} 
        accounts={state.accounts} 
        transactions={state.transactions} 
        initialData={editingTransaction || undefined} 
        isSettlement={!!settlingLoanId} 
        settlementDueAmount={settlementDueAmount} 
      />
      
      <TransactionDetailsModal 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        transaction={selectedTransaction} 
        category={state.categories.find(c => c.id === selectedTransaction?.categoryId)} 
        account={state.accounts.find(a => a.id === selectedTransaction?.accountId)} 
        toAccount={state.accounts.find(a => a.id === selectedTransaction?.toAccountId)} 
        relatedTransaction={state.transactions.find(t => t.id === selectedTransaction?.relatedTransactionId)} 
        onEdit={handleEditClick} 
        onDelete={handleInitiateDelete} 
        onSettleLoan={handleSettleLoan} 
        onViewRelated={(t) => handleViewTransaction(t)} 
        allTransactions={state.transactions} 
        onProcess={handleProcessTransaction} 
      />
      
      <LoanDetailsModal 
        isOpen={!!viewingLoanParent}
        onClose={() => setViewingLoanParent(null)}
        loan={viewingLoanParent}
        allTransactions={state.transactions}
      />
      
      <RealizationModal 
        transaction={currentRealizationTransaction} 
        accountName={state.accounts.find(a => a.id === currentRealizationTransaction?.accountId)?.name} 
        categoryName={getRealizationCategoryName()} 
        accountBalance={currentRealizationTransaction ? getAccountBalance(currentRealizationTransaction.accountId) : 0} 
        onConfirm={handleRealizeConfirm} 
        onSkip={handleSkipRealization}
        onReschedule={(date) => currentRealizationTransaction && handleRescheduleTransaction(currentRealizationTransaction.id, date)} 
      />
      
      <ConfirmModal 
        isOpen={deleteConfirmation.isOpen} 
        title="Delete Transaction" 
        message="Are you sure you want to delete this record?" 
        onConfirm={handleConfirmDelete} 
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })} 
      />
      
      <PinModal 
        isOpen={!!pinVerifyMode} 
        mode="VERIFY" 
        existingPin={state.securityPin} 
        onSuccess={() => { 
            if (pinVerifyMode?.action === 'DELETE') handleConfirmDelete(); 
            else handleEditClick(state.transactions.find(t => t.id === pinVerifyMode?.transactionId)!); 
            setPinVerifyMode(null); 
        }} 
        onClose={() => setPinVerifyMode(null)} 
      />
    </div>
  );
};
