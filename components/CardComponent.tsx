
import React from 'react';
import { Card, Suit } from '../types';
import { SUIT_SYMBOLS } from '../constants';

interface CardComponentProps {
  card?: Card;
  isBack?: boolean;
  className?: string;
  themeColors: any;
  animationState?: 'playing' | 'winning' | 'war' | 'idle';
  style?: React.CSSProperties;
}

const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  isBack = false, 
  className = "", 
  themeColors,
  animationState = 'idle',
  style
}) => {
  const isRed = card?.suit === 'Hearts' || card?.suit === 'Diamonds';

  const getAnimationClass = () => {
    switch (animationState) {
      case 'playing': return 'animate-flip-in';
      case 'war': return 'animate-war-reveal';
      case 'winning': return 'animate-win-zoom';
      default: return '';
    }
  };

  if (isBack) {
    return (
      <div 
        style={style}
        className={`w-20 h-30 md:w-32 md:h-48 rounded-xl border-4 border-white shadow-xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${themeColors.accent} ${className}`}
      >
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="text-white text-3xl md:text-4xl font-bold">W</div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className={`perspective-1000 w-20 h-30 md:w-32 md:h-48 ${className}`} style={style}>
      <div className={`relative w-full h-full rounded-xl border border-gray-200 shadow-lg flex flex-col justify-between p-2 md:p-3 transition-all transform-gpu ${getAnimationClass()} ${themeColors.card}`}>
        
        {/* Sparkle effect for winners */}
        {animationState === 'winning' && (
          <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden z-20">
            <div className="absolute inset-[-50%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.4),transparent)]"></div>
          </div>
        )}

        <div className={`flex flex-col items-start ${isRed ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
          <span className="text-lg md:text-2xl font-bold leading-none">{card.rank}</span>
          <span className="text-base md:text-xl">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
        
        <div className={`flex items-center justify-center self-center text-3xl md:text-6xl ${isRed ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>

        <div className={`flex flex-col items-end rotate-180 ${isRed ? 'text-red-500' : 'text-gray-900 dark:text-gray-100'}`}>
          <span className="text-lg md:text-2xl font-bold leading-none">{card.rank}</span>
          <span className="text-base md:text-xl">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
      </div>
      
      <style>{`
        @keyframes flip-in {
          0% { transform: rotateY(90deg) scale(0.8); opacity: 0; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        .animate-flip-in {
          animation: flip-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        @keyframes war-reveal {
          0% { transform: rotateY(90deg) scale(0.6); opacity: 0; }
          60% { transform: rotateY(90deg) scale(0.6); opacity: 0; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        .animate-war-reveal {
          animation: war-reveal 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @keyframes win-zoom {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(250,204,21,0); }
          50% { transform: scale(1.15); box-shadow: 0 0 30px rgba(250,204,21,0.8); }
          100% { transform: scale(1.1); box-shadow: 0 0 20px rgba(250,204,21,0.6); border-color: rgba(250,204,21,1); }
        }
        .animate-win-zoom {
          animation: win-zoom 0.6s ease-out forwards;
          border: 4px solid #facc15 !important;
          z-index: 50;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default CardComponent;
