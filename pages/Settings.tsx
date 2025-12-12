import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Moon, Sun, FileSpreadsheet, Trash2, ChevronRight, Lock, Key, Info, X, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, clearData, transactions, password, setPassword, isAppLockEnabled, setAppLockEnabled, requestAuth } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  // Password Setting State
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');

  // About Modal State
  const [showAbout, setShowAbout] = useState(false);

  const handleExport = (type: 'Excel' | 'Google Sheets') => {
    // CSV with BOM for Excel compatibility
    const BOM = "\uFEFF";
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Category', 'SubCategory', 'Account', 'To Account', 'Note'];
    
    const rows = transactions.map(t => [
        `"${new Date(t.date).toLocaleString()}"`, 
        t.type, 
        t.amount, 
        'LKR',
        t.categoryId || '', 
        t.subCategory || '',
        t.accountId,
        t.toAccountId || '',
        `"${t.note || ''}"`
    ]);

    const csvContent = BOM + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    // Google Sheets generally opens CSVs fine, but Excel needs the BOM
    link.setAttribute("download", `CashFlow_Report_${type.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSavePassword = () => {
      if (!pwdInput) return;
      if (pwdInput !== pwdConfirm) {
          alert("Passwords do not match");
          return;
      }
      setPassword(pwdInput);
      setIsSettingPassword(false);
      setPwdInput('');
      setPwdConfirm('');
  };

  const handleRemovePassword = () => {
      requestAuth(() => {
         setPassword(null);
         setAppLockEnabled(false);
      });
  };

  const handleClearData = () => {
      requestAuth(() => {
          clearData();
          setShowClearConfirm(false);
      });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark pb-24">
      {/* Header - No Back Arrow */}
      <header className="sticky top-0 z-10 flex flex-col gap-2 p-4 bg-background-light dark:bg-background-dark">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">Settings</h1>
      </header>

      <div className="flex flex-col gap-6 p-4">
        {/* Appearance */}
        <section>
          <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Appearance</h2>
          <div className="overflow-hidden rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Dark Mode</span>
              </div>
              <button 
                onClick={toggleTheme}
                className={`relative h-7 w-12 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${theme === 'dark' ? 'left-[26px]' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Security */}
        <section>
          <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Security</h2>
          <div className="overflow-hidden rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
             <div className="p-4 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                        <Key size={20} />
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">App Password</span>
                 </div>
                 {password ? (
                     <div className="flex gap-2">
                        <button onClick={handleRemovePassword} className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full text-xs font-bold">Remove</button>
                     </div>
                 ) : (
                     <button onClick={() => setIsSettingPassword(true)} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">Set</button>
                 )}
             </div>
             
             {password && (
                 <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                            <Lock size={20} />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">App Lock</span>
                    </div>
                    <button 
                        onClick={() => setAppLockEnabled(!isAppLockEnabled)}
                        className={`relative h-7 w-12 rounded-full transition-colors ${isAppLockEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${isAppLockEnabled ? 'left-[26px]' : 'left-1'}`} />
                    </button>
                 </div>
             )}
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Data Management</h2>
          <div className="overflow-hidden rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5">
            <div className="p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                  <FileSpreadsheet size={20} />
                </div>
                <span className="font-medium text-slate-900 dark:text-white">Export Data</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleExport('Excel')}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-700 py-3 text-sm font-semibold text-white hover:bg-green-800"
                >
                    Excel
                </button>
                <button 
                    onClick={() => handleExport('Google Sheets')}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-500 py-3 text-sm font-semibold text-white hover:bg-green-600"
                >
                    Google Sheets
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section>
          <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-red-500">Danger Zone</h2>
          <div className="overflow-hidden rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5">
            <button 
                onClick={() => setShowClearConfirm(true)}
                className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-red-50 dark:hover:bg-red-900/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                <Trash2 size={20} />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-red-500">Clear All Data</span>
                <span className="text-xs text-slate-500">This cannot be undone</span>
              </div>
            </button>
          </div>
        </section>

        {/* About */}
        <section>
            <h2 className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">About</h2>
            <div className="overflow-hidden rounded-xl bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 divide-y divide-slate-100 dark:divide-white/5">
                <div className="flex items-center justify-between p-4">
                    <span className="text-slate-900 dark:text-white">Version</span>
                    <span className="text-slate-500">1.0.0</span>
                </div>
                <button 
                    onClick={() => setShowAbout(true)}
                    className="flex w-full items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                >
                    <span className="text-slate-900 dark:text-white">About CashFlow</span>
                    <ChevronRight size={18} className="text-slate-400" />
                </button>
            </div>
        </section>
      </div>

      {/* Confirm Clear Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-card-dark p-6 text-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Are you sure?</h3>
            <p className="mt-2 text-sm text-slate-500">
              All your expense data will be permanently deleted. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-xl bg-slate-200 dark:bg-slate-700 py-3 font-semibold text-slate-900 dark:text-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearData}
                className="flex-1 rounded-xl bg-red-500 py-3 font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {isSettingPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-card-dark p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Set Password</h3>
                <input 
                    type="password" 
                    value={pwdInput}
                    onChange={(e) => setPwdInput(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full bg-slate-100 dark:bg-black/20 rounded-xl p-3 mb-3 outline-none"
                    autoFocus
                />
                 <input 
                    type="password" 
                    value={pwdConfirm}
                    onChange={(e) => setPwdConfirm(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full bg-slate-100 dark:bg-black/20 rounded-xl p-3 mb-6 outline-none"
                />
                <div className="flex gap-3">
                    <button onClick={() => setIsSettingPassword(false)} className="flex-1 bg-slate-200 dark:bg-white/10 py-3 rounded-xl font-bold">Cancel</button>
                    <button onClick={handleSavePassword} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold">Save</button>
                </div>
            </div>
          </div>
      )}

      {/* About Modal */}
      {showAbout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-card-dark p-6 relative">
                <button onClick={() => setShowAbout(false)} className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                    <X size={24} />
                </button>
                <div className="flex flex-col items-center mb-4">
                    <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-3 shadow-lg">
                         <TrendingUp size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">CashFlow</h2>
                    <p className="text-sm text-primary font-medium">Track. Save. Grow.</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 mb-4 text-left">
                    <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Version 1.0.0 Features</h4>
                    <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside">
                        <li>Comprehensive Expense & Income Tracking</li>
                        <li>Multiple Account Management (Cash, Savings)</li>
                        <li>Category & Sub-category Management</li>
                        <li>Detailed Statistical Analysis & Charts</li>
                        <li>Secure App Lock & Password Protection</li>
                        <li>Data Export (Excel / Google Sheets)</li>
                    </ul>
                </div>

                <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300 text-center">
                    <p>
                        A modern, minimalistic expense tracking application designed to help you manage your finances with ease.
                    </p>
                    <p className="pt-2 text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} CashFlow App
                    </p>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default Settings;