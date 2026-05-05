"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Goal, Rocket, TrendingUp, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import FavoriteToggle from "./FavoriteToggle";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";

export default function CustomCrashModal({ isOpen, onClose, gameData, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [autoCashout, setAutoCashout] = useState<number | string>('');
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

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

    const config = gameData?.crashConfig || gameData?.config || {};
    const ROCKET_IMAGE = config.rocketImage || (typeof config.flyingObject === 'string' && (config.flyingObject.startsWith('data:image') || config.flyingObject.startsWith('http') || config.flyingObject.startsWith('/')) ? config.flyingObject : null);
    const CRASH_IMAGE = config.crashImage;
    const FLYING_OBJECT = (!ROCKET_IMAGE && typeof config.flyingObject === 'string') ? config.flyingObject : '🚀';
    const ACCENT_COLOR = config.accentColor || '#10b981';
    const GRAPH_COLOR = config.graphColor || ACCENT_COLOR;
    const BACKGROUND_COLOR = config.backgroundColor || '#06090c';
    const BACKGROUND_IMAGE = config.backgroundImage || null;

    const configAcceleration = config.accelerationCurve || 0.08;
    const configHouseEdge = config.houseEdge || 5;
    const configMaxMultiplier = Math.min(config.maxMultiplier || 1000, 35);

    // We pre-load images to draw them on canvas
    const [rocketImgObj, setRocketImgObj] = useState<HTMLImageElement | null>(null);
    const [crashImgObj, setCrashImgObj] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (ROCKET_IMAGE) {
            const img = new Image();
            img.src = ROCKET_IMAGE;
            img.onload = () => setRocketImgObj(img);
        }
        if (CRASH_IMAGE) {
            const img = new Image();
            img.src = CRASH_IMAGE;
            img.onload = () => setCrashImgObj(img);
        }
    }, [ROCKET_IMAGE, CRASH_IMAGE]);

    const generateCrashPoint = () => {
        const edge = Math.max(12, Number(configHouseEdge) || 16);
        const edgeFraction = edge / 100;

        // Guaranteed instant loss based on the configured house edge
        if (Math.random() < edgeFraction) {
            return 1.0;
        }

        const u = Math.max(0.0001, Math.random());
        const cp = (1 - edgeFraction) / (1 - u);
        return Number(Math.max(1.0, Math.min(cp, configMaxMultiplier)).toFixed(1));
    };

    const startGame = () => {
        if (!gameData || balance < betAmount || betAmount <= 0 || (gameState === 'PLAYING' && cashedOutAt !== null)) return;

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

        const nextMultiplier = Math.pow(Math.E, configAcceleration * timeElapsedSec);

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
            const m = Math.pow(Math.E, configAcceleration * t);

            const x = padding + (t / maxTime) * (w - padding * 2);
            const y = h - padding - ((m - 1) / (maxMult - 1)) * (h - padding * 2);

            ctx.lineTo(x, y);
            lastX = x;
            lastY = y;
        }

        ctx.strokeStyle = isCrashed ? '#ef4444' : GRAPH_COLOR;
        ctx.lineWidth = 8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.lineTo(lastX, h - padding);
        ctx.lineTo(padding, h - padding);
        ctx.closePath();

        ctx.fillStyle = isCrashed ? 'rgba(239, 68, 68, 0.1)' : `${GRAPH_COLOR}33`;
        ctx.fill();

        if (isCrashed) {
            if (crashImgObj) {
                const imgW = 100;
                const imgH = 100;
                ctx.drawImage(crashImgObj, lastX - imgW / 2, lastY - imgH / 2, imgW, imgH);
            } else {
                ctx.fillStyle = '#ef4444';
                ctx.font = '32px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💥', lastX, lastY);
            }
        } else {
            // Draw flying object
            ctx.save();
            ctx.translate(lastX, lastY);
            const angle = Math.atan2((((Math.pow(Math.E, configAcceleration * timeElapsedSec) - 1) / (maxMult - 1)) * (h - padding * 2)), (((timeElapsedSec) / maxTime) * (w - padding * 2)));

            if (rocketImgObj) {
                ctx.rotate(-angle);
                const imgW = 80;
                const imgH = 80;
                ctx.shadowColor = `${GRAPH_COLOR}aa`;
                ctx.shadowBlur = 20;
                ctx.drawImage(rocketImgObj, -imgW / 2, -imgH / 2, imgW, imgH);
            } else {
                ctx.rotate(-angle * 0.5);
                ctx.fillStyle = 'white';
                ctx.font = '36px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(FLYING_OBJECT, 0, 0);
            }
            ctx.restore();
        }
    };

    const cashOut = (forceMultiplier?: number) => {
        if (gameStateRef.current !== 'PLAYING') return;

        const mult = forceMultiplier || currentMultiplierRef.current;
        setCashedOutAt(mult);
        cashedOutAtRef.current = mult;

        const roundedMult = Number(mult.toFixed(1));
        const winAmount = Number((betAmount * roundedMult).toFixed(2));
        setLastWin({ amount: winAmount, currency: currencyType, mult: roundedMult });

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
            setMobileMoreOpen(false);
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: gameData?.name || "Custom Game", 
                        gameImage: gameData?.coverImage || "/images/game-placeholder.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType,
                        creatorId: gameData?.creatorId,
                        gameId: gameData?.id,
                    }
                }));
                // Reset session
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
    }, [isOpen, sessionWagered, sessionPayout, currencyType, gameData]);

    if (!isOpen || !gameData) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden bg-black md:bg-black/80 backdrop-blur-none md:backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`bg-[#0f212e] rounded-none md:rounded-2xl w-full max-w-5xl border overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[700px] md:max-h-[90vh] min-h-0`}
                style={{ borderColor: `${ACCENT_COLOR}55`, boxShadow: `0 0 50px ${ACCENT_COLOR}33` }}
            >
                <MobileGameHudBar
                    className="bg-[#121c22]"
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={gameState === "PLAYING"}
                            quickBtnClassName="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] px-2 py-2 text-[11px] font-black text-slate-200 active:scale-95 disabled:opacity-40 min-h-[40px] min-w-[34px]"
                            inputClassName="min-h-[40px] min-w-[3rem] flex-1 basis-0 max-w-[6.75rem] rounded-lg border border-white/10 bg-[#0a1114] px-1 py-1 text-center text-[11px] font-mono font-bold text-white outline-none focus:border-green-400/45 disabled:opacity-40"
                        />
                    }
                    center={
                        gameState === "PLAYING" && cashedOutAt === null ? (
                            <button type="button" onClick={() => cashOut()} className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-green-500 text-[9px] font-black uppercase leading-tight text-[#0f212e] shadow-[0_0_20px_rgba(34,197,94,0.45)] active:scale-95">
                                <span className="text-[9px]">Out</span>
                                <span className="text-xs font-black">{(betAmount * multiplier).toFixed(1)}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={startGame}
                                disabled={balance < betAmount || betAmount <= 0 || (gameState === "PLAYING" && cashedOutAt !== null)}
                                className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-[0_0_22px_rgba(34,197,94,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                                aria-label="Fly"
                            >
                                <Rocket className="h-6 w-6" strokeWidth={2.2} />
                            </button>
                        )
                    }
                    right={
                        <>
                            <button type="button" disabled={gameState === "PLAYING"} onClick={() => handleBetChange(balance)} className="shrink-0 rounded-lg border border-green-500/30 bg-[#1a2c38] px-2.5 py-2.5 text-[11px] font-black text-green-400 active:scale-95 disabled:opacity-40">MAX</button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={gameState === "PLAYING"}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                                className="h-10 w-10 rounded-lg"
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] p-2 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-4 w-4" /></button>
                        </>
                    }
                />

                {/* ADVANCED BETTING MENU — desktop */}
                <div className={`hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain bg-[#121c22] flex-col gap-2 border-r border-white/5 p-3 md:p-6 md:gap-4 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col gap-1 text-white">
                            <h2 className="text-xl font-black uppercase tracking-widest leading-none truncate w-[200px]">{gameData.name}</h2>
                            <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest truncate w-[200px]">By {gameData.creatorName}</p>
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5 mt-2">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'PLAYING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> GC</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'PLAYING'} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> FC</button>
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
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-green-500 focus:shadow-[0_0_10px_rgba(34,197,94,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className={`bg-[#1a2c38] hover:bg-[#2f4553] text-green-500 text-xs font-black py-2 rounded-lg border border-green-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="space-y-2 mt-2">
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
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-green-500 rounded-xl py-3 pl-10 pr-8 text-white font-mono text-base font-bold transition-all outline-none"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold">
                                X
                            </div>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#0a1114]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <TrendingUp className="text-[#00b9f0]" />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{gameData?.name || "Crash"}</h2>
                            <FavoriteToggle gameName={gameData?.name || "Crash"} />
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
                                    <span className="text-xs opacity-80 mt-[-4px]">Win {(betAmount * multiplier).toFixed(1)}</span>
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={startGame}
                                disabled={balance < betAmount || betAmount <= 0 || (gameState === 'PLAYING' && cashedOutAt !== null)}
                                className={`w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}
                            >
                                <span className="relative z-10 flex gap-2 items-center justify-center">
                                    <Rocket size={20} /> {(gameState === 'PLAYING' && cashedOutAt !== null) ? 'ESCAPED' : 'FLY'}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative min-h-[48vh] md:min-h-0 p-2 sm:p-6 flex flex-col justify-center overflow-hidden shadow-inner`} style={{ backgroundColor: BACKGROUND_COLOR }}>
                    {BACKGROUND_IMAGE && (
                        <img src={BACKGROUND_IMAGE} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-slate-200 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>

                    <div className="absolute inset-0 bg-black/25 z-0"></div>
                    <div className="absolute inset-0 pointer-events-none z-0 bg-[size:50px_50px]" style={{ backgroundImage: `linear-gradient(${ACCENT_COLOR}22 1px,transparent 1px),linear-gradient(90deg,${ACCENT_COLOR}22 1px,transparent 1px)` }}></div>

                    {/* Central Multiplier Display */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="flex flex-col items-center">
                            <span className={`text-6xl sm:text-8xl md:text-9xl font-black transition-colors duration-200 ${(gameState === 'CRASHED' && cashedOutAt === null) ? 'text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]' : (cashedOutAt !== null) ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.5)]' : 'text-green-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.5)]'}`}>
                                {multiplier.toFixed(1)}x
                            </span>
                            {gameState === 'CRASHED' && (
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-500 font-bold uppercase tracking-[0.3em] mt-2 text-lg sm:text-xl"
                                >
                                    CRASHED @ {crashPoint.toFixed(1)}x
                                </motion.span>
                            )}
                            {cashedOutAt !== null && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-green-400 font-bold uppercase tracking-[0.3em] mt-2 text-lg sm:text-xl bg-green-950/50 px-4 py-1 rounded-full border border-green-500/30"
                                >
                                    Escaped @ {cashedOutAt.toFixed(1)}x
                                </motion.span>
                            )}
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={500}
                        className="w-full h-full object-contain opacity-100 relative z-0 mix-blend-screen"
                    />
                </div>
            </motion.div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="custom-crash-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-white">{gameData?.name}</p>
                                    <p className="truncate text-[10px] font-bold uppercase text-green-400">By {gameData?.creatorName}</p>
                                </div>
                                <FavoriteToggle gameName={gameData?.name || "Crash"} />
                            </div>
                            <div className="mb-4 space-y-2">
                                <label className="text-[10px] font-bold uppercase text-slate-500">Auto cashout</label>
                                <div className="relative">
                                    <Goal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                                    <input type="number" step="0.01" min="1.01" value={autoCashout} onChange={(e) => setAutoCashout(e.target.value)} disabled={gameState === "PLAYING"} placeholder="Off" className="w-full rounded-xl border border-white/10 bg-[#0a1114] py-3 pl-10 pr-8 font-mono text-base font-bold text-white outline-none focus:border-green-500 disabled:opacity-50" />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">×</span>
                                </div>
                            </div>
                            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#0a1114]/50 p-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Last win</span>
                                {lastWin ? (
                                    <span className="flex items-center gap-1 text-sm font-black text-green-400">
                                        +{lastWin.amount.toFixed(2)} {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}
                                    </span>
                                ) : (
                                    <span className="font-mono text-xs text-slate-600">—</span>
                                )}
                            </div>
                            <button type="button" onClick={() => setMobileMoreOpen(false)} className="w-full rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-white active:bg-white/10">
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
}
