import React, { useState, useEffect, useRef } from 'react';
import { Theme } from '../types.ts';
import { THEME_CONFIG } from '../constants.tsx';
import CardComponent from './CardComponent.tsx';

interface DeckStackProps {
  count: number;
  theme: Theme;
  label: string;
  isPlayer1?: boolean;
  winnerHighlight?: boolean;
}

const DeckStack: React.FC<DeckStackProps> = ({ count, theme, label, isPlayer1, winnerHighlight }) => {
  const t = THEME_CONFIG[theme];
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(count);

  // Animate the counter number smoothly and trigger glow
  useEffect(() => {
    if (count !== prevCountRef.current) {
      setIsAnimating(true);
      
      const start = displayCount;
      const end = count;
      const duration = 600;
      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const current = Math.floor(progress * (end - start) + start);
        
        setDisplayCount(current);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayCount(end);
          setTimeout(() => setIsAnimating(false), 1000);
        }
      };

      requestAnimationFrame(animate);
      prevCountRef.current = count;
    }
  }, [count]);

  const stackSize = Math.min(Math.floor(count / 5) + 1, 6);
  const isIncreasing = count > prevCountRef.current;
  
  return (
    <div className="flex flex-col items-center gap-1 md:gap-2 select-none">
      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-500 ${winnerHighlight ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'opacity-50'}`}>
        {label}
      </span>
      
      <div className="relative group h-32 md:h-48 w-20 md:w-32">
        {/* Render stacked card backs */}
        {[...Array(stackSize)].map((_, i) => (
          <CardComponent 
            key={i}
            isBack 
            themeColors={t} 
            className={`absolute shadow-xl transition-all duration-300 scale-90 md:scale-100 ${winnerHighlight ? 'ring-2 ring-yellow-400/30' : ''}`}
            style={{ 
              top: `-${i * 2}px`, 
              left: isPlayer1 ? `${i * 2}px` : `-${i * 2}px`,
              zIndex: i
            }} 
          />
        ))}
        
        {/* Counter Badge with Glow & Pop Animation */}
        <div className={`
          absolute -top-4 ${isPlayer1 ? '-left-4' : '-right-4'} z-30 
          ${isPlayer1 ? 'bg-blue-600' : 'bg-red-600'} 
          text-white text-[10px] md:text-sm font-black px-2 md:px-3 py-1 
          rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.4)] border-2 border-white/90
          transition-all duration-300 transform-gpu
          ${isAnimating ? 'scale-125' : 'scale-100'}
          ${winnerHighlight ? 'ring-4 ring-yellow-400 animate-pulse-glow' : ''}
          ${isIncreasing && isAnimating ? 'animate-bounce-subtle' : ''}
        `}>
          {displayCount}
          
          {/* Floating particle effect when increasing */}
          {isIncreasing && isAnimating && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-emerald-400 text-xs font-bold animate-float-up">
              +{count - prevCountRef.current}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(250, 204, 21, 0.4), 0 4px 12px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 20px rgba(250, 204, 21, 0.8), 0 4px 12px rgba(0,0,0,0.4); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 1.5s ease-in-out infinite;
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0) scale(1.25); }
          50% { transform: translateY(-5px) scale(1.35); }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 0.4s ease-out;
        }

        @keyframes float-up {
          0% { opacity: 0; transform: translate(-50%, 0); }
          20% { opacity: 1; transform: translate(-50%, -10px); }
          100% { opacity: 0; transform: translate(-50%, -30px); }
        }
        .animate-float-up {
          animation: float-up 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default DeckStack;