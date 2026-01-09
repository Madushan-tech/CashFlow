import React, { useState, useEffect } from 'react';
import { Delete, Lock, Unlock, ShieldCheck, X } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  mode: 'UNLOCK' | 'SET' | 'VERIFY' | 'REMOVE';
  existingPin?: string;
  onSuccess: (pin?: string) => void;
  onClose?: () => void; // Optional, as UNLOCK mode cannot be closed
  title?: string;
}

export const PinModal: React.FC<PinModalProps> = ({ isOpen, mode, existingPin, onSuccess, onClose, title }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'ENTER' | 'CONFIRM'>('ENTER');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
        setPin('');
        setConfirmPin('');
        setStep('ENTER');
        setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePress = (num: string) => {
    setError(null);
    if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
        
        // Auto submit on 4th digit
        if (newPin.length === 4) {
            handleSubmit(newPin);
        }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleSubmit = (currentPin: string) => {
      setTimeout(() => {
        if (mode === 'UNLOCK' || mode === 'VERIFY' || mode === 'REMOVE') {
            if (currentPin === existingPin) {
                onSuccess(currentPin);
            } else {
                setError('Incorrect PIN');
                setPin('');
            }
        } else if (mode === 'SET') {
            if (step === 'ENTER') {
                setConfirmPin(currentPin);
                setPin('');
                setStep('CONFIRM');
            } else {
                if (currentPin === confirmPin) {
                    onSuccess(currentPin);
                } else {
                    setError('PINs do not match. Try again.');
                    setPin('');
                    setConfirmPin('');
                    setStep('ENTER');
                }
            }
        }
      }, 100);
  };

  const getTitle = () => {
      if (title) return title;
      if (mode === 'UNLOCK') return 'Enter PIN to Unlock';
      if (mode === 'REMOVE') return 'Enter PIN to Remove Lock';
      if (mode === 'VERIFY') return 'Enter PIN to Continue';
      if (mode === 'SET') return step === 'ENTER' ? 'Create a PIN' : 'Confirm your PIN';
      return 'Enter PIN';
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-slate-900 dark:text-white animate-fade-in">
       {/* Background pattern */}
       <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#258cf4_1px,transparent_1px)] [background-size:16px_16px]"></div>

       <div className="relative w-full max-w-xs flex flex-col items-center p-6">
           {onClose && mode !== 'UNLOCK' && (
               <button onClick={onClose} className="absolute top-0 right-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                   <X size={24} />
               </button>
           )}

           <div className="mb-8 flex flex-col items-center">
               <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-lg shadow-blue-500/10">
                   {mode === 'UNLOCK' || mode === 'VERIFY' ? <Lock size={32} /> : mode === 'REMOVE' ? <Unlock size={32} /> : <ShieldCheck size={32} />}
               </div>
               <h2 className="text-xl font-bold mb-2">{getTitle()}</h2>
               <p className="text-sm text-gray-500 h-4">{error || 'Enter 4-digit PIN'}</p>
           </div>

           {/* Dots */}
           <div className="flex gap-4 mb-10">
               {[0, 1, 2, 3].map(i => (
                   <div 
                    key={i} 
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                        i < pin.length 
                        ? 'bg-primary scale-110 shadow-[0_0_8px_rgba(37,140,244,0.6)]' 
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                   />
               ))}
           </div>

           {/* Keypad */}
           <div className="grid grid-cols-3 gap-6 w-full">
               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                   <button
                    key={num}
                    onClick={() => handlePress(num.toString())}
                    className="w-16 h-16 rounded-full text-2xl font-bold bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center focus:outline-none select-none active:scale-90 duration-150"
                   >
                       {num}
                   </button>
               ))}
               <div className="w-16 h-16"></div>
               <button
                    onClick={() => handlePress('0')}
                    className="w-16 h-16 rounded-full text-2xl font-bold bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center focus:outline-none select-none active:scale-90 duration-150"
               >
                   0
               </button>
               <button
                    onClick={handleBackspace}
                    className="w-16 h-16 rounded-full text-xl font-bold bg-transparent hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center focus:outline-none select-none active:scale-90 duration-150"
               >
                   <Delete size={28} />
               </button>
           </div>
       </div>
    </div>
  );
};