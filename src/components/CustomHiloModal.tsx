import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, ArrowUp, ArrowDown } from 'lucide-react';
import { HiLoConfig, DEFAULT_HILO_CONFIG } from '@/types/hiloConfig';
import confetti from 'canvas-confetti';

interface CustomHiloModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameConfig?: any;
    gameName?: string;
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

export default function CustomHiloModal({ isOpen, onClose, gameConfig, gameName }: CustomHiloModalProps) {
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

        // Synth ASMR flip / Snap
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (config.dealSoundType === 'asmr') {
             // Soft brushing noise
             const bufferSize = ctx.sampleRate * 0.1; // 100ms
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
            // Classic snap
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
            // sad_trombone
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
        const isTie = nextCard.rank === currentCard.rank; // Ties usually win in casual versions

        let isCorrect = false;
        if (guess === 'higher' && (isHigher || isTie)) isCorrect = true;
        if (guess === 'lower' && (isLower || isTie)) isCorrect = true;

        playDealSound();

        setPreviousCards(prev => [...prev, currentCard]);
        setCurrentCard(nextCard);
        setDeck(nextDeck);

        if (isCorrect) {
            // Update multiplier
            let multIncrease = 0;
            // Reward more for riskier probabilities
            const totalRanks = 13;
            if (guess === 'higher') {
                const higherCards = 14 - currentCard.rank;
                multIncrease = (totalRanks / (higherCards || 1)) * 0.1;
            } else {
                const lowerCards = currentCard.rank - 2;
                multIncrease = (totalRanks / (lowerCards || 1)) * 0.1;
            }
            
            // Constrain increase to 0.1 - 2.0
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
    };

    if (!isOpen) return null;

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
                {/* Top left */}
                <div className={`absolute top-2 left-2 flex flex-col items-center ${getSuitColor(card.suit)} font-black leading-none`}>
                    <span>{rankStr}</span>
                    <span className={isSmall ? "text-lg" : "text-3xl"}>{getSuitSymbol(card.suit)}</span>
                </div>
                
                {/* Bottom right */}
                <div className={`absolute bottom-2 right-2 flex flex-col items-center ${getSuitColor(card.suit)} font-black transform rotate-180 leading-none`}>
                    <span>{rankStr}</span>
                    <span className={isSmall ? "text-lg" : "text-3xl"}>{getSuitSymbol(card.suit)}</span>
                </div>

                {/* Center */}
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

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6"
                style={{ backgroundColor: `${config.backgroundColor}dd` }}
            >
                {/* Close & Sound Buttons */}
                <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
                    <button onClick={() => setSoundEnabled(!soundEnabled)}
                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20">
                        {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
                    </button>
                    <button onClick={onClose}
                        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:rotate-90 transition-all border border-white/20">
                        <X size={24} />
                    </button>
                </div>

                <div className="max-w-4xl w-full flex flex-col items-center">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h2 className="text-4xl font-black text-transparent bg-clip-text drop-shadow-lg"
                            style={{ backgroundImage: `linear-gradient(to right, #fff, ${config.accentColor})` }}>
                            {config.theme.gameName}
                        </h2>
                        <p className="text-slate-400 mt-2">{config.theme.gameDescription}</p>
                    </div>

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

                    {/* Main Game Area */}
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
                                        <div className="absolute inset-0 bg-red-500/30 rounded-2xl flex items-center justify-center backdrop-blur-sm z-20">
                                            <div className="bg-black/80 px-6 py-2 rounded-xl border border-red-500">
                                                <span className="text-3xl font-black text-red-500 uppercase tracking-widest">Bust</span>
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

                    {/* Controls */}
                    <div className="mt-12 flex gap-4 w-full max-w-md">
                        {!isPlaying ? (
                            <button onClick={startGame} className="w-full py-4 rounded-xl font-black text-xl uppercase tracking-widest text-white shadow-2xl transition-all hover:scale-[1.02]"
                                    style={{ background: `linear-gradient(to bottom, ${config.accentColor}, #000)`, border: `1px solid ${config.accentColor}50`, boxShadow: `0 0 40px ${config.accentColor}30` }}>
                                {gameOver ? 'Play Again' : 'Place Bet & Deal'}
                            </button>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button onClick={() => handleGuess('higher')} className="flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 bg-[#1a2332] active:translate-y-[4px] active:border-b-0 transition-all border-green-600/50 hover:bg-white/5 group">
                                    <ArrowUp className="text-green-500 group-hover:scale-125 transition-transform mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" size={40} />
                                    <span className="text-white font-black text-xl uppercase tracking-widest">Higher</span>
                                    {currentCard && <span className="text-xs text-slate-400 mt-1">or same</span>}
                                </button>
                                
                                <button onClick={() => handleGuess('lower')} className="flex flex-col items-center justify-center p-4 rounded-2xl border-b-4 bg-[#1a2332] active:translate-y-[4px] active:border-b-0 transition-all border-rose-600/50 hover:bg-white/5 group">
                                    <ArrowDown className="text-rose-500 group-hover:scale-125 transition-transform mb-2 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" size={40} />
                                    <span className="text-white font-black text-xl uppercase tracking-widest">Lower</span>
                                    {currentCard && <span className="text-xs text-slate-400 mt-1">or same</span>}
                                </button>
                                
                                <button onClick={handleCashout} className="col-span-2 py-4 rounded-xl mt-2 font-black text-lg uppercase tracking-widest text-white transition-all shadow-[0_0_15px_rgba(255,215,0,0.2)] bg-gradient-to-r from-yellow-600 to-amber-500 hover:brightness-110">
                                    Cashout {multiplier.toFixed(2)}x
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
