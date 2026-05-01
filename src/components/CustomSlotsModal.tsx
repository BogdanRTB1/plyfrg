"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Coins, Repeat } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import FavoriteToggle from "./FavoriteToggle";

export default function CustomSlotsModal({ isOpen, onClose, gameData, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'SPINNING' | 'WON' | 'LOST'>('IDLE');
    const [reels, setReels] = useState<number[]>([1, 1, 1]);
    const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false]);
    const [winMultiplier, setWinMultiplier] = useState(0);

    const config = gameData?.slotsConfig || gameData?.config || {};
    const SYMBOLS = config.symbols || [];

    const spinReels = () => {
        if (!gameData || balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);

        if (SYMBOLS.length === 0) {
            setGameState('IDLE');
            setSpinningReels([false, false, false]);
            return;
        }

        setGameState('SPINNING');
        setWinMultiplier(0);
        setSpinningReels([true, true, true]);

        const newReels = [
            Math.floor(Math.random() * SYMBOLS.length),
            Math.floor(Math.random() * SYMBOLS.length),
            Math.floor(Math.random() * SYMBOLS.length)
        ];

        setTimeout(() => {
            setSpinningReels(prev => [false, prev[1], prev[2]]);
            setReels(prev => [newReels[0], prev[1], prev[2]]);
        }, 1000);

        setTimeout(() => {
            setSpinningReels(prev => [false, false, prev[2]]);
            setReels(prev => [newReels[0], newReels[1], prev[2]]);
        }, 1500);

        setTimeout(() => {
            setSpinningReels([false, false, false]);
            setReels(newReels);

            if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
                const multi = SYMBOLS[newReels[0]].multiplier;
                setWinMultiplier(multi);
                setGameState('WON');

                const winAmount = betAmount * multi;
                setLastWin({ amount: winAmount, currency: currencyType });

                if (currencyType === 'GC') {
                    setDiamonds((prev: number) => prev + winAmount);
                } else {
                    setForgesCoins((prev: number) => prev + winAmount);
                }

        setSessionPayout(prev => prev + winAmount);

                confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
            } else {
                setGameState('LOST');
            }
        }, 2000);
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'SPINNING') return;
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
                        gameName: gameData?.name || "Custom Game", 
                        gameImage: gameData?.coverImage || "/images/game-placeholder.png", 
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
        
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType, gameData]);

    if (!isOpen || !gameData) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`bg-[#0f212e] rounded-2xl w-full max-w-4xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden flex flex-col md:flex-row h-[600px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 bg-[#121c22] p-6 flex flex-col gap-4 border-r border-white/5 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col gap-1 text-white">
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black uppercase italic tracking-widest">{gameData?.name || "Slots"}</h2>
                                <FavoriteToggle gameName={gameData?.name || "Slots"} />
                            </div>
                            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest truncate w-[200px]">By {gameData.creatorName}</p>
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5 mt-2">
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

                    <div className="bg-[#0a1114]/50 border border-white/5 rounded-xl p-3 flex flex-col gap-2 mt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center border-b border-white/5 pb-1">Payouts</span>
                        <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                            {SYMBOLS.map((sym: any) => (
                                <div key={sym.id} className="flex justify-between items-center bg-[#121c22] rounded px-2 py-1 h-10 border border-white/5">
                                    <span className="text-xl leading-none flex items-center justify-center w-8 h-8 rounded shrink-0">
                                        {sym.image ? <img src={sym.image} className="w-full h-full object-contain drop-shadow" /> : sym.icon}
                                    </span>
                                    <span className="text-[#00b9f0] font-mono text-[10px] sm:text-xs font-bold">{sym.multiplier}x</span>
                                </div>
                            ))}
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

                    <div className="mt-auto">
                        <button onClick={spinReels} disabled={balance < betAmount || betAmount <= 0 || gameState === 'SPINNING'} className={`w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <Repeat className={gameState === 'SPINNING' ? "animate-spin" : ""} size={20} />
                                {gameState === 'SPINNING' ? 'SPINNING...' : 'SPIN'}
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
                                WIN {winMultiplier}x !
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
                                No Match
                            </motion.div>
                        </div>
                    )}

                    <div className="relative bg-gradient-to-b from-purple-900/40 to-[#0a1114] p-6 lg:p-10 rounded-3xl border-8 border-purple-500/20 shadow-[inset_0_20px_50px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.5)]">
                        <div className="flex gap-4 sm:gap-6 bg-[#06090c] p-4 sm:p-6 rounded-2xl shadow-inner border-[4px] border-[#0f171c]">
                            {reels.map((reelValueIdx, i) => (
                                <div key={i} className={`w-20 h-32 sm:w-28 sm:h-40 bg-[#121c22] rounded-xl overflow-hidden relative border border-white/5 shadow-inner`}>
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-10 pointer-events-none"></div>
                                    <div className="flex flex-col items-center w-full h-full text-5xl sm:text-7xl absolute left-0 right-0">

                                        <AnimatePresence mode="popLayout">
                                            {spinningReels[i] ? (
                                                <motion.div
                                                    key={`spin-${i}`}
                                                    animate={{ y: [0, -([1, 2, 3, 4, 5].length * 100)] }}
                                                    transition={{ duration: 0.5, ease: "linear", repeat: Infinity }}
                                                    className="flex flex-col gap-8 pb-8 pt-8"
                                                >
                                                    {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((sym: any, trackIdx: number) => (
                                                        <div key={trackIdx} className="flex justify-center items-center opacity-60 blur-[1px] h-20 w-20">
                                                            {sym.image ? <img src={sym.image} className="w-full h-full object-contain" /> : sym.icon}
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key={`stop-${i}-${reelValueIdx}`}
                                                    initial={{ y: -50, opacity: 0 }}
                                                    animate={{ y: 0, opacity: 1 }}
                                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                                    className="absolute inset-0 flex items-center justify-center p-2 h-full"
                                                >
                                                    {SYMBOLS[reelValueIdx]?.image ? (
                                                        <img src={SYMBOLS[reelValueIdx].image} className="w-[80%] h-[80%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                                                    ) : (
                                                        SYMBOLS[reelValueIdx]?.icon
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                    </div>

                                    {gameState === 'WON' && !spinningReels[i] && (
                                        <motion.div
                                            initial={{ opacity: 0, scaleY: 0 }}
                                            animate={{ opacity: 1, scaleY: 1 }}
                                            className="absolute top-1/2 left-0 right-0 h-1 bg-purple-500 -translate-y-1/2 z-20 shadow-[0_0_15px_#a855f7]"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
