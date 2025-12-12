import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatInputNumber, parseInputNumber } from '../utils';
import { TrendingUp, Wallet, ArrowRight, Building2, Landmark } from 'lucide-react';

const Onboarding = () => {
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState(0); // 0: Splash, 1: Balances
  const [balances, setBalances] = useState({ cash: '', savings: '', deposit: '' });

  // Splash Effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setStep(1);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (field: keyof typeof balances, value: string) => {
      const formatted = formatInputNumber(value);
      setBalances(prev => ({ ...prev, [field]: formatted }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboarding({
        cash: parseInputNumber(balances.cash),
        savings: parseInputNumber(balances.savings),
        deposit: parseInputNumber(balances.deposit)
    });
  };

  if (step === 0) {
      return (
          <div className="flex h-screen w-full flex-col items-center justify-center bg-primary text-white">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-xl mb-6">
                  <TrendingUp className="h-12 w-12 text-primary" strokeWidth={2.5} />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">CashFlow</h1>
              <p className="mt-2 text-blue-100 font-medium tracking-wide">Track. Save. Grow.</p>
          </div>
      );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark px-6 py-10">
      <div className="flex flex-col gap-2 mb-10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome! 👋</h1>
        <p className="text-slate-500">Let's set up your initial balances (LKR) to get started.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="space-y-6">
            {/* Cash */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Wallet size={16} /> Cash in Hand
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">LKR</span>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        value={balances.cash}
                        onChange={(e) => handleInputChange('cash', e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border-none bg-white dark:bg-card-dark p-4 pl-14 text-lg font-bold text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
            </div>

            {/* Savings */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Building2 size={16} /> Savings Account
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">LKR</span>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        value={balances.savings}
                        onChange={(e) => handleInputChange('savings', e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border-none bg-white dark:bg-card-dark p-4 pl-14 text-lg font-bold text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
            </div>

            {/* Deposit */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Landmark size={16} /> Fixed Deposit
                </label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">LKR</span>
                    <input 
                        type="text" 
                        inputMode="numeric"
                        value={balances.deposit}
                        onChange={(e) => handleInputChange('deposit', e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border-none bg-white dark:bg-card-dark p-4 pl-14 text-lg font-bold text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10 focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
            </div>
        </div>

        <div className="flex-grow"></div>

        <button 
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
        >
            Start Tracking <ArrowRight size={20} />
        </button>
      </form>
    </div>
  );
};

export default Onboarding;
