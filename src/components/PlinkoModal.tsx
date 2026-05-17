"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useBoardFitScale } from "@/hooks/useBoardFitScale";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, RotateCw, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { fireWinConfetti } from "@/utils/winConfetti";
import { playGameSound, resumeOriginalGameAudio } from "@/utils/originalGameSounds";
import { ORIGINALS_PAYOUT, pickPlinkoBucketIndex } from "@/utils/originalsMath";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";

// INFLUENCER/ADMIN CUSTOMIZATION CONFIG
export const PLINKO_CONFIG = {
    theme: {
        background: "bg-[#0f212e]",
        panelBg: "bg-[#121c22]",
        accent: "text-purple-500",
        buttonAccent: "bg-purple-600 hover:bg-purple-500",
        gameBg: "bg-[#0a1114]", // very dark background for the board
        pinColor: "bg-white",
        pinGlow: "shadow-[0_0_5px_rgba(255,255,255,0.8)]",
        ballColor: "bg-purple-500",
        ballGlow: "shadow-[0_0_10px_#a855f7]"
    },
    names: {
        title: "Plinko"
    },
    physics: {
        rows: 16,
        pinSize: 4,
        ballSize: 8,
        width: 600,
        height: 400
    },
    multipliers: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110]
};

interface PlinkoModalProps {
    isOpen: boolean;
    onClose: () => void;
    diamonds: number;
    setDiamonds: React.Dispatch<React.SetStateAction<number>>;
    forgesCoins: number;
    setForgesCoins: React.Dispatch<React.SetStateAction<number>>;
}

export default function PlinkoModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: PlinkoModalProps) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;

    // Default bet amounts based on currency type
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);
    const [history, setHistory] = useState<number[]>([]);
    
    // Session tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

    const [dropping, setDropping] = useState(false);
    const [pins, setPins] = useState<{ x: number; y: number }[]>([]);
    const [ballPath, setBallPath] = useState<{ x: number; y: number }[]>([]);

    // Refs for cleanup
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Game constants from config
    const ROWS = PLINKO_CONFIG.physics.rows;
    const PIN_SIZE = PLINKO_CONFIG.physics.pinSize;
    const BALL_SIZE = PLINKO_CONFIG.physics.ballSize;
    const WIDTH = PLINKO_CONFIG.physics.width;
    const HEIGHT = PLINKO_CONFIG.physics.height;
    const MULTIPLIERS = PLINKO_CONFIG.multipliers;

    const { hostRef: plinkoHostRef, scale: plinkoBoardScale } = useBoardFitScale(!!isOpen, WIDTH, HEIGHT, 16);

    useEffect(() => {
        // Generate pins
        const newPins = [];
        const spacingX = WIDTH / (ROWS + 2);
        const spacingY = HEIGHT / (ROWS + 2);

        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col <= row; col++) {
                const x = WIDTH / 2 + (col - row / 2) * spacingX;
                const y = spacingY * (row + 1);
                newPins.push({ x, y });
            }
        }
        setPins(newPins);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const dropBall = useCallback(() => {
        if (dropping || balance < betAmount) return;

        if (currencyType === 'GC') {
            setDiamonds(prev => prev - betAmount);
        } else {
            setForgesCoins(prev => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);
        playGameSound('plinko', 'bet');

        setDropping(true);
        setBallPath([]); // Clear previous path immediately

        // Calculate path
        let currentX = WIDTH / 2;
        let currentY = 20;
        const spacingX = WIDTH / (ROWS + 2);
        const spacingY = HEIGHT / (ROWS + 2);
        const path = [{ x: currentX, y: currentY }];
        let bucketIndex = 0;

        for (let i = 0; i < ROWS; i++) {
            const direction = Math.random() > 0.5 ? 1 : -1;
            bucketIndex += direction === 1 ? 1 : 0;
            currentX += (direction * spacingX) / 2;
            currentY += spacingY;
            // Add some randomness/bounce to path
            path.push({
                x: currentX + (Math.random() - 0.5) * 5,
                y: currentY
            });
        }

        // Animate ball
        let step = 0;

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            if (step >= path.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                intervalRef.current = null;

                // Ensure path has data before accessing logic
                if (path.length > 0) {
                    const randomBucketForDemo = pickPlinkoBucketIndex();
                    const multiplier = MULTIPLIERS[randomBucketForDemo];

                    const winAmount = betAmount * multiplier * ORIGINALS_PAYOUT.plinko;
                    setLastWin({ amount: winAmount, currency: currencyType });

                    if (currencyType === 'GC') {
                        setDiamonds(prev => prev + winAmount);
                    } else {
                        setForgesCoins(prev => prev + winAmount);
                    }

                    setSessionPayout(prev => prev + winAmount);

                    setHistory(prev => [multiplier, ...prev].slice(0, 5));

                    if (multiplier >= 1) playGameSound('plinko', 'win');
                    if (multiplier >= 10) {
                        fireWinConfetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                    }
                }

                setDropping(false);
                setBallPath([]);
            } else {
                const nextPoint = path[step];
                if (nextPoint) {
                    setBallPath(prev => [...prev, nextPoint]);
                }
                step++;
            }
        }, 50);
    }, [dropping, balance, betAmount, ROWS, WIDTH, HEIGHT, MULTIPLIERS, currencyType, setDiamonds, setForgesCoins]);

    // Handle bet change (similar to other modals)
    const handleBetChange = (amount: number) => {
        if (dropping) return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    // Handle closing via parent prop, ensure cleanup and session saving
    
    useEffect(() => {
        if (isOpen) resumeOriginalGameAudio();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setMobileMoreOpen(false);
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                // Record session for consolidated history
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Plinko", 
                        gameImage: "/images/game-plinko.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                
                // Reset session
                setSessionWagered(0);
                setSessionPayout(0);
            }

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setDropping(false);
            setBallPath([]);
        }
    }, [isOpen, sessionWagered, sessionPayout]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    // Safe ball position access
    const lastBallPos = ballPath.length > 0 ? ballPath[ballPath.length - 1] : null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden bg-black md:bg-black/80 backdrop-blur-none md:backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${PLINKO_CONFIG.theme.background} rounded-none md:rounded-2xl w-full max-w-5xl border border-white/10 shadow-2xl overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[700px] md:max-h-[90vh] min-h-0`}
            >
                <MobileGameHudBar
                    className={PLINKO_CONFIG.theme.panelBg}
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={dropping}
                            quickBtnClassName="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] px-2 py-2 text-[11px] font-black text-slate-200 active:scale-95 disabled:opacity-40 min-h-[40px] min-w-[34px]"
                            inputClassName="min-h-[40px] min-w-[3rem] flex-1 basis-0 max-w-[6.75rem] rounded-lg border border-white/10 bg-[#0a1114] px-1 py-1 text-center text-[11px] font-mono font-bold text-white outline-none focus:border-purple-400/40 disabled:opacity-40"
                        />
                    }
                    center={
                        <button
                            type="button"
                            onClick={dropBall}
                            disabled={dropping || balance < betAmount || betAmount <= 0}
                            className={`flex h-[68px] w-[68px] items-center justify-center rounded-full ${PLINKO_CONFIG.theme.buttonAccent} text-white shadow-[0_0_22px_rgba(168,85,247,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45`}
                            aria-label="Drop ball"
                        >
                            {dropping ? <RotateCw className="h-6 w-6 animate-spin" /> : <Play className="h-6 w-6 fill-current" />}
                        </button>
                    }
                    right={
                        <>
                            <button type="button" disabled={dropping} onClick={() => handleBetChange(balance)} className={`shrink-0 rounded-lg border border-purple-500/30 bg-[#1a2c38] px-2.5 py-2.5 text-[11px] font-black ${PLINKO_CONFIG.theme.accent} active:scale-95 disabled:opacity-40`}>MAX</button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={dropping}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                                className="h-10 w-10 rounded-lg"
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] p-2 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-4 w-4" /></button>
                        </>
                    }
                />

                {/* ADVANCED BETTING MENU — desktop */}
                <div className={`hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain ${PLINKO_CONFIG.theme.panelBg} flex-col gap-2 border-r border-white/5 p-3 md:p-6 md:gap-4 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Play className={PLINKO_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{PLINKO_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={PLINKO_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={dropping} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> GC</button>
                        <button onClick={() => setCurrencyType('FC')} disabled={dropping} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> FC</button>
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
                                disabled={dropping}
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-purple-500 focus:shadow-[0_0_10px_rgba(168,85,247,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={dropping} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={dropping} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={dropping} className={`bg-[#1a2c38] hover:bg-[#2f4553] ${PLINKO_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-purple-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#0a1114]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
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

                    <button
                        onClick={dropBall}
                        disabled={dropping || balance < betAmount || betAmount <= 0}
                        className={`w-full mt-auto text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(168,85,247,0.3)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group ${PLINKO_CONFIG.theme.buttonAccent}`}
                    >
                        <span className="relative z-10 flex gap-2 items-center justify-center">
                            {dropping ? <RotateCw className="animate-spin" /> : 'PLAY'}
                        </span>
                    </button>
                </div>

                {/* Game Board */}
                <div className={`flex-1 relative min-h-[48vh] md:min-h-0 ${PLINKO_CONFIG.theme.gameBg} p-4 overflow-hidden flex flex-col shadow-inner`}>
                    <button type="button" onClick={onClose} className="absolute right-2 top-2 z-[80] flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-300 backdrop-blur-sm md:hidden active:bg-white/10" aria-label="Close game">
                        <X className="h-5 w-5" />
                    </button>
                    <div className="hidden md:flex justify-between items-center mb-4">
                        <div className="flex gap-2">
                            {history.map((mult, i) => (
                                <div key={i} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border-b-2 ${mult >= 10 ? 'bg-amber-500 text-[#0f212e] border-amber-700' :
                                    mult >= 2 ? 'bg-purple-500 text-white border-purple-700' :
                                        mult < 1 ? 'bg-slate-700 text-slate-400 border-slate-900' :
                                            'bg-white text-[#0f212e] border-slate-300'
                                    }`}>
                                    {mult}x
                                </div>
                            ))}
                        </div>

                    </div>

                    <div ref={plinkoHostRef} className="flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden px-1">
                        <div
                            className="relative shrink-0"
                            style={{ width: WIDTH * plinkoBoardScale, height: HEIGHT * plinkoBoardScale }}
                        >
                            <div
                                className="absolute left-0 top-0"
                                style={{
                                    width: WIDTH,
                                    height: HEIGHT,
                                    transform: `scale(${plinkoBoardScale})`,
                                    transformOrigin: "top left",
                                }}
                            >
                            {/* Pins */}
                            {pins.map((pin, i) => (
                                <div
                                    key={i}
                                    className={`absolute rounded-full ${PLINKO_CONFIG.theme.pinColor} ${PLINKO_CONFIG.theme.pinGlow}`}
                                    style={{
                                        left: pin.x,
                                        top: pin.y,
                                        width: PIN_SIZE,
                                        height: PIN_SIZE,
                                    }}
                                />
                            ))}

                            {/* Multipliers */}
                            <div className="absolute bottom-0 flex justify-center gap-1 w-full px-8">
                                {MULTIPLIERS.map((mult, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-8 rounded text-[10px] font-bold flex items-center justify-center text-[#0f212e] shadow-lg ${mult >= 10 ? 'bg-gradient-to-t from-amber-600 to-amber-400' :
                                            mult >= 3 ? 'bg-gradient-to-t from-purple-600 to-purple-400 text-white' :
                                                mult < 1 ? 'bg-gradient-to-t from-slate-600 to-slate-400' :
                                                    'bg-gradient-to-t from-slate-200 to-white'
                                            }`}
                                    >
                                        {mult}x
                                    </div>
                                ))}
                            </div>

                            {/* Ball */}
                            {lastBallPos && (
                                <motion.div
                                    className={`absolute ${PLINKO_CONFIG.theme.ballColor} rounded-full ${PLINKO_CONFIG.theme.ballGlow} z-10`}
                                    style={{
                                        width: BALL_SIZE * 2,
                                        height: BALL_SIZE * 2,
                                    }}
                                    animate={{
                                        left: lastBallPos.x - BALL_SIZE,
                                        top: lastBallPos.y - BALL_SIZE
                                    }}
                                    transition={{ duration: 0.05, ease: "linear" }}
                                />
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div key="plinko-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden">
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Plinko</span>
                                <FavoriteToggle gameName={PLINKO_CONFIG.names.title} />
                            </div>
                            <p className="mb-2 text-[10px] font-bold uppercase text-slate-500">Balance</p>
                            <p className="mb-4 font-mono text-lg font-bold text-white">{balance.toFixed(2)} {currencyType}</p>
                            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                                {history.slice(-12).map((mult, i) => (
                                    <div key={i} className={`shrink-0 rounded-lg px-2 py-1 text-xs font-bold ${mult >= 10 ? "bg-amber-500 text-[#0f212e]" : mult >= 2 ? "bg-purple-500 text-white" : mult < 1 ? "bg-slate-700 text-slate-400" : "bg-white text-[#0f212e]"}`}>{mult}x</div>
                                ))}
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
