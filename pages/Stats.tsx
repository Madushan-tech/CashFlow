import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TransactionType } from '../types';
import { formatCurrency } from '../utils';
import * as LucideIcons from 'lucide-react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Period = 'weekly' | 'monthly' | 'annually' | 'custom';

const Stats = () => {
  const navigate = useNavigate();
  const { transactions, categories, accounts } = useApp();
  const [view, setView] = useState<TransactionType>(TransactionType.EXPENSE);
  const [period, setPeriod] = useState<Period>('weekly');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Custom range state
  const [customStart, setCustomStart] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [customEnd, setCustomEnd] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

  // Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isCurrentPeriod = useMemo(() => {
      const now = new Date();
      if (period === 'weekly') {
          // Check if current week
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
          const currStart = new Date(currentDate);
          currStart.setDate(currStart.getDate() - currStart.getDay());
          return startOfWeek.toDateString() === currStart.toDateString();
      }
      if (period === 'monthly') return now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear();
      if (period === 'annually') return now.getFullYear() === currentDate.getFullYear();
      return false;
  }, [period, currentDate]);

  // --- Date Logic ---
  const { start, end, label } = useMemo(() => {
      const curr = new Date(currentDate);
      let s = new Date(curr);
      let e = new Date(curr);
      let lbl = '';

      if (period === 'weekly') {
          // Adjust to start of week (Sunday)
          const day = curr.getDay();
          s.setDate(curr.getDate() - day);
          e.setDate(s.getDate() + 6);
          
          const fmt = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}.${d.getFullYear().toString().slice(-2)}`;
          lbl = `${fmt(s)} ~ ${fmt(e)}`;
      } else if (period === 'monthly') {
          s = new Date(curr.getFullYear(), curr.getMonth(), 1);
          e = new Date(curr.getFullYear(), curr.getMonth() + 1, 0);
          lbl = s.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else if (period === 'annually') {
          s = new Date(curr.getFullYear(), 0, 1);
          e = new Date(curr.getFullYear(), 11, 31);
          lbl = s.getFullYear().toString();
      } else {
          // Custom
          s = customStart;
          e = customEnd;
          lbl = 'Period';
      }
      
      // Set time to boundaries
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);

      return { start: s, end: e, label: lbl };
  }, [period, currentDate, customStart, customEnd]);

  const handleNavigate = (dir: -1 | 1) => {
      const newDate = new Date(currentDate);
      if (period === 'weekly') newDate.setDate(newDate.getDate() + (dir * 7));
      if (period === 'monthly') newDate.setMonth(newDate.getMonth() + dir);
      if (period === 'annually') newDate.setFullYear(newDate.getFullYear() + dir);
      setCurrentDate(newDate);
  };

  // --- Data Filtering & Aggregation ---
  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const d = new Date(t.date);
          return d >= start && d <= end;
      });
  }, [transactions, start, end]);

  const { incomeTotal, expenseTotal } = useMemo(() => {
      return filteredTransactions.reduce((acc, t) => {
          if (t.type === TransactionType.INCOME) {
               const account = accounts.find(a => a.id === t.accountId);
               if (account?.type !== 'deposit') {
                   acc.incomeTotal += t.amount;
               }
          }
          if (t.type === TransactionType.EXPENSE) {
              acc.expenseTotal += t.amount;
          }
          return acc;
      }, { incomeTotal: 0, expenseTotal: 0 });
  }, [filteredTransactions, accounts]);

  const chartData = useMemo(() => {
    let relevantTx = filteredTransactions.filter(t => t.type === view);
    const catMap: { [key: string]: number } = {};

    if (view === TransactionType.INCOME) {
        const depositAccountIds = accounts.filter(a => a.type === 'deposit').map(a => a.id);
        const depositTransfers = filteredTransactions.filter(t => 
            t.type === TransactionType.TRANSFER && 
            t.toAccountId && 
            depositAccountIds.includes(t.toAccountId)
        );
        relevantTx = [...relevantTx, ...depositTransfers];
        depositTransfers.forEach(t => {
             catMap['fixed-deposit-transfer'] = (catMap['fixed-deposit-transfer'] || 0) + t.amount;
        });
    }

    const total = relevantTx.reduce((acc, t) => acc + t.amount, 0);

    relevantTx.forEach(t => {
      if (t.type === TransactionType.TRANSFER && !catMap['fixed-deposit-transfer']) return;
      if (t.type === TransactionType.TRANSFER) return; 
      
      if (t.categoryId) {
          catMap[t.categoryId] = (catMap[t.categoryId] || 0) + t.amount;
      }
    });

    return Object.keys(catMap).map(catId => {
      let category;
      if (catId === 'fixed-deposit-transfer') {
          category = { id: 'fixed-deposit-transfer', name: 'Fixed Deposit', color: '#10B981', icon: 'Landmark', type: TransactionType.INCOME } as any;
      } else {
          category = categories.find(c => c.id === catId);
      }
      
      const value = catMap[catId];
      return {
        id: category?.id,
        name: category?.name || 'Unknown',
        value: value,
        color: category?.color || '#cbd5e1',
        icon: category?.icon || 'HelpCircle',
        percent: total > 0 ? (value / total) * 100 : 0
      };
    }).sort((a, b) => b.value - a.value);

  }, [filteredTransactions, view, categories, accounts]);

  // Handle fallback if no data for chart (0)
  const finalChartData = chartData.length > 0 ? chartData : [{ name: 'Empty', value: 1, color: '#334155', percent: 0, icon: '', id: 'empty' }];
  const hasData = chartData.length > 0;

  const formatTabAmount = (val: number) => `Rs. ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark pb-24 overflow-hidden">
      
      {/* --- Header Section --- */}
      <div className="bg-background-light dark:bg-background-dark pt-2 sticky top-0 z-10">
          
          {/* Top Row: Navigation & Period Dropdown */}
          <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-4">
                  {period !== 'custom' ? (
                      <div className="flex items-center gap-2">
                          <button onClick={() => handleNavigate(-1)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full">
                              <ChevronLeft size={20} className="text-slate-400" />
                          </button>
                          
                          <div className="flex items-center gap-2 relative">
                                {isCurrentPeriod && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
                                <span className="text-lg font-medium text-slate-900 dark:text-slate-200">{label}</span>
                          </div>

                          <button onClick={() => handleNavigate(1)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full">
                              <ChevronRight size={20} className="text-slate-400" />
                          </button>
                      </div>
                  ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                         {/* Two Calendars Logic */}
                         <div className="relative">
                            <input 
                                type="date" 
                                value={customStart.toISOString().split('T')[0]} 
                                onChange={(e) => setCustomStart(new Date(e.target.value))}
                                className="bg-white/5 border border-slate-700 rounded px-2 py-1 text-xs outline-none" 
                            />
                         </div>
                         <span>~</span>
                         <div className="relative">
                            <input 
                                type="date" 
                                value={customEnd.toISOString().split('T')[0]} 
                                onChange={(e) => setCustomEnd(new Date(e.target.value))}
                                className="bg-white/5 border border-slate-700 rounded px-2 py-1 text-xs outline-none" 
                            />
                         </div>
                      </div>
                  )}
              </div>
              
              <div className="relative">
                 <button 
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 text-xs font-bold bg-[#1e293b] text-slate-200 py-1.5 px-3 rounded-lg border border-white/10"
                  >
                      <span className="capitalize">{period === 'custom' ? 'Period' : period}</span>
                      <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Custom Dropdown Menu */}
                  {isDropdownOpen && (
                      <>
                          <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                          <div className="absolute right-0 top-full mt-2 w-32 bg-[#1e293b] rounded-xl shadow-xl border border-white/5 overflow-hidden z-20 flex flex-col p-1">
                              {(['weekly', 'monthly', 'annually', 'custom'] as Period[]).map(p => (
                                  <button 
                                      key={p}
                                      onClick={() => { setPeriod(p); setIsDropdownOpen(false); }}
                                      className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize
                                          ${period === p 
                                              ? 'text-[#3b82f6] bg-white/5' 
                                              : 'text-slate-300 hover:bg-white/5'
                                          }`}
                                  >
                                      {p === 'custom' ? 'Period' : p}
                                  </button>
                              ))}
                          </div>
                      </>
                  )}
              </div>
          </div>

          {/* Tab Row */}
          <div className="flex mt-4 border-b border-slate-200 dark:border-slate-800">
              <button 
                  onClick={() => setView(TransactionType.INCOME)}
                  className={`flex-1 pb-3 text-center transition-colors relative ${view === TransactionType.INCOME ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
              >
                  <span className="text-xs mr-2 text-slate-500">Income</span>
                  <span className="text-xs font-semibold">{formatTabAmount(incomeTotal)}</span>
                  {view === TransactionType.INCOME && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500" />
                  )}
              </button>
              <button 
                  onClick={() => setView(TransactionType.EXPENSE)}
                  className={`flex-1 pb-3 text-center transition-colors relative ${view === TransactionType.EXPENSE ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}
              >
                  <span className="text-xs mr-2 text-slate-500">Expenses</span>
                  <span className="text-xs font-semibold">{formatTabAmount(expenseTotal)}</span>
                  {view === TransactionType.EXPENSE && (
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-expense" />
                  )}
              </button>
          </div>
      </div>

      {/* --- Chart Section --- */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-6">
          <div className="relative flex flex-col items-center justify-center mb-6">
            <div className="h-64 w-full min-w-[300px]" style={{ minHeight: '250px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={finalChartData}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {finalChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {!hasData && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-slate-500 text-xs">No Data</span>
                </div>
            )}
          </div>

          {/* List Section */}
          <div className="flex flex-col gap-3 pb-8">
            {chartData.length > 0 ? (
                chartData.map((item, idx) => {
                    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.HelpCircle;
                    return (
                        <div 
                            key={idx} 
                            onClick={() => navigate(`/stats/${item.id}`)}
                            className="flex items-center justify-between py-2 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-lg px-2 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {/* Percentage Badge */}
                                <div 
                                    className="px-2 py-0.5 rounded text-xs font-bold min-w-[40px] text-center"
                                    style={{ backgroundColor: item.color, color: '#000000aa' }}
                                >
                                    {item.percent.toFixed(0)}%
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <Icon size={16} style={{ color: item.color }} />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{formatCurrency(item.value)}</p>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="text-center text-slate-500 py-10 text-sm">No data available for this period</div>
            )}
          </div>
      </div>
    </div>
  );
};

export default Stats;