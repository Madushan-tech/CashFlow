import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { TransactionType, Category, Account } from '../types';
import * as LucideIcons from 'lucide-react';
import { Trash2, ChevronDown, ChevronUp, Plus, X, GripVertical, Wallet, AlertTriangle, Loader2, Sparkles, WifiOff } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory, accounts, addAccount, deleteAccount, requestAuth } = useApp();
  
  // Tabs: Income | Expense | Accounts
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'accounts'>('income');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Inline Add Item State (Category)
  const [addingToCatId, setAddingToCatId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  
  // Track input focus to hide FAB
  const [isInputActive, setIsInputActive] = useState(false);

  // Edit Item State
  const [editingItem, setEditingItem] = useState<{catId: string, item: string} | null>(null);

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState<{catId: string, index: number} | null>(null);

  // Delete Confirmation State
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'category' | 'account'; id: string; name: string } | null>(null);

  // New Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatTags, setNewCatTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Icon Selection State
  const [selectedIcon, setSelectedIcon] = useState('HelpCircle');
  const [suggestedIcons, setSuggestedIcons] = useState<string[]>([]);
  const [isIconLoading, setIsIconLoading] = useState(false);

  // New Account Form State
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');

  const filteredCategories = categories.filter(c => c.type === activeTab);

  // --- AI Icon Suggestion Logic ---
  useEffect(() => {
    if (!isModalOpen || activeTab === 'accounts' || newCatName.length < 3) return;

    // Reset suggestions if name is cleared
    if (!newCatName) {
        setSuggestedIcons([]);
        return;
    }

    const fetchIcons = async () => {
        if (!navigator.onLine || !process.env.API_KEY) return;
        
        setIsIconLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Suggest 3 Lucide React icon names (camelCase) for a financial category named "${newCatName}". Return strictly a JSON array of strings. Example: ["Car", "Bus", "Train"]. Do not include markdown formatting or explanations.`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            });
            const text = response.text;
            if(text) {
                const icons = JSON.parse(text);
                setSuggestedIcons(icons);
                // Auto-select first suggested if current is default
                if (selectedIcon === 'HelpCircle' && icons.length > 0) {
                   setSelectedIcon(icons[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching icons", error);
        } finally {
            setIsIconLoading(false);
        }
    }

    const timer = setTimeout(fetchIcons, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [newCatName, isModalOpen, activeTab, selectedIcon]);

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const trimmed = tagInput.trim();
          if (trimmed && !newCatTags.includes(trimmed)) {
              setNewCatTags([...newCatTags, trimmed]);
              setTagInput('');
          }
      }
  };

  const removeTag = (tag: string) => {
      setNewCatTags(newCatTags.filter(t => t !== tag));
  };

  const handleAddCategory = () => {
      if (!newCatName) return;
      addCategory({
          name: newCatName,
          type: activeTab as TransactionType,
          icon: selectedIcon,
          color: activeTab === 'income' ? '#258cf4' : '#EF4444',
          isCustom: true,
          subCategories: newCatTags
      });
      setIsModalOpen(false);
      resetForms();
  };

  const promptDeleteCategory = (id: string, name: string) => {
      setDeleteConfirm({ isOpen: true, type: 'category', id, name });
  };

  const promptDeleteAccount = (id: string, name: string) => {
      setDeleteConfirm({ isOpen: true, type: 'account', id, name });
  };

  const confirmDelete = () => {
      if (!deleteConfirm) return;
      
      if (deleteConfirm.type === 'category') {
          deleteCategory(deleteConfirm.id);
      } else {
          requestAuth(() => {
              deleteAccount(deleteConfirm.id);
          });
      }
      setDeleteConfirm(null);
  };

  const handleAddItem = (cat: Category) => {
      if (!newItemName.trim()) {
          setAddingToCatId(null);
          return;
      }
      const currentSubs = cat.subCategories || [];
      if (!currentSubs.includes(newItemName.trim())) {
          updateCategory(cat.id, { subCategories: [...currentSubs, newItemName.trim()] });
      }
      setNewItemName('');
  };

  const handleDeleteItem = (cat: Category, item: string) => {
      const currentSubs = cat.subCategories || [];
      updateCategory(cat.id, { subCategories: currentSubs.filter(s => s !== item) });
      setEditingItem(null);
  };

  const onDragStart = (e: React.DragEvent, catId: string, index: number) => {
      setDraggedItem({ catId, index });
  };
  const onDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent, cat: Category, dropIndex: number) => {
      e.preventDefault();
      if (!draggedItem || draggedItem.catId !== cat.id) return;
      const currentSubs = [...(cat.subCategories || [])];
      const draggedSub = currentSubs[draggedItem.index];
      currentSubs.splice(draggedItem.index, 1);
      currentSubs.splice(dropIndex, 0, draggedSub);
      updateCategory(cat.id, { subCategories: currentSubs });
      setDraggedItem(null);
  };

  // --- Account Logic ---

  const handleAddAccount = () => {
      if (!newAccName) return;
      addAccount({
          name: newAccName,
          type: 'cash', 
          currency: 'LKR',
          balance: parseFloat(newAccBalance) || 0
      });
      setIsModalOpen(false);
      resetForms();
  };

  const resetForms = () => {
      setNewCatName('');
      setNewCatTags([]);
      setTagInput('');
      setSelectedIcon('HelpCircle');
      setSuggestedIcons([]);
      setNewAccName('');
      setNewAccBalance('');
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsInputActive(true);
      // Wait a moment for keyboard to appear then scroll
      setTimeout(() => {
          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-light dark:bg-background-dark">
      {/* Header - No Back Arrow */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light dark:bg-background-dark p-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Manage</h2>
        <div className="w-10"></div>
      </header>

      {/* Tabs */}
      <div className="px-4 py-2">
        <div className="flex rounded-lg bg-slate-200 dark:bg-card-dark p-1">
          <button onClick={() => setActiveTab('income')} className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${activeTab === 'income' ? 'bg-primary text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}>Income</button>
          <button onClick={() => setActiveTab('expense')} className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${activeTab === 'expense' ? 'bg-primary text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}>Expenses</button>
          <button onClick={() => setActiveTab('accounts')} className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-all ${activeTab === 'accounts' ? 'bg-primary text-white shadow-md' : 'text-slate-500 dark:text-slate-400'}`}>Accounts</button>
        </div>
      </div>

      {/* Content List */}
      <div className="flex flex-col px-4 mt-2 pb-24">
        {activeTab !== 'accounts' ? (
            // CATEGORIES LIST
            filteredCategories.map((category) => {
            const Icon = (LucideIcons as any)[category.icon] || LucideIcons.HelpCircle;
            const isExpanded = expandedId === category.id;
            
            return (
                <div key={category.id} className="border-b border-slate-200 dark:border-white/5 last:border-0">
                    <div 
                        className="flex items-center justify-between py-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : category.id)}
                    >
                        <div className="flex items-center gap-4">
                            <div 
                                className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-white"
                                style={{ color: category.color }}
                            >
                                <Icon size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 dark:text-white">{category.name}</span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">{category.subCategories?.length || 0} sub-items</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </div>
                    </div>
                    
                    {/* Expanded Area */}
                    {isExpanded && (
                        <div className="pl-4 pr-4 pb-4 flex flex-col gap-2 bg-slate-50 dark:bg-white/5 rounded-lg mb-4">
                            
                            {/* New Header: Label + Delete Button */}
                            <div className="flex items-center justify-between mt-2 mb-1">
                                <span className="text-xs font-bold text-slate-500 uppercase">Sub Categories</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); promptDeleteCategory(category.id, category.name); }}
                                    className="p-2 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                    title="Delete Category"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* List of Sub Items */}
                            <div className="flex flex-col gap-1">
                                {category.subCategories?.map((sub, idx) => {
                                    const isEditing = editingItem?.catId === category.id && editingItem?.item === sub;
                                    return (
                                        <div 
                                            key={idx} 
                                            draggable="true"
                                            onDragStart={(e) => onDragStart(e, category.id, idx)}
                                            onDragOver={(e) => onDragOver(e, idx)}
                                            onDrop={(e) => onDrop(e, category, idx)}
                                            onClick={() => setEditingItem(isEditing ? null : { catId: category.id, item: sub })}
                                            className={`flex items-center justify-between text-sm py-3 px-3 rounded-lg border border-transparent cursor-pointer transition-all ${isEditing ? 'bg-white dark:bg-card-dark border-slate-200 dark:border-white/10 shadow-sm' : 'hover:bg-black/5 dark:hover:bg-white/5 border-l-2 border-l-transparent'}`}
                                        >
                                            <span className={`flex-1 text-left ${isEditing ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {sub}
                                            </span>
                                            
                                            {isEditing && (
                                                <div 
                                                    className="flex-none flex items-center gap-3 animate-in fade-in duration-200 ml-2"
                                                    onClick={(e) => e.stopPropagation()} 
                                                >
                                                    <button onClick={() => handleDeleteItem(category, sub)} className="p-1 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-md hover:bg-red-500 hover:text-white"><X size={14} /></button>
                                                    <div className="text-slate-400 cursor-grab active:cursor-grabbing">
                                                        <GripVertical size={16} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Inline Add Item (Moved to Bottom) */}
                            <div className="flex flex-col mt-1">
                                {addingToCatId === category.id ? (
                                    <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                        <input 
                                            id={`input-${category.id}`}
                                            type="text"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddItem(category); } }}
                                            onFocus={handleInputFocus}
                                            onBlur={() => { 
                                                setIsInputActive(false); 
                                                if (newItemName.trim()) handleAddItem(category); else setAddingToCatId(null); 
                                            }}
                                            className="flex-1 bg-white dark:bg-black/20 border border-primary rounded-lg px-3 py-2 text-sm outline-none text-slate-900 dark:text-white"
                                            placeholder="Type item name..."
                                            autoFocus
                                        />
                                        <button onMouseDown={() => setAddingToCatId(null)} className="p-2 bg-slate-300 dark:bg-slate-600 rounded-full text-white"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => { setAddingToCatId(category.id); }}
                                        className="flex items-center justify-center gap-2 text-slate-500 text-sm font-bold py-2 border border-dashed border-slate-300 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <Plus size={16} /> Add Sub Category
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
            })
        ) : (
            // ACCOUNTS LIST
            accounts.map((acc) => {
                 const isExpanded = expandedId === acc.id;
                 return (
                    <div key={acc.id} className="border-b border-slate-200 dark:border-white/5 last:border-0">
                         <div 
                            className="flex items-center justify-between py-4 cursor-pointer"
                            onClick={() => setExpandedId(isExpanded ? null : acc.id)}
                        >
                             <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 dark:bg-white/5 text-slate-900 dark:text-white">
                                    <Wallet size={24} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-slate-900 dark:text-white">{acc.name}</span>
                                    <span className="text-xs text-slate-500 uppercase">{acc.type}</span>
                                </div>
                             </div>
                             {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                        </div>
                         {/* Expanded Area */}
                         {isExpanded && (
                            <div className="pl-4 pr-4 pb-4 flex flex-col gap-2 bg-slate-50 dark:bg-white/5 rounded-lg mb-4">
                                {/* Header Row (Matches Category) */}
                                <div className="flex items-center justify-between mt-2 mb-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Account Details</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); promptDeleteAccount(acc.id, acc.name); }}
                                        className="p-2 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                        title="Delete Account"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <div className="p-3 bg-white dark:bg-card-dark rounded-lg border border-slate-200 dark:border-white/5 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Current Balance</span>
                                        <span className="font-bold text-slate-900 dark:text-white">LKR {acc.balance.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                 )
            })
        )}
      </div>

      {/* FAB - Hides when input is active */}
      {!isInputActive && (
          <div className="fixed bottom-24 right-6 animate-in zoom-in duration-200">
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            >
                <Plus size={32} />
            </button>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-2xl p-6 shadow-xl">
                  <div className="flex flex-col items-center gap-4 text-center">
                      <div className="p-4 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete {deleteConfirm.type === 'category' ? 'Category' : 'Account'}?</h3>
                      <p className="text-sm text-slate-500">
                          Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? 
                          {deleteConfirm.type === 'account' ? ' Transactions linked to this account might display errors.' : ' This action cannot be undone.'}
                      </p>
                      <div className="flex gap-3 w-full mt-2">
                          <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-white/5 font-bold text-slate-700 dark:text-slate-300">Cancel</button>
                          <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-500 font-bold text-white shadow-lg shadow-red-500/30">Delete</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-2xl p-6 shadow-xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto no-scrollbar">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add {activeTab === 'accounts' ? 'Account' : (activeTab === 'income' ? 'Income' : 'Expense')}</h3>
                      <button onClick={() => setIsModalOpen(false)}><X className="text-slate-500" /></button>
                  </div>
                  
                  {activeTab === 'accounts' ? (
                      <div className="space-y-4">
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Account Name</label>
                              <input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="w-full border-b border-slate-300 dark:border-slate-700 bg-transparent py-2 text-slate-900 dark:text-white outline-none focus:border-primary" placeholder="e.g. My Bank / Wallet" />
                           </div>
                           
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Initial Balance</label>
                              <input type="number" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} className="w-full border-b border-slate-300 dark:border-slate-700 bg-transparent py-2 text-slate-900 dark:text-white outline-none focus:border-primary" placeholder="0.00" />
                           </div>
                           <button onClick={handleAddAccount} className="w-full rounded-xl bg-primary py-3 font-bold text-white shadow-lg mt-4">Save Account</button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Category Name</label>
                              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} className="w-full border-b border-slate-300 dark:border-slate-700 bg-transparent py-2 text-slate-900 dark:text-white outline-none focus:border-primary" placeholder="Enter Category Name" />
                          </div>

                          {/* Icon Selector / Suggester */}
                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between">
                                  <span>Icon</span>
                                  {isIconLoading && <span className="flex items-center gap-1 text-primary text-[10px] lowercase"><Loader2 size={10} className="animate-spin" /> asking AI...</span>}
                              </label>
                              <div className="mt-2 flex items-center gap-3">
                                  {/* Selected Icon Preview */}
                                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/10 text-primary border border-primary/20">
                                      {React.createElement((LucideIcons as any)[selectedIcon] || LucideIcons.HelpCircle, { size: 24 })}
                                  </div>
                                  
                                  {/* Suggestions List */}
                                  <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                      {suggestedIcons.length > 0 ? (
                                          suggestedIcons.map(iconName => (
                                              <button 
                                                  key={iconName}
                                                  onClick={() => setSelectedIcon(iconName)}
                                                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors ${selectedIcon === iconName ? 'bg-primary text-white border-primary' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100'}`}
                                                  title={iconName}
                                              >
                                                   {React.createElement((LucideIcons as any)[iconName] || LucideIcons.HelpCircle, { size: 18 })}
                                              </button>
                                          ))
                                      ) : (
                                          <div className="flex h-10 items-center px-2 text-xs text-slate-400 italic">
                                              {newCatName.length > 2 && !isIconLoading && navigator.onLine ? "No suggestions found" : ""}
                                              {!navigator.onLine && <span className="flex items-center gap-1"><WifiOff size={12}/> Offline</span>}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>

                          <div>
                              <label className="text-xs font-bold text-slate-500 uppercase">Sub Categories</label>
                              <div className="flex flex-wrap gap-2 mt-2 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 min-h-[50px]">
                                  {newCatTags.map(tag => (
                                      <span key={tag} className="flex items-center gap-1 bg-white dark:bg-card-dark px-2 py-1 rounded text-xs font-medium text-slate-700 dark:text-white shadow-sm border border-slate-200 dark:border-white/5">
                                          {tag}
                                          <button onClick={() => removeTag(tag)} className="ml-1 text-slate-400 hover:text-red-500"><X size={12} /></button>
                                      </span>
                                  ))}
                                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagInputKeyDown} className="flex-1 bg-transparent outline-none text-sm min-w-[80px]" placeholder="Add item..." />
                              </div>
                          </div>
                          <button onClick={handleAddCategory} className="w-full rounded-xl bg-primary py-3 font-bold text-white shadow-lg mt-4">Save Category</button>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default Categories;