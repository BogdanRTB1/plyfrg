"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Footprints, Skull, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import GameLeaderboardTrigger from "./GameLeaderboardTrigger";
import GameLeaderboardModal from "./GameLeaderboardModal";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import { fireWinConfetti } from "@/utils/winConfetti";
import { playGameSound, resumeOriginalGameAudio } from "@/utils/originalGameSounds";
import { calcOriginalsWin, pickGlassBridgeStepHolds } from "@/utils/originalsMath";

export const BRIDGE_CONFIG = {
    theme: {
        background: "bg-[#050014]",
        panelBg: "bg-[#0a0028]",
        accent: "text-cyan-400",
        buttonAccent: "bg-cyan-600 hover:bg-cyan-500",
        gameBg: "bg-[url('/images/game-glass-bridge.png')]",
    },
    names: {
        title: "Glass Bridge"
    },
    multipliers: [1.5, 2.5, 4.0, 7.0, 12.0, 20.0, 35.0, 60.0, 100.0, 250.0]
};

export default function GlassBridgeModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CRACKED'>('IDLE');
    const [currentStep, setCurrentStep] = useState(0);
    const [path, setPath] = useState<('left' | 'right')[]>([]);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);
        playGameSound('glassBridge', 'bet');

        // Calculate result
        setGameState('PLAYING');
        setCurrentStep(0);
        setPath([]);
    };

    const stepOnGlass = (side: 'left' | 'right') => {
        if (gameState !== 'PLAYING') return;

        const holds = pickGlassBridgeStepHolds();

        setPath(prev => [...prev, side]);

        if (holds) {
            playGameSound('glassBridge', 'reveal');
            const nextStep = currentStep + 1;
            if (nextStep >= BRIDGE_CONFIG.multipliers.length) {
                // WON MAX!
                setCurrentStep(nextStep);
                cashOut(nextStep);
            } else {
                setCurrentStep(nextStep);
            }
        } else {
            playGameSound('glassBridge', 'lose');
            // Breaks
            setGameState('CRACKED');
            setTimeout(() => {
                setGameState('IDLE');
                setCurrentStep(0);
                setPath([]);
            }, 2000);
        }
    };

    const cashOut = (stepOverride?: number) => {
        if (gameState !== 'PLAYING') return;
        const step = stepOverride !== undefined ? stepOverride : currentStep;
        if (step === 0) return;

        const mult = BRIDGE_CONFIG.multipliers[step - 1];
        const winAmount = calcOriginalsWin(betAmount, mult, 'glassBridge');

        setLastWin({ amount: winAmount, currency: currencyType, mult });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);
        playGameSound('glassBridge', 'win');

        fireWinConfetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

        setGameState('IDLE');
        setCurrentStep(0);
        setPath([]);
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'PLAYING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    
    useEffect(() => {
        if (isOpen) resumeOriginalGameAudio();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) setMobileMoreOpen(false);
    }, [isOpen]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden bg-black md:bg-black/80 backdrop-blur-none md:backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${BRIDGE_CONFIG.theme.background} rounded-none md:rounded-2xl w-full max-w-5xl border border-cyan-500/20 shadow-2xl overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[700px] md:max-h-[90vh] min-h-0`}
            >
                <MobileGameHudBar
                    className={BRIDGE_CONFIG.theme.panelBg}
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={gameState === "PLAYING"}
                            quickBtnClassName="shrink-0 rounded-lg border border-cyan-500/20 bg-[#100033] px-2 py-2 text-[11px] font-black text-cyan-200 active:scale-95 disabled:opacity-40 min-h-[40px] min-w-[34px]"
                            inputClassName="min-h-[40px] min-w-[3rem] flex-1 basis-0 max-w-[6.75rem] rounded-lg border border-cyan-500/20 bg-[#050014]/90 px-1 py-1 text-center text-[11px] font-mono font-bold text-white outline-none focus:border-cyan-400/40 disabled:opacity-40"
                        />
                    }
                    center={
                        gameState === "PLAYING" && currentStep > 0 ? (
                            <button type="button" onClick={() => cashOut()} className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-green-500 text-[10px] font-black uppercase leading-tight text-[#050014] shadow-[0_0_20px_rgba(34,197,94,0.45)] active:scale-95">
                                <Trophy className="mb-0.5 h-5 w-5" />
                                <span className="text-[10px]">{(betAmount * BRIDGE_CONFIG.multipliers[currentStep - 1]).toFixed(0)}</span>
                            </button>
                        ) : gameState === "IDLE" ? (
                            <button type="button" onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-cyan-600 text-[#050014] shadow-[0_0_22px_rgba(34,211,238,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45" aria-label="Bet">
                                <Footprints className="h-7 w-7" strokeWidth={2.2} />
                            </button>
                        ) : (
                            <button type="button" disabled className="flex h-[68px] w-[68px] cursor-not-allowed items-center justify-center rounded-full border border-cyan-500/30 bg-[#100033] text-cyan-500/50 opacity-50" aria-label="Choose glass">
                                <Footprints className="h-7 w-7" strokeWidth={2.2} />
                            </button>
                        )
                    }
                    right={
                        <>
                            <button type="button" disabled={gameState === "PLAYING"} onClick={() => handleBetChange(balance)} className={`shrink-0 rounded-lg border border-cyan-500/30 bg-[#100033] px-3 py-3 text-xs font-black ${BRIDGE_CONFIG.theme.accent} active:scale-95 disabled:opacity-40`}>MAX</button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={gameState === "PLAYING"}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-cyan-500/20 bg-[#100033] p-2.5 text-cyan-200 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
                        </>
                    }
                />

                {/* ADVANCED BETTING MENU */}
                <div className={`hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain ${BRIDGE_CONFIG.theme.panelBg} flex-col gap-2 border-r border-cyan-500/10 p-3 md:p-6 md:gap-4 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Footprints className={BRIDGE_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{BRIDGE_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={BRIDGE_CONFIG.names.title} />
                            <GameLeaderboardTrigger variant="header" onClick={() => setLeaderboardOpen(true)} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-cyan-400 transition-colors" /></button>
                    </div>

                    <div className="bg-[#050014]/80 p-1 rounded-xl flex border border-cyan-500/10">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'PLAYING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> GC</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'PLAYING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> FC</button>
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
                                disabled={gameState === 'PLAYING'}
                                className="w-full bg-[#050014]/80 border border-cyan-500/20 focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-[#100033] hover:bg-[#1a004c] text-cyan-200 hover:text-white text-xs font-bold py-2 rounded-lg border border-cyan-500/20 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#100033] hover:bg-[#1a004c] text-cyan-200 hover:text-white text-xs font-bold py-2 rounded-lg border border-cyan-500/20 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className={`bg-[#100033] hover:bg-[#1a004c] ${BRIDGE_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-cyan-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#050014]/80 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
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
                        {gameState === 'PLAYING' && currentStep > 0 ? (
                            <button onClick={() => cashOut()} className={`w-full bg-green-500 hover:bg-green-400 text-black h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(34,197,94,0.4)] relative overflow-hidden group`}>
                                <span className="relative z-10 flex flex-col items-center justify-center">
                                    <span className="text-base">CASHOUT</span>
                                    <span className="text-xs opacity-80 mt-[-2px]">Win {(betAmount * BRIDGE_CONFIG.multipliers[currentStep - 1]).toFixed(2)}</span>
                                </span>
                            </button>
                        ) : (
                            <button onClick={startGame} disabled={gameState !== 'IDLE' || balance < betAmount || betAmount <= 0} className={`w-full ${BRIDGE_CONFIG.theme.buttonAccent} hover:brightness-110 text-[#050014] h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(34,211,238,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                                <span className="relative z-10 flex gap-2 items-center justify-center">
                                    <Footprints size={20} /> BET
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`relative flex flex-1 flex-col items-center justify-end overflow-hidden ${BRIDGE_CONFIG.theme.gameBg} bg-cover bg-center p-2 shadow-inner perspective-[1000px] sm:p-6`}>
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-[80] flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-black/50 text-cyan-100 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>

                    <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-[1px]"></div>

                    {/* Result overlay */}
                    <AnimatePresence>
                        {gameState === 'CRACKED' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-40 bg-orange-900/60 backdrop-blur-sm pointer-events-none"
                            >
                                <div className="text-center drop-shadow-[0_0_50px_rgba(249,115,22,0.8)]">
                                    <Skull className="w-40 h-40 text-orange-500 mx-auto mb-4" />
                                    <h1 className="text-6xl font-black text-orange-500 uppercase tracking-[0.3em] font-mono">CRACK!</h1>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bridge Area */}
                    <div className="z-10 w-full max-w-sm flex flex-col-reverse gap-4 relative mt-10 mb-0" style={{ transform: "rotateX(40deg) scale(1.1)", transformStyle: "preserve-3d", transformOrigin: "bottom" }}>
                        {BRIDGE_CONFIG.multipliers.map((mult, idx) => {
                            const isCurrent = gameState === 'PLAYING' && currentStep === idx;
                            const isPassed = currentStep > idx;
                            const stepSide = path[idx];
                            const crackedSide = (gameState === 'CRACKED' && currentStep === idx) ? path[idx] : null;

                            return (
                                <div key={idx} className={`flex gap-6 relative transition-all duration-300 ${isCurrent ? 'scale-110 z-20' : isPassed ? 'opacity-80 scale-95' : 'opacity-80 scale-90'}`} style={{ transform: `translateZ(${idx * 10}px)` }}>

                                    {/* Multiplier label */}
                                    <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-16 text-right" style={{ transform: "rotateX(-40deg)" }}>
                                        <span className={`font-mono font-black text-lg ${isCurrent || isPassed ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' : 'text-slate-500'}`}>{mult}x</span>
                                    </div>

                                    {/* Left pane */}
                                    <button
                                        disabled={!isCurrent}
                                        onClick={() => stepOnGlass('left')}
                                        className={`flex-1 h-16 rounded-xl border-[3px] transition-all duration-300 relative overflow-hidden backdrop-blur-md
                                            ${crackedSide === 'left' ? 'border-red-500 bg-red-950/80 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)]'
                                                : isCurrent ? 'border-cyan-300 bg-cyan-900/40 hover:bg-cyan-800/60 shadow-[0_0_30px_rgba(34,211,238,0.4)] cursor-pointer'
                                                    : isPassed && stepSide === 'left' ? 'border-emerald-400 bg-emerald-900/40 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                                                        : 'border-cyan-900/50 bg-slate-900/60 hover:border-cyan-700/50'}
                                        `}
                                    >
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/glass-panels.png')] opacity-30 mix-blend-overlay"></div>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>

                                        {/* Stepped indicator */}
                                        {isPassed && stepSide === 'left' && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-70">
                                                <Footprints className="w-8 h-8 text-emerald-400" />
                                            </div>
                                        )}
                                        {crackedSide === 'left' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-full bg-[url('https://www.shutterstock.com/image-vector/broken-glass-cracks-on-window-260nw-1919530436.jpg')] bg-cover opacity-80 mix-blend-screen"></div>
                                            </div>
                                        )}
                                    </button>

                                    {/* Right pane */}
                                    <button
                                        disabled={!isCurrent}
                                        onClick={() => stepOnGlass('right')}
                                        className={`flex-1 h-16 rounded-xl border-[3px] transition-all duration-300 relative overflow-hidden backdrop-blur-md
                                            ${crackedSide === 'right' ? 'border-red-500 bg-red-950/80 shadow-[inset_0_0_20px_rgba(239,68,68,0.5)]'
                                                : isCurrent ? 'border-cyan-300 bg-cyan-900/40 hover:bg-cyan-800/60 shadow-[0_0_30px_rgba(34,211,238,0.4)] cursor-pointer'
                                                    : isPassed && stepSide === 'right' ? 'border-emerald-400 bg-emerald-900/40 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                                                        : 'border-cyan-900/50 bg-slate-900/60 hover:border-cyan-700/50'}
                                        `}
                                    >
                                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/glass-panels.png')] opacity-30 mix-blend-overlay"></div>
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>

                                        {/* Stepped indicator */}
                                        {isPassed && stepSide === 'right' && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-70">
                                                <Footprints className="w-8 h-8 text-emerald-400" />
                                            </div>
                                        )}
                                        {crackedSide === 'right' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-full h-full bg-[url('https://www.shutterstock.com/image-vector/broken-glass-cracks-on-window-260nw-1919530436.jpg')] bg-cover opacity-80 mix-blend-screen mix-blend-overlay"></div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            );
                        })}

                        <div className="text-center font-bold text-slate-500 tracking-widest uppercase mt-8 mb-4 text-sm" style={{ transform: "rotateX(-40deg)" }}>
                            Finish
                        </div>
                        <div className="absolute bottom-[-40px] w-full text-center font-bold text-slate-500 tracking-widest uppercase mb-2 text-sm z-0 text-cyan-500/50" style={{ transform: "rotateX(-40deg)" }}>
                            START
                        </div>
                    </div>

                </div>
            </motion.div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="bridge-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className={`max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-cyan-500/20 border-b-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl ${BRIDGE_CONFIG.theme.panelBg}`} onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{BRIDGE_CONFIG.names.title}</span>
                                <FavoriteToggle gameName={BRIDGE_CONFIG.names.title} />
                            </div>
                            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#050014]/80 p-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Last win</span>
                                {lastWin ? <span className="flex items-center gap-1 text-sm font-black text-green-400">+{lastWin.amount.toFixed(2)} {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}</span> : <span className="font-mono text-xs text-slate-600">—</span>}
                            </div>
                            <button type="button" onClick={() => setMobileMoreOpen(false)} className="w-full rounded-xl border border-cyan-500/20 bg-[#100033] py-3 text-sm font-bold text-white active:bg-white/10">Done</button>
                        </motion.div>
                    </motion.div>
                )}
            <GameLeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} gameName={"Glass Bridge"} />
            </AnimatePresence>
        </div>,
        document.body
    );
}
