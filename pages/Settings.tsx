
import React, { useState } from 'react';
import { Moon, Sun, Trash2, ShieldCheck, ChevronRight, Bell, Smartphone, Info, Download, FileText, FileSpreadsheet, Lock, AlertTriangle } from 'lucide-react';
import { Transaction, Account, Category } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { PinModal } from '../components/PinModal';
import { AboutModal } from '../components/AboutModal';
import { requestNotificationPermission } from '../services/notifications';
import { format } from 'date-fns';

interface SettingsProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onClearData: () => void;
  securityPin?: string;
  onSetPin: (pin?: string) => void;
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  notificationsEnabled?: boolean;
  onToggleNotifications?: (enabled: boolean) => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  theme, onToggleTheme, onClearData, securityPin, onSetPin, 
  transactions, accounts, categories,
  notificationsEnabled, onToggleNotifications 
}) => {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinMode, setPinMode] = useState<'SET' | 'REMOVE'>('SET');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [aboutView, setAboutView] = useState<'ABOUT' | 'FEATURES' | null>(null);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const handlePinToggle = () => {
    if (securityPin) {
        setPinMode('REMOVE');
        setIsPinModalOpen(true);
    } else {
        setPinMode('SET');
        setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = (pin?: string) => {
    onSetPin(pin);
    setIsPinModalOpen(false);
  };

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      if (onToggleNotifications) {
          onToggleNotifications(false);
          setNotificationError(null);
      }
    } else {
      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          if (onToggleNotifications) {
              onToggleNotifications(true);
              setNotificationError(null);
          }
        } else {
           setNotificationError("Permission denied. Enable notifications in browser settings.");
        }
      } catch (e) {
          setNotificationError("Browser doesn't support notifications.");
      }
    }
  };

  const handleExport = () => {
      // Simple CSV Export Logic
      const headers = ['Date', 'Type', 'Category', 'SubCategory', 'Amount', 'Account', 'Note', 'Status'];
      const rows = transactions.map(t => {
          const cat = categories.find(c => c.id === t.categoryId)?.name || t.categoryId;
          const acc = accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
          return [
              format(t.date, 'yyyy-MM-dd HH:mm'),
              t.type,
              cat,
              t.subCategory || '',
              t.amount,
              acc,
              t.note || '',
              t.status || 'verified'
          ].join(',');
      });
      
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `cashflow_export_${format(new Date(), 'yyyyMMdd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <button 
        onClick={(e) => { e.stopPropagation(); onChange(); }}
        className={`w-11 h-6 rounded-full p-1 transition-colors ${checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
    >
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-background pt-6 px-4 pb-24">
      <h2 className="text-2xl font-bold dark:text-white mb-6">Settings</h2>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-6">
        
        {/* APPEARANCE */}
        <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Appearance</h3>
            <div className="bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-4" onClick={onToggleTheme}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        </div>
                        <span className="font-bold text-sm dark:text-white">Dark Theme</span>
                    </div>
                    <ToggleSwitch checked={theme === 'dark'} onChange={onToggleTheme} />
                </div>
            </div>
        </div>

        {/* NOTIFICATIONS */}
        <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Notifications</h3>
            <div className="bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-4" onClick={handleNotificationToggle}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                            <Bell size={20} />
                        </div>
                        <span className="font-bold text-sm dark:text-white">Daily Reminders</span>
                    </div>
                    <ToggleSwitch checked={!!notificationsEnabled} onChange={handleNotificationToggle} />
                </div>
                {notificationError && (
                    <div className="px-4 pb-4 animate-fade-in">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">
                            <AlertTriangle size={14} />
                            {notificationError}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* SECURITY */}
        <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Security</h3>
            <div className="bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="flex items-center justify-between p-4" onClick={handlePinToggle}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                            {securityPin ? <ShieldCheck size={20} /> : <Lock size={20} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm dark:text-white">App Lock</span>
                            <span className="text-[10px] text-gray-400 font-bold">{securityPin ? 'Secure' : 'Not Secure'}</span>
                        </div>
                    </div>
                    <ToggleSwitch checked={!!securityPin} onChange={handlePinToggle} />
                </div>
            </div>
        </div>

        {/* DATA MANAGEMENT */}
        <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">Data Management</h3>
            <div className="bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                        <Download size={20} />
                    </div>
                    <span className="font-bold text-sm dark:text-white">Export Data</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={handleExport} className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <FileText size={16} className="text-green-600" />
                        <span className="text-xs font-bold dark:text-white">MS Excel</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <FileSpreadsheet size={16} className="text-green-500" />
                        <span className="text-xs font-bold dark:text-white">Google Sheets</span>
                    </button>
                </div>

                <button 
                    onClick={() => setIsClearModalOpen(true)}
                    className="w-full flex items-center gap-3 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                >
                    <Trash2 size={20} />
                    <span className="font-bold text-sm">Clear Data</span>
                </button>
            </div>
        </div>

        {/* ABOUT */}
        <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-1">About</h3>
            <div className="bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <button 
                    onClick={() => setAboutView('FEATURES')}
                    className="w-full flex items-center justify-between p-4 border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                            <Info size={20} />
                        </div>
                        <span className="font-bold text-sm dark:text-white">Version</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">1.2.0</span>
                        <ChevronRight size={16} className="text-gray-400" />
                    </div>
                </button>

                <button 
                    onClick={() => setAboutView('ABOUT')}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                            <Smartphone size={20} />
                        </div>
                        <span className="font-bold text-sm dark:text-white">About CashFlow</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-400" />
                </button>
            </div>
        </div>
        
      </div>

      <PinModal 
        isOpen={isPinModalOpen} 
        mode={pinMode} 
        existingPin={securityPin} 
        onSuccess={handlePinSuccess} 
        onClose={() => setIsPinModalOpen(false)}
      />

      <ConfirmModal 
        isOpen={isClearModalOpen} 
        title="Reset Application" 
        message="This will permanently delete all your transaction data, accounts, and settings. This action cannot be undone." 
        onConfirm={() => { onClearData(); setIsClearModalOpen(false); }} 
        onCancel={() => setIsClearModalOpen(false)} 
      />

      <AboutModal 
        isOpen={!!aboutView} 
        onClose={() => setAboutView(null)} 
        view={aboutView || 'ABOUT'} 
        onChangeView={setAboutView}
      />
    </div>
  );
};
