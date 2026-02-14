import React from 'react';
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
  
  // Calculate how many visual cards to show in the stack (max 5 for performance/cleanliness)
  const stackSize = Math.min(Math.floor(count / 5) + 1, 6);
  
  return (
    <div className="flex flex-col items-center gap-1 md:gap-2">
      <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${winnerHighlight ? 'text-yellow-400 scale-110' : 'opacity-50'}`}>
        {label}
      </span>
      <div className="relative group h-32 md:h-48 w-20 md:w-32">
        {/* Render stacked card backs */}
        {[...Array(stackSize)].map((_, i) => (
          <CardComponent 
            key={i}
            isBack 
            themeColors={t} 
            className={`absolute shadow-xl transition-all duration-300 scale-90 md:scale-100`}
            style={{ 
              top: `-${i * 2}px`, 
              left: isPlayer1 ? `${i * 2}px` : `-${i * 2}px`,
              zIndex: i
            }} 
          />
        ))}
        
        {/* Counter Badge */}
        <div className={`absolute -top-4 ${isPlayer1 ? '-left-4' : '-right-4'} z-10 ${isPlayer1 ? 'bg-blue-500' : 'bg-red-500'} text-white text-[10px] md:text-xs font-black px-2 md:px-3 py-1 rounded-full shadow-lg border-2 border-white animate-in zoom-in duration-300`}>
          {count}
        </div>
      </div>
    </div>
  );
};

export default DeckStack;