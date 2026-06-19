"use client";
import { scaleDemoWin } from "@/utils/demoPlay";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Zap, Trophy, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import GameLeaderboardTrigger from "./GameLeaderboardTrigger";
import GameLeaderboardModal from "./GameLeaderboardModal";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import { fireWinConfetti } from "@/utils/winConfetti";
import { playGameSound, resumeOriginalGameAudio } from "@/utils/originalGameSounds";
import { pickDartSegmentIndex } from "@/utils/originalsMath";

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

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);

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

        setSessionWagered(prev => prev + betAmount);
        playGameSound('dart', 'bet');
        playGameSound('dart', 'spin');

        setGameState('SPINNING');
        setResultSegment(null);

        // Pick random outcome
        const selectedIdx = pickDartSegmentIndex(segmentsCount);

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
        const winAmount = scaleDemoWin(betAmount * seg.mult);

        setLastWin({ amount: winAmount, currency: currencyType, mult: seg.mult });

        if (winAmount > 0) {
            if (currencyType === 'GC') {
                setDiamonds((prev: number) => prev + winAmount);
            } else {
                setForgesCoins((prev: number) => prev + winAmount);
            }

        setSessionPayout(prev => prev + winAmount);
            playGameSound('dart', 'win');

            if (seg.mult >= 1.5) {
                fireWinConfetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }
        }
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
                className={`${DART_CONFIG.theme.background} rounded-none md:rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[700px] md:max-h-[90vh] min-h-0`}
            >
                <MobileGameHudBar
                    className={DART_CONFIG.theme.panelBg}
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={gameState === "SPINNING"}
                            quickBtnClassName="shrink-0 rounded-lg border border-white/10 bg-[#1f003d] px-2 py-2 text-[11px] font-black text-slate-200 active:scale-95 disabled:opacity-40 min-h-[40px] min-w-[34px]"
                            inputClassName="min-h-[40px] min-w-[3rem] flex-1 basis-0 max-w-[6.75rem] rounded-lg border border-white/10 bg-[#0a0014]/90 px-1 py-1 text-center text-[11px] font-mono font-bold text-white outline-none focus:border-fuchsia-400/35 disabled:opacity-40"
                        />
                    }
                    center={
                        gameState === "SPINNING" ? (
                            <button type="button" disabled className="flex h-[68px] w-[68px] cursor-not-allowed items-center justify-center rounded-full border border-fuchsia-500/30 bg-[#1f003d] text-fuchsia-400/50 opacity-60" aria-label="Spinning">
                                <Zap className="h-7 w-7 animate-pulse" />
                            </button>
                        ) : (
                            <button type="button" onClick={spinWheel} disabled={balance < betAmount || betAmount <= 0} className={`flex h-[68px] w-[68px] items-center justify-center rounded-full ${DART_CONFIG.theme.buttonAccent} text-white shadow-[0_0_22px_rgba(217,70,239,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45`} aria-label="Throw dart">
                                <Zap className="h-7 w-7" strokeWidth={2.2} />
                            </button>
                        )
                    }
                    right={
                        <>
                            <button type="button" disabled={gameState === "SPINNING"} onClick={() => handleBetChange(balance)} className={`shrink-0 rounded-lg border border-fuchsia-500/30 bg-[#1f003d] px-3 py-3 text-xs font-black ${DART_CONFIG.theme.accent} active:scale-95 disabled:opacity-40`}>MAX</button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={gameState === "SPINNING"}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#1f003d] p-2.5 text-fuchsia-200 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
                        </>
                    }
                />

                {/* ADVANCED BETTING MENU */}
                <div className={`z-20 hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain ${DART_CONFIG.theme.panelBg} flex-col gap-2 border-r border-black/50 p-3 md:p-6 md:gap-4`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Target className={DART_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{DART_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={DART_CONFIG.names.title} />
                            <GameLeaderboardTrigger variant="header" onClick={() => setLeaderboardOpen(true)} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c]/50 p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> GC</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'SPINNING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> FC</button>
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
                <div className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden ${DART_CONFIG.theme.gameBg} bg-cover bg-center p-2 shadow-inner sm:p-6`}>
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-[80] flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-500/20 bg-black/50 text-fuchsia-100 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>

                    <div className="absolute inset-0 z-0 bg-black/60 backdrop-blur-sm"></div>

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

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="dart-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className={`max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-fuchsia-500/20 border-b-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl ${DART_CONFIG.theme.panelBg}`} onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{DART_CONFIG.names.title}</span>
                                <FavoriteToggle gameName={DART_CONFIG.names.title} />
                            </div>
                            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#0a0014]/50 p-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Last win</span>
                                {lastWin ? <span className="flex items-center gap-1 text-sm font-black text-green-400">+{lastWin.amount.toFixed(2)} {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}</span> : <span className="font-mono text-xs text-slate-600">—</span>}
                            </div>
                            <button type="button" onClick={() => setMobileMoreOpen(false)} className="w-full rounded-xl border border-fuchsia-500/20 bg-[#1f003d] py-3 text-sm font-bold text-white active:bg-white/10">Done</button>
                        </motion.div>
                    </motion.div>
                )}
            <GameLeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} gameName={"Dart Wheel"} />
            </AnimatePresence>
        </div>,
        document.body
    );
}
