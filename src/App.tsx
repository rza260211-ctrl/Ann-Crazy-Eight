/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw, 
  Hand, 
  Info, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, Suit, GameState, Turn, SUITS, SUIT_SYMBOLS, SUIT_COLORS } from './types';
import { createDeck, shuffleDeck, isValidMove, getAIAction, getBestSuitForAI } from './utils';

// --- Components ---

const PlayingCard = ({ 
  card, 
  isFaceUp = true, 
  onClick, 
  isPlayable = false,
  isSmall = false,
  className = ""
}: { 
  card: Card; 
  isFaceUp?: boolean; 
  onClick?: () => void; 
  isPlayable?: boolean;
  isSmall?: boolean;
  className?: string;
}) => {
  const symbol = SUIT_SYMBOLS[card.suit];
  const colorClass = SUIT_COLORS[card.suit];

  return (
    <motion.div
      layout
      whileHover={isPlayable ? { y: -20, scale: 1.05 } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`
        relative ${isSmall ? 'w-16 h-24' : 'w-24 h-36 md:w-32 md:h-48'} 
        rounded-xl shadow-lg cursor-pointer select-none overflow-hidden
        ${isFaceUp ? 'bg-white border-2 border-slate-100' : 'bg-red-700 border-4 border-yellow-500'}
        ${isPlayable ? 'ring-4 ring-emerald-400 ring-offset-2' : ''}
        flex flex-col items-center justify-center
        transition-shadow duration-200
        ${className}
      `}
    >
      {isFaceUp ? (
        <>
          <div className={`absolute top-2 left-2 flex flex-col items-center ${colorClass}`}>
            <span className="text-lg md:text-xl font-bold leading-none">{card.rank}</span>
            <span className="text-sm md:text-base">{symbol}</span>
          </div>
          <div className={`text-4xl md:text-6xl ${colorClass}`}>{symbol}</div>
          <div className={`absolute bottom-2 right-2 flex flex-col items-center rotate-180 ${colorClass}`}>
            <span className="text-lg md:text-xl font-bold leading-none">{card.rank}</span>
            <span className="text-sm md:text-base">{symbol}</span>
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center relative">
          {/* Corner Patterns */}
          <div className="absolute top-1 left-1 text-yellow-500/40 text-[10px] md:text-xs font-bold">福</div>
          <div className="absolute top-1 right-1 text-yellow-500/40 text-[10px] md:text-xs font-bold">福</div>
          <div className="absolute bottom-1 left-1 text-yellow-500/40 text-[10px] md:text-xs font-bold">福</div>
          <div className="absolute bottom-1 right-1 text-yellow-500/40 text-[10px] md:text-xs font-bold">福</div>
          
          <div className="w-16 h-16 md:w-24 md:h-24 border-2 border-yellow-500/40 rounded-full flex items-center justify-center bg-gradient-to-br from-red-800/60 to-red-900/80 shadow-2xl backdrop-blur-[2px]">
             <div className="flex flex-col items-center">
                <div className="relative w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-yellow-500/50 shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&q=80&w=300&h=300" 
                    alt="Majestic Horse" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent" />
                </div>
                <span className="text-yellow-500/80 text-[7px] md:text-[9px] font-black uppercase tracking-[0.2em] mt-1 drop-shadow-sm">Year of Horse</span>
             </div>
          </div>
          
          {/* Decorative lines */}
          <div className="absolute inset-1.5 border border-yellow-500/20 rounded-lg pointer-events-none" />
          <div className="absolute inset-3 border border-yellow-500/10 rounded-md pointer-events-none" />
        </div>
      )}
    </motion.div>
  );
};

const SuitSelector = ({ onSelect }: { onSelect: (suit: Suit) => void }) => {
  const suitNames: Record<Suit, string> = {
    hearts: '红桃',
    diamonds: '方块',
    clubs: '梅花',
    spades: '黑桃'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">选择一个花色</h2>
        <div className="grid grid-cols-2 gap-4">
          {SUITS.map((suit) => (
            <button
              key={suit}
              onClick={() => onSelect(suit)}
              className={`
                flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100
                hover:border-indigo-500 hover:bg-indigo-50 transition-all group
              `}
            >
              <span className={`text-5xl mb-2 ${SUIT_COLORS[suit]}`}>{SUIT_SYMBOLS[suit]}</span>
              <span className="text-sm font-semibold text-slate-600 capitalize group-hover:text-indigo-600">
                {suitNames[suit]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Splash = ({ onStart }: { onStart: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-6 overflow-hidden"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/20 rounded-full blur-[120px]" />
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex flex-col items-center text-center max-w-lg"
      >
        <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 mb-8 rotate-12">
          <span className="font-black text-5xl">8</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter">
          ANN <span className="text-indigo-400">疯狂</span> 8
        </h1>
        
        <p className="text-slate-400 text-lg md:text-xl font-medium mb-12 max-w-sm">
          马年主题的高级卡牌游戏体验。
        </p>
        
        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={onStart}
            className="w-full py-5 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 group"
          >
            开始游戏
            <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex flex-col items-center">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">主题</span>
              <span className="text-yellow-500 font-bold">2026 马年</span>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex flex-col items-center">
              <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">难度</span>
              <span className="text-indigo-400 font-bold">专业级 AI</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Floating Cards Decoration */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [15, 10, 15]
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute top-20 right-[10%] hidden lg:block opacity-40"
      >
        <div className="w-32 h-48 bg-white rounded-xl border-4 border-slate-100 shadow-2xl flex items-center justify-center">
           <span className="text-red-500 text-4xl font-black">A♥</span>
        </div>
      </motion.div>
      
      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          rotate: [-15, -10, -15]
        }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute bottom-20 left-[10%] hidden lg:block opacity-40"
      >
        <div className="w-32 h-48 bg-red-700 rounded-xl border-4 border-yellow-500 shadow-2xl flex items-center justify-center">
           <span className="text-yellow-400 text-4xl font-black">马</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [aiHand, setAiHand] = useState<Card[]>([]);
  const [discardPile, setDiscardPile] = useState<Card[]>([]);
  const [currentSuit, setCurrentSuit] = useState<Suit | null>(null);
  const [turn, setTurn] = useState<Turn>('player');
  const [gameState, setGameState] = useState<GameState>('splash');
  const [showSuitSelector, setShowSuitSelector] = useState(false);
  const [pendingEightCard, setPendingEightCard] = useState<Card | null>(null);
  const [message, setMessage] = useState<string>("欢迎来到疯狂8！");
  const [isAiThinking, setIsAiThinking] = useState(false);

  const gameInitRef = useRef(false);

  const initGame = useCallback(() => {
    const newDeck = shuffleDeck(createDeck());
    const pHand = newDeck.splice(0, 8);
    const aHand = newDeck.splice(0, 8);
    
    // Find first non-8 card for discard pile
    let firstCardIndex = 0;
    while (newDeck[firstCardIndex].rank === '8') {
      firstCardIndex++;
    }
    const firstCard = newDeck.splice(firstCardIndex, 1)[0];

    setDeck(newDeck);
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstCard]);
    setCurrentSuit(firstCard.suit);
    setTurn('player');
    setGameState('playing');
    setMessage("Your turn! Match the suit or rank.");
  }, []);

  useEffect(() => {
    if (!gameInitRef.current) {
      initGame();
      gameInitRef.current = true;
    }
  }, [initGame]);

  const checkWinner = useCallback((pHand: Card[], aHand: Card[]) => {
    if (pHand.length === 0) {
      setGameState('gameOver');
      setMessage("You Won! 🎉");
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      return true;
    }
    if (aHand.length === 0) {
      setGameState('gameOver');
      setMessage("AI Won! Better luck next time.");
      return true;
    }
    return false;
  }, []);

  const handlePlayCard = (card: Card, isPlayer: boolean) => {
    if (gameState !== 'playing') return;
    
    const topCard = discardPile[discardPile.length - 1];
    if (!isValidMove(card, topCard, currentSuit!)) return;

    if (isPlayer) {
      if (card.rank === '8') {
        setPendingEightCard(card);
        setShowSuitSelector(true);
        return;
      }
      
      const newHand = playerHand.filter(c => c.id !== card.id);
      setPlayerHand(newHand);
      setDiscardPile(prev => [...prev, card]);
      setCurrentSuit(card.suit);
      
      if (!checkWinner(newHand, aiHand)) {
        setTurn('ai');
        setMessage("AI is thinking...");
      }
    } else {
      // AI logic handled in useEffect
    }
  };

  const handleSuitSelect = (suit: Suit) => {
    if (!pendingEightCard) return;

    const newHand = playerHand.filter(c => c.id !== pendingEightCard.id);
    setPlayerHand(newHand);
    setDiscardPile(prev => [...prev, pendingEightCard]);
    setCurrentSuit(suit);
    setShowSuitSelector(false);
    setPendingEightCard(null);

    if (!checkWinner(newHand, aiHand)) {
      setTurn('ai');
      setMessage(`You changed suit to ${suit.toUpperCase()}! AI's turn.`);
    }
  };

  const handleDrawCard = (isPlayer: boolean) => {
    if (gameState !== 'playing') return;
    if (deck.length === 0) {
      setMessage("Draw pile is empty! Turn skipped.");
      setTurn(isPlayer ? 'ai' : 'player');
      return;
    }

    const newDeck = [...deck];
    const drawnCard = newDeck.pop()!;
    setDeck(newDeck);

    if (isPlayer) {
      const newHand = [...playerHand, drawnCard];
      setPlayerHand(newHand);
      
      const topCard = discardPile[discardPile.length - 1];
      if (!isValidMove(drawnCard, topCard, currentSuit!)) {
        setMessage("Drawn card doesn't match. Turn skipped.");
        setTurn('ai');
      } else {
        setMessage("You drew a playable card!");
      }
    } else {
      setAiHand(prev => [...prev, drawnCard]);
      // AI logic will decide what to do next in its turn cycle
    }
  };

  // AI Turn Logic
  useEffect(() => {
    if (turn === 'ai' && gameState === 'playing') {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const topCard = discardPile[discardPile.length - 1];
        const action = getAIAction(aiHand, topCard, currentSuit!);

        if (action.type === 'play') {
          const card = action.card;
          const newHand = aiHand.filter(c => c.id !== card.id);
          setAiHand(newHand);
          setDiscardPile(prev => [...prev, card]);
          
          if (card.rank === '8') {
            const bestSuit = getBestSuitForAI(newHand);
            setCurrentSuit(bestSuit);
            setMessage(`AI played an 8 and changed suit to ${bestSuit.toUpperCase()}!`);
          } else {
            setCurrentSuit(card.suit);
            setMessage(`AI played ${card.rank} of ${card.suit}. Your turn!`);
          }

          if (!checkWinner(playerHand, newHand)) {
            setTurn('player');
          }
        } else {
          // AI must draw
          if (deck.length > 0) {
            const newDeck = [...deck];
            const drawnCard = newDeck.pop()!;
            setDeck(newDeck);
            
            const newHand = [...aiHand, drawnCard];
            setAiHand(newHand);
            
            if (isValidMove(drawnCard, topCard, currentSuit!)) {
              // AI draws and plays immediately if possible
              const finalHand = newHand.filter(c => c.id !== drawnCard.id);
              setAiHand(finalHand);
              setDiscardPile(prev => [...prev, drawnCard]);
              
              if (drawnCard.rank === '8') {
                const bestSuit = getBestSuitForAI(finalHand);
                setCurrentSuit(bestSuit);
                setMessage(`AI drew, played an 8 and changed suit to ${bestSuit.toUpperCase()}!`);
              } else {
                setCurrentSuit(drawnCard.suit);
                setMessage(`AI drew and played ${drawnCard.rank} of ${drawnCard.suit}. Your turn!`);
              }
              
              if (!checkWinner(playerHand, finalHand)) {
                setTurn('player');
              }
            } else {
              setMessage("AI drew a card but couldn't play. Your turn!");
              setTurn('player');
            }
          } else {
            setMessage("AI couldn't play or draw. Your turn!");
            setTurn('player');
          }
        }
        setIsAiThinking(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [turn, aiHand, discardPile, currentSuit, deck, gameState, playerHand, checkWinner]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <span className="font-black text-xl">8</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">Ann 疯狂 8</h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">经典卡牌游戏</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${turn === 'player' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-xs font-bold text-slate-600 uppercase">{turn === 'player' ? '轮到你' : "AI 正在思考"}</span>
          </div>
          <button 
            onClick={() => {
              gameInitRef.current = false;
              initGame();
            }}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            title="重新开始"
          >
            <RotateCcw size={20} className="text-slate-600" />
          </button>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 relative p-4 md:p-8 flex flex-col justify-between max-w-7xl mx-auto w-full">
        
        {/* AI Hand */}
        <div className="flex justify-center h-24 md:h-32">
          <div className="relative flex justify-center w-full max-w-2xl">
            {aiHand.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: -50 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  x: (index - (aiHand.length - 1) / 2) * (window.innerWidth < 768 ? 20 : 40),
                  rotate: (index - (aiHand.length - 1) / 2) * 2
                }}
                className="absolute"
              >
                <PlayingCard card={card} isFaceUp={false} isSmall />
              </motion.div>
            ))}
            {aiHand.length === 0 && gameState === 'playing' && (
              <div className="text-slate-400 font-medium italic">AI 已经出完牌了！</div>
            )}
          </div>
        </div>

        {/* Center: Deck & Discard */}
        <div className="flex flex-col items-center gap-8 my-8">
          <div className="flex items-center gap-12 md:gap-24">
            {/* Draw Pile */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {deck.length > 0 ? (
                  <>
                    {/* Visual stack effect */}
                    {[...Array(Math.min(3, deck.length))].map((_, i) => (
                      <div 
                        key={i}
                        className="absolute bg-indigo-700 border-2 border-white rounded-xl w-24 h-36 md:w-32 md:h-48 shadow-md"
                        style={{ top: -i * 2, left: -i * 2, zIndex: -i }}
                      />
                    ))}
                    <PlayingCard 
                      card={deck[deck.length - 1]} 
                      isFaceUp={false} 
                      isPlayable={turn === 'player' && gameState === 'playing'}
                      onClick={() => handleDrawCard(true)}
                    />
                  </>
                ) : (
                  <div className="w-24 h-36 md:w-32 md:h-48 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                    已空
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">摸牌堆 ({deck.length})</span>
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  {discardPile.length > 0 && (
                    <motion.div
                      key={discardPile[discardPile.length - 1].id}
                      initial={{ scale: 0.8, opacity: 0, rotate: Math.random() * 20 - 10, x: 50 }}
                      animate={{ scale: 1, opacity: 1, rotate: Math.random() * 10 - 5, x: 0 }}
                      exit={{ scale: 1.1, opacity: 0 }}
                    >
                      <PlayingCard card={discardPile[discardPile.length - 1]} />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Current Suit Indicator if it's an 8 */}
                {discardPile.length > 0 && discardPile[discardPile.length - 1].rank === '8' && currentSuit && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-xl border-2 border-slate-100 flex items-center justify-center z-20"
                  >
                    <span className={`text-2xl ${SUIT_COLORS[currentSuit]}`}>{SUIT_SYMBOLS[currentSuit]}</span>
                  </motion.div>
                )}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">弃牌堆</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 max-w-md w-full">
            {isAiThinking ? (
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
              </div>
            ) : turn === 'player' ? (
              <CheckCircle2 className="text-emerald-500" size={20} />
            ) : (
              <AlertCircle className="text-amber-500" size={20} />
            )}
            <p className="text-sm font-semibold text-slate-700">{message}</p>
          </div>
        </div>

        {/* Player Hand */}
        <div className="relative flex justify-center h-48 md:h-64 items-end pb-4">
          <div className="flex justify-center w-full max-w-4xl px-4">
            <div className="relative flex justify-center items-end w-full">
              {playerHand.map((card, index) => {
                const isPlayable = turn === 'player' && 
                                 gameState === 'playing' && 
                                 isValidMove(card, discardPile[discardPile.length - 1], currentSuit!);
                
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      x: (index - (playerHand.length - 1) / 2) * (window.innerWidth < 768 ? 30 : 60),
                      rotate: (index - (playerHand.length - 1) / 2) * 3,
                      zIndex: index
                    }}
                    className="absolute bottom-0"
                  >
                    <PlayingCard 
                      card={card} 
                      isPlayable={isPlayable}
                      onClick={() => handlePlayCard(card, true)}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {gameState === 'splash' && (
          <Splash onStart={() => {
            setGameState('dealing');
            initGame();
          }} />
        )}

        {showSuitSelector && (
          <SuitSelector onSelect={handleSuitSelect} />
        )}

        {gameState === 'gameOver' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="text-indigo-600" size={40} />
              </div>
              <h2 className="text-3xl font-black text-slate-800 mb-2">游戏结束</h2>
              <p className="text-slate-500 font-medium mb-8">{message}</p>
              
              <button
                onClick={() => {
                  gameInitRef.current = false;
                  initGame();
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 group"
              >
                <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                再玩一次
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Controls Overlay (Optional) */}
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        {turn === 'player' && gameState === 'playing' && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-emerald-500 text-white p-3 rounded-full shadow-lg"
          >
            <Hand size={24} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
