import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, PieChart, Settings, Plus, Wallet } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    // Logic to detect if virtual keyboard is likely open by checking focus on input/textarea
    const handleFocus = (e: FocusEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            setIsKeyboardOpen(true);
        }
    };
    const handleBlur = () => {
        setIsKeyboardOpen(false);
    };

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);

    return () => {
        window.removeEventListener('focusin', handleFocus);
        window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  // Don't show navbar on the add transaction page OR if keyboard is open
  if (location.pathname === '/add' || isKeyboardOpen) return null;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 transition-colors ${
      isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 h-20 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-white/5 pb-2">
      <div className="flex items-center justify-around h-full px-2">
        <NavLink to="/" className={linkClass}>
          <Home size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Home</span>
        </NavLink>
        
        <NavLink to="/stats" className={linkClass}>
          <PieChart size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Stats</span>
        </NavLink>

        <div className="relative -top-6">
          <button 
            onClick={() => navigate('/add')}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
          >
            <Plus size={32} />
          </button>
        </div>

        <NavLink to="/categories" className={linkClass}>
          <Wallet size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Edit</span>
        </NavLink>

        <NavLink to="/settings" className={linkClass}>
          <Settings size={24} strokeWidth={2.5} />
          <span className="text-[10px] font-semibold">Settings</span>
        </NavLink>
      </div>
    </div>
  );
};

export default Navbar;