
import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, Loader2 } from 'lucide-react';
import { TransactionType, Category } from '../types';
import { Icon } from './Icon';
import { AVAILABLE_ICONS } from '../constants';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cat: Omit<Category, 'id'>) => void;
}

// Keyword mapping for smart icon detection
const ICON_KEYWORDS: Record<string, string[]> = {
  'Briefcase': ['salary', 'job', 'work', 'business', 'income', 'wage', 'employment', 'career'],
  'Laptop': ['freelance', 'computer', 'tech', 'software', 'dev', 'online', 'internet'],
  'Gift': ['gift', 'donation', 'charity', 'present', 'birthday', 'wedding', 'bonus'],
  'Utensils': ['food', 'restaurant', 'eat', 'dining', 'lunch', 'dinner', 'breakfast', 'meal', 'snack'],
  'Car': ['transport', 'fuel', 'petrol', 'gas', 'diesel', 'car', 'bus', 'train', 'taxi', 'uber', 'vehicle', 'parking', 'maintenance'],
  'Home': ['rent', 'house', 'housing', 'mortgage', 'furniture', 'decoration', 'repair', 'utilities'],
  'Film': ['movie', 'cinema', 'entertainment', 'netflix', 'fun', 'game', 'show', 'event'],
  'ShoppingBag': ['shopping', 'clothes', 'buy', 'mall', 'store', 'groceries', 'supermarket'],
  'Zap': ['electricity', 'power', 'energy', 'bill', 'electric'],
  'Wifi': ['wifi', 'internet', 'data', 'broadband', 'connection'],
  'Coffee': ['coffee', 'tea', 'cafe', 'drink', 'beverage'],
  'Smartphone': ['phone', 'mobile', 'call', 'communication', 'topup', 'reload'],
  'Dumbbell': ['gym', 'fitness', 'sport', 'health', 'workout', 'training', 'exercise'],
  'Heart': ['doctor', 'medical', 'hospital', 'medicine', 'care', 'pharmacy', 'health'],
  'Plane': ['travel', 'trip', 'flight', 'vacation', 'holiday', 'ticket', 'hotel', 'visa'],
  'Music': ['music', 'concert', 'spotify', 'song', 'audio', 'instrument'],
  'Wallet': ['fees', 'tax', 'insurance', 'loan', 'debt', 'bank', 'charges', 'interest']
};

export const CreateCategoryModal: React.FC<CreateCategoryModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [selectedIcon, setSelectedIcon] = useState('');
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [newSub, setNewSub] = useState('');
  
  const [isLoadingIcons, setIsLoadingIcons] = useState(false);
  const [suggestedIcons, setSuggestedIcons] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setType(TransactionType.EXPENSE);
      setSelectedIcon('');
      setSubCategories([]);
      setNewSub('');
      setSuggestedIcons([]);
      setIsLoadingIcons(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!name.trim()) {
        setSuggestedIcons([]);
        setIsLoadingIcons(false);
        return;
    }

    setIsLoadingIcons(true);
    const timer = setTimeout(() => {
        const lowerName = name.toLowerCase();
        const scores: { icon: string, score: number }[] = AVAILABLE_ICONS.map(icon => {
            let score = 0;
            const keywords = ICON_KEYWORDS[icon] || [];
            if (keywords.includes(lowerName)) score += 10;
            if (keywords.some(k => lowerName.includes(k))) score += 5;
            if (keywords.some(k => k.includes(lowerName))) score += 2;
            return { icon, score };
        });

        const sorted = scores
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.icon)
            .slice(0, 3);
        
        const defaults = ['Wallet', 'ShoppingBag', 'HelpCircle'].filter(i => !sorted.includes(i));
        const finalSuggestions = [...sorted, ...defaults].slice(0, 3);

        setSuggestedIcons(finalSuggestions);
        if (!selectedIcon) setSelectedIcon(finalSuggestions[0]);
        setIsLoadingIcons(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [name]);

  if (!isOpen) return null;

  const handleAddSub = () => {
    if (newSub.trim()) {
      setSubCategories([...subCategories, newSub.trim()]);
      setNewSub('');
    }
  };

  const handleRemoveSub = (index: number) => {
    setSubCategories(subCategories.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name,
      type,
      icon: selectedIcon || 'HelpCircle',
      subCategories
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-surface w-full sm:w-[450px] sm:rounded-3xl rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col relative overflow-hidden">
        
        {/* Fixed Header */}
        <div className="shrink-0 p-6 pb-2 relative border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-bold dark:text-white">Create Category</h3>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full dark:text-white transition-colors">
              <X size={20} />
            </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {[TransactionType.INCOME, TransactionType.EXPENSE].map(t => (
                    <button
                        key={t}
                        onClick={() => setType(t)}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                            type === t 
                            ? (t === TransactionType.INCOME ? 'bg-white dark:bg-background text-primary shadow-sm' : 'bg-white dark:bg-background text-danger shadow-sm') 
                            : 'text-gray-500'
                        }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Category Name</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter category name"
                    className="w-full bg-gray-50 dark:bg-background border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 outline-none dark:text-white font-medium focus:border-primary transition-colors"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Icon</label>
                <div className="min-h-[90px] flex flex-col items-center justify-center bg-gray-50 dark:bg-background rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 transition-all">
                    {!name.trim() ? (
                        <span className="text-sm text-gray-400">Type a name to select an icon</span>
                    ) : isLoadingIcons ? (
                        <div className="flex flex-col items-center gap-2 text-primary animate-pulse">
                            <span className="text-2xl">🤔</span>
                            <span className="text-xs font-medium">Thinking...</span>
                        </div>
                    ) : (
                        <div className="flex gap-4 animate-fade-in">
                            {suggestedIcons.map(icon => (
                                <button
                                    key={icon}
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                                        selectedIcon === icon 
                                        ? 'bg-primary text-white shadow-lg shadow-blue-500/30 scale-105' 
                                        : 'bg-white dark:bg-surface text-gray-500 border border-gray-100 dark:border-gray-700 hover:border-primary'
                                    }`}
                                >
                                    <Icon name={icon} size={24} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Sub Categories</label>
                <div className="flex gap-2 mb-3">
                    <input 
                        type="text" 
                        value={newSub}
                        onChange={(e) => setNewSub(e.target.value)}
                        placeholder="Add sub-category..."
                        className="flex-1 bg-gray-50 dark:bg-background border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-2 outline-none dark:text-white font-medium text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSub()}
                    />
                    <button onClick={handleAddSub} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2.5 rounded-xl">
                        <Plus size={20} />
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {subCategories.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-background px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span className="text-sm font-medium dark:text-gray-300">{sub}</span>
                            <button onClick={() => handleRemoveSub(idx)} className="text-gray-400 hover:text-danger">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Fixed Footer */}
        <div className="shrink-0 p-6 border-t border-gray-100 dark:border-gray-800">
            <button 
              onClick={handleSave}
              disabled={!name.trim() || !selectedIcon}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all shrink-0 ${
                  name.trim() && selectedIcon 
                  ? 'bg-primary text-white shadow-blue-500/20 active:scale-95' 
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Check size={20} />
              <span>Create Category</span>
            </button>
        </div>
      </div>
    </div>
  );
};
