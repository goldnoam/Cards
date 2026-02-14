import React, { useState, useEffect, useCallback } from 'react';
import { Card, GameMode, GameStatus, Theme, GameState, RoundHistory } from './types';
import { SUITS, RANKS, RANK_VALUES, THEME_CONFIG, SUIT_SYMBOLS } from './constants';
import CardComponent from './components/CardComponent';
import DeckStack from './components/DeckStack';
import { sounds } from './services/soundService';

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

  // Keyboard Support (WASD / Space / Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // WASD or Common keys for playing
      if ([' ', 'enter', 'w', 'a', 's', 'd'].includes(key)) {
        if (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.WAR) {
          handlePlayClick();
        } else if (gameState.status === GameStatus.IDLE) {
          initializeGame(GameMode.VS_COMPUTER);
        }
      }
      if (key === 'p') togglePause();
      if (key === 'r') resetToMenu();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, gameState.isPaused, isProcessing, lastWinnerId]);

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
      resultMsg = 'שחקן 1 מנצח בסיבוב!';
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
    if (gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.WAR) {
      if ((gameState.player1Deck.length === 0 && gameState.player1InPlay.length === 0) || 
          (gameState.player2Deck.length === 0 && gameState.player2InPlay.length === 0)) {
        checkWinner();
      }
    }
  }, [gameState.player1Deck.length, gameState.player2Deck.length, gameState.status, checkWinner, gameState.player1InPlay.length, gameState.player2InPlay.length]);

  const isGameActive = gameState.status === GameStatus.PLAYING || gameState.status === GameStatus.WAR;

  return (
    <div className={`min-h-screen transition-all duration-500 flex flex-col ${t.bg} ${t.text} p-3 md:p-8 overflow-hidden`}>
      {/* Header */}
      <header className={`max-w-6xl mx-auto w-full flex flex-row items-center justify-between mb-4 md:mb-8 gap-4 transition-all duration-500 ${isGameActive ? 'opacity-40' : ''}`}>
        <div className="text-right md:text-left">
          <h1 className="text-3xl md:text-5xl font-extrabold font-serif tracking-tight mb-1 text-slate-100">
            מלחמה <span className="hidden md:inline text-sm font-normal align-top opacity-50">MILCHAMA</span>
          </h1>
          {!isGameActive && <p className="opacity-60 text-xs md:text-sm">משחק הקלפים המקצועי</p>}
        </div>

        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-2xl backdrop-blur-xl border border-slate-700/50 scale-90 md:scale-100">
          <button onClick={toggleMute} className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${gameState.isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}>
            {gameState.isMuted ? '🔇' : '🔊'}
          </button>
          <div className="w-px h-6 bg-slate-700/50 mx-1"></div>
          <button onClick={() => setTheme(Theme.LIGHT)} className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${theme === Theme.LIGHT ? 'bg-white text-black shadow-lg' : 'hover:bg-white/10'}`}>☀️</button>
          <button onClick={() => setTheme(Theme.DARK)} className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${theme === Theme.DARK ? 'bg-slate-700 text-white shadow-lg' : 'hover:bg-white/10'}`}>🌙</button>
          <button onClick={() => setTheme(Theme.COLORFUL_DARK)} className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${theme === Theme.COLORFUL_DARK ? 'bg-fuchsia-600 text-white shadow-lg' : 'hover:bg-white/10'}`}>🌈</button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8 overflow-hidden">
        
        {/* Actions Sidebar */}
        <aside className={`lg:col-span-1 flex flex-col gap-4 md:gap-6 ${isGameActive ? 'hidden lg:flex' : 'flex'}`}>
          <div className={`${t.card} rounded-3xl p-5 md:p-6 shadow-2xl border border-white/5 flex flex-col gap-4 bg-opacity-40 backdrop-blur-md`}>
            <h2 className="text-xl font-bold border-b border-white/10 pb-2 text-right">תפריט</h2>
            <button onClick={() => initializeGame(GameMode.VS_COMPUTER)} className={`w-full py-4 rounded-xl font-bold transition-all ${t.accent} ${t.accentHover} text-white shadow-xl transform active:scale-95 text-lg`}>נגד המחשב 🤖</button>
            <button onClick={() => initializeGame(GameMode.TWO_PLAYERS)} className={`w-full py-4 rounded-xl font-bold transition-all ${t.secondary} hover:bg-opacity-80 transform active:scale-95 text-lg`}>שחקן נגד שחקן 👥</button>

            {isGameActive && (
              <div className="flex flex-col gap-2 mt-4">
                <button onClick={togglePause} className={`w-full py-3 rounded-xl font-bold border transition-all transform active:scale-95 ${gameState.isPaused ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white'}`}>
                  {gameState.isPaused ? 'המשך ▶️' : 'השהה ⏸️'}
                </button>
                <button onClick={resetToMenu} className="w-full py-3 rounded-xl font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all transform active:scale-95">אפס משחק 🔄</button>
              </div>
            )}
          </div>

          <div className={`${t.card} rounded-3xl p-5 md:p-6 shadow-xl border border-white/5 flex flex-col gap-3 flex-1 overflow-hidden bg-opacity-30`}>
            <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-right">מהלכים אחרונים</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 dir-rtl custom-scrollbar">
              {gameState.history.length === 0 ? (
                <p className="text-xs opacity-30 text-center mt-4 italic">טרם בוצעו מהלכים</p>
              ) : (
                gameState.history.map((round, idx) => (
                  <div key={idx} className="bg-white/5 rounded-xl p-3 flex items-center justify-between text-xs border border-white/5 transition-all hover:bg-white/10">
                    <div className="flex items-center gap-3">
                       <span className={`font-bold text-lg ${round.p1Card.suit === 'Hearts' || round.p1Card.suit === 'Diamonds' ? 'text-red-400' : 'text-slate-300'}`}>
                         {round.p1Card.rank}{SUIT_SYMBOLS[round.p1Card.suit]}
                       </span>
                       <span className="opacity-20">vs</span>
                       <span className={`font-bold text-lg ${round.p2Card.suit === 'Hearts' || round.p2Card.suit === 'Diamonds' ? 'text-red-400' : 'text-slate-300'}`}>
                         {round.p2Card.rank}{SUIT_SYMBOLS[round.p2Card.suit]}
                       </span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full ${round.isWar ? 'bg-red-500 text-white font-black scale-90' : 'bg-slate-700/50 opacity-50'}`}>
                      {round.isWar ? 'מלחמה!' : 'OK'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Board */}
        <section className={`lg:col-span-3 ${t.board} rounded-[3rem] p-4 md:p-10 shadow-2xl border-4 border-slate-800/50 relative flex flex-col gap-8 items-center justify-center min-h-[500px] md:min-h-[650px] overflow-hidden bg-gradient-to-b from-transparent to-black/20`}>
          
          {/* Deck Counters */}
          <div className="w-full flex justify-between items-center px-4 md:px-12 absolute top-10 left-0 right-0 z-10">
             <DeckStack count={gameState.player2Deck.length} theme={theme} label={gameState.mode === GameMode.VS_COMPUTER ? 'מחשב' : 'שחקן 2'} winnerHighlight={lastWinnerId === 2} />
             
             <div className="text-center bg-slate-900/60 backdrop-blur-2xl p-4 rounded-3xl border border-slate-700/50 shadow-2xl min-w-[140px] md:min-w-[220px]">
                <p className="text-sm md:text-xl font-bold opacity-90 leading-tight">
                  {gameState.isPaused ? 'המשחק מושהה ⏸️' : gameState.lastResult}
                </p>
                {gameState.status === GameStatus.WAR && !gameState.isPaused && (
                  <div className="inline-block px-4 py-1 mt-2 rounded-full bg-red-600 text-white text-[10px] md:text-xs font-black animate-pulse uppercase tracking-widest">מלחמה!</div>
                )}
             </div>

             <DeckStack count={gameState.player1Deck.length} theme={theme} label="שחקן 1" isPlayer1 winnerHighlight={lastWinnerId === 1} />
          </div>

          {/* Cards Table */}
          <div className={`flex-1 flex items-center justify-center gap-6 md:gap-16 w-full mt-28 transition-all duration-700 ${gameState.isPaused ? 'opacity-20 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
            {/* P2 Side */}
            <div className="flex flex-col items-center">
              <div className="h-44 md:h-52 flex items-center justify-center">
                {gameState.player2InPlay.length > 0 ? (
                   <div className="relative">
                      <CardComponent 
                        card={gameState.player2InPlay.slice(-1)[0]} 
                        themeColors={t} 
                        side="left"
                        animationState={lastWinnerId === 2 ? 'winning' : gameState.status === GameStatus.WAR ? 'war' : 'playing'} 
                      />
                      {gameState.player2InPlay.length > 1 && (
                        <div className="absolute -bottom-8 -left-4 text-xs font-black bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg border-2 border-slate-900 animate-bounce">
                          +{gameState.player2InPlay.length - 1} קלפים
                        </div>
                      )}
                   </div>
                ) : <div className="w-24 md:w-36 h-36 md:h-52 rounded-2xl border-2 border-dashed border-slate-700/50 flex items-center justify-center text-slate-800 font-black text-2xl">?</div>}
              </div>
            </div>

            <div className="h-40 w-px bg-slate-800/50 hidden md:block" />

            {/* P1 Side */}
            <div className="flex flex-col items-center">
              <div className="h-44 md:h-52 flex items-center justify-center">
                {gameState.player1InPlay.length > 0 ? (
                  <div className="relative">
                    <CardComponent 
                      card={gameState.player1InPlay.slice(-1)[0]} 
                      themeColors={t} 
                      side="right"
                      animationState={lastWinnerId === 1 ? 'winning' : gameState.status === GameStatus.WAR ? 'war' : 'playing'} 
                    />
                    {gameState.player1InPlay.length > 1 && (
                      <div className="absolute -bottom-8 -right-4 text-xs font-black bg-emerald-600 text-white px-3 py-1 rounded-full shadow-lg border-2 border-slate-900 animate-bounce">
                        +{gameState.player1InPlay.length - 1} קלפים
                      </div>
                    )}
                  </div>
                ) : <div className="w-24 md:w-36 h-36 md:h-52 rounded-2xl border-2 border-dashed border-slate-700/50 flex items-center justify-center text-slate-800 font-black text-2xl">?</div>}
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          <div className="w-full flex justify-center pb-10 z-20">
            {isGameActive && (
               <button 
                onClick={handlePlayClick} 
                disabled={isProcessing || gameState.isPaused} 
                className={`px-12 md:px-32 py-5 md:py-8 rounded-[2.5rem] text-2xl md:text-4xl font-black bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_0_50px_rgba(16,185,129,0.3)] disabled:opacity-30 active:scale-95 transition-all w-full md:w-auto mx-4 uppercase tracking-tighter border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2`}
               >
                  {gameState.isPaused ? 'המשחק מושהה' : gameState.status === GameStatus.WAR ? 'מלחמה! 🔥' : 'הפוך קלף! 🃏'}
                </button>
            )}
            
            {gameState.status === GameStatus.FINISHED && (
               <button onClick={() => initializeGame(gameState.mode)} className="px-16 py-6 rounded-3xl text-2xl font-black bg-white text-slate-900 shadow-2xl active:scale-95 transition-all transform hover:-translate-y-1">שחק שוב 🔄</button>
            )}
          </div>

          {/* Start Screen Overlay */}
          {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-8 text-center rounded-[3rem]">
              <div className="max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-9xl mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">🃏</div>
                <h3 className="text-6xl font-black mb-4 font-serif text-white tracking-tight">מלחמה</h3>
                <p className="mb-12 text-slate-400 text-xl leading-relaxed">הגרסה המקצועית והמהירה ביותר למשחק הקלפים הקלאסי. קחו את כל הקלפים כדי לנצח!</p>
                <div className="flex flex-col gap-4">
                  <button onClick={() => initializeGame(GameMode.VS_COMPUTER)} className="w-full py-5 rounded-2xl bg-white text-slate-950 font-black text-2xl hover:bg-emerald-400 shadow-[0_10px_40px_rgba(255,255,255,0.1)] transition-all transform hover:-translate-y-1">נגד המחשב 🤖</button>
                  <button onClick={() => initializeGame(GameMode.TWO_PLAYERS)} className="w-full py-5 rounded-2xl border-2 border-slate-700 hover:border-emerald-500 text-slate-200 font-black text-2xl transition-all transform hover:-translate-y-1">שני שחקנים 👥</button>
                </div>
                <p className="mt-10 text-xs opacity-40 font-bold uppercase tracking-widest">WASD / SPACE / ENTER - קיצורי דרך</p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 max-w-6xl mx-auto w-full text-center border-t border-slate-800/50 pt-8 pb-4 opacity-40 text-[10px] md:text-xs">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p dir="ltr" className="font-mono tracking-tighter">(C) Noam Gold AI 2026</p>
          <div className="flex gap-6 items-center">
            <a href="mailto:goldnoamai@gmail.com" className="hover:text-white transition-colors underline decoration-slate-600">Send Feedback</a>
            <span className="font-mono">goldnoamai@gmail.com</span>
          </div>
        </div>
      </footer>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        .dir-rtl { direction: rtl; }
      `}</style>
    </div>
  );
};

export default App;