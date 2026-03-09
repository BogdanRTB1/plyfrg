"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageCircle, Share2, Flame, Trophy, Smartphone } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";

const EVENTS = [
    { text: "Viral dance video!", mult: 1.5, type: 'good' },
    { text: "Signed brand deal!", mult: 1.3, type: 'good' },
    { text: "MrBeast commented!", mult: 2.0, type: 'good' },
    { text: "Trending #1!", mult: 1.2, type: 'good' },
    { text: "Exposed drama...", mult: 0.5, type: 'bad' },
    { text: "Canceled on Twitter!", mult: 0.3, type: 'bad' },
    { text: "Shadowbanned...", mult: 0.7, type: 'bad' },
    { text: "Fake apology video...", mult: 0.1, type: 'bad' }
];

export default function InfluencerModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'BANNED' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [followers, setFollowers] = useState(1024);
    const [eventText, setEventText] = useState("Tap to start career...");
    const [floatingLikes, setFloatingLikes] = useState<{ id: number, type: 'heart' | 'fire' }[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const likeIdRef = useRef(0);

    const startGame = () => {
        if (balance < betAmount) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('PLAYING');
        setMultiplier(1.00);
        setFollowers(1024);
        setEventText("Gaining initial fans...");
        setFloatingLikes([]);

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            if (Math.random() > 0.4) {
                const randomEvent = EVENTS[Math.floor(Math.random() * EVENTS.length)];
                setEventText(randomEvent.text);

                setMultiplier(prev => {
                    const next = prev * randomEvent.mult;
                    if (next < 0.2) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        setGameState('BANNED');
                        setEventText("ACCOUNT BANNED");
                        return 0;
                    }
                    return next;
                });
            } else {
                setMultiplier(prev => prev + 0.1);
                setEventText("Steady growth...");
            }

            setFloatingLikes(prev => {
                const newLikes = [...prev, { id: likeIdRef.current++, type: (Math.random() > 0.5 ? 'heart' : 'fire') as 'heart' | 'fire' }];
                return newLikes.slice(-8);
            });

        }, 1500);
    };

    useEffect(() => {
        if (gameState !== 'PLAYING') return;
        const tick = setInterval(() => {
            setFollowers(f => f + Math.floor(multiplier * 15 * Math.random()));
        }, 100);
        return () => clearInterval(tick);
    }, [gameState, multiplier]);

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

        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
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
                className="bg-[#0f212e] rounded-2xl w-full max-w-4xl border border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.1)] overflow-hidden flex flex-col md:flex-row h-[600px]"
            >
                {/* ADVANCED BETTING MENU */}
                <div className="w-full md:w-80 bg-[#121c22] p-6 flex flex-col gap-4 border-r border-white/5 z-20">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Smartphone className="text-purple-500" />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">Viral</h2>
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}><DiamondIcon className="w-4 h-4" /> Diamonds</button>
                        <button onClick={() => setCurrencyType('FC')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}><ForgesCoinIcon className="w-4 h-4" /> Coins</button>
                    </div>

                    <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Invest Amount</label>
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
                                className="w-full bg-[#0a1114] border border-purple-500/30 focus:border-purple-500 focus:shadow-[0_0_10px_rgba(168,85,247,0.2)] rounded-xl py-4 pl-10 pr-4 text-white font-mono text-xl font-bold transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount + 10)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">+10</button>
                            <button onClick={() => handleBetChange(betAmount + 50)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">+50</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-purple-500 text-xs font-black py-2.5 rounded-lg border border-purple-500/30 transition-colors">MAX</button>
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
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white h-16 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2"><Flame size={20} /> POST CONTENT</span>
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                            </button>
                        ) : (
                            <button onClick={cashOut} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white h-16 rounded-xl font-black text-2xl uppercase shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse hover:scale-[1.02] transition-transform flex flex-col items-center justify-center">
                                <span>SELL OUT</span>
                                <span className="text-xs text-green-200 mt-[-4px]">Take {(betAmount * multiplier).toFixed(2)}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 relative bg-[#06090c] flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('/images/game-influencer-v2.png')] bg-cover bg-center"></div>

                    <div className="relative z-10 w-[280px] h-[520px] bg-zinc-900 border-[8px] border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                        <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-purple-900/60 to-transparent flex flex-col pt-8 px-6 backdrop-blur-[2px]">

                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full border-2 border-purple-500 bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5">
                                    <div className="w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold">@YOU</div>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white flex items-center gap-1">
                                        Lil Player <span className="bg-blue-500 rounded-full w-3 h-3 inline-block flex items-center justify-center text-[8px] text-white">✓</span>
                                    </p>
                                    <p className="text-xs text-zinc-300">Live Streaming</p>
                                </div>
                            </div>

                            <div className="mt-6 flex gap-4 text-white text-center ml-2">
                                <div><p className="font-black text-lg">{(followers / 1000).toFixed(1)}K</p><p className="text-[10px] text-zinc-400 uppercase font-bold">Followers</p></div>
                                <div><p className="font-black text-lg">{(followers * 2.5 / 1000).toFixed(1)}K</p><p className="text-[10px] text-zinc-400 uppercase font-bold">Likes</p></div>
                            </div>

                        </div>

                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <motion.div
                                animate={gameState === 'PLAYING' ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10"
                            >
                                <h3 className={`text-5xl font-black ${gameState === 'BANNED' ? 'text-red-500' : gameState === 'WON' ? 'text-green-400' : 'text-white'}`}>
                                    {multiplier.toFixed(2)}x
                                </h3>
                            </motion.div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex flex-col justify-end">
                            <AnimatePresence>
                                <motion.div
                                    key={eventText}
                                    initial={{ opacity: 0, x: -20, y: 10 }}
                                    animate={{ opacity: 1, x: 0, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-zinc-800/80 backdrop-blur px-3 py-2 rounded-xl border border-white/5 mb-2 w-[90%] shadow-lg"
                                >
                                    <p className={`text-sm font-medium ${gameState === 'BANNED' || eventText.includes('apology') || eventText.includes('Exposed') ? 'text-red-400' : 'text-white'}`}>
                                        <span className="font-bold text-zinc-400 mr-2">System:</span>
                                        {eventText}
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            <div className="flex justify-between items-center mt-2 px-2 text-white">
                                <div className="bg-zinc-800/80 p-2 rounded-full border border-white/10"><Heart size={18} className="text-pink-500" fill="currentColor" /></div>
                                <div className="bg-zinc-800/80 p-2 rounded-full border border-white/10"><MessageCircle size={18} /></div>
                                <div className="bg-zinc-800/80 p-2 rounded-full border border-white/10"><Share2 size={18} /></div>
                            </div>
                        </div>

                        {gameState === 'PLAYING' && floatingLikes.map(like => (
                            <motion.div
                                key={like.id}
                                initial={{ opacity: 0, y: 50, x: Math.random() * 40 - 20 }}
                                animate={{ opacity: [0, 1, 0], y: -300, x: (Math.random() * 100 - 50) }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="absolute bottom-20 right-8 z-20 pointer-events-none"
                            >
                                {like.type === 'heart' ?
                                    <Heart size={32} className="text-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]" fill="currentColor" /> :
                                    <Flame size={32} className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" fill="currentColor" />
                                }
                            </motion.div>
                        ))}

                        {gameState === 'BANNED' && (
                            <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
                                <div className="text-center font-black drop-shadow-[0_0_10px_black] rotate-[-15deg]">
                                    <h2 className="text-red-500 text-4xl uppercase tracking-widest border-4 border-red-500 p-2">BANNED</h2>
                                </div>
                            </div>
                        )}
                        {gameState === 'WON' && (
                            <div className="absolute inset-0 bg-green-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
                                <div className="text-center font-black drop-shadow-[0_0_10px_black] rotate-[-5deg] bg-green-500/20 px-8 py-4 rounded-full border border-green-500/50">
                                    <h2 className="text-green-400 text-3xl tracking-widest">+{(multiplier * betAmount).toFixed(1)}</h2>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </motion.div>
        </div>,
        document.body
    );
}
