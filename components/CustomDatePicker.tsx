
import React, { useState, useEffect, useRef, UIEvent } from 'react';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isWeekend
} from 'date-fns';

interface CustomDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'DATE' | 'TIME';
}

// Configuration
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 240px
const PADDING_Y = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2; // 96px

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i);   // 0-59
const PERIODS = ['AM', 'PM'];

// --- Helper: Get Sri Lanka Time Components ---
const getSLTimeComponents = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    hour12: false,
    hour: 'numeric',
    minute: 'numeric'
  });
  const parts = formatter.formatToParts(new Date());
  const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  return { h, m };
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange, isOpen, onClose, initialView = 'DATE' }) => {
  const [view, setView] = useState<'DATE' | 'TIME'>(initialView);
  const [currentMonth, setCurrentMonth] = useState(value);
  
  // State for Date View
  const [selectedDate, setSelectedDate] = useState(value);

  // State for Time View (Independent until save)
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');

  useEffect(() => {
    if (isOpen) {
        // Initialize View
        setView(initialView);
        setCurrentMonth(value);
        setSelectedDate(value);

        // Time Initialization Logic
        const now = new Date();
        const isCreation = Math.abs(now.getTime() - value.getTime()) < 60000; // within 1 minute

        let h, m;
        if (isCreation) {
            const sl = getSLTimeComponents();
            h = sl.h;
            m = sl.m;
        } else {
            h = value.getHours();
            m = value.getMinutes();
        }

        // Convert 24h to 12h for the picker state
        const p = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 || 12;

        setHour(displayH);
        setMinute(m);
        setPeriod(p);
    }
  }, [isOpen, value, initialView]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleDateSelect = (day: Date) => {
    setSelectedDate(day);
    setView('TIME');
  };

  const handleSave = () => {
    // Combine selectedDate + hour/minute/period
    const finalDate = new Date(selectedDate);
    
    let h = hour;
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;

    finalDate.setHours(h);
    finalDate.setMinutes(minute);
    
    onChange(finalDate);
    onClose();
  };

  // --- Wheel Component ---
  const Wheel = ({ items, value, onChange, loop = true }: { items: (number|string)[], value: number|string, onChange: (v: any) => void, loop?: boolean }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const displayItems = loop ? [...items, ...items, ...items, ...items, ...items] : items;
    
    useEffect(() => {
       if (scrollRef.current) {
           const idx = items.indexOf(value as never);
           if (idx !== -1) {
               // Center in the middle set (3rd set of 5)
               const offset = loop ? items.length * 2 : 0;
               const targetIdx = offset + idx;
               scrollRef.current.scrollTop = targetIdx * ITEM_HEIGHT;
           }
       }
    }, []); 

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        const idx = Math.round(scrollTop / ITEM_HEIGHT);
        const actualIdx = idx % items.length;
        
        if (items[actualIdx] !== value) {
            onChange(items[actualIdx]);
        }

        // Infinite Scroll Reset
        if (loop) {
            const singleSetHeight = items.length * ITEM_HEIGHT;
            if (scrollTop < singleSetHeight) {
                e.currentTarget.scrollTop += singleSetHeight * 2;
            } else if (scrollTop > singleSetHeight * 4) {
                e.currentTarget.scrollTop -= singleSetHeight * 2;
            }
        }
    };

    return (
        <div className="h-full flex-1 relative overflow-hidden group">
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory"
                style={{ paddingBlock: `${PADDING_Y}px` }}
            >
                {displayItems.map((item, i) => (
                    <div key={i} className={`h-[48px] flex items-center justify-center snap-center transition-all duration-200 cursor-pointer ${item === value ? 'text-xl font-bold text-primary scale-110' : 'text-sm font-medium text-gray-400 opacity-40 scale-90'}`}>
                        {typeof item === 'number' ? item.toString().padStart(2, '0') : item}
                    </div>
                ))}
            </div>
        </div>
    );
  };

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = (monthStart.getDay() + 6) % 7; 
  const padding = Array(startDay).fill(null);
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-surface w-full sm:w-[380px] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col relative">
        
        {/* Header */}
        <div className="bg-primary px-5 py-4 text-white shrink-0">
          <div className="flex items-center justify-between mb-3">
             <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">Select Date & Time</span>
             <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><X size={18} /></button>
          </div>
          
          <div className="flex items-end justify-between w-full mt-2">
             {/* Left: Date */}
             <div 
               className={`flex flex-col text-left cursor-pointer transition-opacity ${view === 'DATE' ? 'opacity-100' : 'opacity-60'}`}
               onClick={() => setView('DATE')}
             >
                <span className="text-3xl font-bold leading-none">{format(selectedDate, 'd MMM')}</span>
                <span className="text-[11px] font-medium opacity-80 mt-1">{format(selectedDate, 'yyyy')}</span>
             </div>

             {/* Right: Time */}
             <div 
               className={`flex flex-col text-right cursor-pointer transition-opacity ${view === 'TIME' ? 'opacity-100' : 'opacity-60'}`}
               onClick={() => setView('TIME')}
             >
                <span className="text-3xl font-bold leading-none">
                    {hour}:{minute.toString().padStart(2, '0')} <span className="text-lg">{period}</span>
                </span>
                <span className="text-[11px] font-medium opacity-80 mt-1">Sri Lanka Time (UTC+5:30)</span>
             </div>
          </div>
        </div>

        {/* Body - Fixed Height Container for Consistent Layout */}
        <div className="p-4 bg-white dark:bg-surface w-full">
            <div className="h-[260px] relative">
                {view === 'DATE' ? (
                    <div className="animate-fade-in h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white">
                                <ChevronLeft size={20} />
                            </button>
                            <span className="font-bold dark:text-white text-sm">{format(currentMonth, 'MMMM yyyy')}</span>
                            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full dark:text-white">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 text-center mb-1">
                            {weekDays.map(d => (
                            <span key={d} className="text-[10px] font-bold text-gray-400">{d}</span>
                            ))}
                        </div>
                        
                        <div className="grid grid-cols-7 gap-1 flex-1 overflow-y-auto no-scrollbar content-start">
                            {padding.map((_, i) => <div key={`pad-${i}`} />)}
                            {daysInMonth.map(day => {
                                const isSelected = isSameDay(day, selectedDate);
                                const isWknd = isWeekend(day);
                                
                                return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => handleDateSelect(day)}
                                    className={`aspect-square rounded-full text-sm font-medium flex items-center justify-center transition-all relative
                                    ${isSelected 
                                        ? 'bg-primary text-white shadow-lg shadow-blue-500/30' 
                                        : isWknd
                                            ? 'text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }
                                    ${isSameDay(day, new Date()) && !isSelected ? 'border border-primary text-primary' : ''}
                                    `}
                                >
                                    {format(day, 'd')}
                                </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center relative animate-fade-in">
                        {/* Visual Lens */}
                        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[48px] bg-primary/5 border-y border-primary/20 pointer-events-none z-10 rounded-lg mx-2"></div>
                        
                        {/* Gradient Masks */}
                        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white dark:from-surface to-transparent z-20 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-surface to-transparent z-20 pointer-events-none"></div>

                        <div className="flex w-full h-[240px] relative z-0 mt-2.5"> {/* Centered vertically within 260px container */}
                            <Wheel items={HOURS} value={hour} onChange={setHour} />
                            <div className="flex items-center justify-center font-bold text-2xl text-gray-300 pb-1 z-30 pointer-events-none">:</div>
                            <Wheel items={MINUTES} value={minute} onChange={setMinute} />
                            <Wheel items={PERIODS} value={period} onChange={setPeriod} loop={false} />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-surface">
           <button 
             onClick={handleSave}
             className="w-full bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
           >
             <Check size={18} />
             <span>Confirm Time</span>
           </button>
        </div>

      </div>
    </div>
  );
};
