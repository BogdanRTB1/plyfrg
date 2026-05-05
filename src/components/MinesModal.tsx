"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Bomb, Gem, Target, MoreHorizontal, Zap } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import Image from "next/image";
import FavoriteToggle from "./FavoriteToggle";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";

/** Fixed mine count for lobby Mines (5×5) — not player-selectable; matches house template. */
const LOBBY_MINES_COUNT = 7;

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
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    // Session tracking locally for consolidation
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'EXPLODED' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [nextMultiplier, setNextMultiplier] = useState(1.00);
    const [grid, setGrid] = useState<{ isMine: boolean, revealed: boolean }[]>([]);

    const updateMultipliers = (revealedSafe: number) => {
        const totalTiles = 25;
        const safeTiles = totalTiles - LOBBY_MINES_COUNT;
        // House-favored multiplier: fair odds * discount factor
        // Progressive tax increases with depth so the house edge grows as risk decreases
        const calcMult = (revealed: number) => {
            if (revealed === 0) return 1;
            let fairMult = 1;
            for (let i = 0; i < revealed; i++) {
                fairMult *= (totalTiles - i) / (safeTiles - i);
            }
            const houseDiscount = 0.88 - (revealed * 0.009);
            return Number((fairMult * Math.max(houseDiscount, 0.73)).toFixed(1));
        };
        setMultiplier(calcMult(revealedSafe));
        setNextMultiplier(calcMult(revealedSafe + 1));
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
        while (minesPlaced < LOBBY_MINES_COUNT) {
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
            if (revealedSafe === (25 - LOBBY_MINES_COUNT)) {
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
            setMobileMoreOpen(false);
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
        <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden bg-black md:bg-black/80 backdrop-blur-none md:backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${MINES_CONFIG.theme.background} rounded-none md:rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[600px] md:max-h-[90vh] min-h-0`}
            >
                <MobileGameHudBar
                    className={MINES_CONFIG.theme.panelBg}
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={gameState === "PLAYING"}
                        />
                    }
                    center={
                        gameState === "PLAYING" ? (
                            <button type="button" onClick={cashout} className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-green-500 text-[9px] font-black uppercase leading-tight text-black shadow-[0_0_20px_rgba(34,197,94,0.45)] active:scale-95">
                                <Trophy className="mb-0.5 h-4 w-4" />
                                <span className="text-[10px]">{(betAmount * multiplier).toFixed(1)}</span>
                            </button>
                        ) : (
                            <button type="button" onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className={`flex h-[68px] w-[68px] items-center justify-center rounded-full ${MINES_CONFIG.theme.buttonAccent} text-black shadow-[0_0_22px_rgba(0,185,240,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45`} aria-label="Start round">
                                <Zap className="h-6 w-6" strokeWidth={2.5} />
                            </button>
                        )
                    }
                    right={
                        <>
                            <button type="button" disabled={gameState === "PLAYING"} onClick={() => handleBetChange(balance)} className={`shrink-0 rounded-lg border border-[#00b9f0]/30 bg-[#1a2c38] px-3 py-3 text-xs font-black ${MINES_CONFIG.theme.accent} active:scale-95 disabled:opacity-40`}>MAX</button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={gameState === "PLAYING"}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] p-2.5 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
                        </>
                    }
                />

                <div className={`hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain ${MINES_CONFIG.theme.panelBg} flex-col gap-2 border-r border-white/5 p-3 md:p-6 md:gap-4 z-20`}>
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
                                    <span>{(betAmount * multiplier).toFixed(1)}</span>
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

                <div className="relative flex min-h-[48vh] flex-1 flex-col items-center justify-center bg-[#0a1114] p-4 sm:p-8 md:min-h-0">
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-300 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>
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

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="mines-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Mines</span>
                                <FavoriteToggle gameName={MINES_CONFIG.names.title} />
                            </div>
                            <p className="mb-4 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-slate-400">
                                Difficulty fixed: <span className="font-bold text-slate-200">{LOBBY_MINES_COUNT} mines</span> on 5×5.
                            </p>
                            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#0a1114]/50 p-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Last win</span>
                                {lastWin ? <span className="flex items-center gap-1 text-sm font-black text-green-400">+{lastWin.amount.toFixed(2)} {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}</span> : <span className="font-mono text-xs text-slate-600">—</span>}
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
