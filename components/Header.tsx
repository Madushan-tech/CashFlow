import React from 'react';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

interface HeaderProps {
  currentDate: Date;
  onMonthChange: (diff: number) => void;
}

const Header: React.FC<HeaderProps> = ({ currentDate, onMonthChange }) => {
  const monthName = currentDate.toLocaleString('default', { month: 'short' });
  // const year = currentDate.getFullYear();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light dark:bg-background-dark px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm">
          <TrendingUp className="text-white h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CashFlow</h1>
      </div>
      
      <div className="flex items-center gap-1 bg-white/50 dark:bg-white/5 rounded-lg p-1">
        <button 
          onClick={() => onMonthChange(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        
        <span className="w-16 text-center text-sm font-bold text-slate-900 dark:text-white select-none">
          {monthName}
        </span>
        
        <button 
          onClick={() => onMonthChange(1)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10 active:scale-95 transition-all"
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>
    </header>
  );
};

export default Header;
