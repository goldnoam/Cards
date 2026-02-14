import React, { useState, useEffect, useCallback } from 'react';
import { Card, GameMode, GameStatus, Theme, GameState, RoundHistory } from './types.ts';
import { SUITS, RANKS, RANK_VALUES, THEME_CONFIG, SUIT_SYMBOLS } from './constants.tsx';
import CardComponent from './components/CardComponent.tsx';
import DeckStack from './components/DeckStack.tsx';
import { sounds } from './services/soundService.ts';

const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: RANK_VALUES[rank] });
    }
  }
  return shuffle(deck);
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(Theme.COLORFUL_DARK);
  const [gameState, setGameState] = useState<GameState>({
    player1Deck: [],
    player2Deck: [],
    player1InPlay: [],
    player2InPlay: [],
    lastResult: 'לחץ על התחל כדי לשחק',
    status: GameStatus.IDLE,
    winner: null,
    mode: GameMode.VS_COMPUTER,
    commentary: '',
    history: [],
    isPaused: false,
    isMuted: false
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastWinnerId, setLastWinnerId] = useState<number | null>(null);
  const t = THEME_CONFIG[theme];

  const initializeGame = (mode: GameMode) => {
    if (!gameState.isMuted) sounds.playCard();
    const deck = createDeck();
    const half = deck.length / 2;
    setGameState(prev => ({
      ...prev,
      player1Deck: deck.slice(0, half),
      player2Deck: deck.slice(half),
      player1InPlay: [],
      player2InPlay: [],
      lastResult: 'המשחק החל!',
      status: GameStatus.PLAYING,
      winner: null,
      mode,
      history: [],
      isPaused: false
    }));
    setLastWinnerId(null);
  };

  const playRound = useCallback(async () => {
    if (gameState.status !== GameStatus.PLAYING && gameState.status !== GameStatus.WAR) return;
    if (isProcessing || gameState.isPaused) return;

    setIsProcessing(true);
    if (!gameState.isMuted) sounds.playCard();

    const p1Card = gameState.player1Deck[0];
    const p2Card = gameState.player2Deck[0];

    if (!p1Card || !p2Card) {
      checkWinner();
      setIsProcessing(false);
      return;
    }

    const newP1InPlay = [...gameState.player1InPlay, p1Card];
    const newP2InPlay = [...gameState.player2InPlay, p2Card];
    const newP1Deck = gameState.player1Deck.slice(1);
    const newP2Deck = gameState.player2Deck.slice(1);

    let resultMsg = '';
    let newStatus = GameStatus.PLAYING;
    let finalP1Deck = newP1Deck;
    let finalP2Deck = newP2Deck;
    let nextInPlayP1 = newP1InPlay;
    let nextInPlayP2 = newP2InPlay;
    let winnerId = 0;

    const isCurrentWar = gameState.status === GameStatus.WAR;

    if (p1Card.value > p2Card.value) {
      resultMsg = 'שחקן 1 מנצח!';
      winnerId = 1;
      finalP1Deck = [...newP1Deck, ...shuffle([...newP1InPlay, ...newP2InPlay])];
      if (!gameState.isMuted) setTimeout(sounds.winRound, isCurrentWar ? 1200 : 300);
    } else if (p2Card.value > p1Card.value) {
      resultMsg = gameState.mode === GameMode.VS_COMPUTER ? 'המחשב מנצח!' : 'שחקן 2 מנצח!';
      winnerId = 2;
      finalP2Deck = [...newP2Deck, ...shuffle([...newP1InPlay, ...newP2InPlay])];
      if (!gameState.isMuted) setTimeout(sounds.winRound, isCurrentWar ? 1200 : 300);
    } else {
      resultMsg = 'מלחמה!!! (WAR)';
      winnerId = 0;
      newStatus = GameStatus.WAR;
      if (!gameState.isMuted) sounds.war();
      
      const warCards1 = newP1Deck.slice(0, 3);
      const warCards2 = newP2Deck.slice(0, 3);
      finalP1Deck = newP1Deck.slice(3);
      finalP2Deck = newP2Deck.slice(3);
      nextInPlayP1 = [...newP1InPlay, ...warCards1];
      nextInPlayP2 = [...newP2InPlay, ...warCards2];
    }

    setLastWinnerId(winnerId);
    
    const roundRecord: RoundHistory = {
      p1Card,
      p2Card,
      result: resultMsg,
      isWar: newStatus === GameStatus.WAR
    };

    setGameState(prev => ({
      ...prev,
      player1Deck: finalP1Deck,
      player2Deck: finalP2Deck,
      player1InPlay: nextInPlayP1,
      player2InPlay: nextInPlayP2,
      lastResult: resultMsg,
      status: newStatus,
      history: [roundRecord, ...prev.history].slice(0, 8)
    }));

    setTimeout(() => setIsProcessing(false), isCurrentWar ? 1600 : 600);
  }, [gameState, isProcessing]);

  const handlePlayClick = () => {
    if (gameState.isPaused) return;
    if (lastWinnerId !== 0 && lastWinnerId !== null && gameState.status !== GameStatus.WAR) {
       setGameState(prev => ({
         ...prev,
         player1InPlay: [],
         player2InPlay: []
       }));
       setLastWinnerId(null);
       setTimeout(playRound, 50);
    } else {
       playRound();
    }
  };

  const handleSkipWar = () => {
    if (gameState.status !== GameStatus.WAR || isProcessing || gameState.isPaused) return;
    
    // Concede all cards currently in play to the opponent (P2 / Computer)
    const cardsInPlay = [...gameState.player1InPlay, ...gameState.player2InPlay];
    
    setGameState(prev => ({
      ...prev,
      player2Deck: [...prev.player2Deck, ...shuffle(cardsInPlay)],
      player1InPlay: [],
      player2InPlay: [],
      status: GameStatus.PLAYING,
      lastResult: 'ויתרת על המלחמה! היריב זכה בקלפים',
    }));
    
    setLastWinnerId(null);
    if (!gameState.isMuted) sounds.lose();
  };

  const resetToMenu = () => {
    setGameState(prev => ({
      ...prev,
      status: GameStatus.IDLE,
      player1Deck: [],
      player2Deck: [],
      player1InPlay: [],
      player2InPlay: [],
      isPaused: false
    }));
    setLastWinnerId(null);
  };

  const togglePause = () => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const toggleMute = () => {
    setGameState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const checkWinner = useCallback(() => {
    if (gameState.player1Deck.length === 0 && gameState.player1InPlay.length === 0) {
      if (!gameState.isMuted) sounds.gameOver();
      setGameState(prev => ({
        ...prev,
        status: GameStatus.FINISHED,
        winner: prev.mode === GameMode.VS_COMPUTER ? 'המחשב' : 'שחקן 2',
        lastResult: 'המשחק נגמר!'
      }));
    } else if (gameState.player2Deck.length === 0 && gameState.player2InPlay.length === 0) {
      if (!gameState.isMuted) sounds.gameOver();
      setGameState(prev => ({
        ...prev,
        status: GameStatus.FINISHED,
        winner: 'שחקן 1',
        lastResult: 'המשחק נגמר!'
      }));
    }
  }, [gameState.player1Deck.length, gameState.player2Deck.length, gameState.player1InPlay.length, gameState.player2InPlay.length, gameState.isMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ([' ', 'enter', 'w', 'a', 's', 'd'].includes(key)) {
        if (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.WAR) {
          handlePlayClick();
        } else if (gameState.status === GameStatus.IDLE) {
          initializeGame(GameMode.VS_COMPUTER);
        }
      }
      if (key === 'p') togglePause();
      if (key === 'r') resetToMenu();
      if (key === 'x' && gameState.status === GameStatus.WAR) handleSkipWar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, gameState.isPaused, isProcessing, lastWinnerId]);

  const isGameActive = gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.WAR;

  return (
    <div className={`min-h-screen transition-all duration-500 flex flex-col ${t.bg} ${t.text} p-2 md:p-8 overflow-hidden`}>
      {/* Header */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between mb-2 md:mb-8 gap-2">
        <div className="text-right">
          <h1 className="text-2xl md:text-5xl font-black font-serif text-white flex items-center gap-2">
            מלחמה <span className="text-[10px] md:text-sm font-normal opacity-40">PRO</span>
          </h1>
        </div>

        <div className="flex items-center gap-1 md:gap-2 bg-slate-800/40 p-1 md:p-1.5 rounded-xl md:rounded-2xl backdrop-blur-xl border border-slate-700/50">
          <button onClick={toggleMute} title="השתק" className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all ${gameState.isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}>
            {gameState.isMuted ? '🔇' : '🔊'}
          </button>
          <div className="w-px h-5 bg-slate-700/50"></div>
          <button onClick={() => setTheme(Theme.LIGHT)} className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${theme === Theme.LIGHT ? 'bg-white text-black' : 'hover:bg-white/10'}`}>☀️</button>
          <button onClick={() => setTheme(Theme.DARK)} className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${theme === Theme.DARK ? 'bg-slate-700 text-white' : 'hover:bg-white/10'}`}>🌙</button>
          <button onClick={() => setTheme(Theme.COLORFUL_DARK)} className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${theme === Theme.COLORFUL_DARK ? 'bg-fuchsia-600 text-white' : 'hover:bg-white/10'}`}>🌈</button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden relative">
        
        {/* Menu & History (Hidden on mobile when playing) */}
        <aside className={`lg:col-span-1 flex-col gap-4 ${isGameActive ? 'hidden lg:flex' : 'flex'}`}>
          <div className={`${t.card} rounded-2xl p-4 md:p-6 shadow-xl border border-white/5 flex flex-col gap-3 bg-opacity-40`}>
            <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-right">תפריט משחק</h2>
            <button onClick={() => initializeGame(GameMode.VS_COMPUTER)} className={`w-full py-3 rounded-xl font-bold transition-all ${t.accent} ${t.accentHover} text-white transform active:scale-95`}>נגד המחשב 🤖</button>
            <button onClick={() => initializeGame(GameMode.TWO_PLAYERS)} className={`w-full py-3 rounded-xl font-bold transition-all ${t.secondary} transform active:scale-95`}>שני שחקנים 👥</button>
          </div>

          <div className={`${t.card} rounded-2xl p-4 md:p-6 shadow-xl border border-white/5 flex flex-col gap-3 flex-1 overflow-hidden bg-opacity-30`}>
             <h2 className="text-sm font-bold opacity-50 text-right uppercase tracking-wider">מהלכים אחרונים</h2>
             <div className="flex-1 overflow-y-auto space-y-2 dir-rtl custom-scrollbar pr-2">
                {gameState.history.length === 0 ? <p className="text-xs opacity-20 text-center py-4">טרם החלו קרבות</p> : 
                  gameState.history.map((r, i) => (
                    <div key={i} className="bg-white/5 p-2 rounded-lg flex justify-between items-center text-[10px] md:text-xs">
                      <span className="font-bold">{r.p1Card.rank}{SUIT_SYMBOLS[r.p1Card.suit]} vs {r.p2Card.rank}{SUIT_SYMBOLS[r.p2Card.suit]}</span>
                      <span className={r.isWar ? 'text-red-400 font-bold' : 'opacity-40'}>{r.isWar ? 'מלחמה!' : 'סיום'}</span>
                    </div>
                  ))
                }
             </div>
          </div>
        </aside>

        {/* Game Board */}
        <section className={`lg:col-span-3 ${t.board} rounded-[2rem] md:rounded-[3rem] p-3 md:p-10 shadow-2xl border-2 md:border-4 border-slate-800/50 relative flex flex-col items-center justify-between min-h-[500px] md:min-h-[650px] overflow-hidden`}>
           
           {/* Top Stats */}
           <div className="w-full flex justify-between items-center px-2 md:px-10 z-10 pt-4">
              <DeckStack count={gameState.player2Deck.length} theme={theme} label={gameState.mode === GameMode.VS_COMPUTER ? 'מחשב' : 'שחקן 2'} winnerHighlight={lastWinnerId === 2} />
              <div className="text-center bg-slate-900/80 backdrop-blur-md px-3 md:px-6 py-2 md:py-3 rounded-2xl border border-white/10 shadow-2xl min-w-[120px] md:min-w-[200px]">
                 <span className="text-xs md:text-lg font-bold block">{gameState.isPaused ? 'מושהה' : gameState.lastResult}</span>
                 {gameState.status === GameStatus.WAR && !gameState.isPaused && (
                   <div className="inline-block px-2 py-0.5 mt-1 rounded bg-red-600 text-[10px] font-black animate-pulse">WAR!</div>
                 )}
              </div>
              <DeckStack count={gameState.player1Deck.length} theme={theme} label="שחקן 1" isPlayer1 winnerHighlight={lastWinnerId === 1} />
           </div>

           {/* Cards Table */}
           <div className={`flex flex-1 items-center justify-center gap-4 md:gap-12 w-full transition-all duration-500 ${gameState.isPaused ? 'blur-md opacity-20' : ''}`}>
              <div className="flex flex-col items-center gap-2">
                 {gameState.player2InPlay.length > 0 ? (
                   <CardComponent card={gameState.player2InPlay.slice(-1)[0]} themeColors={t} side="left" animationState={lastWinnerId === 2 ? 'winning' : gameState.status === GameStatus.WAR ? 'war' : 'playing'} />
                 ) : <div className="w-20 md:w-32 h-32 md:h-48 rounded-xl border-2 border-dashed border-slate-700/40 flex items-center justify-center text-slate-800 text-3xl font-black">?</div>}
              </div>
              <div className="h-24 w-px bg-slate-800 hidden md:block opacity-20"></div>
              <div className="flex flex-col items-center gap-2">
                 {gameState.player1InPlay.length > 0 ? (
                   <CardComponent card={gameState.player1InPlay.slice(-1)[0]} themeColors={t} side="right" animationState={lastWinnerId === 1 ? 'winning' : gameState.status === GameStatus.WAR ? 'war' : 'playing'} />
                 ) : <div className="w-20 md:w-32 h-32 md:h-48 rounded-xl border-2 border-dashed border-slate-700/40 flex items-center justify-center text-slate-800 text-3xl font-black">?</div>}
              </div>
           </div>

           {/* Controls - Mobile Navigation & Play */}
           <div className="w-full flex flex-col items-center gap-4 pb-4 md:pb-10 z-20">
              {isGameActive && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <button 
                    onClick={handlePlayClick} 
                    disabled={isProcessing || gameState.isPaused} 
                    className="w-[85%] md:w-auto md:px-32 py-4 md:py-8 rounded-2xl md:rounded-[2rem] text-xl md:text-4xl font-black bg-emerald-500 text-white shadow-xl disabled:opacity-30 active:scale-95 transition-all border-b-4 md:border-b-8 border-emerald-700 active:border-b-0 active:translate-y-1"
                  >
                    {gameState.status === GameStatus.WAR ? 'המשך קרב 🔥' : 'הפוך קלף 🃏'}
                  </button>
                  
                  {gameState.status === GameStatus.WAR && !isProcessing && !gameState.isPaused && (
                    <button 
                      onClick={handleSkipWar}
                      className="w-[60%] md:w-auto md:px-16 py-3 rounded-xl bg-amber-600/20 text-amber-500 border border-amber-600/40 font-bold hover:bg-amber-600 hover:text-white transition-all active:scale-95"
                    >
                      דלג על המלחמה (ויתור) 🏳️
                    </button>
                  )}

                  {/* Virtual 'WASD' Controls for Mobile/Accessibility */}
                  <div className="flex gap-2 items-center lg:hidden">
                    <button onClick={togglePause} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-lg">{gameState.isPaused ? '▶️' : '⏸️'}</button>
                    <button onClick={resetToMenu} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-lg">🔄</button>
                  </div>
                </div>
              )}

              {gameState.status === GameStatus.FINISHED && (
                <div className="flex flex-col items-center animate-in zoom-in">
                  <h3 className="text-3xl font-black mb-4">הזוכה: {gameState.winner}</h3>
                  <button onClick={() => initializeGame(gameState.mode)} className="px-12 py-4 rounded-xl bg-white text-slate-900 font-black text-xl shadow-2xl active:scale-95">שחק שוב</button>
                </div>
              )}
           </div>

           {/* Landing Screen */}
           {gameState.status === GameStatus.IDLE && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center p-6 text-center">
                 <div className="text-8xl mb-6">🃏</div>
                 <h2 className="text-5xl md:text-7xl font-black mb-4 font-serif">מלחמה</h2>
                 <p className="text-slate-400 max-w-sm mb-10">המשחק הקלאסי בגרסה מלוטשת. הפכו קלפים וקחו את כל הקופה!</p>
                 <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
                    <button onClick={() => initializeGame(GameMode.VS_COMPUTER)} className="py-4 bg-white text-slate-950 rounded-xl font-black text-xl hover:bg-emerald-400 transition-all active:scale-95">נגד המחשב 🤖</button>
                    <button onClick={() => initializeGame(GameMode.TWO_PLAYERS)} className="py-4 border-2 border-slate-700 text-white rounded-xl font-black text-xl active:scale-95">שני שחקנים 👥</button>
                 </div>
                 <div className="mt-12 text-[10px] opacity-30 font-bold uppercase tracking-[0.2em]">WASD / SPACE / ENTER TO PLAY</div>
              </div>
           )}
        </section>
      </main>

      {/* Production Footer */}
      <footer className="mt-4 md:mt-8 max-w-6xl mx-auto w-full text-center border-t border-slate-800/50 pt-4 md:pt-8 pb-4 opacity-40 text-[9px] md:text-xs">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <p dir="ltr">(C) Noam Gold AI 2026</p>
          <div className="flex gap-4">
            <a href="mailto:goldnoamai@gmail.com" className="hover:text-white underline">משוב</a>
            <span dir="ltr">goldnoamai@gmail.com</span>
          </div>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .dir-rtl { direction: rtl; }
        .select-none { user-select: none; -webkit-user-select: none; }
      `}</style>
    </div>
  );
};

export default App;