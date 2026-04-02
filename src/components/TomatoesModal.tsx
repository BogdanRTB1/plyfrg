"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Trophy, Play, Target } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";

export const TOMATOES_CONFIG = {
    theme: {
        background: "bg-[#140000]",
        panelBg: "bg-[#1f0000]",
        accent: "text-red-500",
        buttonAccent: "bg-red-600 hover:bg-red-500",
        gameBg: "bg-[url('/images/game-tomatoes.png')]",
    },
    names: {
        title: "Tomatoes"
    },
    targets: [
        { label: "Headshot!", mult: 3.0, fail: false },
        { label: "Body Hit", mult: 1.5, fail: false },
        { label: "Left Arm", mult: 0.5, fail: false },
        { label: "Right Arm", mult: 0.5, fail: false },
        { label: "Leg Hit", mult: 0.8, fail: false },
        { label: "Missed!", mult: 0.0, fail: true },
    ]
};

export default function TomatoesModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    const [gameState, setGameState] = useState<'IDLE' | 'THROWING' | 'FINISHED'>('IDLE');
    const [resultTarget, setResultTarget] = useState<number | null>(null);

    const throwTomato = () => {
        if (balance < betAmount || betAmount <= 0) return;
        if (gameState === 'THROWING') return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('THROWING');
        setResultTarget(null);

        const r = Math.random();
        let selectedIdx = 5; // Miss default
        if (r < 0.1) selectedIdx = 0; // 10% head
        else if (r < 0.3) selectedIdx = 1; // 20% body
        else if (r < 0.5) selectedIdx = 2; // 20% L arm
        else if (r < 0.7) selectedIdx = 3; // 20% R arm
        else if (r < 0.85) selectedIdx = 4; // 15% leg
        else selectedIdx = 5; // 15% miss

        setGameState('THROWING');
        setResultTarget(selectedIdx);

        setTimeout(() => {
            setGameState('FINISHED');
            handleWin(selectedIdx);
        }, 800); // reduced throwing animation time for better feel
    };

    const getTomatoAnimation = (target: number | null) => {
        switch (target) {
            case 0: return { x: [0, 0], y: [200, -80], scale: [1, 1], opacity: [1, 1] }; // Head
            case 1: return { x: [0, 0], y: [200, 10], scale: [1, 1], opacity: [1, 1] }; // Body
            case 2: return { x: [0, -45], y: [200, -20], scale: [1, 1], opacity: [1, 1] }; // L Arm
            case 3: return { x: [0, 45], y: [200, -20], scale: [1, 1], opacity: [1, 1] }; // R Arm
            case 4: return { x: [0, 0], y: [200, 90], scale: [1, 1], opacity: [1, 1] }; // Leg
            case 5: return { x: [0, 150], y: [200, -150], scale: [1, 0.5], opacity: [1, 0] }; // Miss
            default: return { x: [0, 0], y: [200, -50], scale: [1, 0], opacity: [0, 0] };
        }
    };

    const handleWin = (idx: number) => {
        const target = TOMATOES_CONFIG.targets[idx];
        const winAmount = betAmount * target.mult;

        setLastWin({ amount: winAmount, currency: currencyType, mult: target.mult });

        if (winAmount > 0) {
            if (currencyType === 'GC') {
                setDiamonds((prev: number) => prev + winAmount);
            } else {
                setForgesCoins((prev: number) => prev + winAmount);
            }

            if (target.mult >= 1.5) {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }
        }
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'THROWING') return;
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
                className={`${TOMATOES_CONFIG.theme.background} rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${TOMATOES_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-black/50 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Target className={TOMATOES_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{TOMATOES_CONFIG.names.title}</h2>
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#100000]/50 p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'THROWING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'THROWING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
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
                                disabled={gameState === 'THROWING'}
                                className="w-full bg-[#100000]/50 border border-white/10 focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'THROWING'} className="bg-[#2a0000] hover:bg-[#3d0000] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-red-500/20 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'THROWING'} className="bg-[#2a0000] hover:bg-[#3d0000] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-red-500/20 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'THROWING'} className={`bg-[#2a0000] hover:bg-[#3d0000] ${TOMATOES_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-red-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#100000]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
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
                        <button onClick={throwTomato} disabled={gameState === 'THROWING' || balance < betAmount || betAmount <= 0} className={`w-full ${TOMATOES_CONFIG.theme.buttonAccent} hover:brightness-110 text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(239,68,68,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <Target size={20} /> {gameState === 'THROWING' ? 'THROWING...' : 'THROW'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative ${TOMATOES_CONFIG.theme.gameBg} bg-cover bg-center p-2 sm:p-6 flex flex-col justify-center items-center overflow-hidden shadow-inner`}>

                    <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-[2px]"></div>

                    {/* Character */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-start w-40 h-80 mt-16">
                        {/* Head */}
                        <div className={`w-14 h-16 rounded-[2rem] border-[3px] transition-all duration-300 ${gameState === 'FINISHED' && resultTarget === 0 ? 'bg-red-500/80 border-red-500 scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-[#ffcba4] border-[#d39c7a]'} z-30 flex flex-col items-center pt-2 relative overflow-hidden shadow-inner`}>
                            {/* Hair */}
                            <div className="absolute top-0 w-full h-4 bg-[#4a3018] rounded-t-[2rem]"></div>

                            {/* Face details */}
                            {gameState === 'FINISHED' && resultTarget === 0 ? (
                                <span className="text-2xl mt-1 select-none pointer-events-none">😵</span>
                            ) : (
                                <div className="flex gap-2 mt-2 z-10">
                                    <div className="w-2 h-2 bg-black rounded-full shadow-[0_1px_1px_white]"></div>
                                    <div className="w-2 h-2 bg-black rounded-full shadow-[0_1px_1px_white]"></div>
                                </div>
                            )}
                            {!(gameState === 'FINISHED' && resultTarget === 0) && (
                                <div className="w-4 h-1.5 border-b-2 border-black rounded-full mt-2 opacity-60"></div>
                            )}
                        </div>

                        {/* Torso / Shirt */}
                        <div className={`w-18 h-28 rounded-2xl border-[3px] transition-all duration-300 ${gameState === 'FINISHED' && resultTarget === 1 ? 'bg-red-500/80 border-red-500 scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-[#3b82f6] border-[#2563eb]'} z-20 -mt-2 relative shadow-lg overflow-hidden w-16`}>
                            <div className="w-8 h-8 bg-white/20 absolute -right-2 top-0 rounded-full blur-md"></div>
                            {/* Tie / Suit details */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-[#1e3a8a] opacity-30"></div>
                        </div>

                        {/* Arms (left and right) */}
                        <div className={`absolute top-16 -left-6 w-7 h-26 rounded-full border-[3px] origin-top-right -rotate-[20deg] transition-all duration-300 ${gameState === 'FINISHED' && resultTarget === 2 ? 'bg-red-500/80 border-red-500 scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-[#3b82f6] border-[#2563eb]'} z-10 flex flex-col justify-end items-center pb-1 shadow-md h-24`}>
                            {/* Hand */}
                            <div className="w-5 h-5 bg-[#ffcba4] rounded-full border border-[#d39c7a]"></div>
                        </div>
                        <div className={`absolute top-16 -right-6 w-7 h-26 rounded-full border-[3px] origin-top-left rotate-[20deg] transition-all duration-300 ${gameState === 'FINISHED' && resultTarget === 3 ? 'bg-red-500/80 border-red-500 scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-[#3b82f6] border-[#2563eb]'} z-10 flex flex-col justify-end items-center pb-1 shadow-md h-24`}>
                            {/* Hand */}
                            <div className="w-5 h-5 bg-[#ffcba4] rounded-full border border-[#d39c7a]"></div>
                        </div>

                        {/* Legs (left and right) */}
                        <div className={`absolute top-40 left-[45px] w-7 h-28 rounded-t-lg rounded-b-xl border-[3px] origin-top rotate-[5deg] transition-all duration-300 ${gameState === 'FINISHED' && resultTarget === 4 ? 'bg-red-500/80 border-red-500 scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-[#1f2937] border-[#111827]'} z-10 flex flex-col justify-end shadow-md`}>
                            {/* Shoe */}
                            <div className="w-9 h-5 bg-black rounded-md -ml-1 border-t border-zinc-700"></div>
                        </div>
                        <div className={`absolute top-40 right-[45px] w-7 h-28 rounded-t-lg rounded-b-xl border-[3px] origin-top -rotate-[5deg] transition-all duration-300 ${gameState === 'FINISHED' && resultTarget === 4 ? 'bg-red-500/80 border-red-500 scale-110 drop-shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-[#1f2937] border-[#111827]'} z-10 flex flex-col justify-end shadow-md`}>
                            {/* Shoe */}
                            <div className="w-9 h-5 bg-black rounded-md -ml-1 border-t border-zinc-700"></div>
                        </div>
                    </div>

                    {/* Result overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex flex-col items-center justify-center z-30 pointer-events-none">

                        {gameState === 'THROWING' && (
                            <motion.div
                                animate={{ ...getTomatoAnimation(resultTarget), rotate: [0, 360] }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="text-5xl drop-shadow-[0_0_20px_rgba(239,68,68,0.8)] absolute z-30 mt-10"
                            >
                                🍅
                            </motion.div>
                        )}

                        {gameState === 'FINISHED' && resultTarget !== null && resultTarget !== 5 && (
                            <motion.div
                                initial={{ opacity: 1, scale: 0.5, x: getTomatoAnimation(resultTarget).x[1], y: getTomatoAnimation(resultTarget).y[1] }}
                                animate={{ opacity: 0, scale: 3 }}
                                transition={{ duration: 0.5 }}
                                className="text-red-500 absolute z-40 text-6xl mt-10"
                            >
                                💦
                            </motion.div>
                        )}

                        {gameState === 'FINISHED' && resultTarget !== null && (
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0, y: -100 }}
                                animate={{ scale: 1, opacity: 1, y: -200 }}
                                className={`absolute bg-black/80 border-2 ${TOMATOES_CONFIG.targets[resultTarget].fail ? 'border-red-500' : 'border-green-500'} px-8 py-4 rounded-3xl flex flex-col items-center drop-shadow-[0_0_30px_rgba(239,68,68,0.3)] shadow-2xl z-50`}
                            >
                                <span className={`font-black uppercase tracking-widest text-xl mb-1 ${TOMATOES_CONFIG.targets[resultTarget].fail ? 'text-red-500' : 'text-green-400'}`}>
                                    {TOMATOES_CONFIG.targets[resultTarget].label}
                                </span>
                                <span className="text-4xl font-black text-white">{TOMATOES_CONFIG.targets[resultTarget].mult.toFixed(2)}x</span>
                            </motion.div>
                        )}
                    </div>

                </div>
            </motion.div>
        </div>,
        document.body
    );
}
