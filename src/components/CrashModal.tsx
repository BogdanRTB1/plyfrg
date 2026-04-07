"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X, TrendingUp, Zap, Trophy, Goal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import confetti from "canvas-confetti";

// INFLUENCER/ADMIN CUSTOMIZATION CONFIG
export const CRASH_CONFIG = {
    theme: {
        background: "bg-[#0f212e]",
        panelBg: "bg-[#121c22]",
        accent: "text-[#00b9f0]",
        buttonAccent: "bg-[#00b9f0] hover:bg-[#00a0d1]",
        graphBg: "bg-[#0a1114]",
        lineColor: "stroke-[#00b9f0]",
        fillColor: "fill-[#00b9f0]/10",
        runawayColor: "stroke-red-500 text-red-500"
    },
    names: {
        title: "Crash"
    },
    features: {
        vehicle: "🚀" // Can be changed to logo, emoji, etc.
    }
};

export default function CrashModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [autoCashout, setAutoCashout] = useState<number | string>(''); // Disabled by default
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    // Session tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CRASHED'>('IDLE');
    const [cashedOutAt, setCashedOutAt] = useState<number | null>(null);
    const [multiplier, setMultiplier] = useState(1.00);
    const [crashPoint, setCrashPoint] = useState(1.00);

    // Graph drawing logic
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const timeStartRef = useRef<number>(0);
    const requestRef = useRef<number | null>(null);

    // Keep track of state outside of loops
    const gameStateRef = useRef(gameState);
    gameStateRef.current = gameState;

    const crashPointRef = useRef(1.00);
    const autoCashoutRef = useRef<number>(0);
    autoCashoutRef.current = Number(autoCashout) || 0;

    const cashedOutAtRef = useRef<number | null>(null);
    cashedOutAtRef.current = cashedOutAt;

    const currentMultiplierRef = useRef(1.00);

    const generateCrashPoint = () => {
        // Simple hash logic for crash point: E = 100 / (rand * 100) -> 1% chance instacrash, mean ~2.0
        const e = 100 / (Math.random() * 100 + 1);
        return Math.max(1.00, e * 0.99); // 1% house edge
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

        // Multiplier growth curve: Math.pow(Math.E, 0.06 * timeElapsedSec) -> generic crash formula
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

        // Check auto cashout
        if (autoCashoutRef.current > 1.00 && nextMultiplier >= autoCashoutRef.current && cashedOutAtRef.current === null) {
            cashOut(autoCashoutRef.current); // Explicitly pass the limit mult
            // Continue drawing the graph! Do not return.
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

        // Dynamic horizontal/vertical smooth scale
        // Padding times give space ahead of the line so rocket isn't kissing the edge
        const maxTime = Math.max(10, timeElapsedSec * 1.25);
        const maxMult = Math.max(2.0, currentMult * 1.25);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i <= 5; i++) {
            const y = h - padding - (i / 5) * (h - padding * 2);
            ctx.moveTo(padding, y);
            ctx.lineTo(w - padding, y); // don't draw all the way to 100% width
        }
        ctx.stroke();

        // Labels
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '12px Courier';
        ctx.fillText((maxMult).toFixed(1) + 'x', 5, padding);
        ctx.fillText('1.0x', 5, h - padding);

        // Path
        ctx.beginPath();
        ctx.moveTo(padding, h - padding);

        const STEPS = Math.max(100, Math.floor(timeElapsedSec * 30)); // Adaptive resolution for smoother curves at higher values
        let lastX = padding;
        let lastY = h - padding;

        for (let i = 0; i <= STEPS; i++) {
            const t = (i / STEPS) * timeElapsedSec;
            const m = Math.pow(Math.E, 0.08 * t);

            // X width minus (padding * 2) so graph leaves space on right side
            const x = padding + (t / maxTime) * (w - padding * 2);
            const y = h - padding - ((m - 1) / (maxMult - 1)) * (h - padding * 2);

            ctx.lineTo(x, y);
            lastX = x;
            lastY = y;
        }

        ctx.strokeStyle = isCrashed ? '#ef4444' : '#00b9f0';
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.lineTo(lastX, h - padding);
        ctx.lineTo(padding, h - padding);
        ctx.closePath();

        ctx.fillStyle = isCrashed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0, 185, 240, 0.1)';
        ctx.fill();

        // Draw the vehicle/rocket at the tip smoothly mapped
        ctx.fillStyle = isCrashed ? '#ef4444' : 'white';
        ctx.font = '32px Arial'; // Increased size for better visibility
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(CRASH_CONFIG.features.vehicle, lastX, lastY);
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
        
        setGameState('IDLE');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

        // Note: Graph update continues normally loop logic. We do not restart timeStartRef.
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'PLAYING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    useEffect(() => {
        if (!isOpen) {
            // Record session for consolidated history
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Crash", 
                        gameImage: "/images/game-crash.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                
                // Reset session
                setSessionWagered(0);
                setSessionPayout(0);
            }

            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            setGameState('IDLE');
            setMultiplier(1.00);

            // clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        } else {
            // initial render of canvas
            setTimeout(() => drawGraph(0, 1.0, false), 100);
        }
    }, [isOpen, sessionWagered, sessionPayout]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${CRASH_CONFIG.theme.background} rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${CRASH_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-black/50 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <TrendingUp className={CRASH_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{CRASH_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={CRASH_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
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
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-[#00b9f0] focus:shadow-[0_0_10px_rgba(0,185,240,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className={`bg-[#1a2c38] hover:bg-[#2f4553] ${CRASH_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-[#00b9f0]/30 transition-colors`}>MAX</button>
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
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-[#00b9f0] rounded-xl py-3 pl-10 pr-8 text-white font-mono text-base font-bold transition-all outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">
                                X
                            </div>
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

                    <div className="mt-auto space-y-3">
                        {gameState === 'PLAYING' && cashedOutAt === null ? (
                            <button onClick={() => cashOut()} className={`w-full bg-green-500 hover:bg-green-400 text-[#0f212e] h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(34,197,94,0.4)] relative overflow-hidden group`}>
                                <span className="relative z-10 flex flex-col items-center justify-center">
                                    <span className="text-lg">CASHOUT</span>
                                    <span className="text-xs opacity-80 mt-[-4px]">Win {(betAmount * multiplier).toFixed(2)}</span>
                                </span>
                            </button>
                        ) : (
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0 || (gameState === 'PLAYING' && cashedOutAt !== null)} className={`w-full ${CRASH_CONFIG.theme.buttonAccent} hover:brightness-110 text-[#0f212e] h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(0,185,240,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                                <span className="relative z-10 flex gap-2 items-center justify-center">
                                    <Zap size={20} /> {(gameState === 'PLAYING' && cashedOutAt !== null) ? 'ESCAPED' : 'BET'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative ${CRASH_CONFIG.theme.graphBg} p-2 sm:p-6 flex flex-col justify-center overflow-hidden shadow-inner`}>

                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

                    {/* Central Multiplier Display */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex flex-col items-center">
                            <span className={`text-6xl sm:text-8xl md:text-9xl font-black transition-colors duration-200 ${(gameState === 'CRASHED' && cashedOutAt === null) ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]' : (cashedOutAt !== null) ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-white'}`}>
                                {multiplier.toFixed(2)}x
                            </span>
                            {gameState === 'CRASHED' && (
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 font-bold uppercase tracking-[0.3em] mt-2 text-lg sm:text-xl"
                                >
                                    Crashed @ {crashPoint.toFixed(2)}x
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
                        className="w-full h-full object-contain mix-blend-screen opacity-90 relative z-0"
                    />
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
