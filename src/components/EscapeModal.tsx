"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Skull, Zap, ShieldAlert, Trophy } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import confetti from "canvas-confetti";

const ESCAPE_CONFIG = {
    names: { title: "Escape" },
    theme: { accent: "text-[#00b9f0]" }
};

export default function EscapeModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CAUGHT' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [runnerAngle, setRunnerAngle] = useState(0);
    const [copProximity, setCopProximity] = useState(0);

    const crashPointRef = useRef(1.00);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startGame = () => {
        if (balance < betAmount) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('PLAYING');
        setMultiplier(1.00);
        setCopProximity(0);
        setRunnerAngle(0);

        const e = 2 ** (Math.random() * 5);
        crashPointRef.current = Math.max(1.00, e * 0.95);

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setMultiplier(prev => {
                const step = prev < 2 ? 0.02 : prev < 5 ? 0.05 : 0.15;
                const next = prev + step;

                setRunnerAngle(a => a + 5);

                if (next >= crashPointRef.current) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setGameState('CAUGHT');
                    setCopProximity(100);
                    return crashPointRef.current;
                }

                const distanceRatio = next / crashPointRef.current;
                setCopProximity(c => c + (100 * distanceRatio * 0.02));

                return next;
            });
        }, 80);
    };

    const cashOut = () => {
        if (gameState !== 'PLAYING') return;
        if (timerRef.current) clearInterval(timerRef.current);

        setGameState('WON');
        const winAmount = betAmount * multiplier;
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

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
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('IDLE');
        }
    }, [isOpen]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0f212e] rounded-2xl w-full max-w-4xl border border-[#00b9f0]/20 shadow-[0_0_50px_rgba(0,185,240,0.1)] overflow-hidden flex flex-col md:flex-row h-[600px] shadow-2xl"
            >
                {/* ADVANCED BETTING MENU */}
                <div className="w-full md:w-80 bg-[#121c22] p-6 flex flex-col gap-4 border-r border-white/5 relative z-20">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Skull className={ESCAPE_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{ESCAPE_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={ESCAPE_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    {/* Cyber Currency Toggle */}
                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
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
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className="w-full bg-gradient-to-r from-[#00b9f0] to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white h-16 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(0,185,240,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2"><Zap size={20} className="text-yellow-300" /> Start Evasion</span>
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                            </button>
                        ) : (
                            <button onClick={cashOut} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white h-16 rounded-xl font-black text-2xl uppercase shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse hover:scale-[1.02] transition-transform flex flex-col items-center justify-center">
                                <span>ESCAPE</span>
                                <span className="text-xs text-green-200 mt-[-4px]">Win {(betAmount * multiplier).toFixed(2)}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className="flex-1 relative bg-[#06090c] flex flex-col items-center justify-center overflow-hidden">
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
                            {gameState === 'PLAYING' && <p className="text-[#00b9f0] font-mono animate-pulse font-bold tracking-[0.2em]">EVADING PATROLS...</p>}
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
        </div>,
        document.body
    );
}
