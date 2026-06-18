"use client";
import { scaleDemoWin } from "@/utils/demoPlay";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, RefreshCcw, Disc, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import { fireWinConfetti } from "@/utils/winConfetti";
import { playGameSound, resumeOriginalGameAudio } from "@/utils/originalGameSounds";
import { pickRouletteWinningNumber } from "@/utils/originalsMath";

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

    // Session tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

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

        setSessionWagered(prev => prev + betAmount);
        playGameSound('roulette', 'bet');
        playGameSound('roulette', 'spin');

        setGameState('SPINNING');

        const winningNumber = pickRouletteWinningNumber(ROULETTE_CONFIG.segments, targetChoice);
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
                multi = targetChoice === 'green' ? 11 : 1.8;
            }

            if (multi > 0) {
                setGameState('WON');
                const winAmount = scaleDemoWin(betAmount * multi);
                setLastWin({ amount: winAmount, currency: currencyType });

                if (currencyType === 'GC') {
                    setDiamonds((prev: number) => prev + winAmount);
                } else {
                    setForgesCoins((prev: number) => prev + winAmount);
                }

                setSessionPayout(prev => prev + winAmount);
                playGameSound('roulette', 'win');

                fireWinConfetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
            } else {
                playGameSound('roulette', 'lose');
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
        if (isOpen) resumeOriginalGameAudio();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setMobileMoreOpen(false);
             // Save session to history if any bets were made
             if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Roulette", 
                        gameImage: "/images/game-roulette.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                
                // Reset session
                setSessionWagered(0);
                setSessionPayout(0);
            }

            setGameState('IDLE');
            setResultNumber(null);
        }
    }, [isOpen, sessionWagered, sessionPayout]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden bg-black md:bg-black/80 backdrop-blur-none md:backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${ROULETTE_CONFIG.theme.background} rounded-none md:rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[600px] md:max-h-[90vh] min-h-0`}
            >
                <MobileGameHudBar
                    className={ROULETTE_CONFIG.theme.panelBg}
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={gameState === 'SPINNING'}
                            quickBtnClassName="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] px-2 py-2 text-[11px] font-black text-slate-200 active:scale-95 disabled:opacity-40 min-h-[40px] min-w-[34px]"
                            inputClassName="min-h-[40px] min-w-[3rem] flex-1 basis-0 max-w-[6.75rem] rounded-lg border border-white/10 bg-[#0a1114] px-1 py-1 text-center text-[11px] font-mono font-bold text-white outline-none focus:border-[#00b9f0]/45 disabled:opacity-40"
                        />
                    }
                    center={
                        <button
                            type="button"
                            onClick={spinWheel}
                            disabled={balance < betAmount || betAmount <= 0 || gameState === 'SPINNING'}
                            className={`flex h-[68px] w-[68px] items-center justify-center rounded-full ${ROULETTE_CONFIG.theme.buttonAccent} text-[#0f212e] shadow-[0_0_22px_rgba(0,185,240,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45`}
                            aria-label="Spin"
                        >
                            <RefreshCcw className={`h-6 w-6 ${gameState === 'SPINNING' ? 'animate-spin' : ''}`} />
                        </button>
                    }
                    right={
                        <>
                            <button type="button" disabled={gameState === 'SPINNING'} onClick={() => handleBetChange(balance)} className={`shrink-0 rounded-lg border border-[#00b9f0]/30 bg-[#1a2c38] px-2.5 py-2.5 text-[11px] font-black ${ROULETTE_CONFIG.theme.accent} active:scale-95 disabled:opacity-40`}>MAX</button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === 'GC'}
                                disabled={gameState === 'SPINNING'}
                                onToggle={() => setCurrencyType((c) => (c === 'GC' ? 'FC' : 'GC'))}
                                className="h-10 w-10 rounded-lg"
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] p-2 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-4 w-4" /></button>
                        </>
                    }
                />

                {/* ADVANCED BETTING MENU */}
                <div className={`hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain ${ROULETTE_CONFIG.theme.panelBg} flex-col gap-2 border-r border-white/5 p-3 md:p-6 md:gap-4 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Disc className={ROULETTE_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{ROULETTE_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={ROULETTE_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> GC</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> FC</button>
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
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-[80] flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-300 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>

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

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="roulette-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{ROULETTE_CONFIG.names.title}</span>
                                <FavoriteToggle gameName={ROULETTE_CONFIG.names.title} />
                            </div>
                            <div className="mb-4 bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                                <button type="button" onClick={() => setCurrencyType('GC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'} disabled:opacity-40`}><DiamondIcon className="w-4 h-4" /> GC</button>
                                <button type="button" onClick={() => setCurrencyType('FC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'} disabled:opacity-40`}><ForgesCoinIcon className="w-4 h-4" /> FC</button>
                            </div>
                            <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Bet amount</p>
                            <div className="relative mb-2">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    {currencyType === 'GC' ? <DiamondIcon className="w-5 h-5 opacity-70" /> : <ForgesCoinIcon className="w-5 h-5 opacity-70" />}
                                </div>
                                <input type="number" value={betAmount} onChange={(e) => handleBetChange(Number(e.target.value))} disabled={gameState === 'SPINNING'} className="w-full bg-[#0a1114] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold outline-none disabled:opacity-40" />
                            </div>
                            <div className="mb-4 grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'SPINNING'} className="rounded-lg border border-white/5 bg-[#1a2c38] py-2 text-xs font-bold text-slate-300 disabled:opacity-40">1/2</button>
                                <button type="button" onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'SPINNING'} className="rounded-lg border border-white/5 bg-[#1a2c38] py-2 text-xs font-bold text-slate-300 disabled:opacity-40">2×</button>
                                <button type="button" onClick={() => handleBetChange(balance)} disabled={gameState === 'SPINNING'} className={`rounded-lg border border-[#00b9f0]/30 bg-[#1a2c38] py-2 text-xs font-black ${ROULETTE_CONFIG.theme.accent} disabled:opacity-40`}>MAX</button>
                            </div>
                            <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Bet on</p>
                            <div className="mb-4 grid grid-cols-3 gap-2">
                                <button type="button" onClick={() => setTargetChoice('red')} disabled={gameState === 'SPINNING'} className={`rounded-xl py-3 text-xs font-bold uppercase text-white transition-all disabled:opacity-40 ${targetChoice === 'red' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-red-300' : 'bg-red-900/50 border border-red-900'}`}>RED <span className="block text-[10px] opacity-70 mt-1">2×</span></button>
                                <button type="button" onClick={() => setTargetChoice('green')} disabled={gameState === 'SPINNING'} className={`rounded-xl py-3 text-xs font-bold uppercase text-white transition-all disabled:opacity-40 ${targetChoice === 'green' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)] border-2 border-green-300' : 'bg-green-900/50 border border-green-900'}`}>0 <span className="block text-[10px] opacity-70 mt-1">14×</span></button>
                                <button type="button" onClick={() => setTargetChoice('black')} disabled={gameState === 'SPINNING'} className={`rounded-xl py-3 text-xs font-bold uppercase text-white transition-all disabled:opacity-40 ${targetChoice === 'black' ? 'bg-zinc-700 shadow-[0_0_15px_rgba(82,82,91,0.5)] border-2 border-zinc-400' : 'bg-zinc-900 border border-zinc-800'}`}>BLACK <span className="block text-[10px] opacity-70 mt-1">2×</span></button>
                            </div>
                            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#0a1114]/50 p-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Last win</span>
                                {lastWin ? <span className="flex items-center gap-1 text-sm font-black text-green-400">+{lastWin.amount.toFixed(2)} {lastWin.currency === 'GC' ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}</span> : <span className="font-mono text-xs text-slate-600">—</span>}
                            </div>
                            <button type="button" onClick={() => setMobileMoreOpen(false)} className="w-full rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-white active:bg-white/10">Done</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
}
