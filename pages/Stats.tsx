
import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Transaction, Category, TransactionType, Account, AccountType } from '../types';
import { Icon } from '../components/Icon';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onViewTrend: (categoryId: string, type: TransactionType) => void;
  onViewAccount: (account: Account) => void;
  onViewFuture: (type: TransactionType) => void;
}

export const Stats: React.FC<StatsProps> = ({ transactions, categories, accounts, onViewTrend, onViewAccount, onViewFuture }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const formatLKR = (amount: number) => {
    return amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR' });
  };

  const formatShortLKR = (amount: number) => {
     return amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 });
  };

  const formatCompactLKR = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'LKR',
        notation: "compact",
        maximumFractionDigits: 1
    }).format(amount);
  };

  // Helper: Is Covered Expense (Loan Enabled Expense)
  const isCoveredExpense = (t: Transaction) => {
      if (t.type !== TransactionType.EXPENSE || !t.relatedTransactionId) return false;
      const loanTx = transactions.find(lx => lx.id === t.relatedTransactionId);
      return loanTx && loanTx.relatedTransactionId === t.id;
  };

  // Future Transactions Calculation
  const futureTransactions = useMemo(() => {
      return transactions.filter(t => t.status === 'pending');
  }, [transactions]);

  const futureIncomeTotal = futureTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const futureExpenseTotal = futureTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  // Calculate Totals for Labels (Verified Only for Main Chart/Totals)
  const totals = useMemo(() => {
    const validTransactions = transactions.filter(t => t.status !== 'pending' && !t.isLoanParent);

    const expenseTotal = validTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        // Count settlements if they are Installments or Down Payments (subCategory exists), but ignore generic repayment transactions
        .filter(t => !t.isSettlement || (t.categoryId === 'loan_category')) 
        .reduce((acc, t) => acc + (t.originalAmount || t.amount), 0);

    const incomeTransTotal = validTransactions
        .filter(t => t.type === TransactionType.INCOME)
        // Allow Cash Loans to count as income
        .reduce((acc, t) => acc + t.amount, 0);
    
    return { expense: expenseTotal, income: incomeTransTotal };
  }, [transactions]);


  const data = useMemo(() => {
    const isIncome = type === TransactionType.INCOME;
    
    // Filter transactions by type and Verified Status
    const filtered = transactions.filter(t => {
        if (t.type !== type) return false;
        if (t.status === 'pending') return false;
        
        // IMPORTANT: Ignore Loan Parent (Total Facility) to prevent double counting
        // The actual expense is tracked via Down Payment and Installments.
        if (t.isLoanParent) return false;

        // EXPENSE LOGIC:
        if (t.type === TransactionType.EXPENSE) {
             // Exclude generic settlements (credit card repayment etc), but KEEP Installments & DP
             if (t.isSettlement && t.categoryId !== 'loan_category') return false;
        }
        
        // INCOME LOGIC:
        // Previously filtered out 'loan_category', now allowing it so Cash Loans appear.
        
        return true;
    });

    const totalAmount = filtered.reduce((acc, t) => acc + (t.originalAmount || t.amount), 0);
    
    // Group by Category (Split Loans into DP and Installment)
    const categoryMap = new Map<string, { amount: number, name: string, icon: string }>();
    
    filtered.forEach(t => {
      let key = t.categoryId;
      let name = '';
      let icon = '';
      
      if (t.id.startsWith('fee-')) {
          // Identify Transfer Fees
          key = 'transfer_fee';
          name = 'Transfer Fees';
          icon = 'Zap';
      } else if (t.categoryId === 'loan_category') {
          // Special handling to split Loan category
          if (t.type === TransactionType.INCOME) {
              key = 'loan_cash';
              name = 'Cash Loan';
              icon = 'Banknote';
          } else if (t.subCategory === 'Down Payment') {
              key = 'loan_dp';
              name = 'Down Payment';
              icon = 'Coins';
          } else if (t.subCategory === 'Installment') {
              key = 'loan_inst';
              name = 'Installment';
              icon = 'CalendarClock';
          } else {
              key = 'loan_other';
              name = 'Loan Repayment';
              icon = 'Banknote';
          }
      } else {
          const cat = categories.find(c => c.id === t.categoryId);
          name = cat?.name || 'Unknown';
          icon = cat?.icon || 'HelpCircle';
      }

      const current = categoryMap.get(key) || { amount: 0, name, icon };
      categoryMap.set(key, { ...current, amount: current.amount + (t.originalAmount || t.amount) });
    });

    const chartData = Array.from(categoryMap.entries()).map(([key, data]) => {
      return {
        id: key,
        name: data.name,
        value: data.amount,
        icon: data.icon,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
      };
    }).sort((a, b) => b.value - a.value);

    return { chartData, totalAmount, isIncome };
  }, [transactions, type, categories]);

  // Generate colors for the chart
  const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#64748B'
  ];

  const handlePieEnter = (_: any, index: number) => {
     // Optional: Hover effect
  };

  const handlePieClick = (_: any, index: number, e: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setActiveIndex(index === activeIndex ? null : index);
  };

  const handleCardClick = (item: any, index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      // Pass the specific pseudo-ID (e.g. 'loan_dp') so TransactionStats can filter correctly
      onViewTrend(item.id, type);
  };

  const handleBackgroundClick = () => {
      setActiveIndex(null);
  };

  return (
    <div 
        className="flex flex-col h-full pt-6 pb-24 px-4 bg-gray-50 dark:bg-background overflow-hidden"
        onClick={handleBackgroundClick}
    >
      <h2 className="text-xl font-bold dark:text-white mb-6">Statistics</h2>

      {/* Type Toggle with Totals */}
      <div className="flex bg-gray-200 dark:bg-surface p-1 rounded-xl mb-6 shrink-0" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={() => { setType(TransactionType.INCOME); setActiveIndex(null); }}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${
            type === TransactionType.INCOME 
              ? 'bg-white dark:bg-background text-primary shadow-sm' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <span>Income</span>
          <span className="font-bold text-[11px] truncate w-full text-center">{formatShortLKR(totals.income)}</span>
        </button>
        <button 
          onClick={() => { setType(TransactionType.EXPENSE); setActiveIndex(null); }}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center gap-1 ${
            type === TransactionType.EXPENSE 
              ? 'bg-white dark:bg-background text-danger shadow-sm' 
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <span>Expenses</span>
          <span className="font-bold text-[11px] truncate w-full text-center">{formatShortLKR(totals.expense)}</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto no-scrollbar">
        {/* Future Income Section (Income View Only) - Req 6: Keep Future Income */}
        {data.isIncome && (
            <div className="mb-6 shrink-0">
               <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                   Future Income
               </h3>
               <button 
                  onClick={() => onViewFuture(TransactionType.INCOME)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 shadow-sm hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
               >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-200 text-amber-700">
                           <TrendingUp size={20} />
                        </div>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-500">Scheduled Income</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-500">{formatLKR(futureIncomeTotal)}</span>
               </button>
            </div>
        )}

        {/* Future Expenses Section (Expense View Only) */}
        {!data.isIncome && (
            <div className="mb-6 shrink-0">
               <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                   Future Expenses
               </h3>
               <button 
                  onClick={() => onViewFuture(TransactionType.EXPENSE)}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 shadow-sm hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors"
               >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-amber-200 text-amber-700">
                           <TrendingDown size={20} />
                        </div>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-500">Scheduled Expenses</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-500">{formatLKR(futureExpenseTotal)}</span>
               </button>
            </div>
        )}

        {/* Chart Section */}
        <div 
            className="h-64 w-full mb-6 relative shrink-0" 
            onClick={(e) => e.stopPropagation()} 
        >
          {data.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={75} 
                  outerRadius={90}
                  paddingAngle={4}
                  cornerRadius={4}
                  dataKey="value"
                  stroke="none"
                  onClick={handlePieClick}
                  onMouseEnter={handlePieEnter}
                  isAnimationActive={true}
                  style={{ outline: 'none' }}
                >
                  {data.chartData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                        style={{ outline: 'none' }}
                    />
                  ))}
                </Pie>
                {/* Center Text */}
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                   <tspan x="50%" dy="-0.5em" fontSize="12" fill="#9CA3AF" fontWeight="bold">TOTAL</tspan>
                   <tspan x="50%" dy="1.5em" fontSize="16" fill="#F3F4F6" fontWeight="bold">{formatShortLKR(data.totalAmount)}</tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <div className="w-40 h-40 rounded-full border-8 border-gray-200 dark:border-gray-800 mb-4 opacity-50"></div>
                <p className="text-sm font-medium">No verified data for this period</p>
            </div>
          )}
        </div>

        {/* List Details */}
        <div className="flex flex-col gap-3 pb-4">
            {data.chartData.length > 0 ? (
                <>
                 <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {data.isIncome ? 'Income Categories' : 'Expense Categories'}
                 </h3>
                 {data.chartData.map((item, index) => (
                    <div 
                        key={item.id} 
                        onClick={(e) => handleCardClick(item, index, e)}
                        className={`flex items-center justify-between p-3 bg-white dark:bg-surface rounded-xl border transition-all cursor-pointer active:scale-[0.99]
                        ${activeIndex === index 
                            ? 'border-transparent ring-2 ring-white ring-offset-2 ring-offset-gray-50 dark:ring-offset-background' 
                            : 'border-gray-100 dark:border-gray-800'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div 
                            className="w-2 h-8 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            ></div>
                            <div className="flex items-center gap-2">
                                <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                                    <Icon name={item.icon || 'Circle'} size={16} className="dark:text-white" />
                                </div>
                                <span className="font-medium dark:text-white text-sm">{item.name}</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                            <span className="font-bold dark:text-white text-sm">{formatLKR(item.value)}</span>
                            <span className="text-[10px] text-gray-500">{item.percentage.toFixed(1)}%</span>
                        </div>
                    </div>
                ))}
                </>
            ) : null}
        </div>
      </div>
    </div>
  );
};
