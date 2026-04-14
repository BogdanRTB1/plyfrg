"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Key, ShieldAlert, Zap, Trophy, EyeOff, AlertTriangle, Hand } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import confetti from "canvas-confetti";

export const SNEAK_CONFIG = {
    theme: {
        background: "bg-[#0b0f19]", // Dark room vibe
        panelBg: "bg-[#111827]",
        accent: "text-purple-500",
        buttonAccent: "bg-purple-600 hover:bg-purple-500",
        gameBg: "bg-[url('/images/game-secret-sneak.png')]", // The generated image
    },
    names: {
        title: "Secret Sneak"
    }
};

export default function SneakModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'HOLDING' | 'CAUGHT' | 'ESCAPED'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);

    const bustTimeRef = useRef<number>(0);
    const timeStartRef = useRef<number>(0);
    const requestRef = useRef<number | null>(null);

    const generateBustTimeSeconds = () => {
        // Generates a random time in seconds before getting busted
        // Skewed towards lower times
        return -Math.log(Math.random()) * 3; // exponential distribution, avg 3 seconds
    };

    const startHolding = () => {
        if (gameState !== 'IDLE' && gameState !== 'CAUGHT' && gameState !== 'ESCAPED') return;
        if (balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);

        bustTimeRef.current = generateBustTimeSeconds();
        timeStartRef.current = performance.now();
        setGameState('HOLDING');
        setMultiplier(1.00);

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(updateGame);
    };

    const updateGame = (time: number) => {
        const timeElapsedSec = (time - timeStartRef.current) / 1000;

        if (timeElapsedSec >= bustTimeRef.current) {
            triggerCaught();
            return;
        }

        const currentMult = 1.00 + (timeElapsedSec * 0.4); // Increases by 0.4x per second
        setMultiplier(currentMult);

        requestRef.current = requestAnimationFrame(updateGame);
    };

    const triggerCaught = () => {
        setGameState('CAUGHT');
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        // Auto-restart after 2 seconds
        setTimeout(() => {
            setGameState(prev => prev === 'CAUGHT' ? 'IDLE' : prev);
        }, 2000);
    };

    const releaseHold = () => {
        if (gameState !== 'HOLDING') return;

        setGameState('ESCAPED');
        if (requestRef.current) cancelAnimationFrame(requestRef.current);

        const winAmount = betAmount * multiplier;
        setLastWin({ amount: winAmount, currency: currencyType, mult: multiplier });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);

        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'HOLDING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    useEffect(() => {
        if (!isOpen) {
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Secret Sneak", 
                        gameImage: "/images/game-secret-sneak.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                setSessionWagered(0);
                setSessionPayout(0);
            }

            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            setGameState('IDLE');
        
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${SNEAK_CONFIG.theme.background} rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${SNEAK_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-black/50 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Key className={SNEAK_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{SNEAK_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={SNEAK_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'HOLDING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'HOLDING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
                    </div>

                    <div className="space-y-2 mt-1">
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
                                disabled={gameState === 'HOLDING'}
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-purple-500 focus:shadow-[0_0_10px_rgba(168,85,247,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'HOLDING'} className="bg-[#1f2937] hover:bg-[#374151] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'HOLDING'} className="bg-[#1f2937] hover:bg-[#374151] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'HOLDING'} className={`bg-[#1f2937] hover:bg-[#374151] ${SNEAK_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-purple-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#0a1114]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-green-500 w-4 h-4" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Win</span>
                        </div>
                        {lastWin ? (
                            <span className="text-sm font-black text-green-400 font-mono flex items-center gap-1">
                                +{lastWin.amount.toFixed(2)} {lastWin.currency === 'GC' ? <DiamondIcon className="w-3 h-3" /> : <ForgesCoinIcon className="w-3 h-3" />}
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-slate-600">---</span>
                        )}
                    </div>

                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative ${SNEAK_CONFIG.theme.gameBg} bg-cover bg-center p-2 sm:p-6 flex flex-col justify-end items-center overflow-hidden shadow-inner`}>

                    <div className="absolute inset-0 bg-black/50 z-0"></div>

                    {/* Caught overlay */}
                    <AnimatePresence>
                        {gameState === 'CAUGHT' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 2 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute inset-0 z-10 bg-red-900/40 flex items-center justify-center backdrop-blur-sm pointer-events-none"
                            >
                                <div className="text-center">
                                    <AlertTriangle className="w-32 h-32 text-red-500 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]" />
                                    <h1 className="text-5xl font-black text-red-500 uppercase tracking-[0.3em] drop-shadow-xl">BUSTED!</h1>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Central Area Multiplier */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex flex-col items-center">
                            <span className={`text-6xl sm:text-8xl md:text-9xl font-black transition-colors duration-200 ${(gameState === 'CAUGHT') ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]' : gameState === 'ESCAPED' ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-white'}`}>
                                {multiplier.toFixed(2)}x
                            </span>
                            {gameState === 'ESCAPED' && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-green-400 font-bold uppercase tracking-[0.3em] mt-2 text-lg sm:text-xl bg-green-950/50 px-4 py-1 rounded-full border border-green-500/30"
                                >
                                    SAFE! +{(betAmount * multiplier).toFixed(2)}
                                </motion.span>
                            )}
                        </div>
                    </div>

                    {/* INTERACTION BUTTON */}
                    <div className="relative z-20 mb-8 w-64 h-64 flex items-center justify-center">
                        <AnimatePresence>
                            {gameState === 'HOLDING' && (
                                <motion.div
                                    className="absolute inset-0 rounded-full border-4 border-purple-500/50"
                                    animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                            )}
                        </AnimatePresence>

                        <button
                            onMouseDown={startHolding}
                            onMouseUp={releaseHold}
                            onMouseLeave={releaseHold}
                            onTouchStart={startHolding}
                            onTouchEnd={releaseHold}
                            className={`w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all select-none
                                ${gameState === 'HOLDING' ? 'bg-purple-600 scale-95 shadow-[0_0_50px_rgba(168,85,247,0.6)]' :
                                    gameState === 'CAUGHT' ? 'bg-red-900 border-4 border-red-500 hover:bg-red-800 transition-colors' :
                                        gameState === 'ESCAPED' ? 'bg-green-600 shadow-[0_0_30px_#4ade80]' :
                                            'bg-[#1f2937] hover:bg-[#374151] border-4 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                }
                            `}
                        >
                            <Hand className={`w-16 h-16 ${gameState === 'HOLDING' ? 'text-white animate-pulse' : 'text-slate-400'} mb-2`} />
                            <span className="font-black tracking-widest uppercase text-xl text-white">
                                {gameState === 'HOLDING' ? 'HOLDING...' : gameState === 'CAUGHT' ? 'TRY AGAIN' : gameState === 'ESCAPED' ? 'PLAY AGAIN' : 'HOLD TO START'}
                            </span>
                        </button>
                    </div>

                </div>
            </motion.div>
        </div>,
        document.body
    );
}
