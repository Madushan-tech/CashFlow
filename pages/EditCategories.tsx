
import React, { useState, useMemo } from 'react';
import { TransactionType, Category, Transaction, Account } from '../types';
import { Icon } from '../components/Icon';
import { ChevronRight, ChevronDown, Plus, GripVertical, Trash2, Banknote, History, ShieldAlert, Eye, X, Edit2, CheckCircle2 } from 'lucide-react';
import { CreateCategoryModal } from '../components/CreateCategoryModal';
import { LoanModal } from '../components/LoanModal';
import { LoanDetailsModal } from '../components/LoanDetailsModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { format } from 'date-fns';

interface EditCategoriesProps {
  categories: Category[];
  transactions: Transaction[];
  accounts: Account[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void; 
  onAddLoan: (t: Omit<Transaction, 'id'>, existingId?: string) => void;
  onDeleteTransaction?: (id: string) => void;
}

type TabType = TransactionType | 'LOAN';

export const EditCategories: React.FC<EditCategoriesProps> = ({ 
  categories, transactions, accounts, onAddCategory, onUpdateCategory, onDeleteCategory, onAddLoan, onDeleteTransaction 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(TransactionType.EXPENSE);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Transaction | null>(null);
  const [loanDetailView, setLoanDetailView] = useState<Transaction | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, id: string | null }>({ isOpen: false, id: null });
  
  const [newSubInputs, setNewSubInputs] = useState<Record<string, string>>({});

  const displayedCategories = categories
    .filter(c => c.type === activeTab && c.id !== '0');

  const parentLoans = useMemo(() => {
    return transactions.filter(t => t.isLoanParent);
  }, [transactions]);

  const activeParentLoans = parentLoans.filter(l => !l.isSettled);
  const settledParentLoans = parentLoans.filter(l => l.isSettled);

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddSubCategory = (categoryId: string) => {
    const text = newSubInputs[categoryId]?.trim();
    if (!text) return;
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    const newSubs = [...(category.subCategories || []), text];
    onUpdateCategory({ ...category, subCategories: newSubs });
    setNewSubInputs(prev => ({ ...prev, [categoryId]: '' }));
  };

  const handleRemoveSub = (categoryId: string, index: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    const newSubs = (category.subCategories || []).filter((_, i) => i !== index);
    onUpdateCategory({ ...category, subCategories: newSubs });
  };

  const handleInitiateDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteConfirmation({ isOpen: true, id });
  };

  const handleConfirmDelete = () => {
      if (deleteConfirmation.id) {
          onDeleteCategory(deleteConfirmation.id);
      }
      setDeleteConfirmation({ isOpen: false, id: null });
  };

  const handleEditLoan = (e: React.MouseEvent, loan: Transaction) => {
      e.stopPropagation();
      setEditingLoan(loan);
      setIsLoanModalOpen(true);
  };

  const formatLKR = (amount: number) => amount.toLocaleString('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 });

  const getSimpleLoanProgress = (parent: Transaction) => {
    const parts = transactions.filter(t => t.relatedTransactionId === parent.id);
    const repayableTotal = (parent.totalInstallments || 0) * (parent.installmentFee || 0);
    const repaid = parts
        .filter(t => t.status === 'verified' && t.type === TransactionType.EXPENSE && t.subCategory !== 'Down Payment')
        .reduce((acc, t) => acc + t.amount, 0);
    const remaining = Math.max(0, repayableTotal - repaid);
    const progress = repayableTotal > 0 ? (repaid / repayableTotal) * 100 : 0;
    
    const nextInstallment = parts
        .filter(t => t.status === 'pending' && t.type === TransactionType.EXPENSE)
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

    return { remaining, progress, repaid, repayableTotal, nextInstallment };
  };

  return (
    <>
    <div className="flex flex-col h-full pt-6 pb-24 px-4 bg-gray-50 dark:bg-background">
      <div className="flex items-center justify-between mb-6">
         <h2 className="text-xl font-bold dark:text-white">Management</h2>
      </div>

      <div className="flex bg-gray-200 dark:bg-surface p-1 rounded-xl mb-6 shrink-0 shadow-sm border border-gray-100 dark:border-gray-800">
        <button onClick={() => { setActiveTab(TransactionType.INCOME); setExpandedId(null); }} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === TransactionType.INCOME ? 'bg-white dark:bg-background text-primary shadow-sm' : 'text-gray-500'}`}>Income</button>
        <button onClick={() => { setActiveTab(TransactionType.EXPENSE); setExpandedId(null); }} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === TransactionType.EXPENSE ? 'bg-white dark:bg-background text-danger shadow-sm' : 'text-gray-500'}`}>Expenses</button>
        <button onClick={() => { setActiveTab('LOAN'); setExpandedId(null); }} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === 'LOAN' ? 'bg-white dark:bg-background text-primary shadow-sm' : 'text-gray-500'}`}>Loans</button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {activeTab === 'LOAN' ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            {activeParentLoans.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                        <ShieldAlert size={14} className="text-primary" /> Active Facilities
                    </h3>
                    <div className="flex flex-col gap-4">
                        {activeParentLoans.map(loan => {
                            const { remaining, progress, repaid, repayableTotal, nextInstallment } = getSimpleLoanProgress(loan);
                            const isExpanded = expandedId === loan.id;

                            return (
                                <div key={loan.id} className="bg-white dark:bg-surface rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-all duration-300">
                                    <div 
                                        className="p-5 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/50"
                                        onClick={() => handleExpand(loan.id)}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-base font-bold dark:text-white leading-none">{loan.note}</h4>
                                                    <span className="text-[8px] font-bold bg-blue-100 dark:bg-blue-900/30 text-primary px-1.5 py-0.5 rounded uppercase">{loan.loanType}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    Next: {nextInstallment ? format(nextInstallment.date, 'MMM d, yyyy') : 'No pending due'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] text-gray-400 font-bold uppercase">Balance</span>
                                                <span className="text-base font-black text-primary leading-none">{formatLKR(remaining)}</span>
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-1 overflow-hidden">
                                            <div className="bg-primary h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[8px] font-bold text-gray-400 uppercase tracking-tighter">
                                            <span>{progress.toFixed(0)}% Repaid ({formatLKR(repaid)})</span>
                                            <span>Total Due: {formatLKR(repayableTotal)}</span>
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="flex items-center justify-end gap-3 pb-5 pt-1 px-5 animate-slide-up border-t border-gray-50 dark:border-gray-800/50">
                                            <button onClick={(e) => { e.stopPropagation(); setLoanDetailView(loan); }} className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform">
                                                <Eye size={16} />
                                            </button>
                                            <button onClick={(e) => handleEditLoan(e, loan)} className="w-9 h-9 rounded-full bg-gray-500 flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onDeleteTransaction?.(loan.id); }} className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {settledParentLoans.length > 0 && (
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1 flex items-center gap-2">
                        <History size={14} /> Completed Facilities
                    </h3>
                    <div className="flex flex-col gap-3 opacity-60">
                        {settledParentLoans.map(loan => {
                            const isExpanded = expandedId === loan.id;
                            return (
                                <div key={loan.id} className="bg-white dark:bg-surface border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300">
                                    <div 
                                        className="p-4 flex items-center justify-between cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/50"
                                        onClick={() => handleExpand(loan.id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center text-green-600">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold dark:text-gray-200">{loan.note}</span>
                                                <span className="text-[9px] text-gray-500 uppercase">Fully Settled</span>
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="flex items-center justify-end gap-3 pb-4 pt-1 px-4 animate-slide-up border-t border-gray-50 dark:border-gray-800/50">
                                            <button onClick={(e) => { e.stopPropagation(); setLoanDetailView(loan); }} className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform">
                                                <Eye size={14} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onDeleteTransaction?.(loan.id); }} className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-sm active:scale-90 transition-transform">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {parentLoans.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-surface rounded-full flex items-center justify-center mb-4 border border-dashed border-gray-300 dark:border-gray-700">
                        <Banknote size={32} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-bold">No loan facilities found.</p>
                </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-fade-in">
            {displayedCategories.map(category => (
              <div key={category.id} className="bg-white dark:bg-surface rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all overflow-hidden">
                 <div className="flex items-center justify-between p-4 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800/50" onClick={() => handleExpand(category.id)}>
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          <Icon name={category.icon} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold dark:text-white text-base leading-tight">{category.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{(category.subCategories || []).length} Subcategories</span>
                        </div>
                    </div>
                    {expandedId === category.id ? <ChevronDown className="text-gray-400" size={18} /> : <ChevronRight className="text-gray-400" size={18} />}
                 </div>

                 {expandedId === category.id && (
                     <div className="px-4 pb-4 animate-fade-in border-t border-gray-100 dark:border-gray-800 pt-4 bg-gray-50/50 dark:bg-background/20">
                         <div className="flex justify-end mb-3">
                            <button type="button" onClick={(e) => handleInitiateDelete(e, category.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors">
                                <Trash2 size={14} />
                                <span className="text-[10px] font-bold uppercase">Delete Category</span>
                            </button>
                         </div>
                         <div className="flex flex-col gap-2">
                             {category.subCategories && category.subCategories.map((sub, index) => (
                                 <div key={index} className="flex items-center gap-2 bg-white dark:bg-background/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm group">
                                     <GripVertical size={14} className="text-gray-300" />
                                     <span className="flex-1 text-sm font-bold dark:text-gray-200">{sub}</span>
                                     <button onClick={() => handleRemoveSub(category.id, index)} className="text-gray-400 hover:text-red-500 p-1">
                                         <X size={14} />
                                     </button>
                                 </div>
                             ))}
                             <div className="flex items-center gap-2 bg-blue-50/50 dark:bg-blue-900/10 p-2 rounded-xl border border-dashed border-blue-200 dark:border-blue-900/40">
                                 <Plus size={16} className="text-primary ml-1" />
                                 <input type="text" placeholder="Add sub-category..." value={newSubInputs[category.id] || ''} onChange={(e) => setNewSubInputs(prev => ({ ...prev, [category.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && handleAddSubCategory(category.id)} className="flex-1 bg-transparent text-xs font-bold dark:text-white outline-none placeholder-blue-300" />
                                 {newSubInputs[category.id] && <button onClick={() => handleAddSubCategory(category.id)} className="text-[10px] font-black uppercase bg-primary text-white px-3 py-1.5 rounded-lg">Add</button>}
                             </div>
                         </div>
                     </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 right-6 flex flex-col gap-4">
        <button onClick={() => { setEditingLoan(null); activeTab === 'LOAN' ? setIsLoanModalOpen(true) : setIsCreateModalOpen(true); }} className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white transform active:scale-90 transition-all bg-primary shadow-blue-500/40`}>
          <Plus size={28} />
        </button>
      </div>
    </div>

    <CreateCategoryModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={onAddCategory} />
    <LoanModal 
        isOpen={isLoanModalOpen} 
        onClose={() => { setIsLoanModalOpen(false); setEditingLoan(null); }} 
        accounts={accounts} 
        onSave={(loan) => onAddLoan(loan, editingLoan?.id)} 
        initialData={editingLoan}
    />
    
    <LoanDetailsModal 
        isOpen={!!loanDetailView}
        onClose={() => setLoanDetailView(null)}
        loan={loanDetailView}
        allTransactions={transactions}
    />

    <ConfirmModal 
        isOpen={deleteConfirmation.isOpen} 
        title="Delete Category" 
        message="Are you sure you want to delete this category? All related transactions will lose their category association, but will remain in history." 
        onConfirm={handleConfirmDelete} 
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: null })} 
    />
    </>
  );
};
