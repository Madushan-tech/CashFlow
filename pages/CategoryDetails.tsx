import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowLeft, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { formatCurrency } from '../utils';

type Period = 'weekly' | 'monthly' | 'annually' | 'custom';

const CategoryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories, transactions } = useApp();
  const [period, setPeriod] = useState<Period>('monthly'); 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Anchor date for standard periods
  const [currentDate, setCurrentDate] = useState(new Date());

  // Custom Date Range State
  const [customStart, setCustomStart] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [customEnd, setCustomEnd] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));

  // Find Category info
  const category = categories.find(c => c.id === id) || (id === 'fixed-deposit-transfer' ? { id: 'fixed-deposit-transfer', name: 'Fixed Deposit', icon: 'Landmark', color: '#10B981', type: 'income' } : null);
  const Icon = category ? (LucideIcons as any)[category.icon] || LucideIcons.HelpCircle : LucideIcons.HelpCircle;

  // --- Label Logic ---
  const dateLabel = useMemo(() => {
      if (period === 'weekly') {
         // Show week range relative to currentDate
         const s = new Date(currentDate);
         s.setDate(s.getDate() - 6);
         return `${s.getDate()}.${s.getMonth()+1} ~ ${currentDate.getDate()}.${currentDate.getMonth()+1}`;
      }
      if (period === 'monthly') return currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (period === 'annually') return currentDate.getFullYear().toString();
      return 'Custom Period';
  }, [period, currentDate]);

  // --- Blue Dot Logic (Is Current Period) ---
  const isCurrentPeriod = useMemo(() => {
      const now = new Date();
      now.setHours(0,0,0,0);

      if (period === 'weekly') {
          // Weekly view logic: [currentDate - 6, currentDate]
          const start = new Date(currentDate);
          start.setDate(start.getDate() - 6);
          start.setHours(0,0,0,0);
          
          const end = new Date(currentDate);
          end.setHours(23,59,59,999);
          
          return now >= start && now <= end;
      }
      if (period === 'monthly') return now.getMonth() === currentDate.getMonth() && now.getFullYear() === currentDate.getFullYear();
      if (period === 'annually') return now.getFullYear() === currentDate.getFullYear();
      return false;
  }, [period, currentDate]);

  const handleNavigate = (dir: -1 | 1) => {
      const newDate = new Date(currentDate);
      if (period === 'weekly') newDate.setDate(newDate.getDate() + (dir * 7));
      if (period === 'monthly') newDate.setMonth(newDate.getMonth() + dir);
      if (period === 'annually') newDate.setFullYear(newDate.getFullYear() + dir);
      setCurrentDate(newDate);
  };

  // --- Data Bucketing for Trend Analysis ---
  const chartData = useMemo(() => {
    if (!category) return [];

    // Structure: { start, end, axisLabel, tooltipLabel, value }
    const buckets: { start: Date, end: Date, axisLabel: string, tooltipLabel: string, value: 0 }[] = [];
    
    if (period === 'monthly') {
        // 7 Points: 5 prev months, current, next
        for (let i = -5; i <= 1; i++) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
            const endD = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const label = d.toLocaleDateString('en-US', { month: 'short' });
            buckets.push({ 
                start: d, 
                end: endD,
                axisLabel: label,
                tooltipLabel: `${label} ${d.getFullYear()}`,
                value: 0 
            });
        }
    } else if (period === 'annually') {
        // 7 Points: 5 past years, current, next
        for (let i = -5; i <= 1; i++) {
            const d = new Date(currentDate.getFullYear() + i, 0, 1);
            const endD = new Date(d.getFullYear(), 11, 31, 23, 59, 59);
            const label = d.getFullYear().toString();
            buckets.push({ 
                start: d, 
                end: endD,
                axisLabel: label,
                tooltipLabel: label,
                value: 0 
            });
        }
    } else if (period === 'custom') {
        // 7 Equidistant Points between customStart and customEnd
        const startMillis = customStart.getTime();
        const endMillis = customEnd.getTime();
        const diff = endMillis - startMillis;
        const step = diff / 6; // Divide into 6 intervals to get 7 points

        for (let i = 0; i < 7; i++) {
            const pointDate = new Date(startMillis + (step * i));
            const nextPointDate = new Date(startMillis + (step * (i + 1)));
            
            buckets.push({
                start: pointDate,
                end: i === 6 ? new Date(endMillis) : nextPointDate, 
                axisLabel: pointDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
                tooltipLabel: pointDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                value: 0
            });
        }
    } else {
        // Weekly (Last 7 days)
        for (let i = -6; i <= 0; i++) {
            const d = new Date(currentDate);
            d.setDate(d.getDate() + i);
            d.setHours(0,0,0,0);
            const endD = new Date(d);
            endD.setHours(23,59,59,999);
            
            buckets.push({ 
                start: d, 
                end: endD,
                axisLabel: d.getDate().toString(), // Just the date number for X-axis
                tooltipLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), // "Dec 12" for Tooltip
                value: 0 
            });
        }
    }

    // Fill buckets with transaction sums
    transactions.forEach(t => {
        const isMatch = category.id === 'fixed-deposit-transfer' 
                ? (t.type === 'transfer' && t.toAccountId === '4')
                : t.categoryId === category.id;
        if (!isMatch) return;

        const tDate = new Date(t.date);
        
        // Find which bucket this transaction belongs to
        const bucket = buckets.find(b => tDate >= b.start && tDate <= b.end);
        
        if (bucket) {
            bucket.value += t.amount;
        } else if (period === 'custom' && tDate >= buckets[0].start && tDate <= buckets[6].end) {
             // rough binning for custom
             let closest = buckets[0];
             let minDiff = Math.abs(tDate.getTime() - buckets[0].start.getTime());
             for(let i=1; i<buckets.length; i++){
                 const diff = Math.abs(tDate.getTime() - buckets[i].start.getTime());
                 if(diff < minDiff) {
                     minDiff = diff;
                     closest = buckets[i];
                 }
             }
             closest.value += t.amount;
        }
    });

    return buckets.map(b => ({ ...b, x: b.axisLabel, y: b.value }));

  }, [transactions, category, currentDate, period, customStart, customEnd]);

  // Total amount calculation
  const currentPeriodTotal = useMemo(() => {
      if (period === 'custom') {
          return chartData.reduce((acc, curr) => acc + curr.y, 0);
      }
      // For Monthly/Annual/Weekly, user expects to see the total for the label shown in header (e.g. "Dec 2025")
      const target = chartData.find(d => {
          if (period === 'monthly') return d.axisLabel === currentDate.toLocaleDateString('en-US', { month: 'short' });
          if (period === 'annually') return d.axisLabel === currentDate.getFullYear().toString();
          // Weekly: find the bucket that matches today's date (or the end of the selected week)
          // We used d.getDate() as axisLabel. 
          return d.axisLabel === currentDate.getDate().toString();
      });
      return target ? target.value : 0;
  }, [chartData, currentDate, period]);

  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-card-dark p-2 border border-slate-200 dark:border-white/10 rounded shadow-lg text-xs z-50">
          <p className="font-bold text-slate-900 dark:text-white">{data.tooltipLabel}</p>
          <p className="text-primary font-bold">{formatCurrency(data.y)}</p>
        </div>
      );
    }
    return null;
  };

  if (!category) return <div>Category not found</div>;

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between p-4 sticky top-0 bg-background-light dark:bg-background-dark z-10">
        <button onClick={() => navigate(-1)} className="text-slate-900 dark:text-white p-2 -ml-2">
            <ArrowLeft size={24} />
        </button>
        
        {/* Date Navigator or Custom Inputs */}
        {period === 'custom' ? (
            <div className="flex items-center gap-1 text-xs">
                 <input 
                    type="date" 
                    value={customStart.toISOString().split('T')[0]} 
                    onChange={(e) => setCustomStart(new Date(e.target.value))}
                    className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-1 py-1 w-24 outline-none text-slate-900 dark:text-white"
                 />
                 <span className="text-slate-400">~</span>
                 <input 
                    type="date" 
                    value={customEnd.toISOString().split('T')[0]} 
                    onChange={(e) => setCustomEnd(new Date(e.target.value))}
                    className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-1 py-1 w-24 outline-none text-slate-900 dark:text-white"
                 />
            </div>
        ) : (
            <div className="flex items-center gap-2">
                <button onClick={() => handleNavigate(-1)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full">
                    <ChevronLeft size={20} className="text-slate-400" />
                </button>
                <div className="flex items-center gap-2 relative">
                    {isCurrentPeriod && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{dateLabel}</span>
                </div>
                <button onClick={() => handleNavigate(1)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full">
                    <ChevronRight size={20} className="text-slate-400" />
                </button>
            </div>
        )}
        
        {/* Period Selector Dropdown */}
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
      </header>

      {/* Summary Card with Icon/Name and Total */}
      <div className="px-4 py-2">
          <div className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-slate-100 dark:bg-white/10" style={{ color: category.color }}>
                        <Icon size={20} />
                    </div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">{category.name}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total for {period === 'weekly' ? 'Week' : period === 'monthly' ? 'Month' : 'Period'}</span>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(currentPeriodTotal)}</div>
                </div>
          </div>
      </div>

      {/* Chart */}
      <div className="flex-1 px-2 mt-6 min-h-[300px]">
          <h3 className="px-4 text-sm font-bold text-slate-500 mb-4 uppercase">Trend Analysis</h3>
          <div className="h-[300px] w-full outline-none">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: -10 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={category.color} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={category.color} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis 
                        dataKey="x" 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        interval="preserveStartEnd"
                    />
                    <YAxis 
                        tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                    <Area 
                        type="monotone" 
                        dataKey="y" 
                        stroke={category.color} 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorValue)" 
                        activeDot={{ r: 6, strokeWidth: 4, stroke: 'white', strokeOpacity: 0.5 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};

export default CategoryDetails;