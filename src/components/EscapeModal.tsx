"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Skull, Zap, ShieldAlert, Trophy, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import GameLeaderboardTrigger from "./GameLeaderboardTrigger";
import GameLeaderboardModal from "./GameLeaderboardModal";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import { fireWinConfetti } from "@/utils/winConfetti";
import { playGameSound, resumeOriginalGameAudio } from "@/utils/originalGameSounds";
import { calcOriginalsWin, generateEscapeCrashPoint, ESCAPE_MIN_CASHOUT_MULT, ESCAPE_MIN_PLAY_MS, ESCAPE_ROUND_COOLDOWN_MS } from "@/utils/originalsMath";

const ESCAPE_CONFIG = {
    names: { title: "Escape" },
    theme: { accent: "text-[#00b9f0]" }
};

export default function EscapeModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CAUGHT' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [runnerAngle, setRunnerAngle] = useState(0);
    const [copProximity, setCopProximity] = useState(0);

    const crashPointRef = useRef(1.00);
    const multiplierRef = useRef(1.00);
    const roundStartRef = useRef(0);
    const cooldownUntilRef = useRef(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
    const [leaderboardOpen, setLeaderboardOpen] = useState(false);
    const [cooldownUntil, setCooldownUntil] = useState(0);
    const [tick, setTick] = useState(0);

    const isRoundCooldown = Date.now() < cooldownUntil;
    const canCashOut =
        gameState === "PLAYING" &&
        tick >= 0 &&
        Date.now() - roundStartRef.current >= ESCAPE_MIN_PLAY_MS &&
        multiplier >= ESCAPE_MIN_CASHOUT_MULT;

    const startGame = () => {
        if (balance < betAmount) return;
        if (Date.now() < cooldownUntilRef.current) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);
        playGameSound('escape', 'bet');

        setGameState('PLAYING');
        setMultiplier(1.00);
        multiplierRef.current = 1.00;
        setCopProximity(0);
        setRunnerAngle(0);
        roundStartRef.current = Date.now();

        crashPointRef.current = generateEscapeCrashPoint();

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setMultiplier(prev => {
                const step = prev < 1.5 ? 0.018 : prev < 3 ? 0.045 : prev < 6 ? 0.09 : 0.14;
                const next = Number((prev + step).toFixed(3));
                multiplierRef.current = next;

                setRunnerAngle(a => a + 5);

                if (next >= crashPointRef.current) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    playGameSound('escape', 'crash');
                    setGameState('CAUGHT');
                    setCopProximity(100);
                    cooldownUntilRef.current = Date.now() + ESCAPE_ROUND_COOLDOWN_MS;
                    setCooldownUntil(cooldownUntilRef.current);
                    multiplierRef.current = crashPointRef.current;
                    return crashPointRef.current;
                }

                const distanceRatio = next / crashPointRef.current;
                setCopProximity(c => Math.min(100, c + (100 * distanceRatio * 0.028)));

                return next;
            });
            setTick((t) => t + 1);
        }, 90);
    };

    const cashOut = () => {
        if (gameState !== 'PLAYING') return;
        if (Date.now() - roundStartRef.current < ESCAPE_MIN_PLAY_MS) return;
        if (multiplierRef.current < ESCAPE_MIN_CASHOUT_MULT) return;
        if (timerRef.current) clearInterval(timerRef.current);

        setGameState('WON');
        const winAmount = calcOriginalsWin(betAmount, multiplierRef.current, 'escape');
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);
        playGameSound('escape', 'win');
        cooldownUntilRef.current = Date.now() + ESCAPE_ROUND_COOLDOWN_MS;
        setCooldownUntil(cooldownUntilRef.current);

        fireWinConfetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
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
        if (cooldownUntil <= Date.now()) return;
        const ms = cooldownUntil - Date.now() + 40;
        const id = window.setTimeout(() => setCooldownUntil(0), ms);
        return () => window.clearTimeout(id);
    }, [cooldownUntil]);

    useEffect(() => {
        if (!isOpen) {
            setMobileMoreOpen(false);
            setCooldownUntil(0);
            cooldownUntilRef.current = 0;
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Escape", 
                        gameImage: "/images/game-escape-v3.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                setSessionWagered(0);
                setSessionPayout(0);
            }

            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('IDLE');
        
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
                className="bg-[#0f212e] rounded-none md:rounded-2xl w-full max-w-4xl border border-[#00b9f0]/20 shadow-[0_0_50px_rgba(0,185,240,0.1)] overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[600px] md:max-h-[90vh] min-h-0 shadow-2xl"
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
                            <button type="button" onClick={cashOut} disabled={!canCashOut} className={`flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full text-[10px] font-black uppercase leading-tight text-[#0f212e] active:scale-95 ${canCashOut ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.45)]" : "cursor-not-allowed bg-slate-600 opacity-50"}`}>
                                <Trophy className="mb-0.5 h-5 w-5" />
                                <span className="text-[10px]">{canCashOut ? (betAmount * multiplier).toFixed(0) : "…"}</span>
                            </button>
                        ) : (
                            <button type="button" onClick={startGame} disabled={balance < betAmount || betAmount <= 0 || isRoundCooldown} className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-[#00b9f0] to-blue-600 text-[#0f212e] shadow-[0_0_22px_rgba(0,185,240,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45" aria-label="Start evasion">
                                <Zap className="h-7 w-7" strokeWidth={2.2} />
                            </button>
                        )
                    }
                    right={
                        <>
                            <button type="button" disabled={gameState === "PLAYING"} onClick={() => handleBetChange(balance)} className="shrink-0 rounded-lg border border-[#00b9f0]/30 bg-[#1a2c38] px-3 py-3 text-xs font-black text-[#00b9f0] active:scale-95 disabled:opacity-40">MAX</button>
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
                <div className="relative z-20 hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain flex-col gap-2 border-r border-white/5 bg-[#121c22] p-3 md:p-6 md:gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Skull className={ESCAPE_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{ESCAPE_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={ESCAPE_CONFIG.names.title} />
                            <GameLeaderboardTrigger variant="header" onClick={() => setLeaderboardOpen(true)} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    {/* Cyber Currency Toggle */}
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
                                className="w-full bg-[#0a1114] border border-[#00b9f0]/30 focus:border-[#00b9f0] focus:shadow-[0_0_10px_rgba(0,185,240,0.2)] rounded-xl py-4 pl-10 pr-4 text-white font-mono text-xl font-bold transition-all outline-none"
                            />
                        </div>

                        {/* Quick Bet Buttons */}
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount + 10)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">+10</button>
                            <button onClick={() => handleBetChange(betAmount + 50)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">+50</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00b9f0] text-xs font-black py-2.5 rounded-lg border border-[#00b9f0]/30 transition-colors">MAX</button>
                        </div>
                    </div>

                    {/* LAST WIN */}
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
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0 || isRoundCooldown} className="w-full bg-gradient-to-r from-[#00b9f0] to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white h-16 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(0,185,240,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2"><Zap size={20} className="text-yellow-300" /> {isRoundCooldown ? "Stand by…" : "Start Evasion"}</span>
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                            </button>
                        ) : (
                            <button onClick={cashOut} disabled={!canCashOut} className={`w-full h-16 rounded-xl font-black text-2xl uppercase transition-transform flex flex-col items-center justify-center ${canCashOut ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse hover:scale-[1.02]" : "bg-slate-700 text-slate-400 cursor-not-allowed opacity-70"}`}>
                                <span>{canCashOut ? "ESCAPE" : "HOLD…"}</span>
                                <span className="text-xs mt-[-4px]">{canCashOut ? `Win ${(betAmount * multiplier).toFixed(2)}` : `Need ${ESCAPE_MIN_CASHOUT_MULT.toFixed(2)}x+`}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#06090c]">
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-[80] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-300 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>
                    <div className={`absolute inset-0 opacity-10 bg-[url('/images/game-escape-v3.png')] bg-cover bg-center ${gameState === 'PLAYING' ? 'scale-110 transition-transform duration-[10000ms] ease-linear' : ''}`}></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,185,240,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,185,240,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                    {gameState === 'CAUGHT' && <div className="absolute inset-0 bg-red-600/20 mix-blend-overlay z-0 animate-pulse"></div>}
                    {gameState === 'WON' && <div className="absolute inset-0 bg-green-500/10 z-0"></div>}

                    <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-8">

                        <div className="relative w-72 h-72 rounded-full border border-[#00b9f0]/20 bg-[#0a1114]/80 shadow-[0_0_50px_rgba(0,185,240,0.1)] flex items-center justify-center mb-8 backdrop-blur-md">

                            <div className={`absolute inset-0 transition-opacity duration-300 rounded-full ${gameState === 'CAUGHT' ? 'bg-red-500/20 opacity-100' : 'opacity-0'}`}></div>
                            <div className={`absolute inset-0 transition-opacity duration-300 rounded-full ${gameState === 'WON' ? 'bg-green-500/20 opacity-100' : 'opacity-0'}`}></div>

                            <div className="absolute inset-8 rounded-full border border-[#00b9f0]/10"></div>
                            <div className="absolute inset-16 rounded-full border border-[#00b9f0]/10"></div>
                            <div className="absolute inset-24 rounded-full border border-[#00b9f0]/10"></div>

                            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-[#00b9f0]/20"></div>
                            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-[#00b9f0]/20"></div>

                            {gameState !== 'IDLE' && (
                                <div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                        background: gameState === 'CAUGHT'
                                            ? `conic-gradient(from ${runnerAngle}deg, transparent 0deg, rgba(239, 68, 68, 0.4) 90deg, rgba(239, 68, 68, 0.8) 90deg)`
                                            : `conic-gradient(from ${runnerAngle}deg, transparent 0deg, rgba(0, 185, 240, 0.2) 90deg, rgba(0, 185, 240, 0.6) 90deg)`
                                    }}
                                />
                            )}

                            <div className="absolute z-30 flex items-center justify-center">
                                <div className={`w-32 h-32 rounded-full bg-black/80 border-2 flex items-center justify-center shadow-lg backdrop-blur-xl ${gameState === 'CAUGHT' ? 'border-red-500 shadow-[0_0_20px_#ef4444]' : gameState === 'WON' ? 'border-green-400 shadow-[0_0_20px_#4ade80]' : 'border-[#00b9f0]/50 shadow-[0_0_20px_rgba(0,185,240,0.3)]'}`}>
                                    <h3 className={`text-4xl font-black ${gameState === 'CAUGHT' ? 'text-red-500' : gameState === 'WON' ? 'text-green-400' : 'text-white'}`}>
                                        {multiplier.toFixed(2)}x
                                    </h3>
                                </div>
                            </div>

                            <div className={`absolute w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] z-20 pointer-events-none ${gameState === 'CAUGHT' ? 'bg-red-500 text-red-500 animate-ping' : 'bg-green-400 text-green-400'}`}></div>

                            {/* Cops */}
                            {gameState !== 'IDLE' && gameState !== 'WON' && [0, 90, 180, 270].map((angleOffset, i) => {
                                const angle = (angleOffset + runnerAngle * 0.5) * (Math.PI / 180);
                                const radiusPercent = 50 - (copProximity * 0.5); // Fixed animation by using percentage from center
                                const top = `calc(50% + ${Math.sin(angle) * radiusPercent}%)`;
                                const left = `calc(50% + ${Math.cos(angle) * radiusPercent}%)`;

                                return (
                                    <div
                                        key={i}
                                        className="absolute w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444] z-10 flex items-center justify-center pointer-events-none transition-all duration-100 ease-linear"
                                        style={{ top, left, transform: 'translate(-50%, -50%)' }}
                                    >
                                        <div className="w-1 h-1 bg-white rounded-full"></div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="h-12 flex items-center justify-center relative z-20">
                            {gameState === 'IDLE' && <p className="text-slate-400 font-bold tracking-[0.2em] uppercase text-sm border border-slate-700 bg-slate-800/50 px-6 py-2 rounded-full">System Ready</p>}
                            {gameState === 'PLAYING' && (
                                <p className="text-[#00b9f0] font-mono animate-pulse font-bold tracking-[0.2em]">
                                    {canCashOut ? "EVADING PATROLS…" : "BREAKING CONTAINMENT…"}
                                </p>
                            )}
                            {gameState === 'CAUGHT' && (
                                <div className="bg-red-950/80 border-2 border-red-500 px-8 py-2 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                                    <ShieldAlert className="text-red-500" />
                                    <span className="text-red-500 text-xl font-black uppercase tracking-widest">Neutralized</span>
                                </div>
                            )}
                            {gameState === 'WON' && <div className="bg-green-950/80 border-2 border-green-500 px-8 py-2 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.5)]"><span className="text-green-400 text-xl font-black tracking-widest uppercase">Evasion Successful</span></div>}
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="escape-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{ESCAPE_CONFIG.names.title}</span>
                                <FavoriteToggle gameName={ESCAPE_CONFIG.names.title} />
                            </div>
                            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#0a1114]/50 p-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Last win</span>
                                {lastWin ? <span className="flex items-center gap-1 text-sm font-black text-green-400">+{lastWin.amount.toFixed(2)} {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}</span> : <span className="font-mono text-xs text-slate-600">—</span>}
                            </div>
                            <GameLeaderboardTrigger variant="mobile-menu" onClick={() => { setLeaderboardOpen(true); setMobileMoreOpen(false); }} />
                            <button type="button" onClick={() => setMobileMoreOpen(false)} className="w-full rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-white active:bg-white/10">Done</button>
                        </motion.div>
                    </motion.div>
                )}
            <GameLeaderboardModal isOpen={leaderboardOpen} onClose={() => setLeaderboardOpen(false)} gameName={"Escape"} />
            </AnimatePresence>
        </div>,
        document.body
    );
}
