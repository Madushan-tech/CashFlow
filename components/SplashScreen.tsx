import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';

export const SplashScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [showTagline, setShowTagline] = useState(false);

  useEffect(() => {
    // Show tagline after 800ms
    const taglineTimer = setTimeout(() => {
      setShowTagline(true);
    }, 800);

    // Finish splash after 2.5s
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background text-white">
      <div className="flex flex-col items-center animate-fade-in">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/40">
           <TrendingUp className="text-white w-12 h-12" />
        </div>
        
        {/* Glowing Text Effect */}
        <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse drop-shadow-[0_0_10px_rgba(37,140,244,0.5)]">
          CashFlow
        </h1>

        <div className={`transition-opacity duration-700 ease-out ${showTagline ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
           <p className="text-gray-400 font-medium text-sm tracking-widest uppercase">Master Your Money</p>
        </div>
      </div>
    </div>
  );
};