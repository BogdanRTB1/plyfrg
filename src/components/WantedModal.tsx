"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Siren, Skull, Zap } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import confetti from "canvas-confetti";

export const WANTED_CONFIG = {
    theme: {
        background: "bg-[#0b0c10]",
        panelBg: "bg-[#14161a]",
        accent: "text-blue-500",
        buttonAccent: "bg-blue-600 hover:bg-blue-500",
        gameBg: "bg-[#050505]",
    },
    names: {
        title: "Wanted Runner"
    }
};

export default function WantedModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CRASHED' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [stars, setStars] = useState(1);
    const [obstacles, setObstacles] = useState<{ id: number, x: number, passed: boolean }[]>([]);
    const [nearMisses, setNearMisses] = useState<{ id: number, x: number, y: number }[]>([]);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const obsIdRef = useRef(0);
    const nearMissIdRef = useRef(0);

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('PLAYING');
        setMultiplier(1.00);
        setStars(1);
        setObstacles([]);
        setNearMisses([]);
        obsIdRef.current = 0;
        nearMissIdRef.current = 0;

        if (timerRef.current) clearInterval(timerRef.current);

        let currentMult = 1.00;
        let currentObs: { id: number, x: number, passed: boolean }[] = [];

        timerRef.current = setInterval(() => {
            currentMult += 0.005 + (currentMult * 0.002);

            const currentStars = Math.min(5, Math.floor(currentMult / 1.5) + 1);

            // Move obstacles (speed scales slightly with multiplier)
            const speed = 2 + (currentMult * 0.1);
            currentObs = currentObs.map(o => ({ ...o, x: o.x - speed })).filter(o => o.x > -20);

            // Spawn obstacles
            if (Math.random() < 0.04 + (currentStars * 0.01) && currentObs.every(o => o.x < 70)) {
                currentObs.push({ id: obsIdRef.current++, x: 100, passed: false });
            }

            // Check collisions (player is at roughly x = 20)
            let crashed = false;
            currentObs.forEach((o, index) => {
                if (!o.passed && o.x < 25) {
                    o.passed = true;
                    // Trip chance depends on game speed/stars
                    const tripChance = 0.15 + (currentStars * 0.05);
                    if (Math.random() < tripChance) {
                        crashed = true;
                    } else {
                        // Dodge! Near miss effect
                        setNearMisses(prev => [...prev.slice(-3), { id: nearMissIdRef.current++, x: 25, y: 50 + Math.random() * 20 }]);
                    }
                }
            });

            if (crashed) {
                if (timerRef.current) clearInterval(timerRef.current);
                setGameState('CRASHED');
            } else {
                setMultiplier(Number(currentMult.toFixed(2)));
                setStars(currentStars);
                setObstacles(currentObs);
            }
        }, 50);
    };

    const cashOut = () => {
        if (gameState !== 'PLAYING') return;
        if (timerRef.current) clearInterval(timerRef.current);

        setGameState('WON');
        const winAmount = betAmount * multiplier;
        setLastWin({ amount: winAmount, currency: currencyType, mult: multiplier });

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

    useEffect(() => {
        // Cleanup near misses automatically after a short delay
        if (nearMisses.length > 0) {
            const timer = setTimeout(() => {
                setNearMisses(prev => prev.filter(nm => nm.id !== nearMisses[0]?.id));
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [nearMisses]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${WANTED_CONFIG.theme.background} rounded-2xl w-full max-w-5xl border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]`}
            >
                {/* ADVANCED BETTING MENU */}
                <div className={`w-full md:w-80 ${WANTED_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-white/5 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Skull className={WANTED_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{WANTED_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={WANTED_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-[#050505] p-1 rounded-xl flex border border-white/5">
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
                                className="w-full bg-[#050505] border border-blue-500/20 focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a1f2e] hover:bg-[#252b3b] text-blue-200 hover:text-white text-xs font-bold py-2 rounded-lg border border-blue-500/20 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a1f2e] hover:bg-[#252b3b] text-blue-200 hover:text-white text-xs font-bold py-2 rounded-lg border border-blue-500/20 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className={`bg-[#1a1f2e] hover:bg-[#252b3b] ${WANTED_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-blue-500/30 transition-colors`}>MAX</button>
                        </div>
                    </div>

                    <div className="mt-2 bg-[#050505]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
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
                        {gameState === 'PLAYING' ? (
                            <button onClick={cashOut} className="w-full bg-green-500 hover:bg-green-400 text-black h-16 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(34,197,94,0.4)] relative overflow-hidden group">
                                <span className="relative z-10 flex flex-col items-center justify-center">
                                    <span className="text-base flex items-center gap-2"><Trophy size={18} /> CASHOUT</span>
                                    <span className="text-xs font-mono opacity-80 mt-[-2px]">Win {(betAmount * multiplier).toFixed(2)}</span>
                                </span>
                            </button>
                        ) : (
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0} className={`w-full ${WANTED_CONFIG.theme.buttonAccent} hover:brightness-110 text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                                <span className="relative z-10 flex gap-2 items-center justify-center">
                                    <Zap size={20} /> START RUN
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className={`flex-1 relative ${WANTED_CONFIG.theme.gameBg} overflow-hidden shadow-inner flex flex-col`}>

                    {/* Screenshake Container */}
                    <motion.div
                        animate={gameState === 'PLAYING' && stars >= 4 ? { x: [-2, 2, -2, 2, 0], y: [-1, 1, -2, 1, 0] } : {}}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "mirror" }}
                        className="absolute inset-0 z-0"
                    >
                        {/* Parallax Background */}
                        <div className="absolute inset-0 overflow-hidden flex z-0 opacity-60 pointer-events-none">
                            <motion.div
                                animate={gameState === 'PLAYING' ? { x: ["0%", "-50%"] } : {}}
                                transition={{ repeat: Infinity, ease: "linear", duration: 6 / (multiplier * 0.5 || 1) }}
                                className="flex w-[200%] h-full"
                            >
                                <div className="w-1/2 h-full bg-[url('/images/game-influencer-run.png')] bg-cover bg-bottom filter blur-[2px]"></div>
                                <div className="w-1/2 h-full bg-[url('/images/game-influencer-run.png')] bg-cover bg-bottom filter blur-[2px]"></div>
                            </motion.div>
                        </div>
                    </motion.div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-0"></div>

                    {/* Top HUD */}
                    <div className="relative z-20 flex justify-between items-start p-6 w-full">
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => (
                                <motion.div
                                    key={s}
                                    animate={stars >= s && gameState === 'PLAYING' ? { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] } : {}}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: s * 0.1 }}
                                >
                                    <svg className={`w-8 h-8 drop-shadow-lg ${stars >= s ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]' : 'text-slate-800/80'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <motion.div
                                animate={gameState === 'PLAYING' ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="bg-black/80 border-[3px] border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)] px-8 py-3 rounded-2xl"
                            >
                                <span className="text-5xl font-black text-white font-mono">{multiplier.toFixed(2)}x</span>
                            </motion.div>
                            {gameState === 'PLAYING' && (
                                <div className="text-blue-400 font-mono text-sm font-bold opacity-80 bg-black/50 px-3 py-1 rounded-full border border-blue-500/30">
                                    Dist: {Math.floor((multiplier - 1) * 1000)}m
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Near Miss Text Popups */}
                    <AnimatePresence>
                        {nearMisses.map(miss => (
                            <motion.div
                                key={miss.id}
                                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                animate={{ opacity: 1, y: -50, scale: 1.2 }}
                                exit={{ opacity: 0, y: -100 }}
                                transition={{ duration: 0.8 }}
                                className="absolute z-50 pointer-events-none font-black text-xl italic text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] tracking-wider"
                                style={{ bottom: `${miss.y}%`, left: `${miss.x + 5}%` }}
                            >
                                DODGED!
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Platform/Floor */}
                    <div className="absolute bottom-[10%] w-full h-[5%] bg-blue-900/30 border-t border-blue-500/20 z-0">
                        <motion.div
                            animate={gameState === 'PLAYING' ? { backgroundPositionX: ["0px", "-100px"] } : {}}
                            transition={{ repeat: Infinity, ease: "linear", duration: 0.5 }}
                            className="w-full h-full opacity-30"
                            style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)" }}
                        />
                    </div>

                    {/* Action Area (Bottom) */}
                    <div className="absolute bottom-[15%] w-full h-40 z-10 flex items-end px-4">

                        {/* Obstacles Layer */}
                        {obstacles.map(obs => (
                            <div key={obs.id} className="absolute bottom-0 text-6xl drop-shadow-2xl z-30 filter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]" style={{ left: `${obs.x}%` }}>
                                🚧
                            </div>
                        ))}

                        {/* Player Character */}
                        <div className="absolute bottom-2 left-[20%] z-40">
                            {gameState === 'CRASHED' ? (
                                <motion.div initial={{ rotate: 0, y: 0, x: 0 }} animate={{ rotate: 90, y: 20, x: 30 }} className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] border-red-500">
                                    🏃‍♂️
                                </motion.div>
                            ) : (
                                <motion.div
                                    animate={gameState === 'PLAYING' ? {
                                        y: nearMisses.length > 0 ? [-20, -60, -20] : [0, -20, 0],
                                        rotate: nearMisses.length > 0 ? [0, 15, 0] : 0
                                    } : {}}
                                    transition={{ repeat: Infinity, duration: nearMisses.length > 0 ? 0.5 : 0.4 }}
                                    className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)] filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]"
                                >
                                    🏃‍♂️
                                </motion.div>
                            )}
                        </div>

                        {/* Enemies (Behind player, based on stars) */}
                        <div className="absolute bottom-2 left-[2%] z-30">
                            {stars === 1 && (
                                <motion.div
                                    animate={gameState === 'PLAYING' || gameState === 'CRASHED' ? { x: gameState === 'CRASHED' ? 100 : [0, 5, 0], y: [0, -10, 0] } : {}}
                                    transition={{ repeat: gameState === 'CRASHED' ? 0 : Infinity, duration: 0.4 }}
                                    className="text-6xl drop-shadow-[0_0_15px_rgba(255,0,0,0.5)]"
                                >
                                    <span className="scale-x-[-1] inline-block">👮‍♂️</span>
                                </motion.div>
                            )}
                            {stars === 2 && (
                                <motion.div
                                    animate={gameState === 'PLAYING' || gameState === 'CRASHED' ? { x: gameState === 'CRASHED' ? 100 : [0, 5, 0], y: [0, -10, 0] } : {}}
                                    transition={{ repeat: gameState === 'CRASHED' ? 0 : Infinity, duration: 0.4 }}
                                    className="text-6xl drop-shadow-[0_0_15px_rgba(255,0,0,0.5)] flex"
                                >
                                    <span className="scale-x-[-1] inline-block">👮‍♂️</span>
                                    <span className="scale-x-[-1] inline-block -ml-4 mt-2">👮‍♀️</span>
                                </motion.div>
                            )}
                            {stars >= 3 && (
                                <motion.div
                                    animate={gameState === 'PLAYING' || gameState === 'CRASHED' ? { x: gameState === 'CRASHED' ? 120 : [0, 5, 0], y: [0, -2, 0] } : {}}
                                    transition={{ repeat: gameState === 'CRASHED' ? 0 : Infinity, duration: 0.2 }}
                                    className="text-[5rem] drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] relative"
                                >
                                    <span className="scale-x-[-1] inline-block">🚓</span>
                                    {/* Police Lights */}
                                    <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ repeat: Infinity, duration: 0.2 }} className="absolute top-2 left-6 w-5 h-5 bg-red-500 rounded-full blur-[4px] shadow-[0_0_20px_red]"></motion.div>
                                    <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.2 }} className="absolute top-2 right-8 w-5 h-5 bg-blue-500 rounded-full blur-[4px] shadow-[0_0_20px_blue]"></motion.div>
                                </motion.div>
                            )}
                        </div>

                        {/* Helicopter */}
                        {stars >= 4 && (
                            <motion.div
                                animate={gameState === 'PLAYING' || gameState === 'CRASHED' ? { x: gameState === 'CRASHED' ? 150 : [0, 30, -10, 0], y: [0, 15, -10, 0] } : {}}
                                transition={{ repeat: gameState === 'CRASHED' ? 0 : Infinity, duration: 2.5 }}
                                className="absolute bottom-[200px] left-[5%] z-50 text-[6rem] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                <span className="scale-x-[-1] inline-block relative">
                                    🚁
                                    {/* Spotlight beam */}
                                    <motion.div
                                        animate={{ rotate: [-15, 15, -15], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="absolute top-[80px] right-[-80px] w-[300px] h-[400px] origin-top pointer-events-none"
                                        style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, transparent 100%)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
                                    />
                                </span>
                            </motion.div>
                        )}

                        {/* SWAT Truck for 5 stars */}
                        {stars >= 5 && (
                            <motion.div
                                animate={gameState === 'PLAYING' || gameState === 'CRASHED' ? { x: gameState === 'CRASHED' ? 150 : [-20, 10, -20], y: [0, -2, 0] } : {}}
                                transition={{ repeat: gameState === 'CRASHED' ? 0 : Infinity, duration: 0.15 }}
                                className="absolute bottom-0 -left-10 z-20 text-[6rem] drop-shadow-[0_0_40px_rgba(255,0,0,0.8)]"
                            >
                                <span className="scale-x-[-1] inline-block filter hue-rotate-180 brightness-50 contrast-125">🚐</span>
                                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 0.1 }} className="absolute -top-2 left-10 w-8 h-8 bg-red-600 rounded-full blur-[6px] shadow-[0_0_30px_red]"></motion.div>
                            </motion.div>
                        )}
                    </div>

                    {/* Result overlay */}
                    <AnimatePresence>
                        {gameState === 'CRASHED' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-[60] bg-red-950/80 backdrop-blur-md pointer-events-none"
                            >
                                <div className="text-center drop-shadow-[0_0_50px_rgba(239,68,68,0.8)] border-4 border-red-500/50 p-12 rounded-[3rem] bg-black/60 shadow-[inset_0_0_100px_rgba(239,68,68,0.3)]">
                                    <Skull className="w-32 h-32 text-red-500 mx-auto mb-6 animate-pulse" />
                                    <h1 className="text-6xl font-black text-white uppercase tracking-[0.4em] font-mono mb-4 text-shadow-xl text-red-500" style={{ textShadow: '0 0 20px rgba(255,0,0,1)' }}>BUSTED!</h1>
                                    <p className="text-red-400 font-bold text-2xl tracking-widest bg-red-950/50 px-6 py-2 rounded-full inline-block border border-red-500/30">Loss: {betAmount.toFixed(2)} {currencyType}</p>
                                </div>
                            </motion.div>
                        )}
                        {gameState === 'WON' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-[60] bg-green-950/80 backdrop-blur-md pointer-events-none"
                            >
                                <div className="text-center drop-shadow-[0_0_50px_rgba(34,197,94,0.8)] bg-black/80 p-10 rounded-[3rem] border-4 border-green-500 shadow-[inset_0_0_100px_rgba(34,197,94,0.3)]">
                                    <h1 className="text-6xl font-black text-green-400 uppercase tracking-[0.2em] font-mono mb-6" style={{ textShadow: '0 0 20px rgba(0,255,0,0.8)' }}>ESCAPED!</h1>
                                    <div className="bg-green-500/10 px-8 py-4 rounded-3xl border border-green-500/30 inline-block">
                                        <p className="text-white font-black text-5xl mb-2 drop-shadow-lg">{multiplier.toFixed(2)}x</p>
                                        <p className="text-green-300 font-bold text-2xl">+{lastWin?.amount.toFixed(2)} {currencyType}</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
