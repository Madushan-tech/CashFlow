
import React, { useState } from 'react';
import { Delete, X, Equal } from 'lucide-react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (result: string) => void;
  initialValue: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose, onResult, initialValue }) => {
  const [expression, setExpression] = useState(initialValue === '0' ? '' : initialValue);
  const [display, setDisplay] = useState(initialValue === '0' ? '0' : initialValue);

  if (!isOpen) return null;

  const handlePress = (val: string) => {
    // If we just calculated, start fresh if a number is pressed, or append if operator
    const isOperator = ['+', '-', '*', '/'].includes(val);
    
    if (expression === 'Error') {
        if (isOperator) return;
        setExpression(val);
        setDisplay(val);
        return;
    }

    setExpression(prev => prev + val);
    setDisplay(prev => prev === '0' || prev === 'Error' ? val : prev + val);
  };

  const handleClear = () => {
    setExpression('');
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (expression.length <= 1) {
        handleClear();
    } else {
        const newExp = expression.slice(0, -1);
        setExpression(newExp);
        setDisplay(newExp);
    }
  };

  const handleCalculate = () => {
    try {
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + expression)();
      const resultStr = String(Math.round(result * 100) / 100); // Round to 2 decimals
      onResult(resultStr);
      onClose();
    } catch (e) {
      setDisplay('Error');
      setExpression('Error');
    }
  };

  const btnClass = "h-14 rounded-xl text-xl font-bold transition-all active:scale-95 flex items-center justify-center";
  const numClass = `${btnClass} bg-gray-100 dark:bg-gray-800 text-slate-900 dark:text-white`;
  const opClass = `${btnClass} bg-blue-50 dark:bg-blue-900/20 text-primary`;
  const actionClass = `${btnClass} bg-gray-200 dark:bg-gray-700 text-slate-900 dark:text-white`;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-surface w-full max-w-sm sm:rounded-3xl rounded-t-3xl p-4 shadow-2xl animate-slide-up relative">
        
        <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-500">Calculator</span>
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full dark:text-white z-50">
                <X size={20} />
            </button>
        </div>

        {/* Display */}
        <div className="bg-gray-50 dark:bg-background p-4 rounded-2xl mb-4 text-right mt-6">
            <span className="text-3xl font-bold dark:text-white break-all">{display}</span>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-3">
            <button onClick={handleClear} className={`${actionClass} text-danger`}>C</button>
            <button onClick={() => handlePress('/')} className={opClass}>÷</button>
            <button onClick={() => handlePress('*')} className={opClass}>×</button>
            <button onClick={handleBackspace} className={actionClass}><Delete size={24}/></button>

            <button onClick={() => handlePress('7')} className={numClass}>7</button>
            <button onClick={() => handlePress('8')} className={numClass}>8</button>
            <button onClick={() => handlePress('9')} className={numClass}>9</button>
            <button onClick={() => handlePress('-')} className={opClass}>-</button>

            <button onClick={() => handlePress('4')} className={numClass}>4</button>
            <button onClick={() => handlePress('5')} className={numClass}>5</button>
            <button onClick={() => handlePress('6')} className={numClass}>6</button>
            <button onClick={() => handlePress('+')} className={opClass}>+</button>

            <div className="col-span-3 grid grid-cols-3 gap-3">
                <button onClick={() => handlePress('1')} className={numClass}>1</button>
                <button onClick={() => handlePress('2')} className={numClass}>2</button>
                <button onClick={() => handlePress('3')} className={numClass}>3</button>
                <button onClick={() => handlePress('0')} className={`${numClass} col-span-2`}>0</button>
                <button onClick={() => handlePress('.')} className={numClass}>.</button>
            </div>
            
            <button onClick={handleCalculate} className={`${btnClass} bg-primary text-white h-auto`}>
                <Equal size={32} />
            </button>
        </div>
      </div>
    </div>
  );
};
