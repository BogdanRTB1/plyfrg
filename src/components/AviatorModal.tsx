"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, TrendingUp, Zap, Trophy, Goal, Plane } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import confetti from "canvas-confetti";

// AVIATOR CUSTOMIZATION CONFIG
export const AVIATOR_CONFIG = {
    theme: {
        background: "bg-[#180a24]", // dark purple vibe
        panelBg: "bg-[#25103a]",
        accent: "text-purple-400",
        buttonAccent: "bg-purple-600 hover:bg-purple-500",
        graphBg: "bg-[url('/images/game-aviator.png')]",
        lineColor: "stroke-purple-400",
        fillColor: "fill-purple-500/20",
        runawayColor: "stroke-red-500 text-red-500"
    },
    names: {
        title: "Aviator Influencer"
    },
    features: {
        vehicle: "🛩️", // We can use an emoji or image! Custom character flies here
        flyawayText: "FLEW AWAY"
    }
};

export default function AviatorModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    // THIS SHARES CORE LOGIC WITH CRASH, BUT WITH DIFFERENT THEME AND CONSTANTS
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [autoCashout, setAutoCashout] = useState<number | string>('');
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CRASHED'>('IDLE');
    const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
    const [multiplier, setMultiplier] = useState(1.00);
    const [crashPoint, setCrashPoint] = useState(1.00);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const timeStartRef = useRef<number>(0);
    const requestRef = useRef<number | null>(null);

    const gameStateRef = useRef(gameState);
    gameStateRef.current = gameState;

    const crashPointRef = useRef(1.00);
    const autoCashoutRef = useRef<number>(0);
    autoCashoutRef.current = Number(autoCashout) || 0;

    const cashedOutAtRef = useRef<number | null>(null);
    cashedOutAtRef.current = cashedOutAt;

    const currentMultiplierRef = useRef(1.00);

    const generateCrashPoint = () => {
        const e = 100 / (Math.random() * 100 + 1);
        return Math.max(1.00, e * 0.99);
    };

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);

        const cp = generateCrashPoint();
        crashPointRef.current = cp;
        setCrashPoint(cp);

        setGameState('PLAYING');
        setCashedOutAt(null);
        setMultiplier(1.00);
        currentMultiplierRef.current = 1.00;
        timeStartRef.current = performance.now();

        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        requestRef.current = requestAnimationFrame(updateGame);
    };

    const updateGame = (time: number) => {
        if (gameStateRef.current !== 'PLAYING') return;

        const timeElapsedms = time - timeStartRef.current;
        const timeElapsedSec = timeElapsedms / 1000;

        const nextMultiplier = Math.pow(Math.E, 0.08 * timeElapsedSec);

        if (nextMultiplier >= crashPointRef.current) {
            currentMultiplierRef.current = crashPointRef.current;
            setMultiplier(crashPointRef.current);
            setGameState('CRASHED');
            drawGraph(timeElapsedSec, crashPointRef.current, true);
            return;
        }

        currentMultiplierRef.current = nextMultiplier;
        setMultiplier(nextMultiplier);

        if (autoCashoutRef.current > 1.00 && nextMultiplier >= autoCashoutRef.current && cashedOutAtRef.current === null) {
            cashOut(autoCashoutRef.current);
        }

        drawGraph(timeElapsedSec, nextMultiplier, false);

        requestRef.current = requestAnimationFrame(updateGame);
    };

    const drawGraph = (timeElapsedSec: number, currentMult: number, isCrashed: boolean) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        const padding = 40;

        const maxTime = Math.max(10, timeElapsedSec * 1.25);
        const maxMult = Math.max(2.0, currentMult * 1.25);

        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i <= 5; i++) {
            const y = h - padding - (i / 5) * (h - padding * 2);
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y);
        }
        ctx.stroke();

        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '12px Courier';
        ctx.fillText((maxMult).toFixed(1) + 'x', 5, padding);
        ctx.fillText('1.0x', 5, h - padding);

        ctx.beginPath();
        ctx.moveTo(padding, h - padding);

        const STEPS = Math.max(100, Math.floor(timeElapsedSec * 30));
        let lastX = padding;
        let lastY = h - padding;

        for (let i = 0; i <= STEPS; i++) {
            const t = (i / STEPS) * timeElapsedSec;
            const m = Math.pow(Math.E, 0.08 * t);

            const x = padding + (t / maxTime) * (w - padding * 2);
            const y = h - padding - ((m - 1) / (maxMult - 1)) * (h - padding * 2);

            ctx.lineTo(x, y);
            lastX = x;
            lastY = y;
        }

        // Aviator uses the specified colors from config
        ctx.strokeStyle = isCrashed ? '#ef4444' : '#c084fc';
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.lineTo(lastX, h - padding);
        ctx.lineTo(padding, h - padding);
        ctx.closePath();

        ctx.fillStyle = isCrashed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(192, 132, 252, 0.2)';
        ctx.fill();

        if (isCrashed) {
            // Draw explosion or stopped vehicle
            ctx.fillStyle = '#ef4444';
            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💥', lastX, lastY);
        } else {
            // Draw plane flying
            ctx.fillStyle = 'white';
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // To properly rotate the emoji, we must use transform
            ctx.save();
            ctx.translate(lastX, lastY);
            // approximate angle, basic math 
            const angle = Math.atan2((((Math.pow(Math.E, 0.08 * timeElapsedSec) - 1) / (maxMult - 1)) * (h - padding * 2)), (((timeElapsedSec) / maxTime) * (w - padding * 2)));
            ctx.rotate(-angle * 0.3); // dampen rotation
            ctx.fillText(AVIATOR_CONFIG.features.vehicle, 0, 0);
            ctx.restore();
        }
    };

    const cashOut = (forceMultiplier?: number) => {
        if (gameStateRef.current !== 'PLAYING') return;

        const mult = forceMultiplier || currentMultiplierRef.current;
        setCashedOutAt(mult);
        cashedOutAtRef.current = mult;

        const winAmount = betAmount * mult;
        setLastWin({ amount: winAmount, currency: currencyType, mult });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);

        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'PLAYING') return;
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
                        gameName: "Aviator Influencer", 
                        gameImage: "/images/game-aviator.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                setSessionWagered(0);
                setSessionPayout(0);
            }

            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            setGameState('IDLE');
            setMultiplier(1.00);

            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            setTimeout(() => drawGraph(0, 1.0, false), 100);
        
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
                className={`${AVIATOR_CONFIG.theme.background} rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${AVIATOR_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-black/50 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <TrendingUp className={AVIATOR_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{AVIATOR_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={AVIATOR_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#110521] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'PLAYING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'PLAYING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
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
                                className="w-full bg-[#110521] border border-white/10 focus:border-purple-500 focus:shadow-[0_0_10px_rgba(168,85,247,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-[#381a57] hover:bg-[#4d2874] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#381a57] hover:bg-[#4d2874] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className={`bg-[#381a57] hover:bg-[#4d2874] ${AVIATOR_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-purple-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="space-y-2 mt-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
                            <span>Auto Cashout</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                <Goal className="w-4 h-4" />
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                min="1.01"
                                value={autoCashout}
                                onChange={(e) => setAutoCashout(e.target.value)}
                                disabled={gameState === 'PLAYING'}
                                placeholder="N/A"
                                className="w-full bg-[#110521] border border-white/10 focus:border-purple-500 rounded-xl py-3 pl-10 pr-8 text-white font-mono text-base font-bold transition-all outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">
                                X
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#110521]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
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
                        {gameState === 'PLAYING' && cashedOutAt === null ? (
                            <button onClick={() => cashOut()} className={`w-full bg-green-500 hover:bg-green-400 text-[#0f212e] h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(34,197,94,0.4)] relative overflow-hidden group`}>
                                <span className="relative z-10 flex flex-col items-center justify-center">
                                    <span className="text-lg">CASHOUT</span>
                                    <span className="text-xs opacity-80 mt-[-4px]">Win {(betAmount * multiplier).toFixed(2)}</span>
                                </span>
                            </button>
                        ) : (
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0 || (gameState === 'PLAYING' && cashedOutAt !== null)} className={`w-full ${AVIATOR_CONFIG.theme.buttonAccent} hover:brightness-110 text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                                <span className="relative z-10 flex gap-2 items-center justify-center">
                                    <Plane size={20} /> {(gameState === 'PLAYING' && cashedOutAt !== null) ? 'ESCAPED' : 'BET'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative ${AVIATOR_CONFIG.theme.graphBg} bg-cover bg-center p-2 sm:p-6 flex flex-col justify-center overflow-hidden shadow-inner`}>

                    <div className="absolute inset-0 bg-black/60 z-0"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(192,132,252,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(192,132,252,0.1)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0"></div>

                    {/* Central Multiplier Display */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex flex-col items-center">
                            <span className={`text-6xl sm:text-8xl md:text-9xl font-black transition-colors duration-200 ${(gameState === 'CRASHED' && cashedOutAt === null) ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]' : (cashedOutAt !== null) ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-purple-400 drop-shadow-[0_0_30px_rgba(192,132,252,0.5)]'}`}>
                                {multiplier.toFixed(2)}x
                            </span>
                            {gameState === 'CRASHED' && (
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 font-bold uppercase tracking-[0.3em] mt-2 text-lg sm:text-xl"
                                >
                                    {AVIATOR_CONFIG.features.flyawayText} @ {crashPoint.toFixed(2)}x
                                </motion.span>
                            )}
                            {cashedOutAt !== null && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-green-400 font-bold uppercase tracking-[0.3em] mt-2 text-lg sm:text-xl bg-green-950/50 px-4 py-1 rounded-full border border-green-500/30"
                                >
                                    Escaped @ {cashedOutAt.toFixed(2)}x
                                </motion.span>
                            )}
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={500}
                        className="w-full h-full object-contain mix-blend-screen opacity-100 relative z-0"
                    />
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
