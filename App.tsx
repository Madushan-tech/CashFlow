import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { useApp, AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Stats from './pages/Stats';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import AddTransaction from './pages/AddTransaction';
import Onboarding from './components/Onboarding';
import CategoryDetails from './pages/CategoryDetails';
import { TrendingUp, Lock, X, Plus, PieChart, Wallet } from 'lucide-react';

// Auth Modal for Restricted Actions
const GlobalAuthModal = () => {
    const { authModalState, closeAuthModal, password } = useApp();
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    if (!authModalState.isOpen) return null;

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        if (input === password) {
            setInput('');
            authModalState.onSuccess();
        } else {
            setError(true);
            setInput('');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-xs bg-white dark:bg-card-dark rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-slate-900 dark:text-white">Security Check</h3>
                     <button onClick={closeAuthModal}><X size={20} className="text-slate-500" /></button>
                 </div>
                 <p className="text-sm text-slate-500 mb-4">Enter your password to continue.</p>
                 <form onSubmit={handleVerify}>
                     <input 
                        type="password" 
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setError(false); }}
                        className={`w-full bg-slate-100 dark:bg-black/20 border ${error ? 'border-red-500' : 'border-transparent'} rounded-xl p-3 text-center text-lg font-bold tracking-widest outline-none mb-4`}
                        autoFocus
                        placeholder="••••"
                     />
                     <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-xl">Verify</button>
                 </form>
            </div>
        </div>
    );
};

// New User Guide Modal
const WelcomeGuide = ({ onClose }: { onClose: () => void }) => {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
             <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-blue-300"></div>
                <div className="text-center mb-6 mt-2">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Guide 🚀</h2>
                    <p className="text-slate-500 text-sm mt-1">Get to know your new finance companion</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                        <div className="p-2 bg-blue-100 text-primary rounded-lg">
                            <Plus size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Add Transaction</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Tap the big + button to quickly log expenses, income, or transfers.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                        <div className="p-2 bg-purple-100 text-purple-500 rounded-lg">
                            <PieChart size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Analyze Trends</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Visit the Stats tab to see detailed charts and category breakdowns.</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                         <div className="p-2 bg-orange-100 text-orange-500 rounded-lg">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Manage & Customize</h4>
                            <p className="text-xs text-slate-500 mt-0.5">Use the Edit tab to create custom categories and manage your accounts.</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full mt-6 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
                >
                    Got it!
                </button>
             </div>
        </div>
    );
}

const AppContent = () => {
    const { isOnboarded, isAppLockEnabled, password } = useApp();
    const [showSplash, setShowSplash] = useState(true);
    const [showTagline, setShowTagline] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [lockInput, setLockInput] = useState('');
    const [lockError, setLockError] = useState(false);
    
    // User Guide State
    const [showGuide, setShowGuide] = useState(false);

    // Show splash logic
    useEffect(() => {
        // Tagline delay
        setTimeout(() => setShowTagline(true), 600);
        
        // Hide splash delay
        const timer = setTimeout(() => {
            window.location.hash = '/';
            setShowSplash(false);
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    // Check lock state & Guide state after splash
    useEffect(() => {
        if (!showSplash && isOnboarded) {
            // Check App Lock
            if (isAppLockEnabled && password) {
                setIsLocked(true);
            }
            // Check Guide
            const hasSeenGuide = localStorage.getItem('cf_guide_seen');
            if (!hasSeenGuide) {
                setShowGuide(true);
            }
        }
    }, [showSplash, isOnboarded, isAppLockEnabled, password]);

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (lockInput === password) {
            setIsLocked(false);
        } else {
            setLockError(true);
            setLockInput('');
        }
    };

    const handleCloseGuide = () => {
        localStorage.setItem('cf_guide_seen', 'true');
        setShowGuide(false);
    };

    if (showSplash) {
        return (
             <div className="flex h-screen w-full flex-col items-center justify-center bg-primary text-white">
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl mb-6 animate-in zoom-in duration-500">
                    <TrendingUp className="h-12 w-12 text-primary" strokeWidth={2.5} />
                </div>
                <h1 className="text-4xl font-bold tracking-tight">CashFlow</h1>
                <p 
                    className={`mt-2 text-blue-100 font-medium tracking-wide transition-opacity duration-700 ${showTagline ? 'opacity-100' : 'opacity-0'}`}
                >
                    Track. Save. Grow.
                </p>
            </div>
        );
    }

    if (isLocked) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 mb-6 text-slate-900 dark:text-white">
                    <Lock size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">App Locked</h2>
                <form onSubmit={handleUnlock} className="w-full max-w-xs">
                     <input 
                        type="password" 
                        value={lockInput}
                        onChange={(e) => { setLockInput(e.target.value); setLockError(false); }}
                        className={`w-full bg-white dark:bg-card-dark border ${lockError ? 'border-red-500' : 'border-transparent'} rounded-xl p-4 text-center text-xl font-bold tracking-widest outline-none shadow-sm mb-4`}
                        placeholder="Enter Password"
                        autoFocus
                     />
                     <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg">Unlock</button>
                </form>
            </div>
        );
    }

    if (!isOnboarded) {
        return <Onboarding />;
    }

    return (
        <HashRouter>
            <div className="mx-auto max-w-md bg-background-light dark:bg-background-dark min-h-screen shadow-2xl overflow-hidden relative">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/stats/:id" element={<CategoryDetails />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/add" element={<AddTransaction />} />
            </Routes>
            <Navbar />
            <GlobalAuthModal />
            {showGuide && <WelcomeGuide onClose={handleCloseGuide} />}
            </div>
        </HashRouter>
    );
};

const App = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;