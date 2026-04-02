"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Bomb, Gem, Target } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import Image from "next/image";

// INFLUENCER/ADMIN CUSTOMIZATION CONFIG
export const MINES_CONFIG = {
    theme: {
        background: "bg-[#0f212e]",
        panelBg: "bg-[#121c22]",
        accent: "text-[#00b9f0]",
        buttonAccent: "bg-[#00b9f0]",
        mineColor: "text-red-500",
        safeColor: "text-green-400",
        cardUnrevealed: "bg-[#1a2c38]",
        cardRevealedSafe: "bg-[#0a1114]",
        cardRevealedMine: "bg-red-950/80",
        gridCols: 5,
        gridRows: 5,
    },
    icons: {
        safe: null, // e.g. "/images/custom-safe-icon.png"
        mine: null, // e.g. "/images/custom-mine-icon.png"
    },
    names: {
        title: "Mines",
        safeItem: "Gem",
        mineItem: "Mine"
    }
};

export default function MinesModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [mineCount, setMineCount] = useState(3);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'EXPLODED' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [nextMultiplier, setNextMultiplier] = useState(1.00);

    // Grid: true = mine, false = safe
    const [grid, setGrid] = useState<{ isMine: boolean, revealed: boolean }[]>([]);

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('PLAYING');
        setMultiplier(1.00);

        // Generate new grid
        const newGrid = Array(25).fill({ isMine: false, revealed: false });
        let minesPlaced = 0;
        while (minesPlaced < mineCount) {
            const idx = Math.floor(Math.random() * 25);
            if (!newGrid[idx].isMine) {
                newGrid[idx] = { isMine: true, revealed: false };
                minesPlaced++;
            }
        }
        setGrid(newGrid);
        updateMultipliers(0);
    };

    const updateMultipliers = (revealedSafe: number) => {
        // Simple multiplier math for demo
        const base = 1 - (mineCount / 25);
        const currMult = revealedSafe === 0 ? 1 : Math.pow(1 / base, revealedSafe) * 0.99;
        const nextMult = Math.pow(1 / base, revealedSafe + 1) * 0.99;
        setMultiplier(currMult);
        setNextMultiplier(nextMult);
    };

    const revealCell = (index: number) => {
        if (gameState !== 'PLAYING') return;
        if (grid[index].revealed) return;

        const newGrid = [...grid];
        newGrid[index] = { ...newGrid[index], revealed: true };
        setGrid(newGrid);

        if (newGrid[index].isMine) {
            // Reveal all mines (loss)
            setGameState('EXPLODED');
            setMultiplier(0);
            const finalGrid = newGrid.map(cell => cell.isMine ? { ...cell, revealed: true } : cell);
            setGrid(finalGrid);
        } else {
            const revealedCount = newGrid.filter(c => c.revealed && !c.isMine).length;
            updateMultipliers(revealedCount);

            // Auto win if all safe cells revealed
            if (revealedCount === 25 - mineCount) {
                cashOut(curr => curr);
            }
        }
    };

    const cashOut = (calcMult = (m: number) => m) => {
        if (gameState !== 'PLAYING') return;

        const finalMult = calcMult(multiplier);
        setGameState('WON');
        const winAmount = betAmount * finalMult;
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        // Reveal remaining grid
        const finalGrid = grid.map(cell => ({ ...cell, revealed: true }));
        setGrid(finalGrid);

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'PLAYING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    useEffect(() => {
        if (!isOpen) {
            setGameState('IDLE');
            setGrid(Array(25).fill({ isMine: false, revealed: false }));
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
                className={`${MINES_CONFIG.theme.background} rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${MINES_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-white/5 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Target className={MINES_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{MINES_CONFIG.names.title}</h2>
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
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
                                disabled={gameState === 'PLAYING'}
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-[#00b9f0] focus:shadow-[0_0_10px_rgba(0,185,240,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2 pb-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00b9f0] text-xs font-black py-2 rounded-lg border border-[#00b9f0]/30 transition-colors">MAX</button>
                        </div>

                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mines (1-24)</label>
                        </div>
                        <select
                            value={mineCount}
                            onChange={(e) => setMineCount(Number(e.target.value))}
                            disabled={gameState === 'PLAYING'}
                            className="w-full bg-[#0a1114] border border-white/10 focus:border-[#00b9f0] rounded-xl py-3 px-4 text-white font-bold outline-none appearance-none"
                        >
                            {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
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

                    <div className="mt-auto">
                        {gameState !== 'PLAYING' ? (
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className={`w-full bg-gradient-to-r from-[#00b9f0] to-[#38bdf8] hover:from-[#38bdf8] hover:to-[#7dd3fc] text-[#0f212e] h-14 rounded-xl font-black text-lg tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(0,185,240,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                                <span className="relative z-10">BET</span>
                            </button>
                        ) : (
                            <button onClick={() => cashOut(m => m)} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white h-14 rounded-xl font-black text-lg uppercase shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse hover:scale-[1.02] flex flex-col items-center justify-center">
                                <span>CASHOUT</span>
                                <span className="text-[10px] text-green-200 mt-[-2px]">Take {(betAmount * multiplier).toFixed(2)}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className="flex-1 relative bg-[#06090c] p-4 flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-x-0 top-0 p-6 flex justify-between items-center z-10">
                        <div className="bg-[#121c22] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Multiplier</span>
                            <span className="text-[#00b9f0] font-mono font-black text-xl">{multiplier.toFixed(2)}x</span>
                        </div>
                        {gameState === 'PLAYING' && (
                            <div className="bg-[#121c22] border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Next</span>
                                <span className="text-green-400 font-mono font-black text-xl">{nextMultiplier.toFixed(2)}x</span>
                            </div>
                        )}
                    </div>

                    <div className={`grid gap-2 sm:gap-3 lg:gap-4 p-4 mt-8`} style={{ gridTemplateColumns: `repeat(${MINES_CONFIG.theme.gridCols}, minmax(0, 1fr))` }}>
                        {grid.length === 25 ? grid.map((cell, idx) => (
                            <button
                                key={idx}
                                disabled={cell.revealed || gameState !== 'PLAYING'}
                                onClick={() => revealCell(idx)}
                                className={`
                                    relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl flex items-center justify-center transition-all duration-300 transform
                                    ${!cell.revealed ? MINES_CONFIG.theme.cardUnrevealed + ' hover:bg-white/10 hover:scale-105 shadow-md hover:shadow-xl cursor-pointer' : ''}
                                    ${cell.revealed && cell.isMine ? MINES_CONFIG.theme.cardRevealedMine + ' scale-95 opacity-90 shadow-inner border border-red-500/30' : ''}
                                    ${cell.revealed && !cell.isMine ? MINES_CONFIG.theme.cardRevealedSafe + ' scale-95 opacity-90 shadow-inner border border-white/5' : ''}
                                    ${gameState === 'EXPLODED' && !cell.revealed ? 'opacity-50' : ''}
                                `}
                            >
                                <AnimatePresence>
                                    {cell.revealed && (
                                        <motion.div
                                            initial={{ scale: 0, opacity: 0, rotate: -30 }}
                                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            {cell.isMine ? (
                                                MINES_CONFIG.icons.mine ? (
                                                    <Image src={MINES_CONFIG.icons.mine} alt="Mine" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
                                                ) : <Bomb className={`w-8 h-8 sm:w-10 sm:h-10 ${MINES_CONFIG.theme.mineColor}`} />
                                            ) : (
                                                MINES_CONFIG.icons.safe ? (
                                                    <Image src={MINES_CONFIG.icons.safe} alt="Safe" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 opacity-80" />
                                                ) : <Gem className={`w-8 h-8 sm:w-10 sm:h-10 ${MINES_CONFIG.theme.safeColor}`} />
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        )) : (
                            // Empty grid placeholder
                            Array(25).fill(0).map((_, idx) => (
                                <div key={idx} className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl ${MINES_CONFIG.theme.cardUnrevealed} opacity-50`}></div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div >
        </div >,
        document.body
    );
}
