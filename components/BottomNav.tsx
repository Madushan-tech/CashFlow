
import React, { useEffect, useState } from 'react';
import { Home, BarChart2, Wallet, Settings, Plus } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onAddClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, onAddClick }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsVisible(false);
      }
    };

    const handleBlur = () => {
       // Small delay to ensure we don't flash if moving between inputs
       setTimeout(() => setIsVisible(true), 100);
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  if (!isVisible) return null;

  const navItemClass = (view: ViewState) => 
    `flex flex-col items-center justify-center gap-1 w-full h-full ${
      currentView === view 
        ? 'text-primary' 
        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-background border-t border-gray-200 dark:border-gray-800 z-40 pb-1 animate-fade-in">
      <div className="flex justify-between items-center h-full px-2 relative">
        
        <button onClick={() => onChangeView('HOME')} className={navItemClass('HOME')}>
          <Home size={22} strokeWidth={currentView === 'HOME' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Home</span>
        </button>

        <button onClick={() => onChangeView('STATS')} className={navItemClass('STATS')}>
          <BarChart2 size={22} strokeWidth={currentView === 'STATS' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Stats</span>
        </button>

        {/* Floating Action Button Container - Centered */}
        <div className="relative -top-6 w-full flex justify-center pointer-events-none">
             <button 
              onClick={onAddClick}
              className="pointer-events-auto w-12 h-12 bg-primary rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white transform transition-transform active:scale-95 hover:bg-blue-600"
            >
              <Plus size={24} />
            </button>
        </div>

        <button onClick={() => onChangeView('EDIT')} className={navItemClass('EDIT')}>
          <Wallet size={22} strokeWidth={currentView === 'EDIT' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Edit</span>
        </button>

        <button onClick={() => onChangeView('SETTINGS')} className={navItemClass('SETTINGS')}>
          <Settings size={22} strokeWidth={currentView === 'SETTINGS' ? 2.5 : 2} />
          <span className="text-[10px] font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};
