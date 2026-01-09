
import React, { useState } from 'react';
import { X, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Zap, Wifi } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  view?: 'ABOUT' | 'FEATURES';
  onChangeView?: (view: 'ABOUT' | 'FEATURES') => void;
}

const LATEST_UPDATES = [
  {
    icon: <Wifi size={16} className="text-blue-500" />,
    title: "Offline Capability",
    desc: "App now works fully offline. Data syncs when you return."
  },
  {
    icon: <Zap size={16} className="text-amber-500" />,
    title: "Notification Reminders",
    desc: "Get daily alerts for scheduled payments and realization."
  },
  {
    icon: <Sparkles size={16} className="text-purple-500" />,
    title: "Performance Boost",
    desc: "Faster load times and smoother animations."
  }
];

const FEATURES = [
  {
    section: "Accounts & Assets",
    items: [
      "Track Cash, Savings, and Fixed Deposits",
      "Net Worth Calculation (Assets - Liabilities)",
      "Liquid Cash vs Total Asset Breakdown",
      "Account-specific Transaction History"
    ]
  },
  {
    section: "Loan Management",
    items: [
      "Setup Cash or Asset Loans",
      "Automated Installment Schedules",
      "Down Payment Tracking",
      "Facility Progress & Repayment History"
    ]
  },
  {
    section: "Smart Features",
    items: [
      "Future Transaction Realization Queue",
      "Recurring Expense Tracking (via Loans)",
      "Smart Icon Prediction for Categories",
      "CSV Data Export (Excel/Sheets)"
    ]
  },
  {
    section: "Analysis & Security",
    items: [
      "Interactive Trend Charts (Weekly/Monthly)",
      "Peak Spending Identification",
      "App Lock with PIN Protection",
      "Dark Mode Support"
    ]
  }
];

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, view = 'ABOUT', onChangeView }) => {
  const [showCoreFeatures, setShowCoreFeatures] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="bg-white dark:bg-surface w-full max-w-sm max-h-[85vh] rounded-3xl shadow-2xl animate-scale-up border border-gray-100 dark:border-gray-800 relative overflow-hidden flex flex-col">
        
        {/* Fixed Header */}
        <div className="shrink-0 p-4 border-b border-gray-100 dark:border-gray-800 relative bg-white dark:bg-surface z-10">
            <h3 className="font-bold text-lg dark:text-white px-2">
                {view === 'FEATURES' ? 'Key Features' : 'About CashFlow'}
            </h3>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            {view === 'FEATURES' ? (
                <div className="flex flex-col h-full animate-fade-in min-h-0">
                    
                    {/* Latest Updates Section - Always Visible at Top */}
                    <div className="mb-6 mt-2">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">What's New in v1.2.0</h4>
                        <div className="bg-blue-50/50 dark:bg-[#1E2530] rounded-2xl p-1 border border-blue-100 dark:border-gray-800 shadow-sm">
                            {LATEST_UPDATES.map((update, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 border-b border-blue-100 dark:border-gray-800 last:border-0">
                                    <div className="mt-0.5 shrink-0">{update.icon}</div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold dark:text-white">{update.title}</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{update.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800 mb-6 shrink-0"></div>

                    {/* Expandable Core Features */}
                    <button 
                        onClick={() => setShowCoreFeatures(!showCoreFeatures)}
                        className="flex items-center justify-between w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-4 transition-colors"
                    >
                        <span className="text-sm font-bold dark:text-white">Core Features</span>
                        {showCoreFeatures ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </button>

                    {showCoreFeatures && (
                        <div className="animate-slide-up">
                            {FEATURES.map((section, idx) => (
                                <div key={idx} className="mb-5 last:mb-2">
                                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-1 rounded-md">{section.section}</h4>
                                    <div className="space-y-2.5 px-1">
                                        {section.items.map((item, i) => (
                                            <div key={i} className="flex items-start gap-2.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                                                <CheckCircle2 size={16} className="mt-0.5 text-green-500 shrink-0" />
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center text-center animate-fade-in pt-2">
                    {/* Logo Section */}
                    <div className="w-32 h-32 flex items-center justify-center mb-4 shrink-0 relative group">
                        <img 
                            src="/logo.png" 
                            alt="AuraLabs Logo" 
                            className="w-full h-full object-contain filter drop-shadow-lg transform transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.classList.add('bg-primary', 'rounded-3xl', 'shadow-xl', 'shadow-blue-500/20');
                                const iconContainer = document.createElement('div');
                                iconContainer.className = "flex items-center justify-center w-full h-full";
                                iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>';
                                e.currentTarget.parentElement?.appendChild(iconContainer);
                            }}
                        />
                    </div>
                    
                    <h2 className="text-2xl font-bold dark:text-white mb-2">CashFlow</h2>
                    
                    {/* Clickable Version Badge -> Links to Features View */}
                    <button 
                        onClick={() => onChangeView && onChangeView('FEATURES')}
                        className="text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-primary px-3 py-1.5 rounded-full mb-6 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                        Version 1.2.0
                    </button>
                    
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
                        A simple, minimalist expense tracker designed to help you keep track of your cash, savings, and daily spending habits with ease.
                    </p>

                    <div className="w-full h-px bg-gray-100 dark:bg-gray-800 mb-6 shrink-0"></div>

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Developed By</span>
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-200">AuraLabs</span>
                        <div className="text-[10px] text-gray-400 mt-2">
                            &copy; {new Date().getFullYear()} AuraLabs. All rights reserved.
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
