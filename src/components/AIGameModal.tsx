"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Zap, Sparkles } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";

interface AIGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameData: {
        id: string;
        name: string;
        creatorName: string;
        themeEmoji: string;
        themeColor: string;
        gameDescription: string;
        htmlCode: string;
    };
    diamonds: number;
    setDiamonds: (fn: (prev: number) => number) => void;
    forgesCoins: number;
    setForgesCoins: (fn: (prev: number) => number) => void;
}

const playSynthSound = (type: string) => {
    try {
        if (type === 'spin') {
            const audio = new Audio('/game sounds/slots.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
            return;
        }
        if (type === 'tumble') {
            const audio = new Audio('/game sounds/dice.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
            return;
        }

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'rise') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 2.0);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
        } else if (type === 'blip') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        } else if (type === 'boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        } else {
             return;
        }
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.0);
    } catch(e) {}
};

export default function AIGameModal({ isOpen, onClose, gameData, diamonds, setDiamonds, forgesCoins, setForgesCoins }: AIGameModalProps) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', multiplier: number } | null>(null);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'RESULT'>('IDLE');
    const [gameReady, setGameReady] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Listen for postMessage from iframe
    const handleMessage = useCallback((event: MessageEvent) => {
        const data = event.data;
        if (!data || !data.type) return;

        switch (data.type) {
            case 'GAME_READY':
                setGameReady(true);
                break;
            case 'PLAY_SOUND':
                if (data.soundType) playSynthSound(data.soundType);
                break;
            case 'GAME_RESULT':
                setGameState('RESULT');
                if (data.win && data.multiplier > 0) {
                    const winAmount = betAmount * data.multiplier;
                    setLastWin({ amount: winAmount, currency: currencyType, multiplier: data.multiplier });
                    if (currencyType === 'GC') {
                        setDiamonds((prev: number) => prev + winAmount);
                    } else {
                        setForgesCoins((prev: number) => prev + winAmount);
                    }

                    const gameDataObj = (gameData as any);
                    if (gameDataObj.winSound) {
                        try {
                            const audio = new Audio(gameDataObj.winSound);
                            audio.volume = 0.5;
                            audio.play().catch(e => console.error("Win sound failed:", e));
                        } catch(e) {}
                    }

                    const effect = gameDataObj.winEffect || 'confetti';
                    if (effect === 'confetti') {
                        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                    } else if (effect === 'fireworks') {
                        const duration = 2000;
                        const animationEnd = Date.now() + duration;
                        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
                        const interval: any = setInterval(function() {
                            const timeLeft = animationEnd - Date.now();
                            if (timeLeft <= 0) return clearInterval(interval);
                            const particleCount = 50 * (timeLeft / duration);
                            confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                            confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                        }, 250);
                    } else if (effect === 'stars') {
                        confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, shapes: ['star'], colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'] });
                    } else if (effect === 'snow') {
                        const duration = 3000;
                        const animationEnd = Date.now() + duration;
                        let skew = 1;
                        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
                        const interval: any = setInterval(function() {
                            const timeLeft = animationEnd - Date.now();
                            if (timeLeft <= 0) return clearInterval(interval);
                            skew = Math.max(0.8, skew - 0.001);
                            confetti({ particleCount: 1, startVelocity: 0, ticks: 100, zIndex: 100, origin: { x: Math.random(), y: (Math.random() * skew) - 0.2 }, colors: ['#ffffff'], shapes: ['circle'], gravity: randomInRange(0.4, 0.6), scalar: randomInRange(0.4, 1), drift: randomInRange(-0.4, 0.4) });
                        }, 20);
                    } else if (effect === 'coins') {
                        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 100, shapes: ['circle'], colors: ['#FFD700', '#FDB931', '#F5A623', '#F8E71C'] });
                    }
                } else {
                    // Lost
                    setLastWin(null);
                }
                break;
        }
    }, [betAmount, currencyType, setDiamonds, setForgesCoins]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    useEffect(() => {
        if (!isOpen) {
            setGameState('IDLE');
            setGameReady(false);
        }
    }, [isOpen]);

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0 || !gameReady) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('PLAYING');

        // Send START_GAME to iframe
        iframeRef.current?.contentWindow?.postMessage(
            { type: 'START_GAME', bet: betAmount },
            '*'
        );
    };

    const resetGame = () => {
        setGameState('IDLE');
        iframeRef.current?.contentWindow?.postMessage(
            { type: 'RESET' },
            '*'
        );
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'PLAYING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    if (!isOpen || !gameData) return null;
    if (typeof document === "undefined") return null;

    const accentColor = gameData.themeColor || '#a855f7';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0f212e] rounded-2xl w-full max-w-5xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[650px] sm:h-[700px]"
                style={{ borderColor: `${accentColor}40` }}
            >
                {/* BETTING PANEL (LEFT) */}
                <div className="w-full md:w-80 bg-[#121c22] p-6 flex flex-col gap-4 border-r border-white/5 z-20 shrink-0">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col gap-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black uppercase tracking-wider text-white truncate">{gameData.name}</h2>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest truncate" style={{ color: accentColor }}>
                                By {gameData.creatorName}
                            </p>
                        </div>
                        <button onClick={onClose} className="shrink-0">
                            <X className="text-slate-400 hover:text-white transition-colors" />
                        </button>
                    </div>

                    {/* Game Info */}
                    <div className="text-xs text-slate-400 bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                        <Sparkles className="inline w-3 h-3 mr-1" style={{ color: accentColor }} />
                        {gameData.gameDescription}
                    </div>

                    {/* Currency Toggle */}
                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button
                            onClick={() => setCurrencyType('GC')}
                            disabled={gameState === 'PLAYING'}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <DiamondIcon className="w-4 h-4" /> Diamonds
                        </button>
                        <button
                            onClick={() => setCurrencyType('FC')}
                            disabled={gameState === 'PLAYING'}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <ForgesCoinIcon className="w-4 h-4" /> Coins
                        </button>
                    </div>

                    {/* Bet Amount */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bet Amount</label>
                            <span className="text-xs font-mono font-bold text-slate-400 bg-black/30 px-2 py-1 rounded-md">Bal: {balance.toFixed(2)}</span>
                        </div>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {currencyType === 'GC' ? <DiamondIcon className="w-5 h-5 opacity-70" /> : <ForgesCoinIcon className="w-5 h-5 opacity-70" />}
                            </div>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => handleBetChange(Number(e.target.value))}
                                disabled={gameState === 'PLAYING'}
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-[#00b9f0] focus:shadow-[0_0_10px_rgba(0,185,240,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00b9f0] text-xs font-black py-2 rounded-lg border border-[#00b9f0]/30 transition-colors">MAX</button>
                        </div>
                    </div>

                    {/* Last Win */}
                    <div className="bg-[#0a1114]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-green-500 w-4 h-4" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Win</span>
                        </div>
                        {lastWin ? (
                            <span className="text-sm font-black text-green-400 font-mono flex items-center gap-1">
                                +{lastWin.amount.toFixed(2)} {lastWin.currency === 'GC' ? <DiamondIcon className="w-3 h-3" /> : <ForgesCoinIcon className="w-3 h-3" />}
                                <span className="text-[10px] text-green-500/60 ml-1">({lastWin.multiplier.toFixed(2)}x)</span>
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-slate-600">---</span>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto space-y-3">
                        {gameState === 'RESULT' && (
                            <button
                                onClick={resetGame}
                                className="w-full py-2 rounded-lg text-xs font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-colors"
                            >
                                Play Again
                            </button>
                        )}
                        <button
                            onClick={startGame}
                            disabled={balance < betAmount || betAmount <= 0 || gameState === 'PLAYING' || !gameReady}
                            className="w-full h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group"
                            style={{
                                background: gameState === 'PLAYING'
                                    ? '#334155'
                                    : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                                color: gameState === 'PLAYING' ? '#94a3b8' : '#000',
                                boxShadow: gameState === 'PLAYING' ? 'none' : `0 5px 20px ${accentColor}50`,
                            }}
                        >
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <Zap size={20} />
                                {!gameReady ? 'LOADING...' : gameState === 'PLAYING' ? 'PLAYING...' : 'BET'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* GAME AREA (RIGHT) — Iframe */}
                <div className="flex-1 relative bg-[#06090c] overflow-hidden">
                    {!gameReady && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#06090c]">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor}40`, borderTopColor: 'transparent' }}></div>
                                <div className="absolute inset-0 w-16 h-16 border-4 border-b-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor}`, borderBottomColor: 'transparent', animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
                            </div>
                            <p className="text-slate-400 text-sm font-bold mt-4 uppercase tracking-widest">Loading Game...</p>
                        </div>
                    )}
                    <iframe
                        ref={iframeRef}
                        srcDoc={gameData?.htmlCode || ''}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts"
                        title={gameData.name}
                        onLoad={() => {
                            // Give the iframe a moment to initialize
                            setTimeout(() => {
                                if (!gameReady) setGameReady(true);
                            }, 2000);
                        }}
                    />
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
