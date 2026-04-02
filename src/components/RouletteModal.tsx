"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, RefreshCcw, CircleDashed } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";

// INFLUENCER/ADMIN CUSTOMIZATION CONFIG
export const ROULETTE_CONFIG = {
    theme: {
        background: "bg-[#0f212e]",
        panelBg: "bg-[#121c22]",
        accent: "text-[#00b9f0]",
        buttonAccent: "bg-[#00b9f0]",
        red: "bg-red-500",
        black: "bg-zinc-800",
        green: "bg-green-500",
    },
    names: {
        title: "Roulette"
    },
    // Customize segment labels and colors 
    segments: Array.from({ length: 37 }, (_, i) => ({
        number: i,
        color: i === 0 ? "green" : (i % 2 === 0 ? "black" : "red") // Simple odd/even coloring for 1-36
    }))
};

type ColorChoice = 'red' | 'black' | 'green';

export default function RouletteModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    const [gameState, setGameState] = useState<'IDLE' | 'SPINNING' | 'WON' | 'LOST'>('IDLE');
    const [targetChoice, setTargetChoice] = useState<ColorChoice>('red');
    const [resultNumber, setResultNumber] = useState<number | null>(null);
    const [spinRotation, setSpinRotation] = useState(0);

    const spinWheel = () => {
        if (balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('SPINNING');

        // Pick random 0-36
        const winningNumber = Math.floor(Math.random() * 37);
        const winningSegment = ROULETTE_CONFIG.segments[winningNumber];

        // Calculate rotation
        // 37 segments, each is 360/37 degrees
        // Add multiple spins (e.g. 5 full rotations = 1800deg) + offset for the winning number
        const segmentAngle = 360 / 37;
        const targetDeg = 1800 + (360 - (winningNumber * segmentAngle));

        setSpinRotation(prev => prev + targetDeg);

        setTimeout(() => {
            setResultNumber(winningNumber);

            let multi = 0;
            if (winningSegment.color === targetChoice) {
                multi = targetChoice === 'green' ? 14 : 2; // Green pays 14x, others 2x
            }

            if (multi > 0) {
                setGameState('WON');
                const winAmount = betAmount * multi;
                setLastWin({ amount: winAmount, currency: currencyType });

                if (currencyType === 'GC') {
                    setDiamonds((prev: number) => prev + winAmount);
                } else {
                    setForgesCoins((prev: number) => prev + winAmount);
                }

                confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
            } else {
                setGameState('LOST');
            }
        }, 4000); // 4s spin duration
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'SPINNING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    useEffect(() => {
        if (!isOpen) {
            setGameState('IDLE');
            setResultNumber(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${ROULETTE_CONFIG.theme.background} rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${ROULETTE_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-white/5 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <CircleDashed className={ROULETTE_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{ROULETTE_CONFIG.names.title}</h2>
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
                    </div>

                    <div className="space-y-2 mt-2">
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
                                disabled={gameState === 'SPINNING'}
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-[#00b9f0] focus:shadow-[0_0_10px_rgba(0,185,240,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'SPINNING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'SPINNING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'SPINNING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00b9f0] text-xs font-black py-2 rounded-lg border border-[#00b9f0]/30 transition-colors">MAX</button>
                        </div>
                    </div>

                    <div className="space-y-2 mt-4">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden">Choose Color</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setTargetChoice('red')}
                                disabled={gameState === 'SPINNING'}
                                className={`py-4 rounded-xl font-bold uppercase tracking-wider text-white transition-all ${targetChoice === 'red' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-red-300' : 'bg-red-900/50 border border-red-900 hover:bg-red-800'}`}
                            >
                                RED <span className="block text-[10px] opacity-70 mt-1">2X</span>
                            </button>
                            <button
                                onClick={() => setTargetChoice('green')}
                                disabled={gameState === 'SPINNING'}
                                className={`py-4 rounded-xl font-bold uppercase tracking-wider text-white transition-all ${targetChoice === 'green' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] border-2 border-green-300' : 'bg-green-900/50 border border-green-900 hover:bg-green-800'}`}
                            >
                                0 <span className="block text-[10px] opacity-70 mt-1">14X</span>
                            </button>
                            <button
                                onClick={() => setTargetChoice('black')}
                                disabled={gameState === 'SPINNING'}
                                className={`py-4 rounded-xl font-bold uppercase tracking-wider text-white transition-all ${targetChoice === 'black' ? 'bg-zinc-700 shadow-[0_0_15px_rgba(82,82,91,0.5)] border-2 border-zinc-400' : 'bg-zinc-900 border border-zinc-800 hover:bg-zinc-800'}`}
                            >
                                BLACK <span className="block text-[10px] opacity-70 mt-1">2X</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 bg-[#0a1114]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
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

                    <div className="mt-auto">
                        <button onClick={spinWheel} disabled={balance < betAmount || betAmount <= 0 || gameState === 'SPINNING'} className={`w-full ${ROULETTE_CONFIG.theme.buttonAccent} hover:brightness-110 text-[#0f212e] h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(0,185,240,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <RefreshCcw className={gameState === 'SPINNING' ? "animate-spin" : ""} size={20} />
                                {gameState === 'SPINNING' ? 'SPINNING...' : 'BET TO SPIN'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative bg-[#06090c] p-4 flex flex-col items-center justify-center overflow-hidden`}>

                    {gameState === 'WON' && (
                        <div className="absolute inset-x-0 top-0 p-6 flex justify-center z-20">
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="bg-green-500 text-white font-black text-2xl uppercase tracking-widest py-3 px-8 rounded-full shadow-[0_0_30px_#22c55e] border-2 border-white/20"
                            >
                                YOU WON !
                            </motion.div>
                        </div>
                    )}
                    {gameState === 'LOST' && (
                        <div className="absolute inset-x-0 top-0 p-6 flex justify-center z-20">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/20 text-red-500 font-bold uppercase tracking-widest py-2 px-6 rounded-full border border-red-500/30"
                            >
                                NOT THIS TIME
                            </motion.div>
                        </div>
                    )}

                    {/* Wheel container */}
                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 rounded-full border-8 border-[#1a2c38] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-[#0f171c]">

                        <div className="absolute inset-0 pointer-events-none z-10 rounded-full border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>

                        {/* The static pointer */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 w-8 h-8 rotate-45 bg-[#00b9f0] border-2 border-white/20 z-20 shadow-[0_0_15px_#00b9f0]"></div>

                        <motion.div
                            animate={{ rotate: spinRotation }}
                            transition={{ duration: 4, ease: [0.1, 0.9, 0.2, 1] }}
                            className="w-full h-full relative rounded-full"
                        >
                            {/* SVG sectors generation */}
                            <svg viewBox="0 0 100 100" className="w-full h-full rounded-full -rotate-90">
                                {ROULETTE_CONFIG.segments.map((seg, i) => {
                                    const percent = 100 / 37;
                                    const rotate = i * 360 / 37;
                                    const dashArray = `${percent} 100`;

                                    let fill = "#ef4444"; // red
                                    if (seg.color === "black") fill = "#27272a"; // zinc-800
                                    if (seg.color === "green") fill = "#22c55e"; // green-500

                                    return (
                                        <g key={i} transform={`rotate(${rotate} 50 50)`}>
                                            {/* We use stroke-dasharray to build the segment. It works well visually. */}
                                            {/* We use a path for cleaner wedges, but simple circle stroke trick handles it easily */}
                                            <path d="M50 50 L100 50 A50 50 0 0 1 99.6 58.6 Z" fill={fill} className="stroke-zinc-900 stroke-[0.2]" />
                                            {/* Add number text */}
                                            <text x="85" y="52" fill="white" fontSize="4" fontWeight="bold" fontFamily="monospace" transform="rotate(4.8, 85, 52)">
                                                {seg.number}
                                            </text>
                                        </g>

                                    )
                                })}
                            </svg>
                        </motion.div>

                        <div className="absolute inset-x-0 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#1a2c38] rounded-full z-20 border-[4px] border-[#0f171c] flex items-center justify-center">
                            {resultNumber !== null && (
                                <span className={`text-xl font-black font-mono ${ROULETTE_CONFIG.segments[resultNumber].color === 'red' ? 'text-red-500' : ROULETTE_CONFIG.segments[resultNumber].color === 'green' ? 'text-green-500' : 'text-zinc-300'}`}>
                                    {resultNumber}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
