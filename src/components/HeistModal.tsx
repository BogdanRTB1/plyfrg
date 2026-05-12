"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Unlock, Zap, Trophy, Goal, Crosshair, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import confetti from "canvas-confetti";

const HEIST_CONFIG = {
    names: { title: "Heist" },
    theme: { accent: "text-yellow-500" }
};

export default function HeistModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    // Session tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CRASHED' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [cashOutValue, setCashOutValue] = useState(0);
    const crashPointRef = useRef(1.00);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

    const startGame = () => {
        if (balance < betAmount) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);

        setGameState('PLAYING');
        setMultiplier(1.00);

        const e = 2 ** (Math.random() * 3.05);
        crashPointRef.current = Math.max(1.00, e * 0.56);

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setMultiplier(prev => {
                const step = prev < 2 ? 0.01 : prev < 5 ? 0.03 : 0.08;
                const next = prev + step;
                if (next >= crashPointRef.current) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setGameState('CRASHED');
                    return crashPointRef.current;
                }
                return next;
            });
        }, 80);
    };

    const cashOut = () => {
        if (gameState !== 'PLAYING') return;
        if (timerRef.current) clearInterval(timerRef.current);

        setGameState('WON');
        const winAmount = betAmount * multiplier * 0.92;
        setCashOutValue(winAmount);
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);

        confetti({ particleCount: 200, spread: 90, colors: ['#ffe000', '#ffcc00', '#ffb300', '#ffffff'], origin: { y: 0.6 } });
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
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Heist", 
                        gameImage: "/images/game-heist-v2.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                
                // Reset session
                setSessionWagered(0);
                setSessionPayout(0);
            }

            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('IDLE');
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
                className="bg-[#0f212e] rounded-none md:rounded-2xl w-full max-w-4xl border border-yellow-500/20 shadow-[0_0_50px_rgba(234,179,8,0.1)] overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[600px] md:max-h-[90vh] min-h-0"
            >
                <MobileGameHudBar
                    className="bg-[#121c22]"
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
                            <button type="button" onClick={cashOut} className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-green-500 text-[10px] font-black uppercase leading-tight text-[#0f212e] shadow-[0_0_20px_rgba(34,197,94,0.45)] active:scale-95">
                                <Trophy className="mb-0.5 h-5 w-5" />
                                <span className="text-[10px]">{(betAmount * multiplier).toFixed(0)}</span>
                            </button>
                        ) : (
                            <button type="button" onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-yellow-600 to-amber-500 text-black shadow-[0_0_22px_rgba(234,179,8,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45" aria-label="Start heist">
                                <Lock className="h-7 w-7" strokeWidth={2.2} />
                            </button>
                        )
                    }
                    right={
                        <>
                            <button type="button" disabled={gameState === "PLAYING"} onClick={() => handleBetChange(balance)} className="shrink-0 rounded-lg border border-yellow-500/30 bg-[#1a2c38] px-3 py-3 text-xs font-black text-yellow-400 active:scale-95 disabled:opacity-40">MAX</button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={gameState === "PLAYING"}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] p-2.5 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
                        </>
                    }
                />

                {/* ADVANCED BETTING MENU */}
                <div className="hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain bg-[#121c22] flex-col gap-2 border-r border-white/5 p-3 md:p-6 md:gap-4 z-20">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Crosshair className={HEIST_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{HEIST_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={HEIST_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> GC</button>
                        <button onClick={() => setCurrencyType('FC')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> FC</button>
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
                                className="w-full bg-[#0a1114] border border-yellow-500/30 focus:border-yellow-500 focus:shadow-[0_0_10px_rgba(234,179,8,0.2)] rounded-xl py-4 pl-10 pr-4 text-white font-mono text-xl font-bold transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount + 10)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">+10</button>
                            <button onClick={() => handleBetChange(betAmount + 50)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">+50</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-yellow-500 text-xs font-black py-2.5 rounded-lg border border-yellow-500/30 transition-colors">MAX</button>
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
                        {gameState !== 'PLAYING' ? (
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-black h-16 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(234,179,8,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2"><Lock size={20} /> INITIATE HEIST</span>
                                <div className="absolute inset-0 bg-white/30 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                            </button>
                        ) : (
                            <button onClick={cashOut} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white h-16 rounded-xl font-black text-2xl uppercase shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse hover:scale-[1.02] transition-transform flex flex-col items-center justify-center">
                                <span>CASH OUT</span>
                                <span className="text-xs text-green-200 mt-[-4px]">Take {(betAmount * multiplier).toFixed(2)}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#06090c] p-4">
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-[80] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-300 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>
                    <div className="absolute inset-0 opacity-10 bg-[url('/images/game-heist-v2.png')] bg-cover bg-center mix-blend-screen"></div>

                    {gameState === 'CRASHED' && (
                        <div className="absolute inset-0 flex">
                            <div className="flex-1 bg-red-600/40 mix-blend-color animate-[pulse_0.4s_infinite]"></div>
                            <div className="flex-1 bg-blue-600/40 mix-blend-color animate-[pulse_0.4s_infinite_0.2s]"></div>
                        </div>
                    )}

                    <div className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center group mb-12">
                        <div className={`absolute inset-4 rounded-full bg-gradient-to-br from-yellow-500/80 via-yellow-700/80 to-amber-900/80 flex items-center justify-center shadow-[inset_0_0_50px_rgba(255,255,255,0.5)] transition-opacity duration-1000 ${gameState === 'PLAYING' || gameState === 'WON' ? 'opacity-100' : 'opacity-0'}`}>
                            {gameState === 'PLAYING' && <div className="absolute inset-0 flex flex-wrap justify-center content-center gap-1 opacity-50 p-6 mix-blend-screen">
                                {Array.from({ length: Math.min(20, Math.floor(multiplier * 2)) }).map((_, i) => (
                                    <div key={i} className="w-8 h-4 bg-yellow-400 rounded-sm shadow-[0_0_10px_#fde047] transform rotate-[-20deg]"></div>
                                ))}
                            </div>}

                            <motion.h3
                                animate={gameState === 'PLAYING' ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className={`text-6xl font-black drop-shadow-[0_0_15px_rgba(0,0,0,0.5)] relative z-10 ${gameState === 'WON' ? 'text-green-400' : 'text-white'}`}
                            >
                                {multiplier.toFixed(2)}x
                            </motion.h3>
                        </div>

                        <motion.div
                            className="absolute left-0 top-0 bottom-0 w-1/2 bg-gradient-to-r from-zinc-800 to-zinc-700 border-r-4 border-zinc-900 shadow-2xl origin-left rounded-l-full flex items-center justify-end overflow-hidden"
                            animate={{ rotateY: gameState === 'PLAYING' || gameState === 'WON' ? -90 : 0 }}
                            transition={{ type: "spring", stiffness: 60, damping: 15 }}
                            style={{ perspective: 1000 }}
                        >
                            <div className="w-16 h-16 mr-2 rounded-full border-4 border-zinc-500 flex items-center justify-center opacity-30 bg-black/20">
                                <Lock className="text-zinc-500" />
                            </div>
                        </motion.div>

                        <motion.div
                            className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-zinc-800 to-zinc-700 border-l-4 border-zinc-900 shadow-2xl origin-right rounded-r-full flex items-center justify-start overflow-hidden"
                            animate={{ rotateY: gameState === 'PLAYING' || gameState === 'WON' ? 90 : 0 }}
                            transition={{ type: "spring", stiffness: 60, damping: 15 }}
                            style={{ perspective: 1000 }}
                        >
                            <div className="w-16 h-16 ml-2 rounded-full border-4 border-zinc-500 flex items-center justify-center opacity-30 bg-black/20">
                                <Unlock className="text-zinc-500" />
                            </div>
                        </motion.div>

                        <div className="absolute inset-0 rounded-full border-[16px] border-zinc-800/90 shadow-[0_0_30px_rgba(0,0,0,0.8)] pointer-events-none">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="absolute w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-zinc-600 shadow-inner" style={{
                                    top: '50%', left: '50%',
                                    transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-145px)`
                                }}></div>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        {gameState === 'IDLE' && <p className="text-slate-400 font-bold tracking-widest text-lg border border-slate-700 bg-slate-800/50 px-6 py-2 rounded-full">VAULT LOCKED</p>}
                        {gameState === 'PLAYING' && <p className="text-yellow-400 font-bold text-lg animate-pulse tracking-[0.2em]">COLLECTING GOLD...</p>}
                        {gameState === 'CRASHED' && (
                            <div className="bg-red-950/80 border-2 border-red-500 px-8 py-3 rounded-full flex items-center gap-3 backdrop-blur z-20">
                                <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                                <span className="text-red-500 text-lg sm:text-xl font-black">POLICE ARRIVED @ {crashPointRef.current.toFixed(2)}x</span>
                            </div>
                        )}
                        {gameState === 'WON' && <div className="bg-green-950/80 border-2 border-green-500 px-8 py-3 rounded-full backdrop-blur z-20"><span className="text-green-400 text-lg sm:text-xl font-black tracking-widest">ESCAPED WITH {cashOutValue.toFixed(2)}</span></div>}
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="heist-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{HEIST_CONFIG.names.title}</span>
                                <FavoriteToggle gameName={HEIST_CONFIG.names.title} />
                            </div>
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
