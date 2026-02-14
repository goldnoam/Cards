
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, GameMode, GameStatus, Theme, GameState, RoundHistory } from './types';
import { SUITS, RANKS, RANK_VALUES, THEME_CONFIG, SUIT_SYMBOLS } from './constants';
import CardComponent from './components/CardComponent';
import DeckStack from './components/DeckStack';
import { getCommentary } from './services/geminiService';
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
    commentary: 'מוכנים לקרב?',
    history: [],
    isPaused: false,
    isMuted: false
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [lastWinnerId, setLastWinnerId] = useState<number | null>(null); // 1, 2, or 0 (tie)
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
      commentary: mode === GameMode.VS_COMPUTER ? 'בהצלחה מול המחשב!' : 'שחקן 1 נגד שחקן 2!',
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
    setGameState(prev => ({
      ...prev,
      isPaused: !prev.isPaused
    }));
  };

  const toggleMute = () => {
    setGameState(prev => ({
      ...prev,
      isMuted: !prev.isMuted
    }));
  };

  const handleRoundCommentary = async (p1: Card, p2: Card, winner: string, isWar: boolean, p1C: number, p2C: number) => {
    const reaction = await getCommentary(p1.rank, p2.rank, winner, isWar, p1C, p2C);
    setGameState(prev => ({ ...prev, commentary: reaction }));
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
      handleRoundCommentary(p1Card, p2Card, 'Player 1', false, finalP1Deck.length, finalP2Deck.length);
      if (!gameState.isMuted) {
        // Delay sound to match the war suspense reveal if needed
        setTimeout(sounds.winRound, isCurrentWar ? 1000 : 300);
      }
    } else if (p2Card.value > p1Card.value) {
      resultMsg = gameState.mode === GameMode.VS_COMPUTER ? 'המחשב מנצח!' : 'שחקן 2 מנצח!';
      winnerId = 2;
      finalP2Deck = [...newP2Deck, ...shuffle([...newP1InPlay, ...newP2InPlay])];
      handleRoundCommentary(p1Card, p2Card, gameState.mode === GameMode.VS_COMPUTER ? 'Computer' : 'Player 2', false, finalP1Deck.length, finalP2Deck.length);
      if (!gameState.isMuted) {
        setTimeout(sounds.winRound, isCurrentWar ? 1000 : 300);
      }
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
      handleRoundCommentary(p1Card, p2Card, 'Tie', true, finalP1Deck.length, finalP2Deck.length);
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
      history: [roundRecord, ...prev.history].slice(0, 10)
    }));

    // Longer processing time during War to allow the suspenseful animation to complete
    setTimeout(() => setIsProcessing(false), isCurrentWar ? 1400 : 600);
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
    <div className={`min-h-screen transition-colors duration-500 flex flex-col ${t.bg} ${t.text} p-3 md:p-8 overflow-hidden`}>
      {/* Header */}
      <header className={`max-w-6xl mx-auto w-full flex flex-row items-center justify-between mb-4 md:mb-8 gap-4 transition-all duration-500 ${isGameActive ? 'opacity-40' : ''}`}>
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold font-serif tracking-tight mb-1 text-right md:text-left">
            מלחמה <span className="hidden md:inline text-sm font-normal align-top opacity-70">MILCHAMA</span>
          </h1>
          {!isGameActive && <p className="opacity-60 text-xs md:text-sm text-right md:text-left">משחק הקלפים הקלאסי בעיצוב מודרני</p>}
        </div>

        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl backdrop-blur-sm scale-90 md:scale-100">
          <button 
            onClick={toggleMute} 
            className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${gameState.isMuted ? 'bg-red-500/20 text-red-500' : 'hover:bg-white/10'}`}
            title={gameState.isMuted ? 'בטל השתקה' : 'השתק קול'}
          >
            {gameState.isMuted ? '🔇' : '🔊'}
          </button>
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <button onClick={() => setTheme(Theme.LIGHT)} className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${theme === Theme.LIGHT ? 'bg-white text-black shadow-lg' : 'hover:bg-white/10'}`}>☀️</button>
          <button onClick={() => setTheme(Theme.DARK)} className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${theme === Theme.DARK ? 'bg-gray-800 text-white shadow-lg' : 'hover:bg-white/10'}`}>🌙</button>
          <button onClick={() => setTheme(Theme.COLORFUL_DARK)} className={`w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all ${theme === Theme.COLORFUL_DARK ? 'bg-fuchsia-600 text-white shadow-lg' : 'hover:bg-white/10'}`}>🌈</button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-8 overflow-hidden">
        
        {/* Left Actions / Stats */}
        <aside className={`lg:col-span-1 flex flex-col gap-4 md:gap-6 ${isGameActive ? 'hidden lg:flex' : 'flex'}`}>
          <div className={`${t.card} rounded-3xl p-5 md:p-6 shadow-2xl border border-white/5 flex flex-col gap-4`}>
            <h2 className="text-xl font-bold border-b border-white/10 pb-2 text-right">תפריט משחק</h2>
            
            <button 
              onClick={() => initializeGame(GameMode.VS_COMPUTER)}
              className={`w-full py-3 rounded-xl font-bold transition-all ${t.accent} ${t.accentHover} text-white shadow-xl transform active:scale-95`}
            >
              נגד המחשב 🤖
            </button>
            <button 
              onClick={() => initializeGame(GameMode.TWO_PLAYERS)}
              className={`w-full py-3 rounded-xl font-bold transition-all ${t.secondary} hover:bg-opacity-80 transform active:scale-95`}
            >
              שני שחקנים 👥
            </button>

            {isGameActive && (
              <div className="flex flex-col gap-2 mt-2">
                <button 
                  onClick={togglePause}
                  className={`w-full py-3 rounded-xl font-bold border transition-all transform active:scale-95 ${gameState.isPaused ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500 hover:text-white'}`}
                >
                  {gameState.isPaused ? 'המשך משחק ▶️' : 'השהה משחק ⏸️'}
                </button>
                <button 
                  onClick={resetToMenu}
                  className="w-full py-3 rounded-xl font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all transform active:scale-95"
                >
                  אפס משחק 🔄
                </button>
              </div>
            )}
          </div>

          <div className={`${t.card} rounded-3xl p-5 md:p-6 shadow-xl border border-white/5 flex flex-col gap-4 max-h-40 overflow-hidden`}>
            <h2 className="text-lg font-bold border-b border-white/10 pb-2 flex justify-between items-center">
              <span>פרשנות AI</span>
              <span className="text-[10px] uppercase opacity-40">Gemini</span>
            </h2>
            <div className="flex-1 overflow-y-auto italic text-center text-sm leading-relaxed px-2 flex items-center justify-center">
              "{gameState.commentary}"
            </div>
          </div>

          <div className={`${t.card} rounded-3xl p-5 md:p-6 shadow-xl border border-white/5 flex flex-col gap-3 flex-1 overflow-hidden`}>
            <h2 className="text-lg font-bold border-b border-white/10 pb-2 text-right">קרבות אחרונים</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar text-right">
              {gameState.history.length === 0 ? (
                <p className="text-xs opacity-30 text-center mt-4 italic">טרם בוצעו מהלכים</p>
              ) : (
                gameState.history.map((round, idx) => (
                  <div key={idx} className="bg-white/5 rounded-lg p-2 flex items-center justify-between text-[10px] border border-white/5 dir-rtl">
                    <div className="flex items-center gap-2">
                       <span className={`font-bold ${round.p1Card.suit === 'Hearts' || round.p1Card.suit === 'Diamonds' ? 'text-red-400' : 'text-slate-400'}`}>
                         {round.p1Card.rank}{SUIT_SYMBOLS[round.p1Card.suit]}
                       </span>
                       <span className="opacity-30">vs</span>
                       <span className={`font-bold ${round.p2Card.suit === 'Hearts' || round.p2Card.suit === 'Diamonds' ? 'text-red-400' : 'text-slate-400'}`}>
                         {round.p2Card.rank}{SUIT_SYMBOLS[round.p2Card.suit]}
                       </span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full ${round.isWar ? 'bg-red-500/20 text-red-400' : 'bg-green-500/10 opacity-70'}`}>
                      {round.isWar ? 'מלחמה!' : 'OK'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* Game Board */}
        <section className={`lg:col-span-3 ${t.board} rounded-[2rem] md:rounded-[3rem] p-4 md:p-10 shadow-inner border-4 border-black/10 relative flex flex-col gap-4 md:gap-8 items-center justify-center min-h-[450px] md:min-h-[600px] overflow-hidden`}>
          
          {/* Deck Counters with Visual Stack */}
          <div className="w-full flex justify-between items-center px-2 md:px-8 absolute top-8 left-0 right-0 z-0">
             <DeckStack 
               count={gameState.player2Deck.length} 
               theme={theme} 
               label={gameState.mode === GameMode.VS_COMPUTER ? 'מחשב' : 'שחקן 2'} 
               winnerHighlight={lastWinnerId === 2}
             />
             
             <div className="flex-1 flex flex-col items-center justify-center px-4">
                {isGameActive && (
                  <div className="lg:hidden flex gap-2 mb-2">
                    <button onClick={togglePause} className="text-[10px] font-bold opacity-30 uppercase border border-white/10 px-2 py-1 rounded hover:opacity-100 transition-opacity">
                      {gameState.isPaused ? 'המשך' : 'השהה'}
                    </button>
                    <button onClick={resetToMenu} className="text-[10px] font-bold opacity-30 uppercase border border-white/10 px-2 py-1 rounded hover:opacity-100 transition-opacity">
                      תפריט
                    </button>
                  </div>
                )}
                <div className="text-center z-10 bg-black/20 backdrop-blur-sm p-3 rounded-2xl border border-white/5">
                    <p className="text-sm md:text-xl font-bold opacity-90 mb-1 leading-tight">
                      {gameState.isPaused ? 'המשחק מושהה ⏸️' : gameState.lastResult}
                    </p>
                    {gameState.status === GameStatus.WAR && !gameState.isPaused && (
                      <div className="inline-block px-3 md:px-4 py-1 rounded-full bg-red-600 text-white text-[10px] md:text-xs font-black animate-pulse uppercase">
                        מלחמה!
                      </div>
                    )}
                </div>
             </div>

             <DeckStack 
               count={gameState.player1Deck.length} 
               theme={theme} 
               label="שחקן 1" 
               isPlayer1
               winnerHighlight={lastWinnerId === 1}
             />
          </div>

          {/* Table Cards - The Battleground */}
          <div className={`flex-1 flex items-center justify-center gap-4 md:gap-12 w-full mt-24 transition-opacity duration-300 ${gameState.isPaused ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex flex-col items-center">
              <div className="h-40 md:h-48 flex items-center justify-center">
                {gameState.player2InPlay.length > 0 ? (
                   <div className="relative">
                      {gameState.player2InPlay.slice(-1).map((card) => (
                        <CardComponent 
                          key={`${card.rank}-${card.suit}`} 
                          card={card} 
                          themeColors={t} 
                          className="rotate-3 shadow-2xl scale-90 md:scale-100"
                          animationState={lastWinnerId === 2 ? 'winning' : gameState.status === GameStatus.WAR ? 'war' : 'playing'}
                        />
                      ))}
                      {gameState.player2InPlay.length > 1 && (
                        <div className="absolute -bottom-6 -left-2 text-[10px] font-bold opacity-70 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                          +{gameState.player2InPlay.length - 1} קלפים
                        </div>
                      )}
                   </div>
                ) : (
                  <div className="w-20 md:w-32 h-30 md:h-48 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center opacity-20">
                     <span className="text-[10px] uppercase font-bold tracking-widest">ממתין</span>
                  </div>
                )}
              </div>
            </div>

            <div className="h-20 md:h-32 w-px bg-white/10 self-center hidden md:block" />

            <div className="flex flex-col items-center">
              <div className="h-40 md:h-48 flex items-center justify-center">
                {gameState.player1InPlay.length > 0 ? (
                  <div className="relative">
                    {gameState.player1InPlay.slice(-1).map((card) => (
                      <CardComponent 
                        key={`${card.rank}-${card.suit}`} 
                        card={card} 
                        themeColors={t} 
                        className="-rotate-3 shadow-2xl scale-90 md:scale-100"
                        animationState={lastWinnerId === 1 ? 'winning' : gameState.status === GameStatus.WAR ? 'war' : 'playing'}
                      />
                    ))}
                    {gameState.player1InPlay.length > 1 && (
                      <div className="absolute -bottom-6 -right-2 text-[10px] font-bold opacity-70 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        +{gameState.player1InPlay.length - 1} קלפים
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-20 md:w-32 h-30 md:h-48 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center opacity-20">
                    <span className="text-[10px] uppercase font-bold tracking-widest">ממתין</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Action Button */}
          <div className="w-full flex justify-center pb-8 z-10">
            {isGameActive && (
               <button 
                  onClick={handlePlayClick}
                  disabled={isProcessing || gameState.isPaused}
                  className={`px-8 md:px-20 py-4 md:py-6 rounded-3xl text-xl md:text-3xl font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse disabled:opacity-50 disabled:animate-none transform active:scale-95 transition-all w-full md:w-auto mx-4 uppercase tracking-tighter`}
                >
                  {gameState.isPaused ? 'המשחק מושהה' : gameState.status === GameStatus.WAR ? 'מלחמה!' : 'הפוך קלף! 🔥'}
                </button>
            )}
            
            {gameState.status === GameStatus.FINISHED && (
               <button 
                  onClick={() => initializeGame(gameState.mode)}
                  className={`px-12 md:px-20 py-4 md:py-6 rounded-3xl text-xl font-black bg-white text-black shadow-2xl transform active:scale-95 transition-all`}
                >
                  שחק שוב 🔄
                </button>
            )}
          </div>

          {/* Overlay for Pause State */}
          {gameState.isPaused && (
            <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm flex items-center justify-center">
               <button 
                 onClick={togglePause}
                 className="px-12 py-6 rounded-3xl bg-emerald-500 text-white text-3xl font-black shadow-2xl transform hover:scale-105 active:scale-95 transition-all"
               >
                 המשך משחק ▶️
               </button>
            </div>
          )}

          {/* Overlay for Idle State */}
          {gameState.status === GameStatus.IDLE && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xl flex items-center justify-center p-6 md:p-8 text-center rounded-[2rem] md:rounded-[3rem]">
              <div className="max-w-md animate-in fade-in zoom-in duration-500">
                <div className="text-6xl md:text-8xl mb-4 md:mb-8 drop-shadow-2xl">🃏</div>
                <h3 className="text-3xl md:text-5xl font-black mb-4 font-serif">מלחמה</h3>
                <p className="mb-8 md:mb-12 opacity-80 text-sm md:text-xl font-medium leading-relaxed">
                  המשחק הקלאסי. כל שחקן מקבל חצי חפיסה. <br/> המנצח הוא זה שלוקח את כל הקלפים!
                </p>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => initializeGame(GameMode.VS_COMPUTER)} 
                    className="w-full py-4 md:py-5 rounded-2xl bg-white text-black font-black text-lg md:text-xl shadow-2xl hover:bg-opacity-90 transition-all transform hover:-translate-y-1"
                  >
                    נגד המחשב 🤖
                  </button>
                  <button 
                    onClick={() => initializeGame(GameMode.TWO_PLAYERS)} 
                    className="w-full py-4 md:py-5 rounded-2xl border-2 border-white/20 hover:border-white text-white font-black text-lg md:text-xl transition-all transform hover:-translate-y-1"
                  >
                    שני שחקנים 👥
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className={`mt-4 md:mt-12 max-w-6xl mx-auto w-full text-center border-t border-white/5 pt-4 md:pt-8 transition-opacity duration-500 ${isGameActive ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'opacity-30'}`}>
        <p className="text-[10px] md:text-xs">MILCHAMA - משחק הקלפים של כולם</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        .dir-rtl { direction: rtl; }
      `}</style>
    </div>
  );
};

export default App;
