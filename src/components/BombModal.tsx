"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scissors, Trophy, Bomb, ShieldAlert } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import confetti from "canvas-confetti";

const BOMB_CONFIG = {
    names: { title: "Defuse" },
    theme: { accent: "text-red-500" }
};

export default function BombModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'EXPLODED' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [timeLeft, setTimeLeft] = useState(10.0);
    const [wires, setWires] = useState<{ id: number, color: string, colorHex: string, cut: boolean, bad: boolean }[]>([]);
    const [shake, setShake] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        setTimeLeft(10.0);
        setShake(false);

        const newWires = [
            { id: 0, color: 'bg-red-500', colorHex: '#ef4444', cut: false, bad: false },
            { id: 1, color: 'bg-blue-500', colorHex: '#3b82f6', cut: false, bad: false },
            { id: 2, color: 'bg-green-500', colorHex: '#22c55e', cut: false, bad: false },
            { id: 3, color: 'bg-yellow-500', colorHex: '#eab308', cut: false, bad: false }
        ];
        newWires[Math.floor(Math.random() * 4)].bad = true;
        setWires(newWires);

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0.1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setGameState('EXPLODED');
                    setShake(true);
                    return 0;
                }
                return prev - 0.1;
            });
            setMultiplier(prev => prev + 0.05);
        }, 100);
    };

    const cutWire = (index: number) => {
        if (gameState !== 'PLAYING') return;

        const wire = wires[index];
        if (wire.cut) return;

        const newWires = [...wires];
        newWires[index].cut = true;
        setWires(newWires);

        if (wire.bad) {
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('EXPLODED');
            setShake(true);
        } else {
            setMultiplier(prev => prev * 1.5);
            if (newWires.filter(w => !w.bad && w.cut).length === 3) {
                cashOut();
            }
        }
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

        setSessionPayout(prev => prev + winAmount);

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
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: "Defuse", 
                        gameImage: "/images/game-bomb-v2.png", 
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0f212e] rounded-2xl w-full max-w-4xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] overflow-hidden flex flex-col md:flex-row h-[600px]"
            >
                {/* ADVANCED BETTING MENU */}
                <div className="w-full md:w-80 bg-[#121c22] p-6 flex flex-col gap-4 border-r border-white/5 z-20">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <ShieldAlert className={BOMB_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{BOMB_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={BOMB_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

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
                                className="w-full bg-[#0a1114] border border-red-500/30 focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.2)] rounded-xl py-4 pl-10 pr-4 text-white font-mono text-xl font-bold transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount + 10)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">+10</button>
                            <button onClick={() => handleBetChange(betAmount + 50)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">+50</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-red-500 text-xs font-black py-2.5 rounded-lg border border-red-500/30 transition-colors">MAX</button>
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
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white h-16 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2"><Bomb size={20} /> ARM BOMB</span>
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                            </button>
                        ) : (
                            <button onClick={cashOut} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white h-16 rounded-xl font-black text-2xl uppercase shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse hover:scale-[1.02] transition-transform flex flex-col items-center justify-center">
                                <span>DEFUSE</span>
                                <span className="text-xs text-green-200 mt-[-4px]">Take {(betAmount * multiplier).toFixed(2)}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 relative bg-[#06090c] p-4 flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('/images/game-bomb-v2.png')] bg-cover bg-center"></div>

                    {shake && <div className="absolute inset-0 bg-red-600 mix-blend-color z-0"></div>}

                    <motion.div
                        animate={shake ? { x: [-15, 15, -15, 15, -10, 10, -5, 5, 0], y: [-5, 5, -5, 5, -2, 2, 0] } : {}}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 flex flex-col items-center bg-zinc-900/90 p-8 sm:p-10 rounded-[3rem] border-[8px] border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-sm sm:max-w-md"
                    >
                        <div className={`w-full bg-red-950/80 border-4 ${gameState === 'EXPLODED' ? 'border-red-600 shadow-[0_0_30px_#dc2626]' : 'border-red-900/50'} px-8 py-6 rounded-2xl mb-12 font-mono text-center relative overflow-hidden`}>
                            <h3 className={`text-5xl sm:text-6xl font-black tracking-widest ${gameState === 'EXPLODED' ? 'text-red-500 animate-pulse' : 'text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]'}`}>
                                {timeLeft.toFixed(1)}s
                            </h3>
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.2)_2px,rgba(0,0,0,0.2)_4px)] pointer-events-none"></div>
                        </div>

                        <div className="absolute -top-6 bg-zinc-800 border-4 border-zinc-900 px-6 py-2 rounded-xl shadow-lg">
                            <h3 className={`text-3xl font-black ${gameState === 'EXPLODED' ? 'text-red-500' : gameState === 'WON' ? 'text-green-500' : 'text-white'}`}>
                                {multiplier.toFixed(2)}x
                            </h3>
                        </div>

                        <div className="w-full space-y-4">
                            {wires.map((wire, idx) => (
                                <div key={idx} className="relative w-full h-12 flex items-center justify-center gap-4 group">
                                    <div className="w-4 h-4 rounded-full bg-zinc-700 border-2 border-zinc-500"></div>
                                    <button
                                        onClick={() => cutWire(idx)}
                                        disabled={wire.cut || gameState !== 'PLAYING'}
                                        className={`w-full h-4 rounded-full transition-all flex items-center justify-center relative ${wire.color} ${wire.cut ? 'opacity-20 translate-y-2 !h-2' : "hover:brightness-125 hover:h-6 cursor-pointer shadow-[0_5px_15px_rgba(0,0,0,0.5)]"}`}
                                    >
                                        {!wire.cut && gameState === 'PLAYING' && (
                                            <div className="absolute opacity-0 group-hover:opacity-100 bg-white/20 px-2 py-1 rounded backdrop-blur border border-white/50 text-white flex items-center gap-1 shadow-2xl scale-110 transition-all">
                                                <Scissors size={14} /> Cut
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 top-1/2 h-px bg-white/20 transform -translate-y-1/2"></div>
                                    </button>
                                    <div className="w-4 h-4 rounded-full bg-zinc-700 border-2 border-zinc-500"></div>
                                </div>
                            ))}
                        </div>

                        {gameState === 'EXPLODED' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 rounded-[2.5rem] backdrop-blur z-20">
                                <span className="text-red-500 text-5xl font-black tracking-widest drop-shadow-[0_0_20px_#ef4444] rotate-[-5deg] border-4 border-red-500 p-4">BOOM!</span>
                            </div>
                        )}
                        {gameState === 'WON' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-950/80 rounded-[2.5rem] backdrop-blur z-20">
                                <span className="text-green-400 text-4xl pr-2 text-center font-black tracking-widest drop-shadow-[0_0_20px_#4ade80] border-4 border-green-500 p-4">DEFUSED</span>
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
