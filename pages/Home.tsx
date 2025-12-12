import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import { TransactionType, DaySummary, Transaction } from '../types';
import * as LucideIcons from 'lucide-react';
import { ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';

interface TransactionItemProps {
    transaction: Transaction;
    onDelete: (id: string) => void;
    isOpen: boolean;
    onToggle: (id: string | null) => void;
}

// Swipeable Transaction Item
const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, onDelete, isOpen, onToggle }) => {
    const { categories } = useApp();
    const navigate = useNavigate();
    const [startX, setStartX] = useState<number | null>(null);
    const [currentX, setCurrentX] = useState(0);
    const itemRef = useRef<HTMLDivElement>(null);

    // Sync state with prop
    useEffect(() => {
        if (!isOpen) {
            setCurrentX(0);
        } else {
            setCurrentX(-120);
        }
    }, [isOpen]);

    let category = categories.find(c => c.id === transaction.categoryId);
    // Handle Transfer
    if (transaction.type === TransactionType.TRANSFER && !category) {
        category = { 
            id: 'transfer', 
            name: 'Transfer', 
            type: TransactionType.TRANSFER, 
            icon: 'ArrowRightLeft', 
            color: '#64748b' 
        };
    }
    const IconComponent = (category && (LucideIcons as any)[category.icon]) || LucideIcons.HelpCircle;

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
        // If we touch another item, close the currently open one (if it's not this one)
        if (!isOpen) {
            onToggle(transaction.id); // Signal intention to interact
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (startX === null) return;
        const currentClientX = e.touches[0].clientX;
        const diff = currentClientX - startX;

        // Logic depending on whether we start from closed (0) or open (-120)
        let newX = 0;
        
        if (isOpen) {
            // We are open at -120. Moving right (diff > 0) closes it.
            // Moving left (diff < 0) does nothing (clamped).
            newX = -120 + diff;
            if (newX > 0) newX = 0; // Don't overscroll right
            if (newX < -140) newX = -140; // Slight resistance left
        } else {
            // We are closed at 0. Moving left (diff < 0) opens it.
            newX = diff;
            if (newX > 0) newX = 0; // Don't slide right
            if (newX < -140) newX = -140;
        }

        setCurrentX(newX);
    };

    const handleTouchEnd = () => {
        if (startX === null) return;
        
        // Snap logic
        if (isOpen) {
            // Was open. If we slid significantly right (e.g. > 40px), close it.
            if (currentX > -80) {
                 onToggle(null); // Close
            } else {
                 setCurrentX(-120); // Snap back open
            }
        } else {
            // Was closed. If we slid significantly left, open it.
            if (currentX < -60) {
                 onToggle(transaction.id); // Keep open (state will set -120)
            } else {
                 setCurrentX(0); // Snap back closed
                 onToggle(null); 
            }
        }
        setStartX(null);
    };

    // Helper to format currency nicely
    const formatAmount = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="relative overflow-hidden mb-3">
             {/* Background Actions */}
            <div className="absolute inset-y-0 right-0 flex w-[120px] items-center justify-end">
                <button 
                    onClick={() => navigate('/add', { state: { transaction } })}
                    className="flex h-full w-1/2 items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                >
                    <Pencil size={18} />
                </button>
                <button 
                    onClick={() => onDelete(transaction.id)}
                    className="flex h-full w-1/2 items-center justify-center bg-red-500 text-white rounded-r-lg"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Foreground Item */}
            <div 
                ref={itemRef}
                className="relative flex items-center justify-between bg-white dark:bg-background-dark py-2 transition-transform duration-200 ease-out"
                style={{ transform: `translateX(${currentX}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div 
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-white/10"
                        style={{ color: category?.color }}
                    >
                        <IconComponent size={20} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {category?.name || 'Unknown'}
                        </span>
                        {(transaction.subCategory || transaction.note) && (
                            <span className="truncate text-xs text-slate-500">
                                {transaction.subCategory ? `${transaction.subCategory}${transaction.note ? ' - ' + transaction.note : ''}` : transaction.note}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className={`text-sm font-bold whitespace-nowrap ${
                        transaction.type === TransactionType.INCOME ? 'text-income' : transaction.type === TransactionType.EXPENSE ? 'text-expense' : 'text-slate-500'
                    }`}>
                        {transaction.type === TransactionType.INCOME ? '+' : transaction.type === TransactionType.EXPENSE ? '-' : ''}
                        {formatAmount(transaction.amount)}
                    </span>
                </div>
            </div>
        </div>
    );
};

interface DayListProps {
    day: DaySummary;
    openId: string | null;
    setOpenId: (id: string | null) => void;
}

const DayList: React.FC<DayListProps> = ({ day, openId, setOpenId }) => {
    const { deleteTransaction } = useApp();
    const [isOpen, setIsOpen] = useState(false); // Default hidden as requested

    // Parse date for display
    const dateObj = new Date(day.date);
    const dayNum = dateObj.getDate();
    const dayName = dateObj.toLocaleDateString('default', { weekday: 'short' });
    const isToday = new Date().toDateString() === dateObj.toDateString();
    const isYesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toDateString() === dateObj.toDateString();
    const label = isToday ? 'Today' : isYesterday ? 'Yesterday' : dateObj.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });

    // Format for day header summary
    const formatSum = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <div className="border-t border-slate-200 dark:border-white/5 first:border-t-0">
            <div 
                className="flex cursor-pointer items-center justify-between py-4 select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center min-w-[3rem]">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{dayNum}</span>
                        <span className="text-xs font-medium text-slate-500 uppercase">{dayName}</span>
                    </div>
                    <span className="text-sm font-medium text-slate-400">{label}</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        {day.income > 0 && <span className="text-income">+{formatSum(day.income)}</span>}
                        {day.income > 0 && day.expense > 0 && <span className="text-slate-600">|</span>}
                        {day.expense > 0 && <span className="text-expense">-{formatSum(day.expense)}</span>}
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                </div>
            </div>

            {isOpen && (
                <div className="flex flex-col pb-4 pl-4 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {day.transactions.map((t) => (
                        <TransactionItem 
                            key={t.id} 
                            transaction={t} 
                            onDelete={deleteTransaction} 
                            isOpen={openId === t.id}
                            onToggle={(id) => setOpenId(id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const Home = () => {
  const { transactions, accounts } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Track strictly one open swipe item ID across the whole list
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  const changeMonth = (diff: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + diff);
      return d;
    });
  };

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    });
  }, [transactions, currentDate]);

  const totals = useMemo(() => {
    return monthlyTransactions.reduce((acc, t) => {
      // Logic: Include INCOME, but Exclude if it belongs to a 'deposit' account (Fixed Deposit)
      if (t.type === TransactionType.INCOME) {
          const account = accounts.find(a => a.id === t.accountId);
          if (account?.type !== 'deposit') {
              acc.income += t.amount;
          }
      }
      if (t.type === TransactionType.EXPENSE) acc.expense += t.amount;
      return acc;
    }, { income: 0, expense: 0 });
  }, [monthlyTransactions, accounts]);

  const groupedDays: DaySummary[] = useMemo(() => {
    const groups: { [key: string]: DaySummary } = {};
    monthlyTransactions.forEach(t => {
      const dateKey = new Date(t.date).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: t.date,
          income: 0,
          expense: 0,
          transactions: []
        };
      }
      groups[dateKey].transactions.push(t);
      // For the daily list, we show it visually, but summary logic above handles the 'main income' stat
      if (t.type === TransactionType.INCOME) groups[dateKey].income += t.amount;
      if (t.type === TransactionType.EXPENSE) groups[dateKey].expense += t.amount;
    });
    return Object.values(groups)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [monthlyTransactions]);

  const totalBalance = totals.income - totals.expense;
  const formatTotal = (val: number) => val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex min-h-screen flex-col pb-24 no-scrollbar bg-background-light dark:bg-background-dark" onTouchStart={() => setOpenSwipeId(null)}>
      <Header currentDate={currentDate} onMonthChange={changeMonth} />

      {/* Summary Card */}
      <div className="px-4 py-2">
        <div className="flex justify-between rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-card-dark p-6 shadow-sm">
          {/* Income */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Income</span>
            <div className="flex flex-col items-start">
                <span className="text-lg font-bold text-income">{formatTotal(totals.income)}</span>
                <span className="text-[10px] font-bold text-slate-400">LKR</span>
            </div>
          </div>
          {/* Expenses */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Expenses</span>
            <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-expense">{formatTotal(totals.expense)}</span>
                <span className="text-[10px] font-bold text-slate-400">LKR</span>
            </div>
          </div>
          {/* Total */}
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total</span>
            <div className="flex flex-col items-end">
                <span className={`text-lg font-bold ${totalBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-expense'}`}>
                    {formatTotal(totalBalance)}
                </span>
                <span className="text-[10px] font-bold text-slate-400">LKR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 px-4" onTouchStart={(e) => e.stopPropagation()}>
        <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">Recent Activity</h3>
        <div className="flex flex-col pb-20">
          {groupedDays.length > 0 ? (
             groupedDays.map(day => (
                <DayList 
                    key={day.date} 
                    day={day} 
                    openId={openSwipeId} 
                    setOpenId={setOpenSwipeId} 
                />
             ))
          ) : (
             <div className="py-10 text-center text-slate-500 text-sm">
                No transactions for this month.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
