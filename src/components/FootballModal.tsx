"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Dribbble, Activity } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import confetti from "canvas-confetti";

export const FOOTBALL_CONFIG = {
    theme: {
        background: "bg-[#001f11]",
        panelBg: "bg-[#002b18]",
        accent: "text-emerald-500",
        buttonAccent: "bg-emerald-600 hover:bg-emerald-500",
        gameBg: "bg-[url('/images/game-football.png')]",
    },
    names: {
        title: "Penalty"
    }
};

export default function FootballModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'SHOOTING' | 'FINISHED'>('IDLE');
    const [result, setResult] = useState<'SCORE' | 'PARRIED' | null>(null);
    const [mult, setMult] = useState(0);
    const [ballTargetX, setBallTargetX] = useState(0);

    const shoot = () => {
        if (balance < betAmount || betAmount <= 0) return;
        if (gameState === 'SHOOTING') return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);

        setGameState('SHOOTING');
        setResult(null);

        // 50% chance to score
        const r = Math.random();
        const scored = r > 0.4;
        const multiplier = scored ? (Math.random() * 2 + 1.5) : 0; // between 1.5 and 3.5

        const newTargetX = scored ? (Math.random() > 0.5 ? 80 : -80) : (Math.random() > 0.5 ? 30 : -30);
        setBallTargetX(newTargetX);

        setResult(scored ? 'SCORE' : 'PARRIED');
        setMult(Number(multiplier.toFixed(2)));
        setGameState('SHOOTING');

        setTimeout(() => {
            setGameState('FINISHED');
            handleWin(Number(multiplier.toFixed(2)));
        }, 800);
    };

    const handleWin = (multiplier: number) => {
        const winAmount = betAmount * multiplier;

        setLastWin({ amount: winAmount, currency: currencyType, mult: multiplier });

        if (winAmount > 0) {
            if (currencyType === 'GC') {
                setDiamonds((prev: number) => prev + winAmount);
            } else {
                setForgesCoins((prev: number) => prev + winAmount);
            }

        setSessionPayout(prev => prev + winAmount);

            if (multiplier >= 1.5) {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }
        }

        // Auto restart
        setTimeout(() => {
            setGameState(prev => prev === 'FINISHED' ? 'IDLE' : prev);
        }, 2500);
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'SHOOTING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${FOOTBALL_CONFIG.theme.background} rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${FOOTBALL_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-black/50 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Activity className={FOOTBALL_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{FOOTBALL_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={FOOTBALL_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#00140b]/50 p-1 rounded-xl flex border border-emerald-500/10">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'SHOOTING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'SHOOTING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
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
                                disabled={gameState === 'SHOOTING'}
                                className="w-full bg-[#00140b]/50 border border-emerald-500/20 focus:border-emerald-500 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'SHOOTING'} className="bg-[#003b21] hover:bg-[#004f2d] text-emerald-200 hover:text-white text-xs font-bold py-2 rounded-lg border border-emerald-500/20 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'SHOOTING'} className="bg-[#003b21] hover:bg-[#004f2d] text-emerald-200 hover:text-white text-xs font-bold py-2 rounded-lg border border-emerald-500/20 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'SHOOTING'} className={`bg-[#003b21] hover:bg-[#004f2d] ${FOOTBALL_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-emerald-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#00140b]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
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

                    <div className="mt-auto space-y-3">
                        <button onClick={shoot} disabled={gameState === 'SHOOTING' || balance < betAmount || betAmount <= 0} className={`w-full ${FOOTBALL_CONFIG.theme.buttonAccent} hover:brightness-110 text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <Dribbble size={20} className={gameState === 'SHOOTING' ? 'animate-spin' : ''} /> {gameState === 'SHOOTING' ? 'SHOOTING...' : 'SHOOT'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative ${FOOTBALL_CONFIG.theme.gameBg} bg-cover bg-center p-2 sm:p-6 flex flex-col justify-center items-center overflow-hidden shadow-inner`}>

                    <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-[1px]"></div>

                    {/* Goal Frame */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-16 w-80 h-48 border-t-8 border-x-8 border-white z-10 flex flex-col items-center justify-end overflow-hidden shadow-[inset_0_20px_50px_rgba(0,0,0,0.5)] bg-white/5">
                        {/* Net pattern could be some background */}
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 mix-blend-overlay"></div>

                        {/* Goalkeeper */}
                        <motion.div
                            animate={gameState === 'SHOOTING' ? (result === 'PARRIED' ? { x: [0, ballTargetX], y: [0, -10] } : { x: [0, -ballTargetX * 0.5], y: [0, 0] }) : gameState === 'FINISHED' ? (result === 'PARRIED' ? { x: ballTargetX, y: -10 } : { x: -ballTargetX * 0.5, y: 0 }) : { x: [0, 10, -10, 0] }}
                            transition={{ duration: gameState === 'SHOOTING' ? 0.6 : (gameState === 'FINISHED' ? 0 : 2), ease: "easeOut", repeat: gameState === 'IDLE' ? Infinity : 0 }}
                            className="w-16 h-28 bg-[#facc15] rounded-t-[1.5rem] border-[3px] border-[#ca8a04] relative z-20 shadow-lg flex flex-col items-center overflow-hidden"
                        >
                            {/* Shirt details */}
                            <div className="w-full h-4 bg-black/20 absolute bottom-0 shadow-inner"></div>
                            <div className="absolute top-2 w-full text-center text-xs font-black text-[#ca8a04] opacity-80">#1</div>
                            <div className="w-1 h-full bg-[#ca8a04]/30 absolute left-2"></div>
                            <div className="w-1 h-full bg-[#ca8a04]/30 absolute right-2"></div>

                            {/* Head */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-12 h-14 rounded-[1.5rem] bg-[#ffcba4] border-[3px] border-[#d39c7a] flex flex-col items-center overflow-hidden z-10 shadow-md">
                                {/* Hair */}
                                <div className="absolute top-0 w-full h-4 bg-[#8b4513] rounded-t-full"></div>
                                {/* Face */}
                                {gameState === 'FINISHED' ? (
                                    <span className="text-[14px] mt-4 z-10 select-none">{result === 'PARRIED' ? '💪' : '😭'}</span>
                                ) : (
                                    <div className="flex gap-1.5 mt-5 z-10">
                                        <div className={`w-2.5 h-2.5 bg-black rounded-full transition-transform ${gameState === 'SHOOTING' ? 'scale-y-[0.2]' : ''}`}></div>
                                        <div className={`w-2.5 h-2.5 bg-black rounded-full transition-transform ${gameState === 'SHOOTING' ? 'scale-y-[0.2]' : ''}`}></div>
                                    </div>
                                )}
                                <div className={`w-3 h-1 border-b-[2px] border-[#8b4513] rounded-full mt-1.5 transition-all ${gameState === 'SHOOTING' ? 'scale-x-50' : ''}`}></div>
                            </div>

                            {/* Arms */}
                            <motion.div
                                animate={gameState === 'SHOOTING' && result === 'PARRIED' ? { rotate: [0, -80] } : gameState === 'SHOOTING' ? { rotate: [0, 30] } : { rotate: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute top-4 -left-6 w-5 h-20 bg-[#facc15] rounded-full origin-top border-[3px] border-[#ca8a04] flex flex-col justify-end pb-1 items-center shadow-md">
                                {/* Glove */}
                                <div className="w-6 h-6 bg-white rounded-md border-2 border-slate-300 -ml-0.5 shadow-inner"></div>
                            </motion.div>

                            <motion.div
                                animate={gameState === 'SHOOTING' && result === 'PARRIED' ? { rotate: [0, 80] } : gameState === 'SHOOTING' ? { rotate: [0, -30] } : { rotate: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute top-4 -right-6 w-5 h-20 bg-[#facc15] rounded-full origin-top border-[3px] border-[#ca8a04] flex flex-col justify-end pb-1 items-center shadow-md">
                                {/* Glove */}
                                <div className="w-6 h-6 bg-white rounded-md border-2 border-slate-300 -mr-0.5 shadow-inner"></div>
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Simple animation overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex flex-col items-center justify-center z-30 pointer-events-none">

                        {(gameState === 'SHOOTING' || (gameState === 'FINISHED' && result === 'SCORE')) && (
                            <motion.div
                                initial={{ scale: 3, y: 250, x: 0, opacity: 1 }}
                                animate={gameState === 'SHOOTING' ? { scale: 0.8, y: result === 'PARRIED' ? 10 : -40, x: ballTargetX } : { scale: 0.8, y: -40, x: ballTargetX, opacity: 0.8 }}
                                transition={{ duration: gameState === 'SHOOTING' ? 0.6 : 0, ease: "easeOut" }}
                                className={`text-6xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] absolute ${gameState === 'FINISHED' ? 'z-0' : 'z-30'}`}
                            >
                                <motion.div animate={{ rotate: [0, 720] }} transition={{ duration: 0.6 }}>⚽</motion.div>
                            </motion.div>
                        )}

                        {gameState === 'FINISHED' && result === 'PARRIED' && (
                            <motion.div
                                initial={{ scale: 0.8, y: 10, x: ballTargetX }}
                                animate={{ scale: 2, y: 250, x: ballTargetX + (Math.random() > 0.5 ? 150 : -150), opacity: 0 }}
                                transition={{ duration: 0.8, ease: "easeIn" }}
                                className="text-6xl drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] absolute z-40"
                            >
                                <motion.div animate={{ rotate: [0, 720] }} transition={{ duration: 0.8 }}>⚽</motion.div>
                            </motion.div>
                        )}

                        {gameState === 'FINISHED' && result !== null && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0, y: -100 }}
                                animate={{ scale: 1, opacity: 1, y: -180 }}
                                className={`absolute bg-black/80 border-2 ${result === 'PARRIED' ? 'border-red-500' : 'border-emerald-500'} px-8 py-4 rounded-3xl flex flex-col items-center drop-shadow-[0_0_30px_rgba(16,185,129,0.3)] shadow-2xl z-50`}
                            >
                                <span className={`font-black uppercase tracking-[0.2em] text-3xl mb-1 ${result === 'PARRIED' ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {result === 'SCORE' ? 'GOAL!' : 'PARRIED!'}
                                </span>
                                {result === 'SCORE' && (
                                    <span className="text-5xl font-black text-white">{mult.toFixed(2)}x</span>
                                )}
                                {result === 'PARRIED' && (
                                    <span className="text-3xl font-bold text-slate-400 mt-0">0.00x</span>
                                )}
                            </motion.div>
                        )}
                    </div>

                </div>
            </motion.div>
        </div>,
        document.body
    );
}
