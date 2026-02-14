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
      case 'playing': return 'animate-card-flip';
      case 'war': return 'animate-war-reveal';
      case 'winning': return 'animate-win-zoom';
      default: return '';
    }
  };

  if (isBack) {
    return (
      <div 
        style={style}
        className={`w-24 h-36 md:w-36 md:h-52 rounded-2xl border-4 border-slate-100/20 shadow-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 ${themeColors.accent} ${className}`}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="text-white text-4xl md:text-5xl font-black drop-shadow-lg">W</div>
        <div className="absolute bottom-2 opacity-20 text-[8px] font-mono uppercase tracking-[0.2em]">Milchama</div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className={`perspective-1000 w-24 h-36 md:w-36 md:h-52 ${className}`} style={style}>
      <div className={`relative w-full h-full rounded-2xl border-2 border-slate-200/50 shadow-[0_15px_35px_rgba(0,0,0,0.4)] flex flex-col justify-between p-3 md:p-4 transition-all transform-gpu ${getAnimationClass()} ${themeColors.card}`}>
        
        {/* Shine for winners */}
        {animationState === 'winning' && (
          <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden z-20">
            <div className="absolute inset-[-100%] animate-spin-slow bg-[conic-gradient(from_0deg,transparent,rgba(250,204,21,0.3),transparent)]"></div>
          </div>
        )}

        <div className={`flex flex-col items-start ${isRed ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
          <span className="text-xl md:text-3xl font-black leading-none tracking-tighter">{card.rank}</span>
          <span className="text-base md:text-2xl">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
        
        <div className={`flex items-center justify-center self-center text-4xl md:text-8xl drop-shadow-md ${isRed ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
          {SUIT_SYMBOLS[card.suit]}
        </div>

        <div className={`flex flex-col items-end rotate-180 ${isRed ? 'text-red-500' : 'text-slate-900 dark:text-slate-100'}`}>
          <span className="text-xl md:text-3xl font-black leading-none tracking-tighter">{card.rank}</span>
          <span className="text-base md:text-2xl">{SUIT_SYMBOLS[card.suit]}</span>
        </div>
      </div>
      
      <style>{`
        @keyframes flip-in {
          0% { transform: rotateY(90deg) scale(0.7) translateY(20px); opacity: 0; }
          60% { transform: rotateY(-10deg) scale(1.05); }
          100% { transform: rotateY(0deg) scale(1) translateY(0); opacity: 1; }
        }
        .animate-card-flip {
          animation: flip-in 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        
        @keyframes war-reveal {
          0% { transform: rotateY(90deg) scale(0.6) rotateZ(-5deg); opacity: 0; filter: blur(4px); }
          70% { transform: rotateY(90deg) scale(0.6) rotateZ(5deg); opacity: 0; filter: blur(4px); }
          85% { transform: rotateY(-15deg) scale(1.1); }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; filter: blur(0); }
        }
        .animate-war-reveal {
          animation: war-reveal 1.5s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
        }

        @keyframes win-zoom {
          0% { transform: scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          40% { transform: scale(1.18); box-shadow: 0 0 50px rgba(250,204,21,0.6); }
          100% { transform: scale(1.12); box-shadow: 0 0 30px rgba(250,204,21,0.4); border-color: rgba(250,204,21,1); }
        }
        .animate-win-zoom {
          animation: win-zoom 0.8s ease-out forwards;
          border-width: 4px !important;
          z-index: 50;
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 6s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default CardComponent;