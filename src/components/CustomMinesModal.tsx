"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Bomb, Gem, Target } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import FavoriteToggle from "./FavoriteToggle";
import type { MinesConfig, MinesGridSize } from "@/types/minesConfig";
import { DEFAULT_MINES_CONFIG, GRID_SIZE_PRESETS as MINES_GRID_PRESETS } from "@/types/minesConfig";

// ─── Progressive Suspense Audio Engine ──────────────────────────────────────
const playSuspenseTone = (revealedCount: number) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        // Frequency rises with each reveal: 300Hz → 1200Hz
        const baseFreq = 300 + revealedCount * 60;
        const duration = Math.max(0.06, 0.15 - revealedCount * 0.005);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.3, ctx.currentTime + duration);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration + 0.02);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration + 0.05);
    } catch (e) {}
};

// ─── Loss Sound Synthesizer ─────────────────────────────────────────────────
const playLossSound = (type: string) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        if (type === 'sad_trombone') {
            // "Wah wah wah wahhh" — descending notes
            const notes = [350, 330, 310, 233];
            const durations = [0.3, 0.3, 0.3, 0.8];
            let time = ctx.currentTime;
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, time);
                if (i === notes.length - 1) {
                    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + durations[i]);
                }
                gain.gain.setValueAtTime(0.08, time);
                gain.gain.linearRampToValueAtTime(0.06, time + durations[i] * 0.8);
                gain.gain.linearRampToValueAtTime(0, time + durations[i]);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(time);
                osc.stop(time + durations[i] + 0.05);
                time += durations[i];
            });
        } else if (type === 'piano') {
            // Sad piano — minor descent
            const notes = [440, 415, 370, 330, 262];
            let time = ctx.currentTime;
            notes.forEach((freq) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);
                gain.gain.setValueAtTime(0.12, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(time);
                osc.stop(time + 0.55);
                time += 0.25;
            });
        }
    } catch (e) {}
};

export default function CustomMinesModal({ isOpen, onClose, gameData, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [mineCount, setMineCount] = useState(3);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC' } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'EXPLODED' | 'WON'>('IDLE');
    const [multiplier, setMultiplier] = useState(1.00);
    const [nextMultiplier, setNextMultiplier] = useState(1.00);
    const [showBustOverlay, setShowBustOverlay] = useState(false);
    const [shakeScreen, setShakeScreen] = useState(false);

    // Read config from gameData
    const config: MinesConfig = gameData?.minesConfig || DEFAULT_MINES_CONFIG;
    const gridPreset = MINES_GRID_PRESETS[config.gridSize || '5x5'];
    const totalCells = gridPreset.total;
    const gridCols = gridPreset.cols;

    const MINE_IMAGE = config.mineImage || gameData?.config?.mineImage;
    const GEM_IMAGE = config.gemImage || gameData?.config?.gemImage;

    // Grid: true = mine, false = safe
    const [grid, setGrid] = useState<{ isMine: boolean, revealed: boolean }[]>([]);
    // Track flip states for 3D animation
    const [flippingCells, setFlippingCells] = useState<Set<number>>(new Set());

    const maxMines = totalCells - 1;

    const startGame = () => {
        if (!gameData || balance < betAmount || betAmount <= 0) return;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);

        setGameState('PLAYING');
        setMultiplier(1.00);
        setShowBustOverlay(false);
        setShakeScreen(false);
        setFlippingCells(new Set());

        // Generate new grid
        const newGrid = Array(totalCells).fill(null).map(() => ({ isMine: false, revealed: false }));
        let minesPlaced = 0;
        const effectiveMineCount = Math.min(mineCount, maxMines);
        while (minesPlaced < effectiveMineCount) {
            const idx = Math.floor(Math.random() * totalCells);
            if (!newGrid[idx].isMine) {
                newGrid[idx] = { isMine: true, revealed: false };
                minesPlaced++;
            }
        }
        setGrid(newGrid);
        updateMultipliers(0);
    };

    const updateMultipliers = (revealedSafe: number) => {
        const base = 1 - (Math.min(mineCount, maxMines) / totalCells);
        const currMult = revealedSafe === 0 ? 1 : Math.pow(1 / base, revealedSafe) * 0.99;
        const nextMult = Math.pow(1 / base, revealedSafe + 1) * 0.99;
        setMultiplier(currMult);
        setNextMultiplier(nextMult);
    };

    const triggerBustEffects = () => {
        // Bust animation based on config
        if (config.bustAnimationStyle === 'fullscreen_image' && config.bustImage) {
            setShowBustOverlay(true);
            setTimeout(() => setShowBustOverlay(false), 3000);
        } else if (config.bustAnimationStyle === 'shake') {
            setShakeScreen(true);
            setTimeout(() => setShakeScreen(false), 500);
        }
        // 'explosion' is handled by default reveal animation

        // Loss sound
        if (config.lossSoundType === 'custom' && config.lossSoundFile) {
            try {
                const audio = new Audio(config.lossSoundFile);
                audio.volume = 0.5;
                audio.play().catch(() => {});
            } catch (e) {}
        } else if (config.lossSoundType !== 'none') {
            playLossSound(config.lossSoundType);
        }
    };

    const revealCell = (index: number) => {
        if (gameState !== 'PLAYING') return;
        if (grid[index].revealed) return;

        const newGrid = [...grid];
        newGrid[index] = { ...newGrid[index], revealed: true };

        if (newGrid[index].isMine) {
            // Hit a mine
            setGameState('EXPLODED');
            setMultiplier(0);
            const finalGrid = newGrid.map(cell => cell.isMine ? { ...cell, revealed: true } : cell);
            setGrid(finalGrid);
            triggerBustEffects();
        } else {
            // Safe reveal
            if (config.enableFlipAnimation) {
                setFlippingCells(prev => new Set(prev).add(index));
                setTimeout(() => {
                    setFlippingCells(prev => {
                        const next = new Set(prev);
                        next.delete(index);
                        return next;
                    });
                }, 600);
            }

            // Progressive suspense audio
            const revealedCount = newGrid.filter(c => c.revealed && !c.isMine).length;
            if (config.enableProgressiveSuspense) {
                playSuspenseTone(revealedCount);
            }

            // Custom reveal sound
            if (config.revealSoundFile) {
                try {
                    const audio = new Audio(config.revealSoundFile);
                    audio.volume = 0.3;
                    audio.play().catch(() => {});
                } catch (e) {}
            }

            setGrid(newGrid);
            updateMultipliers(revealedCount);

            // Auto win if all safe cells revealed
            if (revealedCount === totalCells - Math.min(mineCount, maxMines)) {
                cashOut(curr => curr);
            }
        }
    };

    const cashOut = (calcMult = (m: number) => m) => {
        if (gameState !== 'PLAYING') return;

        const finalMult = calcMult(multiplier);
        setGameState('WON');
        const winAmount = betAmount * finalMult;
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);

        // Reveal remaining grid
        const finalGrid = grid.map(cell => ({ ...cell, revealed: true }));
        setGrid(finalGrid);

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
                        gameName: gameData?.name || "Custom Mines", 
                        gameImage: gameData?.coverImage || "/images/game-placeholder.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                // Reset session
                setSessionWagered(0);
                setSessionPayout(0);
            }

            setGameState('IDLE');
            setGrid([]);
            setShowBustOverlay(false);
            setShakeScreen(false);
            setFlippingCells(new Set());
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType, gameData]);

    if (!isOpen || !gameData) return null;
    if (typeof document === "undefined") return null;

    const accentColor = config.accentColor || '#f97316';
    const bgColor = config.backgroundColor || '#06090c';
    const tileColor = config.tileColor || '#1a2c38';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`rounded-2xl w-full max-w-4xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] ${shakeScreen ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                style={{
                    backgroundColor: bgColor,
                    borderColor: accentColor + '30',
                    boxShadow: `0 0 50px ${accentColor}15`,
                }}
            >
                {/* ADVANCED BETTING MENU */}
                <div className="w-full md:w-80 p-6 flex flex-col gap-4 border-r border-white/5 z-20"
                     style={{ backgroundColor: bgColor + 'F0' }}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex flex-col gap-1 text-white">
                            <h2 className="text-xl font-black uppercase tracking-widest leading-none truncate w-[200px]">
                                {config.theme.gameName}
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest truncate w-[200px]"
                               style={{ color: accentColor }}>
                                By {gameData.creatorName}
                            </p>
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="bg-black/30 p-1 rounded-xl flex border border-white/5">
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
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2 pb-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'}
                                className="bg-white/5 hover:bg-white/10 text-xs font-black py-2 rounded-lg border transition-colors"
                                style={{ color: accentColor, borderColor: accentColor + '30' }}>MAX</button>
                        </div>

                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mines (1-{maxMines})</label>
                        </div>
                        <select
                            value={mineCount}
                            onChange={(e) => setMineCount(Number(e.target.value))}
                            disabled={gameState === 'PLAYING'}
                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white font-bold outline-none appearance-none"
                        >
                            {Array.from({ length: maxMines }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-2 bg-black/30 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Target style={{ color: accentColor }} className="w-5 h-5" />
                            <h2 className="text-sm font-black uppercase tracking-widest truncate max-w-[120px]">{config.theme.gameName}</h2>
                            <FavoriteToggle gameName={gameData?.name || "Mines"} />
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
                            <button onClick={startGame} disabled={balance < betAmount || betAmount <= 0}
                                className="w-full text-white h-14 rounded-xl font-black text-lg tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group"
                                style={{
                                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                                    boxShadow: `0 5px 20px ${accentColor}40`,
                                }}>
                                <span className="relative z-10">PLAY DANGER</span>
                            </button>
                        ) : (
                            <button onClick={() => cashOut(m => m)} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white h-14 rounded-xl font-black text-lg uppercase shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse hover:scale-[1.02] flex flex-col items-center justify-center">
                                <span>CASHOUT</span>
                                <span className="text-[10px] text-green-200 mt-[-2px]">Take {(betAmount * multiplier).toFixed(2)}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* GAME AREA */}
                <div className="flex-1 relative p-4 flex flex-col items-center justify-center overflow-hidden" style={{ backgroundColor: bgColor }}>
                    {/* Background image */}
                    {config.backgroundImage && (
                        <div className="absolute inset-0 z-0">
                            <img src={config.backgroundImage} alt="" className="w-full h-full object-cover opacity-20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 z-0"></div>

                    {/* Watermark */}
                    {config.watermarkImage && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
                            <img src={config.watermarkImage} alt="" className="w-2/3 h-2/3 object-contain opacity-[0.08]" />
                        </div>
                    )}

                    {/* Multiplier Info */}
                    <div className="absolute inset-x-0 top-0 p-4 sm:p-6 flex justify-between items-center z-10 w-full max-w-[500px] mx-auto">
                        <div className="bg-black/60 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg backdrop-blur-sm">
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Multiplier</span>
                            <span className="font-mono font-black text-xl" style={{ color: accentColor }}>{multiplier.toFixed(2)}x</span>
                        </div>
                        {gameState === 'PLAYING' && (
                            <div className="bg-black/60 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3 shadow-lg backdrop-blur-sm">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Next</span>
                                <span className="text-green-400 font-mono font-black text-xl">{nextMultiplier.toFixed(2)}x</span>
                            </div>
                        )}
                    </div>

                    {/* GRID */}
                    <div className="relative z-10 grid gap-2 sm:gap-3 p-4 mt-8" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
                        {grid.length === totalCells ? grid.map((cell, idx) => {
                            const isFlipping = flippingCells.has(idx);
                            const cellSize = gridCols <= 3 ? 'w-20 h-20 sm:w-24 sm:h-24' : gridCols <= 5 ? 'w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20' : 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14';
                            
                            return (
                                <button
                                    key={idx}
                                    disabled={cell.revealed || gameState !== 'PLAYING'}
                                    onClick={() => revealCell(idx)}
                                    className={`
                                        relative ${cellSize} rounded-xl flex items-center justify-center transition-all duration-300 transform
                                        ${!cell.revealed ? 'hover:scale-105 shadow-md hover:shadow-xl cursor-pointer' : ''}
                                        ${cell.revealed && cell.isMine ? 'bg-red-950/80 scale-95 opacity-90 shadow-inner border border-red-500/30' : ''}
                                        ${cell.revealed && !cell.isMine ? 'bg-[#0a1114] scale-95 opacity-90 shadow-inner border border-white/5' : ''}
                                        ${gameState === 'EXPLODED' && !cell.revealed ? 'opacity-50' : ''}
                                    `}
                                    style={(!cell.revealed ? {
                                        backgroundColor: tileColor,
                                        perspective: config.enableFlipAnimation ? '600px' : undefined,
                                    } : undefined)}
                                >
                                    <AnimatePresence>
                                        {cell.revealed && (
                                            <motion.div
                                                initial={config.enableFlipAnimation ? { rotateY: 180, opacity: 0 } : { scale: 0, opacity: 0, rotate: -30 }}
                                                animate={config.enableFlipAnimation ? { rotateY: 0, opacity: 1 } : { scale: 1, opacity: 1, rotate: 0 }}
                                                transition={config.enableFlipAnimation
                                                    ? { type: "spring", stiffness: 200, damping: 20, duration: 0.6 }
                                                    : { type: "spring", stiffness: 300, damping: 20 }
                                                }
                                                className="w-full h-full flex items-center justify-center overflow-hidden rounded-lg p-2"
                                                style={{ transformStyle: 'preserve-3d' }}
                                            >
                                                {cell.isMine ? (
                                                    MINE_IMAGE ? (
                                                        <img src={MINE_IMAGE} alt="Mine" className="w-[80%] h-[80%] object-contain drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
                                                    ) : <Bomb className="w-8 h-8 sm:w-10 sm:h-10 text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.5)]" />
                                                ) : (
                                                    GEM_IMAGE ? (
                                                        <img src={GEM_IMAGE} alt="Safe" className="w-[80%] h-[80%] object-contain drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    ) : <Gem className="w-8 h-8 sm:w-10 sm:h-10 text-green-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </button>
                            );
                        }) : (
                            // Empty grid placeholder
                            Array(totalCells).fill(0).map((_, idx) => {
                                const cellSize = gridCols <= 3 ? 'w-20 h-20 sm:w-24 sm:h-24' : gridCols <= 5 ? 'w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20' : 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14';
                                return <div key={idx} className={`${cellSize} rounded-xl opacity-50`} style={{ backgroundColor: tileColor }}></div>;
                            })
                        )}
                    </div>

                    {/* BUSTED Overlay */}
                    <AnimatePresence>
                        {showBustOverlay && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                                onClick={() => setShowBustOverlay(false)}
                            >
                                {config.bustImage && (
                                    <motion.img
                                        src={config.bustImage}
                                        alt="Busted"
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 0.6 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                        className="absolute inset-0 w-full h-full object-contain p-8"
                                    />
                                )}
                                <motion.div
                                    initial={{ scale: 0, rotate: -15 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
                                    className="relative z-10 flex flex-col items-center"
                                >
                                    <span 
                                        className="text-6xl sm:text-8xl font-black text-red-500 uppercase tracking-[0.2em]"
                                        style={{ 
                                            textShadow: '0 0 40px rgba(255,0,0,0.8), 0 0 80px rgba(255,0,0,0.4), 0 4px 0 #7f0000',
                                            WebkitTextStroke: '2px rgba(0,0,0,0.3)',
                                        }}
                                    >
                                        BUSTED
                                    </span>
                                    <span className="text-slate-400 text-sm mt-4 font-bold uppercase tracking-widest">Tap to continue</span>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Explosion overlay for 'explosion' bust style */}
                    <AnimatePresence>
                        {gameState === 'EXPLODED' && config.bustAnimationStyle === 'explosion' && !showBustOverlay && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [0, 2, 1.5], opacity: [1, 1, 0] }}
                                    transition={{ duration: 1, times: [0, 0.3, 1] }}
                                    className="text-8xl"
                                >
                                    💥
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Screen shake CSS animation */}
            <style jsx global>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
                    20%, 40%, 60%, 80% { transform: translateX(8px); }
                }
            `}</style>
        </div>,
        document.body
    );
}
