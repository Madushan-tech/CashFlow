
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Calendar, ChevronLeft, ChevronRight, ChevronDown, Clock, Coins, CalendarClock, Banknote, CheckCircle2, ShieldCheck, TrendingUp, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { Transaction, Category, TransactionType } from '../types';
import { 
  format, startOfMonth, endOfMonth, addMonths, subMonths,
  addDays, subDays, addYears, subYears,
  isSameDay, isSameMonth, isSameYear
} from 'date-fns';
import { Icon } from '../components/Icon';

interface TransactionStatsProps {
  transaction: Transaction | null;
  allTransactions: Transaction[];
  categories: Category[];
  onBack: () => void;
}

type PeriodMode = 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

const CustomXAxisTick = (props: any) => {
  const { x, y, payload, chartData, darkMode } = props;
  const point = chartData[payload.index];
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text 
        x={0} 
        y={0} 
        dy={16} 
        textAnchor="middle" 
        fill={point?.isSelected ? (darkMode ? '#FFFFFF' : '#111827') : '#9CA3AF'} 
        fontSize={10} 
        fontWeight={point?.isSelected ? 800 : 500}
      >
        {payload.value}
      </text>
      {point?.isToday && (
        <circle cx={0} cy={24} r={3} fill="#10B981" />
      )}
    </g>
  );
};

export const TransactionStats: React.FC<TransactionStatsProps> = ({ transaction, allTransactions, categories, onBack }) => {
  const [mode, setMode] = useState<PeriodMode>('MONTHLY');
  const [cursorDate, setCursorDate] = useState(new Date());
  
  const [customRange, setCustomRange] = useState<{ start: Date; end: Date }>({
    start: subMonths(new Date(), 1),
    end: new Date()
  });
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!transaction) return null;

  // 1. Determine Effective Category & SubCategory for Filtering
  let effectiveCategoryId = transaction.categoryId;
  let effectiveSubCategory: string | undefined = transaction.subCategory;
  let categoryName = '';
  let categoryIcon = '';

  // Handle Transfer Fees (From Stats Pie Chart or Direct Transaction)
  if (effectiveCategoryId === 'transfer_fee' || transaction.id.startsWith('fee-')) {
      effectiveCategoryId = 'transfer_fee';
      categoryName = 'Transfer Fees';
      categoryIcon = 'Zap';
  } else if (transaction.categoryId === 'loan_dp') {
      effectiveCategoryId = 'loan_category';
      effectiveSubCategory = 'Down Payment';
      categoryName = 'Down Payment';
      categoryIcon = 'Coins';
  } else if (transaction.categoryId === 'loan_inst') {
      effectiveCategoryId = 'loan_category';
      effectiveSubCategory = 'Installment';
      categoryName = 'Installment';
      categoryIcon = 'CalendarClock';
  } else if (transaction.categoryId === 'loan_other') {
      effectiveCategoryId = 'loan_category';
      effectiveSubCategory = undefined;
      categoryName = 'Loan Repayment';
      categoryIcon = 'Banknote';
  } else if (transaction.categoryId === 'loan_cash') {
      effectiveCategoryId = 'loan_category';
      effectiveSubCategory = undefined;
      categoryName = 'Cash Loan';
      categoryIcon = 'Banknote';
  } else {
      const cat = categories.find(c => c.id === effectiveCategoryId);
      categoryName = cat?.name || 'Unknown';
      categoryIcon = cat?.icon || 'Activity';
  }

  // Override visual name if it's a specific Loan Component being viewed directly
  if (effectiveCategoryId === 'loan_category') {
      if (effectiveSubCategory === 'Down Payment') { categoryName = 'Down Payment'; categoryIcon = 'Coins'; }
      else if (effectiveSubCategory === 'Installment') { categoryName = 'Installment'; categoryIcon = 'CalendarClock'; }
  }

  const isIncome = transaction.type === TransactionType.INCOME;
  const color = isIncome ? '#10B981' : '#EF4444'; 

  // Calculate Date Window for 6 Points: -4 to +1 relative to cursor
  const windowRange = useMemo(() => {
    if (mode === 'WEEKLY') {
        return { start: subDays(cursorDate, 4), end: addDays(cursorDate, 1), points: 6 };
    } else if (mode === 'MONTHLY') {
        return { start: startOfMonth(subMonths(cursorDate, 4)), end: endOfMonth(addMonths(cursorDate, 1)), points: 6 };
    } else if (mode === 'YEARLY') {
        return { start: subYears(cursorDate, 4), end: addYears(cursorDate, 1), points: 6 };
    } else {
        return { start: customRange.start, end: customRange.end, points: 6 };
    }
  }, [mode, cursorDate, customRange]);

  const handlePrev = () => {
    switch (mode) {
      case 'WEEKLY': setCursorDate(subDays(cursorDate, 1)); break;
      case 'MONTHLY': setCursorDate(subMonths(cursorDate, 1)); break;
      case 'YEARLY': setCursorDate(subYears(cursorDate, 1)); break;
    }
  };

  const handleNext = () => {
    switch (mode) {
      case 'WEEKLY': setCursorDate(addDays(cursorDate, 1)); break;
      case 'MONTHLY': setCursorDate(addMonths(cursorDate, 1)); break;
      case 'YEARLY': setCursorDate(addYears(cursorDate, 1)); break;
    }
  };

  const isSelectedCurrent = useMemo(() => {
    const now = new Date();
    switch (mode) {
        case 'WEEKLY': return isSameDay(cursorDate, now);
        case 'MONTHLY': return isSameMonth(cursorDate, now) && isSameYear(cursorDate, now);
        case 'YEARLY': return isSameYear(cursorDate, now);
        default: return false;
    }
  }, [mode, cursorDate]);

  const periodLabel = useMemo(() => {
    switch (mode) {
      case 'WEEKLY': return format(cursorDate, 'EEE, MMM d');
      case 'MONTHLY': return format(cursorDate, 'MMMM yyyy');
      case 'YEARLY': return format(cursorDate, 'yyyy');
      case 'CUSTOM': return 'Custom';
    }
  }, [mode, cursorDate]);

  const filteredData = useMemo(() => {
    return allTransactions.filter(t => {
      // Special logic for Transfer Fees
      if (effectiveCategoryId === 'transfer_fee') {
          return t.id.startsWith('fee-') && t.date >= windowRange.start && t.date <= windowRange.end;
      }

      if (t.categoryId !== effectiveCategoryId) return false;
      if (t.type !== transaction.type) return false;
      if (t.isLoanParent) return false;

      if (effectiveCategoryId === 'loan_category' && effectiveSubCategory) {
          if (t.subCategory !== effectiveSubCategory) return false;
      }
      
      return t.date >= windowRange.start && t.date <= windowRange.end;
    });
  }, [allTransactions, effectiveCategoryId, effectiveSubCategory, transaction.type, windowRange]);

  const selectedPeriodData = useMemo(() => {
    return allTransactions.filter(t => {
      // Special logic for Transfer Fees
      if (effectiveCategoryId === 'transfer_fee') {
          if (!t.id.startsWith('fee-')) return false;
      } else {
          if (t.categoryId !== effectiveCategoryId) return false;
          if (t.type !== transaction.type) return false;
          if (t.isLoanParent) return false;
          
          if (effectiveCategoryId === 'loan_category' && effectiveSubCategory) {
              if (t.subCategory !== effectiveSubCategory) return false;
          }
      }

      if (mode === 'WEEKLY') return isSameDay(t.date, cursorDate);
      if (mode === 'MONTHLY') return isSameMonth(t.date, cursorDate) && isSameYear(t.date, cursorDate);
      if (mode === 'YEARLY') return isSameYear(t.date, cursorDate);
      
      return false; 
    });
  }, [allTransactions, effectiveCategoryId, effectiveSubCategory, transaction.type, mode, cursorDate]);

  const currentPeriodAmount = useMemo(() => {
     return selectedPeriodData.reduce((acc, t) => acc + t.amount, 0);
  }, [selectedPeriodData]);

  // Sort detailed transactions by date DESC
  const sortedPeriodTransactions = useMemo(() => {
      return [...selectedPeriodData].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selectedPeriodData]);

  const chartData = useMemo(() => {
    let points: any[] = [];
    const now = new Date();

    const getBucketData = (bucketTransactions: Transaction[]) => {
        const bucketTotal = bucketTransactions.reduce((acc, t) => acc + t.amount, 0);
        return { bucketTotal };
    };

    if (mode === 'CUSTOM') {
         return []; 
    } else {
        for (let i = -4; i <= 1; i++) {
            let pointDate: Date;
            let bucketTransactions: Transaction[] = [];
            let label = '';
            let fullLabel = '';
            let isToday = false;

            if (mode === 'WEEKLY') {
                pointDate = addDays(cursorDate, i);
                bucketTransactions = filteredData.filter(t => isSameDay(t.date, pointDate));
                label = format(pointDate, 'EEE');
                fullLabel = format(pointDate, 'MMM d, yyyy');
                isToday = isSameDay(pointDate, now);
            } else if (mode === 'MONTHLY') {
                pointDate = addMonths(cursorDate, i);
                bucketTransactions = filteredData.filter(t => isSameMonth(t.date, pointDate) && isSameYear(t.date, pointDate));
                label = format(pointDate, 'MMM');
                fullLabel = format(pointDate, 'MMMM yyyy');
                isToday = isSameMonth(pointDate, now) && isSameYear(pointDate, now);
            } else { // YEARLY
                pointDate = addYears(cursorDate, i);
                bucketTransactions = filteredData.filter(t => isSameYear(t.date, pointDate));
                label = format(pointDate, 'yyyy');
                fullLabel = format(pointDate, 'yyyy');
                isToday = isSameYear(pointDate, now);
            }

            const { bucketTotal } = getBucketData(bucketTransactions);

            points.push({ 
                label, 
                fullLabel, 
                amount: bucketTotal, 
                date: pointDate,
                isSelected: i === 0, 
                isToday: isToday 
            });
        }
    }
    return points;
  }, [mode, cursorDate, filteredData]);

  const highestRecord = useMemo(() => {
      if (chartData.length === 0) return 0;
      return Math.max(...chartData.map(d => d.amount));
  }, [chartData]);

  const highestLabel = useMemo(() => {
     if (chartData.length === 0) return '-';
     const maxPoint = chartData.find(d => d.amount === highestRecord);
     return maxPoint && highestRecord > 0 ? maxPoint.label : '-';
  }, [chartData, highestRecord]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-background">
      <div className="sticky top-0 z-30 bg-white dark:bg-background border-b border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full dark:text-white transition-colors">
                <ArrowLeft size={24} />
                </button>
                <span className="font-bold text-lg dark:text-white">Trend Analysis</span>
            </div>
            
            <div className="relative" ref={dropdownRef}>
                <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1 bg-gray-100 dark:bg-surface px-3 py-1.5 rounded-lg text-sm font-medium dark:text-gray-200"
                >
                    <span>{mode === 'WEEKLY' ? 'Daily' : mode.charAt(0) + mode.slice(1).toLowerCase()}</span>
                    <ChevronDown size={14} />
                </button>
                
                {isDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-surface rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-up origin-top-right">
                        {(['WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as PeriodMode[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => { setMode(m); setIsDropdownOpen(false); }}
                                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${mode === m ? 'text-primary' : 'text-gray-700 dark:text-gray-300'}`}
                            >
                                {m === 'WEEKLY' ? 'Daily' : m.charAt(0) + m.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                )}
            </div>
          </div>

          <div className="px-4 pb-4">
            {mode === 'CUSTOM' ? (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-surface p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                     <div className="relative flex items-center gap-2 flex-1 min-w-0">
                        <Calendar size={16} className="text-primary shrink-0" />
                        <input 
                            type="date" 
                            value={format(customRange.start, 'yyyy-MM-dd')}
                            onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.valueAsDate || new Date() }))}
                            className="bg-transparent text-xs font-semibold dark:text-white outline-none w-full" 
                        />
                     </div>
                     <ArrowRight size={14} className="text-gray-400 mx-2 shrink-0" />
                     <div className="relative flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <input 
                            type="date" 
                            value={format(customRange.end, 'yyyy-MM-dd')}
                            onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.valueAsDate || new Date() }))}
                            className="bg-transparent text-xs font-semibold dark:text-white outline-none w-full text-right" 
                        />
                     </div>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-gray-100 dark:bg-surface p-1 rounded-xl">
                    <button onClick={handlePrev} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm text-gray-600 dark:text-gray-300">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center justify-center gap-2">
                         {isSelectedCurrent && (
                            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                         )}
                         <div className="flex flex-col items-center">
                            <span className="font-bold text-sm dark:text-white">
                                {periodLabel}
                            </span>
                         </div>
                    </div>
                    <button onClick={handleNext} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm text-gray-600 dark:text-gray-300">
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 pt-4">
        <div className="px-6 pb-6">
            <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {effectiveCategoryId === 'transfer_fee' ? (
                        <Zap size={24} />
                    ) : (
                        <Icon name={categoryIcon} size={24} />
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{categoryName}</span>
                    <h1 className="text-3xl font-bold dark:text-white mt-1">
                        {currentPeriodAmount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}
                    </h1>
                </div>
            </div>
        </div>

        <div className="px-4">
            <div className="bg-white dark:bg-surface rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Overview
                    </h3>
                </div>
                
                <div className="h-56 w-full -ml-2 min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                            <XAxis 
                                dataKey="label" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={(props) => <CustomXAxisTick {...props} chartData={chartData} darkMode={isDarkMode} />}
                                dy={10}
                                interval={0} 
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1E2530', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-[#1E2530] text-white p-3 rounded-xl shadow-xl border border-gray-700">
                                                <p className="text-gray-400 text-xs mb-1">{data.fullLabel}</p>
                                                <p className="text-lg font-bold mb-1">{data.amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' })}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke={color} 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill="url(#colorAmount)" 
                                animationDuration={1500}
                                animationEasing="ease-in-out"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/20 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <Calendar size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider truncate">Total</span>
                            <span className="text-sm font-black dark:text-white truncate">
                                {currentPeriodAmount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>
                    <div className="bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <TrendingUp size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider truncate">Peak ({highestLabel})</span>
                            <span className="text-sm font-black dark:text-white truncate">
                                {highestRecord.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {sortedPeriodTransactions.length > 0 && (
                <div className="mt-6 animate-fade-in">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
                        Period Breakdown
                    </h3>
                    <div className="flex flex-col gap-3">
                        {sortedPeriodTransactions.map(tx => {
                            const txIcon = effectiveCategoryId === 'transfer_fee' 
                                ? 'Zap' 
                                : (categories.find(c => c.id === tx.categoryId)?.icon || categoryIcon);
                                
                            return (
                                <div key={tx.id} className="group flex flex-col bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all overflow-hidden">
                                    <div className="flex items-center p-3 gap-3">
                                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                              {effectiveCategoryId === 'transfer_fee' ? (
                                                  <Zap size={20} />
                                              ) : (
                                                  <Icon name={txIcon} size={20} />
                                              )}
                                         </div>
                                         <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                              <span className="text-sm font-bold dark:text-white truncate">{tx.note || categoryName}</span>
                                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                 {tx.subCategory && (
                                                     <>
                                                         <span className="font-medium text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{tx.subCategory}</span>
                                                         <span className="text-gray-300 text-[10px]">•</span>
                                                     </>
                                                 )}
                                                 <span className="whitespace-nowrap">{format(tx.date, 'MMM d, yyyy')}</span>
                                                 {tx.status === 'pending' && (
                                                    <div className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500 uppercase bg-amber-50 dark:bg-amber-900/20 px-1 py-0 rounded ml-1">
                                                        <Clock size={8} />
                                                        <span>Pending</span>
                                                    </div>
                                                 )}
                                              </div>
                                         </div>
                                         <div className="shrink-0 text-right pl-2">
                                              <span className="text-sm font-black dark:text-white block">
                                                  {tx.amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 })}
                                              </span>
                                         </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
