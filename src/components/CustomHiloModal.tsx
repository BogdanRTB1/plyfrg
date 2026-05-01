import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ArrowUp, ArrowDown, Target } from 'lucide-react';
import { HiLoConfig, DEFAULT_HILO_CONFIG } from '@/types/hiloConfig';
import confetti from 'canvas-confetti';
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import FavoriteToggle from "./FavoriteToggle";
import { createPortal } from "react-dom";

interface CustomHiloModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameConfig?: any;
    gameName?: string;
    diamonds?: number;
    setDiamonds?: (val: any) => void;
    forgesCoins?: number;
    setForgesCoins?: (val: any) => void;
}

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Card = {
    rank: number; // 2-14
    suit: Suit;
    id: string;
};

// Map number to rank string
const getRankStr = (rank: number) => {
    switch (rank) {
        case 11: return 'J';
        case 12: return 'Q';
        case 13: return 'K';
        case 14: return 'A';
        default: return rank.toString();
    }
};

const getSuitSymbol = (suit: Suit) => {
    switch (suit) {
        case 'hearts': return '♥';
        case 'diamonds': return '♦';
        case 'clubs': return '♣';
        case 'spades': return '♠';
    }
};

const getSuitColor = (suit: Suit) => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-slate-800';
};

const SHAPES = {
    oscillator: null as unknown as OscillatorNode,
    gainNode: null as unknown as GainNode,
};

export default function CustomHiloModal({ isOpen, onClose, gameConfig, gameName, diamonds = 0, setDiamonds, forgesCoins = 0, setForgesCoins }: CustomHiloModalProps) {
    const config: HiLoConfig = gameConfig?.hiloConfig || DEFAULT_HILO_CONFIG;
    
    const [soundEnabled, setSoundEnabled] = useState(true);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const customAudioRef = useRef<HTMLAudioElement | null>(null);

    const [deck, setDeck] = useState<Card[]>([]);
    const [currentCard, setCurrentCard] = useState<Card | null>(null);
    const [previousCards, setPreviousCards] = useState<Card[]>([]);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [streak, setStreak] = useState(0);
    const [multiplier, setMultiplier] = useState(1.0);

    // Betting states
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    // Initialize Audio Context
    useEffect(() => {
        if (isOpen && !audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(() => {});
                audioCtxRef.current = null;
            }
        };
    }, [isOpen]);

    // Create a new deck
    const generateDeck = () => {
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const newDeck: Card[] = [];
        for (let r = 2; r <= 14; r++) {
            for (let s of suits) {
                newDeck.push({ rank: r, suit: s, id: `${r}-${s}-${Date.now()}-${Math.random()}` });
            }
        }
        // Shuffle
        for (let i = newDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
        }
        return newDeck;
    };

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC' && setDiamonds) {
            setDiamonds((prev: number) => prev - betAmount);
        } else if (setForgesCoins) {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);

        const newDeck = generateDeck();
        const firstCard = newDeck.pop()!;
        setDeck(newDeck);
        setCurrentCard(firstCard);
        setPreviousCards([]);
        setIsPlaying(true);
        setGameOver(false);
        setStreak(0);
        setMultiplier(1.0);
    };

    // Play deal sound
    const playDealSound = () => {
        if (!soundEnabled || !audioCtxRef.current) return;
        
        if (config.dealSoundType === 'custom' && config.dealSoundFile) {
            if (!customAudioRef.current) {
                customAudioRef.current = new Audio(config.dealSoundFile);
            } else {
                customAudioRef.current.src = config.dealSoundFile;
            }
            customAudioRef.current.currentTime = 0;
            customAudioRef.current.play().catch(() => {});
            return;
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (config.dealSoundType === 'asmr') {
             const bufferSize = ctx.sampleRate * 0.1;
             const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
             const data = buffer.getChannelData(0);
             for (let i = 0; i < bufferSize; i++) {
                 data[i] = Math.random() * 2 - 1;
             }
             const noise = ctx.createBufferSource();
             noise.buffer = buffer;
             const noiseFilter = ctx.createBiquadFilter();
             noiseFilter.type = 'lowpass';
             noiseFilter.frequency.value = 1000;
             const noiseGain = ctx.createGain();
             
             noise.connect(noiseFilter);
             noiseFilter.connect(noiseGain);
             noiseGain.connect(ctx.destination);
             
             noiseGain.gain.setValueAtTime(0.5, ctx.currentTime);
             noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
             noise.start(ctx.currentTime);
             noise.stop(ctx.currentTime + 0.1);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.1);
        }
    };

    // Play lose sound
    const playLossSound = () => {
        if (!soundEnabled || !audioCtxRef.current) return;

        if (config.lossSoundType === 'custom' && config.lossSoundFile) {
            if (!customAudioRef.current) {
                customAudioRef.current = new Audio(config.lossSoundFile);
            } else {
                customAudioRef.current.src = config.lossSoundFile;
            }
            customAudioRef.current.currentTime = 0;
            customAudioRef.current.play().catch(() => {});
            return;
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (config.lossSoundType === 'buzzer') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.setValueAtTime(90, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        } else {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.6);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.7);
        }
    };

    const handleGuess = (guess: 'higher' | 'lower') => {
        if (!isPlaying || gameOver || !currentCard || deck.length === 0) return;

        const nextDeck = [...deck];
        const nextCard = nextDeck.pop()!;
        
        const isHigher = nextCard.rank > currentCard.rank;
        const isLower = nextCard.rank < currentCard.rank;
        const isTie = nextCard.rank === currentCard.rank;

        let isCorrect = false;
        if (guess === 'higher' && (isHigher || isTie)) isCorrect = true;
        if (guess === 'lower' && (isLower || isTie)) isCorrect = true;

        playDealSound();

        setPreviousCards(prev => [...prev, currentCard]);
        setCurrentCard(nextCard);
        setDeck(nextDeck);

        if (isCorrect) {
            let multIncrease = 0;
            const totalRanks = 13;
            if (guess === 'higher') {
                const higherCards = 14 - currentCard.rank;
                multIncrease = (totalRanks / (higherCards || 1)) * 0.1;
            } else {
                const lowerCards = currentCard.rank - 2;
                multIncrease = (totalRanks / (lowerCards || 1)) * 0.1;
            }
            
            multIncrease = Math.max(0.1, Math.min(2.0, multIncrease));
            const newMult = parseFloat((multiplier + multIncrease).toFixed(2));
            setMultiplier(newMult);
            setStreak(prev => prev + 1);
            
            if (streak > 0 && streak % 5 === 0) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.6, x: 0.5 },
                    colors: [config.accentColor, '#ffffff']
                });
            }

        } else {
            playLossSound();
            setGameOver(true);
            setIsPlaying(false);
        }
    };

    const handleCashout = () => {
        if (!isPlaying) return;
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.5 },
            colors: [config.accentColor, '#ffd700']
        });
        setIsPlaying(false);
        setGameOver(true);

        const winAmount = betAmount * multiplier;
        setLastWin({ amount: winAmount, currency: currencyType });
        
        if (currencyType === 'GC' && setDiamonds) {
            setDiamonds((prev: number) => prev + winAmount);
        } else if (setForgesCoins) {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);
    };

    const handleBetChange = (amount: number) => {
        if (isPlaying) return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    useEffect(() => {
        if (!isOpen) {
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: gameName || config.theme.gameName || "Hi-Lo", 
                        gameImage: gameConfig?.coverImage || "/images/game-placeholder.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                setSessionWagered(0);
                setSessionPayout(0);
            }
            setIsPlaying(false);
            setGameOver(false);
            setDeck([]);
            setCurrentCard(null);
            setPreviousCards([]);
            setStreak(0);
            setMultiplier(1.0);
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType, gameConfig, gameName, config]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    const renderCard = (card: Card, faceUp: boolean, isSmall: boolean = false) => {
        const rankStr = getRankStr(card.rank);
        const customFace = config.customFaceCards[rankStr as 'J' | 'Q' | 'K' | 'A'];
        const isFaceCard = ['J', 'Q', 'K', 'A'].includes(rankStr);

        if (!faceUp) {
            return (
                <div className={`${isSmall ? 'w-12 h-16 rounded-md' : 'w-48 h-72 rounded-2xl'} bg-[#1a2332] shadow-2xl overflow-hidden relative border border-white/10 flex items-center justify-center shrink-0`}>
                    {config.cardBackImage ? (
                        <img src={config.cardBackImage} className="absolute w-full h-full object-cover" />
                    ) : (
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 2px, transparent 2px, transparent 8px)' }}></div>
                    )}
                    <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center z-10 bg-black/50 backdrop-blur-sm" style={{ borderColor: config.accentColor }}>
                        {config.theme.gameName.charAt(0).toUpperCase()}
                    </div>
                </div>
            );
        }

        return (
            <motion.div 
                initial={{ rotateY: 90, scale: 0.8 }} 
                animate={{ rotateY: 0, scale: 1 }} 
                className={`${isSmall ? 'w-12 h-16 rounded-md border text-xs' : 'w-48 h-72 rounded-2xl border-4 text-2xl'} bg-white text-black shadow-2xl overflow-hidden relative flex flex-col shrink-0`}
            >
                <div className={`absolute top-2 left-2 flex flex-col items-center ${getSuitColor(card.suit)} font-black leading-none`}>
                    <span>{rankStr}</span>
                    <span className={isSmall ? "text-lg" : "text-3xl"}>{getSuitSymbol(card.suit)}</span>
                </div>
                <div className={`absolute bottom-2 right-2 flex flex-col items-center ${getSuitColor(card.suit)} font-black transform rotate-180 leading-none`}>
                    <span>{rankStr}</span>
                    <span className={isSmall ? "text-lg" : "text-3xl"}>{getSuitSymbol(card.suit)}</span>
                </div>
                <div className="flex-1 flex items-center justify-center pointer-events-none p-6">
                    {isFaceCard && customFace ? (
                        <div className="w-full h-full relative">
                            <img src={customFace} alt={rankStr} className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-inner" style={{ border: `2px solid ${config.accentColor}` }} />
                        </div>
                    ) : (
                        <span className={`${isSmall ? "text-3xl" : "text-7xl"} ${getSuitColor(card.suit)}`}>{getSuitSymbol(card.suit)}</span>
                    )}
                </div>
            </motion.div>
        );
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="rounded-2xl w-full max-w-5xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[650px]"
                style={{
                    backgroundColor: config.backgroundColor || '#06090c',
                    borderColor: config.accentColor + '30',
                    boxShadow: `0 0 50px ${config.accentColor}15`,
                }}
            >
                {/* ADVANCED BETTING MENU */}
                <div className="w-full md:w-80 p-6 flex flex-col gap-4 border-r border-white/5 z-20"
                     style={{ backgroundColor: (config.backgroundColor || '#06090c') + 'F0' }}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col gap-1 text-white">
                            <h2 className="text-xl font-black uppercase tracking-widest leading-none truncate w-[200px]">
                                {config.theme.gameName}
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest truncate w-[200px]"
                               style={{ color: config.accentColor }}>
                                By {gameConfig?.creatorName || "Studio"}
                            </p>
                        </div>
                    </div>

                    <div className="bg-black/30 p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
                    </div>

                    <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bet Amount</label>
                            <span className="text-xs font-mono font-bold text-slate-400 bg-black/30 px-2 py-1 rounded-md">Bal: {balance === 999999999 ? '∞' : balance.toFixed(2)}</span>
                        </div>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {currencyType === 'GC' ? <DiamondIcon className="w-5 h-5 opacity-70" /> : <ForgesCoinIcon className="w-5 h-5 opacity-70" />}
                            </div>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => handleBetChange(Number(e.target.value))}
                                disabled={isPlaying}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2 pb-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={isPlaying} className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={isPlaying} className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={isPlaying}
                                className="bg-white/5 hover:bg-white/10 text-xs font-black py-2 rounded-lg border transition-colors"
                                style={{ color: config.accentColor, borderColor: config.accentColor + '30' }}>MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-black/30 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Target style={{ color: config.accentColor }} className="w-5 h-5" />
                            <h2 className="text-sm font-black uppercase tracking-widest truncate max-w-[120px]">{config.theme.gameName}</h2>
                            <FavoriteToggle gameName={gameName || "Hi-Lo"} />
                        </div>
                        {lastWin ? (
                            <span className="text-sm font-black text-green-400 font-mono flex items-center gap-1">
                                +{lastWin.amount.toFixed(2)} {lastWin.currency === 'GC' ? <DiamondIcon className="w-3 h-3" /> : <ForgesCoinIcon className="w-3 h-3" />}
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-slate-600">---</span>
                        )}
                    </div>

                    <div className="mt-auto">
                        {!isPlaying ? (
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0}
                                className="w-full text-white h-14 rounded-xl font-black text-lg tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group"
                                style={{
                                    background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}CC)`,
                                    boxShadow: `0 5px 20px ${config.accentColor}40`,
                                }}>
                                <span className="relative z-10">{gameOver ? 'PLAY AGAIN' : 'START GAME'}</span>
                            </button>
                        ) : (
                            <button onClick={handleCashout} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white h-14 rounded-xl font-black text-lg uppercase shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse hover:scale-[1.02] flex flex-col items-center justify-center">
                                <span>CASHOUT</span>
                                <span className="text-[10px] text-green-200 mt-[-2px]">Take {(betAmount * multiplier).toFixed(2)}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className="flex-1 relative flex flex-col items-center overflow-hidden" style={{ backgroundColor: config.backgroundColor || '#06090c' }}>
                    
                    {/* Controls overlay */}
                    <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
                        <button onClick={() => setSoundEnabled(!soundEnabled)}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20">
                            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>
                        <button onClick={onClose}
                            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:rotate-90 transition-all border border-white/20">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 w-full flex flex-col items-center justify-center p-6 mt-10">
                        {/* Stats */}
                        {isPlaying && (
                            <div className="flex gap-6 mb-8 items-center bg-black/40 px-8 py-4 rounded-3xl border border-white/10 backdrop-blur-md">
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Multiplier</p>
                                    <p className="text-3xl font-black text-white" style={{ color: config.accentColor }}>{multiplier.toFixed(2)}x</p>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <div className="text-center">
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Streak</p>
                                    <p className="text-3xl font-black text-white">{streak}</p>
                                </div>
                            </div>
                        )}

                        {/* Cards Display */}
                        <div className="relative w-full aspect-[21/9] max-w-3xl flex items-center justify-center overflow-hidden">
                            {/* History (Previous cards off to left) */}
                            <div className="absolute left-0 flex gap-[-20px] items-center mask-image-left pr-32 z-0 hidden md:flex" style={{ maskImage: 'linear-gradient(to right, transparent, black 80%)' }}>
                                {previousCards.map((card, i) => (
                                    <motion.div key={card.id} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: Math.max(0.2, 1 - (previousCards.length - i) * 0.2) }}
                                        className="scale-[0.5] -ml-24 brightness-50">
                                        {renderCard(card, true)}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Current Card */}
                            <div className="relative z-10 flex gap-8 items-center justify-center w-full">
                                {currentCard ? (
                                    <div className="relative">
                                        {renderCard(currentCard, true)}
                                        
                                        {gameOver && (
                                            <div className="absolute inset-0 bg-red-500/10 rounded-2xl flex items-center justify-center z-20 pointer-events-none">
                                                <div className="bg-black/90 px-6 py-2 rounded-xl border border-red-500 transform rotate-12 drop-shadow-2xl">
                                                    <span className="text-3xl font-black text-red-500 uppercase tracking-widest" style={{ textShadow: '0 0 10px rgba(255,0,0,0.8)' }}>Bust</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-48 h-72 border-4 border-dashed border-white/10 rounded-2xl flex items-center justify-center">
                                        <span className="text-white/20 text-4xl font-black">?</span>
                                    </div>
                                )}

                                {/* Deck indicator */}
                                <div className="hidden sm:block scale-[0.6] opacity-80 brightness-50 relative translate-x-12 translate-y-4 shadow-2xl">
                                    {renderCard({ rank: 2, suit: 'hearts', id: '1' }, false)}
                                    <div className="absolute top-[-4px] left-[-4px] z-[-1]">{renderCard({ rank: 2, suit: 'hearts', id: '2' }, false)}</div>
                                    <div className="absolute top-[-8px] left-[-8px] z-[-2]">{renderCard({ rank: 2, suit: 'hearts', id: '3' }, false)}</div>
                                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white text-3xl font-black">{deck.length} Left</span>
                                </div>
                            </div>
                        </div>

                        {/* Controls underneath */}
                        {isPlaying && !gameOver && (
                            <div className="mt-8 flex gap-4 w-full max-w-sm">
                                <button onClick={() => handleGuess('higher')} className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 bg-[#1a2332] active:translate-y-[4px] active:border-b-0 transition-all border-green-600/50 hover:bg-white/5 group">
                                    <ArrowUp className="text-green-500 group-hover:scale-125 transition-transform mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" size={40} />
                                    <span className="text-white font-black text-xl uppercase tracking-widest">Higher</span>
                                    {currentCard && <span className="text-xs text-slate-400 mt-1">or same</span>}
                                </button>
                                
                                <button onClick={() => handleGuess('lower')} className="flex-1 flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 bg-[#1a2332] active:translate-y-[4px] active:border-b-0 transition-all border-rose-600/50 hover:bg-white/5 group">
                                    <ArrowDown className="text-rose-500 group-hover:scale-125 transition-transform mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" size={40} />
                                    <span className="text-white font-black text-xl uppercase tracking-widest">Lower</span>
                                    {currentCard && <span className="text-xs text-slate-400 mt-1">or same</span>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
