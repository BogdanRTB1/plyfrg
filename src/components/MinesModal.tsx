"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Bomb, Gem, Target } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import Image from "next/image";
import FavoriteToggle from "./FavoriteToggle";

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

    // Session tracking locally for consolidation
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'EXPLODED' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [nextMultiplier, setNextMultiplier] = useState(1.00);
    const [grid, setGrid] = useState<{ isMine: boolean, revealed: boolean }[]>([]);

    const updateMultipliers = (revealedSafe: number) => {
        const base = 1 - (mineCount / 25);
        const currMult = revealedSafe === 0 ? 1 : Math.pow(1 / base, revealedSafe) * 0.99;
        const nextMult = Math.pow(1 / base, revealedSafe + 1) * 0.99;
        setMultiplier(currMult);
        setNextMultiplier(nextMult);
    };

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        // Track session wagered
        setSessionWagered(prev => prev + betAmount);

        setGameState('PLAYING');
        setMultiplier(1.00);

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

    const revealCell = (index: number) => {
        if (gameState !== 'PLAYING') return;
        if (grid[index].revealed) return;

        const newGrid = [...grid];
        newGrid[index] = { ...newGrid[index], revealed: true };
        setGrid(newGrid);

        if (newGrid[index].isMine) {
            setGameState('EXPLODED');
            const finalGrid = newGrid.map(cell => ({ ...cell, revealed: true }));
            setGrid(finalGrid);
        } else {
            const revealedSafe = newGrid.filter(c => c.revealed && !c.isMine).length;
            updateMultipliers(revealedSafe);
            if (revealedSafe === (25 - mineCount)) {
                cashout();
            }
        }
    };

    const cashout = () => {
        if (gameState !== 'PLAYING') return;
        const finalMult = multiplier;
        setGameState('WON');
        const winAmount = betAmount * finalMult;
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        // Track session payout
        setSessionPayout(prev => prev + winAmount);

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
            // Report consolidated session on exit
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Mines", 
                        gameImage: "/images/game-mines.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                // Reset local session trackers
                setSessionWagered(0);
                setSessionPayout(0);
            }
            setGameState('IDLE');
            setGrid([]);
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
                className={`${MINES_CONFIG.theme.background} rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]`}
            >
                <div className={`w-full md:w-80 ${MINES_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-white/5 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Target className={MINES_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{MINES_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={MINES_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button
                            onClick={() => setCurrencyType('GC')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${currencyType === 'GC' ? 'bg-[#1a2c38] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <DiamondIcon className="w-4 h-4" /> GC
                        </button>
                        <button 
                            onClick={() => setCurrencyType('FC')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${currencyType === 'FC' ? 'bg-[#1a2c38] text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            <ForgesCoinIcon className="w-4 h-4" /> FC
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <span>Bet Amount</span>
                                <span className={MINES_CONFIG.theme.accent}>{balance.toFixed(2)}</span>
                            </div>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => handleBetChange(Number(e.target.value))}
                                    className="w-full bg-[#1a2c38] border border-white/5 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-[#00b9f0]/50 transition-all"
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                    <button onClick={() => handleBetChange(betAmount / 2)} className="px-2 py-1 bg-[#2f4553] hover:bg-[#3d5a6d] text-xs font-bold text-white rounded-lg transition-colors border border-white/5">½</button>
                                    <button onClick={() => handleBetChange(betAmount * 2)} className="px-2 py-1 bg-[#2f4553] hover:bg-[#3d5a6d] text-xs font-bold text-white rounded-lg transition-colors border border-white/5">2×</button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mines Count</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 3, 5, 24].map((count) => (
                                    <button
                                        key={count}
                                        onClick={() => gameState !== 'PLAYING' && setMineCount(count)}
                                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${mineCount === count ? 'bg-[#00b9f0] border-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.3)]' : 'bg-[#1a2c38] border-white/5 text-slate-400 hover:border-white/20'}`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 mt-auto">
                        {gameState === 'PLAYING' ? (
                            <button
                                onClick={cashout}
                                className="w-full py-4 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-widest rounded-xl transition-all flex flex-col items-center justify-center group shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                            >
                                <span className="text-xs opacity-70 group-hover:scale-110 transition-transform">Cashout</span>
                                <div className="flex items-center gap-1">
                                    <Trophy size={16} />
                                    <span>{(betAmount * multiplier).toFixed(2)}</span>
                                </div>
                            </button>
                        ) : (
                            <button
                                onClick={startGame}
                                className={`w-full py-4 ${MINES_CONFIG.theme.buttonAccent} hover:opacity-90 text-black font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_30px_rgba(0,185,240,0.3)]`}
                            >
                                Start Game
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 bg-[#0a1114] p-4 sm:p-8 flex flex-col items-center justify-center relative">
                    <div className="grid grid-cols-5 gap-2 sm:gap-3 bg-[#121c22]/50 p-3 sm:p-4 rounded-3xl border border-white/5">
                        {grid.length > 0 ? grid.map((cell, idx) => (
                            <button
                                key={idx}
                                onClick={() => revealCell(idx)}
                                disabled={gameState !== 'PLAYING' || cell.revealed}
                                className={`
                                    w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl transition-all duration-300 relative overflow-hidden flex items-center justify-center
                                    ${cell.revealed 
                                        ? cell.isMine ? MINES_CONFIG.theme.cardRevealedMine : MINES_CONFIG.theme.cardRevealedSafe
                                        : `${MINES_CONFIG.theme.cardUnrevealed} hover:bg-[#2f4553] shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:-translate-y-1 active:translate-y-0 active:shadow-none`
                                    }
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
                            Array(25).fill(0).map((_, idx) => (
                                <div key={idx} className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl ${MINES_CONFIG.theme.cardUnrevealed} opacity-50`}></div>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
