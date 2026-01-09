
import React, { useState, useMemo } from 'react';
import { Account, AccountType } from '../types';
import { ArrowRight, Wallet, Landmark, Building2, CheckCircle2, TrendingUp } from 'lucide-react';

interface OnboardingProps {
  accounts: Account[];
  onComplete: (updatedAccounts: Account[]) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ accounts, onComplete }) => {
  const [balances, setBalances] = useState<Record<string, string>>({});

  const formatNumber = (numStr: string) => {
    if (!numStr) return '';
    const clean = numStr.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handleBalanceChange = (id: string, value: string) => {
    const clean = value.replace(/,/g, '');
    if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
      setBalances(prev => ({ ...prev, [id]: clean }));
    }
  };

  const totalBalance = useMemo(() => {
    return Object.values(balances).reduce((acc: number, val: string) => acc + (parseFloat(val) || 0), 0);
  }, [balances]);

  const handleComplete = () => {
    const updatedAccounts = accounts.map(acc => ({
      ...acc,
      balance: parseFloat(balances[acc.id] || '0')
    }));
    onComplete(updatedAccounts);
  };

  const getAccountInfo = (type: AccountType) => {
      switch (type) {
          case AccountType.CASH: 
            return { 
                icon: <Wallet className="text-emerald-400" size={20} />, 
                color: 'from-emerald-500/20 to-emerald-500/5',
                border: 'border-emerald-500/20',
                label: 'Liquid Cash',
                desc: 'Physical cash or wallet balance'
            };
          case AccountType.SAVINGS: 
            return { 
                icon: <Landmark className="text-blue-400" size={20} />, 
                color: 'from-blue-500/20 to-blue-500/5',
                border: 'border-blue-500/20',
                label: 'Bank Savings',
                desc: 'Primary bank account balance'
            };
          case AccountType.FIXED_DEPOSIT: 
            return { 
                icon: <Building2 className="text-purple-400" size={20} />, 
                color: 'from-purple-500/20 to-purple-500/5',
                border: 'border-purple-500/20',
                label: 'Fixed Assets',
                desc: 'Investments and FD accounts'
            };
          default: 
            return { 
                icon: <Wallet size={20} />, 
                color: 'from-gray-500/20 to-gray-500/5',
                border: 'border-gray-500/20',
                label: 'Account',
                desc: 'Starting balance'
            };
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background text-white animate-fade-in overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#258cf4_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
      
      {/* Header Section */}
      <div className="relative pt-10 pb-6 px-6 shrink-0 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <TrendingUp className="text-white" size={18} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Set Your Path</h1>
        </div>
        <p className="text-text-muted text-[11px] max-w-xs mb-6 font-medium">
            Enter your current balances to initialize your wealth tracking.
        </p>

        {/* Total Summary Card */}
        <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-5">
                <CheckCircle2 size={60} />
            </div>
            <span className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] mb-1 block">Starting Net Worth</span>
            <div className="flex items-baseline gap-2">
                <span className="text-[11px] font-bold text-text-muted">LKR</span>
                <span className="text-2xl font-black tracking-tight transition-all">
                    {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                </span>
            </div>
        </div>
      </div>

      {/* Input List */}
      <div className="relative flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar pb-32">
        {accounts.map(acc => {
            const info = getAccountInfo(acc.type);
            const hasValue = parseFloat(balances[acc.id] || '0') > 0;
            
            return (
                <div key={acc.id} className={`group relative bg-surface border transition-all duration-300 rounded-2xl p-4 ${hasValue ? 'border-primary/50 shadow-lg shadow-primary/5' : 'border-white/5'}`}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${info.color} border ${info.border}`}>
                                {info.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] font-bold text-gray-100">{acc.name}</span>
                                <span className="text-[9px] text-text-muted font-medium uppercase tracking-tight">{info.desc}</span>
                            </div>
                        </div>
                        {hasValue && (
                            <div className="text-primary animate-scale-up">
                                <CheckCircle2 size={16} />
                            </div>
                        )}
                    </div>
                    
                    <div className="relative flex items-center bg-background/50 rounded-xl border border-white/5 px-3 py-2.5 focus-within:border-primary/40 transition-colors">
                        <span className="text-[10px] font-bold text-text-muted mr-2">LKR</span>
                        <input 
                            type="text" 
                            inputMode="decimal"
                            value={formatNumber(balances[acc.id] || '')}
                            onChange={(e) => handleBalanceChange(acc.id, e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-transparent text-xl font-bold text-white outline-none placeholder-white/5"
                        />
                    </div>
                </div>
            );
        })}
        
        <div className="py-2 px-2">
            <div className="flex items-start gap-2.5 p-3 bg-white/5 rounded-xl border border-white/5">
                <CheckCircle2 size={14} className="text-primary mt-0.5 shrink-0" />
                <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                    By confirming, these amounts will be recorded as <b>Opening Balance</b> transactions for today.
                </p>
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-10">
        <button 
            onClick={handleComplete}
            className="w-full h-14 bg-primary text-white rounded-xl font-bold text-base shadow-2xl shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-blue-500"
        >
            <span>Finish Setup</span>
            <ArrowRight size={18} className="animate-pulse" />
        </button>
      </div>
    </div>
  );
};
