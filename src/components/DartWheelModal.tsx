"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Zap, Trophy, Play } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import confetti from "canvas-confetti";

export const DART_CONFIG = {
    theme: {
        background: "bg-[#0a0014]", // very dark purple
        panelBg: "bg-[#140028]",
        accent: "text-fuchsia-500",
        buttonAccent: "bg-fuchsia-600 hover:bg-fuchsia-500",
        gameBg: "bg-[url('/images/game-dart-wheel.png')]",
    },
    names: {
        title: "Dart Wheel"
    },
    segments: [
        { label: "Head", mult: 2.0, color: "bg-fuchsia-500" },
        { label: "Arm", mult: 0.5, color: "bg-slate-500" },
        { label: "Leg", mult: 0.8, color: "bg-slate-400" },
        { label: "Body", mult: 1.5, color: "bg-purple-500" },
        { label: "Miss", mult: 0.0, color: "bg-red-500" },
        { label: "Bulls Eye", mult: 5.0, color: "bg-yellow-400" },
    ]
};

export default function DartWheelModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    const [gameState, setGameState] = useState<'IDLE' | 'SPINNING' | 'FINISHED'>('IDLE');
    const [wheelRotation, setWheelRotation] = useState(0);
    const [resultSegment, setResultSegment] = useState<number | null>(null);

    const segmentsCount = DART_CONFIG.segments.length;
    const degreePerSegment = 360 / segmentsCount;

    const spinWheel = () => {
        if (balance < betAmount || betAmount <= 0) return;
        if (gameState === 'SPINNING') return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('SPINNING');
        setResultSegment(null);

        // Pick random outcome
        const selectedIdx = Math.floor(Math.random() * segmentsCount);

        // Calculate physics
        const spins = 5; // minimum spins
        const extraDegrees = (segmentsCount - 1 - selectedIdx) * degreePerSegment; // to land on selected
        const randomOffset = Math.random() * (degreePerSegment * 0.8) - (degreePerSegment * 0.4); // not perfectly centered
        const targetRotation = wheelRotation + (360 * spins) + extraDegrees + randomOffset;

        setWheelRotation(targetRotation);

        setTimeout(() => {
            setGameState('FINISHED');
            setResultSegment(selectedIdx);
            handleWin(selectedIdx);
        }, 3000); // 3 seconds spin duration matching the framer motion transition
    };

    const handleWin = (idx: number) => {
        const seg = DART_CONFIG.segments[idx];
        const winAmount = betAmount * seg.mult;

        setLastWin({ amount: winAmount, currency: currencyType, mult: seg.mult });

        if (winAmount > 0) {
            if (currencyType === 'GC') {
                setDiamonds((prev: number) => prev + winAmount);
            } else {
                setForgesCoins((prev: number) => prev + winAmount);
            }

            if (seg.mult >= 1.5) {
                confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }
        }
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'SPINNING') return;
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
                className={`${DART_CONFIG.theme.background} rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${DART_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-black/50 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Target className={DART_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{DART_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={DART_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c]/50 p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
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
                                disabled={gameState === 'SPINNING'}
                                className="w-full bg-[#0a0014]/50 border border-white/10 focus:border-fuchsia-500 focus:shadow-[0_0_10px_rgba(217,70,239,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'SPINNING'} className="bg-[#1f003d] hover:bg-[#340066] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'SPINNING'} className="bg-[#1f003d] hover:bg-[#340066] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'SPINNING'} className={`bg-[#1f003d] hover:bg-[#340066] ${DART_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-fuchsia-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#0a0014]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
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
                        <button onClick={spinWheel} disabled={gameState === 'SPINNING' || balance < betAmount || betAmount <= 0} className={`w-full ${DART_CONFIG.theme.buttonAccent} hover:brightness-110 text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(217,70,239,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <Zap size={20} /> THROW DART
                            </span>
                        </button>
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative ${DART_CONFIG.theme.gameBg} bg-cover bg-center p-2 sm:p-6 flex flex-col justify-center items-center overflow-hidden shadow-inner`}>

                    <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-sm"></div>

                    {/* Result overlay */}
                    <div className="absolute top-10 w-full flex justify-center z-30">
                        {gameState === 'FINISHED' && resultSegment !== null && (
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-black/80 border-2 border-fuchsia-500 px-8 py-4 rounded-2xl flex flex-col items-center drop-shadow-[0_0_20px_rgba(217,70,239,0.5)]"
                            >
                                <span className="text-slate-300 font-black uppercase tracking-widest text-sm mb-1">{DART_CONFIG.segments[resultSegment].label} Hit</span>
                                <span className="text-4xl font-black text-fuchsia-400">{DART_CONFIG.segments[resultSegment].mult}x</span>
                            </motion.div>
                        )}
                    </div>

                    {/* WHEEL CONTAINER */}
                    <div className="relative z-10 w-80 h-80 sm:w-96 sm:h-96">
                        {/* Wheel Pointer */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-8 h-10 bg-fuchsia-500 border-2 border-white [clip-path:polygon(50%_100%,0_0,100%_0)] drop-shadow-md"></div>

                        {/* Wheel */}
                        <motion.div
                            className="w-full h-full rounded-full border-8 border-[#340066] overflow-hidden relative shadow-[0_0_50px_rgba(217,70,239,0.2)]"
                            animate={{ rotate: wheelRotation }}
                            transition={{ duration: 3, ease: [0.15, 0.85, 0.35, 1] }}
                            style={{ backgroundImage: "conic-gradient(from 0deg, #1f003d, #0a0014)" }}
                        >
                            {/* Segments */}
                            {DART_CONFIG.segments.map((seg, i) => {
                                const rotation = i * degreePerSegment;
                                return (
                                    <div
                                        key={i}
                                        className="absolute w-[50%] h-[50%] origin-bottom-right flex items-center border-[0.5px] border-white/10"
                                        style={{
                                            rotate: `${rotation}deg`,
                                            transformOrigin: '100% 100%',
                                            top: 0,
                                            left: 0,
                                            backgroundColor: i % 2 === 0 ? 'rgba(217,70,239,0.1)' : 'rgba(217,70,239,0.02)'
                                        }}
                                    >
                                        <div className="absolute text-center text-white top-10 left-10 -rotate-45 -translate-y-1/2 min-w-[50px]">
                                            <div className="font-black text-xl">{seg.mult}x</div>
                                            <div className="text-[10px] uppercase font-bold text-fuchsia-200/60">{seg.label}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </motion.div>
                    </div>

                </div>
            </motion.div>
        </div>,
        document.body
    );
}
