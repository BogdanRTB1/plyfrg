"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Package, Sparkles } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import FavoriteToggle from "./FavoriteToggle";
import type { CaseConfig, CaseItem, CaseRarity } from "@/types/caseConfig";
import { DEFAULT_CASE_CONFIG, RARITY_CONFIG } from "@/types/caseConfig";

// ─── Opening Sound Synthesizer ──────────────────────────────────────────────
const playOpeningSound = (type: string) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        if (type === 'chains') {
            // Metallic chain-breaking sound
            for (let i = 0; i < 4; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2000 + i * 500, ctx.currentTime);
                filter.Q.setValueAtTime(5, ctx.currentTime);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100 + Math.random() * 200, ctx.currentTime + i * 0.08);
                gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.08);
                osc.stop(ctx.currentTime + i * 0.08 + 0.2);
            }
        } else if (type === 'lock') {
            // Lock click + creak
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } else if (type === 'zipper') {
            // Zipper — rapid ascending tones
            for (let i = 0; i < 12; i++) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600 + i * 100, ctx.currentTime + i * 0.02);
                gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.02 + 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.02);
                osc.stop(ctx.currentTime + i * 0.02 + 0.05);
            }
        }
    } catch (e) {}
};

// ─── Rare Item Explosion Sound ──────────────────────────────────────────────
const playRareExplosion = (rarity: CaseRarity) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const intensity = rarity === 'legendary' ? 1.0 : rarity === 'epic' ? 0.7 : 0.4;
        const noteCount = rarity === 'legendary' ? 6 : rarity === 'epic' ? 4 : 2;

        // Rising triumphant notes
        for (let i = 0; i < noteCount; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400 + i * 150, ctx.currentTime + i * 0.1);
            gain.gain.setValueAtTime(0.1 * intensity, ctx.currentTime + i * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.1);
            osc.stop(ctx.currentTime + i * 0.1 + 0.35);
        }

        // Bass impact
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bass.type = 'sine';
        bass.frequency.setValueAtTime(80, ctx.currentTime);
        bass.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5);
        bassGain.gain.setValueAtTime(0.15 * intensity, ctx.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        bass.connect(bassGain);
        bassGain.connect(ctx.destination);
        bass.start();
        bass.stop(ctx.currentTime + 0.6);
    } catch (e) {}
};

// ─── Roulette Tick Sound ────────────────────────────────────────────────────
const playTick = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
};

// ─── Case Emoji by Design ───────────────────────────────────────────────────
const getCaseEmoji = (design: string) => {
    switch (design) {
        case 'safe': return '🔒';
        case 'treasure': return '🏴‍☠️';
        case 'cardboard': return '📦';
        case 'card_pack': return '🃏';
        default: return '📦';
    }
};

// ─── ITEM_WIDTH for roulette band ────────────────────────────────────────────
const ITEM_WIDTH = 120; // px per item card
const VISIBLE_ITEMS = 7; // items visible at once
const BAND_ITEMS = 60; // total items in the roulette band

export default function CustomCaseModal({ isOpen, onClose, gameData, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', item: CaseItem } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'OPENING' | 'REVEALING' | 'FINISHED'>('IDLE');
    const [bandItems, setBandItems] = useState<CaseItem[]>([]);
    const [bandOffset, setBandOffset] = useState(0);
    const [winnerItem, setWinnerItem] = useState<CaseItem | null>(null);
    const [showWinOverlay, setShowWinOverlay] = useState(false);

    const animFrameRef = useRef<number | null>(null);
    const lastTickRef = useRef<number>(0);
    const bandRef = useRef<HTMLDivElement>(null);

    // Read config from gameData
    const config: CaseConfig = gameData?.caseConfig || DEFAULT_CASE_CONFIG;
    const items = config.items || DEFAULT_CASE_CONFIG.items;

    // ─── Pick winner based on probabilities ─────────────────────────────────
    const pickWinner = useCallback((): CaseItem => {
        const totalProb = items.reduce((sum, item) => sum + item.probability, 0);
        let rand = Math.random() * totalProb;
        for (let i = 0; i < items.length; i++) {
            rand -= items[i].probability;
            if (rand <= 0) return items[i];
        }
        return items[items.length - 1];
    }, [items]);

    // ─── Build roulette band ────────────────────────────────────────────────
    const buildBand = useCallback((winner: CaseItem): CaseItem[] => {
        const band: CaseItem[] = [];
        // Fill with weighted random items
        const totalProb = items.reduce((sum, item) => sum + item.probability, 0);
        for (let i = 0; i < BAND_ITEMS; i++) {
            let rand = Math.random() * totalProb;
            for (let j = 0; j < items.length; j++) {
                rand -= items[j].probability;
                if (rand <= 0) {
                    band.push(items[j]);
                    break;
                }
            }
            if (band.length <= i) band.push(items[0]); // fallback
        }
        // Place winner near the end (where the pointer will land)
        const winnerPosition = BAND_ITEMS - Math.floor(VISIBLE_ITEMS / 2) - 1;
        band[winnerPosition] = winner;
        return band;
    }, [items]);

    // ─── Open Case ──────────────────────────────────────────────────────────
    const openCase = () => {
        if (gameState === 'OPENING' || gameState === 'REVEALING') return;
        if (balance < betAmount || betAmount <= 0) return;

        // Deduct bet
        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }
        setSessionWagered(prev => prev + betAmount);

        // Pick winner and build band
        const winner = pickWinner();
        const band = buildBand(winner);
        setBandItems(band);
        setWinnerItem(winner);
        setBandOffset(0);
        setShowWinOverlay(false);
        setGameState('OPENING');

        // Play opening sound
        if (config.openingSoundType === 'none') {
            // skip
        } else if (config.openingSoundFile) {
            try {
                const audio = new Audio(config.openingSoundFile);
                audio.volume = 0.5;
                audio.play().catch(() => {});
            } catch (e) {}
        } else {
            playOpeningSound(config.openingSoundType);
        }

        // Animate roulette band
        const winnerPosition = BAND_ITEMS - Math.floor(VISIBLE_ITEMS / 2) - 1;
        const targetOffset = winnerPosition * ITEM_WIDTH + (Math.random() - 0.5) * (ITEM_WIDTH * 0.4);
        const duration = (config.scrollDuration || 5) * 1000;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Cubic ease-out for suspenseful deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentOffset = targetOffset * eased;

            setBandOffset(currentOffset);

            // Tick sound on each item pass
            const currentItemIdx = Math.floor(currentOffset / ITEM_WIDTH);
            if (currentItemIdx !== lastTickRef.current) {
                lastTickRef.current = currentItemIdx;
                playTick();
            }

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                // Done scrolling — reveal winner
                setGameState('REVEALING');
                handleReveal(winner);
            }
        };

        lastTickRef.current = 0;
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(animate);
    };

    // ─── Handle Reveal ──────────────────────────────────────────────────────
    const handleReveal = (winner: CaseItem) => {
        // Delay for dramatic effect
        setTimeout(() => {
            setGameState('FINISHED');
            setShowWinOverlay(true);

            // Rare explosion sound
            if (config.enableRareExplosionSound && winner.rarity !== 'common') {
                playRareExplosion(winner.rarity);
            }

            // Calculate payout
            const winAmount = betAmount * winner.multiplier;
            setLastWin({ amount: winAmount, currency: currencyType, item: winner });

            if (winAmount > 0) {
                if (currencyType === 'GC') {
                    setDiamonds((prev: number) => prev + winAmount);
                } else {
                    setForgesCoins((prev: number) => prev + winAmount);
                }
                setSessionPayout(prev => prev + winAmount);
            }

            // Confetti for epic+ wins
            if (winner.rarity === 'legendary') {
                confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff'] });
                setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.4 } }), 300);
            } else if (winner.rarity === 'epic') {
                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#a855f7', '#c084fc', '#e9d5ff'] });
            } else if (winner.rarity === 'rare') {
                confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
            }
        }, 500);
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'OPENING' || gameState === 'REVEALING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: {
                        gameName: gameData?.name || "Custom Case",
                        gameImage: gameData?.coverImage || "/images/game-placeholder.png",
                        wagered: sessionWagered,
                        payout: sessionPayout,
                        currency: currencyType
                    }
                }));
                setSessionWagered(0);
                setSessionPayout(0);
            }
            if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
            setGameState('IDLE');
            setBandItems([]);
            setBandOffset(0);
            setWinnerItem(null);
            setShowWinOverlay(false);
        }
    }, [isOpen]);

    if (!isOpen || !gameData) return null;
    if (typeof document === "undefined") return null;

    const accentColor = config.accentColor || '#f59e0b';
    const bgColor = config.backgroundColor || '#06090c';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="rounded-2xl w-full max-w-5xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[650px]"
                style={{
                    backgroundColor: bgColor,
                    borderColor: accentColor + '30',
                    boxShadow: `0 0 50px ${accentColor}15`,
                }}
            >
                {/* BETTING PANEL */}
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

                    {/* Collection badge */}
                    <div className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
                        <span className="text-lg mr-2">{config.caseDesign !== 'custom' ? getCaseEmoji(config.caseDesign) : '🎁'}</span>
                        <span className="text-sm font-black text-white uppercase tracking-widest">{config.collectionName}</span>
                    </div>

                    <div className="bg-black/30 p-1 rounded-xl flex border border-white/5">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'OPENING'}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}>
                            <DiamondIcon className="w-4 h-4" /> Diamonds
                        </button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'OPENING'}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}>
                            <ForgesCoinIcon className="w-4 h-4" /> Coins
                        </button>
                    </div>

                    <div className="space-y-2">
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
                                disabled={gameState === 'OPENING' || gameState === 'REVEALING'}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'OPENING'}
                                className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'OPENING'}
                                className="bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'OPENING'}
                                className="bg-white/5 hover:bg-white/10 text-xs font-black py-2 rounded-lg border transition-colors"
                                style={{ color: accentColor, borderColor: accentColor + '30' }}>MAX</button>
                        </div>
                    </div>

                    {/* Items preview */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Case Contents</label>
                        {items.map(item => {
                            const rarityConf = RARITY_CONFIG[item.rarity];
                            return (
                                <div key={item.id} className="flex items-center gap-2 text-xs p-1.5 rounded-lg bg-white/[0.02]">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: rarityConf.color }} />
                                    <span className="text-white font-bold flex-1 truncate">{item.name}</span>
                                    <span className="font-mono font-bold" style={{ color: rarityConf.color }}>{item.multiplier}x</span>
                                    <span className="text-slate-500 font-mono text-[10px]">{item.probability}%</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-2 bg-black/30 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Package style={{ color: accentColor }} className="w-5 h-5" />
                            <span className="text-sm font-black uppercase tracking-widest truncate max-w-[120px]">{config.theme.gameName}</span>
                            <FavoriteToggle gameName={gameData?.name || "Case"} />
                        </div>
                        {lastWin ? (
                            <span className="text-sm font-black font-mono flex items-center gap-1"
                                  style={{ color: RARITY_CONFIG[lastWin.item.rarity].color }}>
                                +{lastWin.amount.toFixed(2)} {lastWin.currency === 'GC' ? <DiamondIcon className="w-3 h-3" /> : <ForgesCoinIcon className="w-3 h-3" />}
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-slate-600">---</span>
                        )}
                    </div>

                    <div className="mt-auto">
                        <button
                            onClick={openCase}
                            disabled={gameState === 'OPENING' || gameState === 'REVEALING' || balance < betAmount || betAmount <= 0}
                            className="w-full text-white h-14 rounded-xl font-black text-lg tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group"
                            style={{
                                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                                boxShadow: `0 5px 20px ${accentColor}40`,
                            }}
                        >
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <Package size={20} />
                                {gameState === 'OPENING' ? 'OPENING...' : gameState === 'REVEALING' ? 'REVEALING...' : 'OPEN CASE'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* GAME AREA */}
                <div className="flex-1 relative flex flex-col justify-center items-center overflow-hidden" style={{ backgroundColor: bgColor }}>
                    {/* Background image */}
                    {config.backgroundImage && (
                        <div className="absolute inset-0 z-0">
                            <img src={config.backgroundImage} alt="" className="w-full h-full object-cover opacity-20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 z-0"></div>

                    {/* Case Display — shows when IDLE */}
                    {gameState === 'IDLE' && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative z-10 flex flex-col items-center gap-6"
                        >
                            <div className="relative">
                                {config.caseDesign === 'custom' && config.caseImage ? (
                                    <img src={config.caseImage} alt="Case" className="w-40 h-40 object-contain drop-shadow-2xl" />
                                ) : (
                                    <div className="w-40 h-40 rounded-3xl border-2 flex items-center justify-center text-7xl"
                                         style={{
                                             borderColor: accentColor + '40',
                                             background: `radial-gradient(circle, ${accentColor}15, transparent)`,
                                             boxShadow: `0 0 60px ${accentColor}20`,
                                         }}>
                                        {getCaseEmoji(config.caseDesign)}
                                    </div>
                                )}
                                {/* Glow pulse */}
                                <div className="absolute inset-0 rounded-3xl animate-pulse"
                                     style={{ boxShadow: `0 0 40px ${accentColor}30` }} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-black text-white uppercase tracking-widest">{config.collectionName}</h3>
                                <p className="text-sm text-slate-400 mt-1">{config.theme.gameDescription}</p>
                            </div>
                        </motion.div>
                    )}

                    {/* ROULETTE BAND — shows during OPENING / REVEALING / FINISHED */}
                    {(gameState === 'OPENING' || gameState === 'REVEALING' || gameState === 'FINISHED') && bandItems.length > 0 && (
                        <div className="relative z-10 w-full px-4">
                            {/* Center pointer */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-0 z-30 flex flex-col items-center">
                                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
                            </div>
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 z-30 flex flex-col items-center">
                                <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor, boxShadow: `0 0 10px ${accentColor}` }} />
                            </div>

                            {/* Band container */}
                            <div className="relative overflow-hidden rounded-2xl border-2 h-[140px]"
                                 style={{
                                     borderColor: accentColor + '40',
                                     background: 'rgba(0,0,0,0.5)',
                                 }}>
                                {/* Gradient fade edges */}
                                <div className="absolute left-0 top-0 bottom-0 w-16 z-20" style={{ background: `linear-gradient(to right, ${bgColor}, transparent)` }} />
                                <div className="absolute right-0 top-0 bottom-0 w-16 z-20" style={{ background: `linear-gradient(to left, ${bgColor}, transparent)` }} />

                                {/* Scrolling band */}
                                <div
                                    ref={bandRef}
                                    className="absolute top-0 bottom-0 flex items-center gap-2"
                                    style={{
                                        left: `calc(50% - ${ITEM_WIDTH / 2}px)`,
                                        transform: `translateX(-${bandOffset}px)`,
                                    }}
                                >
                                    {bandItems.map((item, idx) => {
                                        const rarityConf = RARITY_CONFIG[item.rarity];
                                        const isWinner = gameState === 'FINISHED' && winnerItem && idx === (BAND_ITEMS - Math.floor(VISIBLE_ITEMS / 2) - 1);
                                        return (
                                            <div
                                                key={idx}
                                                className={`shrink-0 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${isWinner ? 'scale-110 z-10' : ''}`}
                                                style={{
                                                    width: ITEM_WIDTH - 8,
                                                    height: 120,
                                                    backgroundColor: item.color + '40',
                                                    borderColor: config.enableRarityGlow ? rarityConf.color + (isWinner ? 'FF' : '60') : 'rgba(255,255,255,0.1)',
                                                    boxShadow: config.enableRarityGlow && isWinner
                                                        ? `0 0 30px ${rarityConf.glowColor}, inset 0 0 20px ${rarityConf.glowColor}`
                                                        : config.enableRarityGlow
                                                        ? `0 0 8px ${rarityConf.glowColor}`
                                                        : 'none',
                                                }}
                                            >
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-10 h-10 object-contain" />
                                                ) : (
                                                    <span className="text-2xl font-black text-white">{item.multiplier}x</span>
                                                )}
                                                <span className="text-[10px] font-bold text-white/70 truncate max-w-[90px]">{item.name}</span>
                                                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" 
                                                      style={{ backgroundColor: rarityConf.color + '30', color: rarityConf.color }}>
                                                    {rarityConf.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* WIN OVERLAY */}
                    <AnimatePresence>
                        {showWinOverlay && winnerItem && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                                onClick={() => setShowWinOverlay(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2"
                                    style={{
                                        backgroundColor: bgColor + 'E0',
                                        borderColor: RARITY_CONFIG[winnerItem.rarity].color,
                                        boxShadow: `0 0 60px ${RARITY_CONFIG[winnerItem.rarity].glowColor}, 0 0 120px ${RARITY_CONFIG[winnerItem.rarity].glowColor}`,
                                    }}
                                >
                                    {/* Rarity badge */}
                                    <span className="text-xs font-black uppercase tracking-[0.3em] px-4 py-1 rounded-full"
                                          style={{ backgroundColor: RARITY_CONFIG[winnerItem.rarity].color + '30', color: RARITY_CONFIG[winnerItem.rarity].color }}>
                                        {RARITY_CONFIG[winnerItem.rarity].label}
                                    </span>

                                    {/* Prize display */}
                                    {winnerItem.image ? (
                                        <motion.img
                                            src={winnerItem.image}
                                            alt={winnerItem.name}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className="w-24 h-24 object-contain"
                                        />
                                    ) : (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.2, type: "spring" }}
                                            className="text-6xl font-black"
                                            style={{ color: RARITY_CONFIG[winnerItem.rarity].color }}
                                        >
                                            {winnerItem.multiplier}x
                                        </motion.span>
                                    )}

                                    <h3 className="text-xl font-black text-white uppercase tracking-widest">{winnerItem.name}</h3>

                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black font-mono text-green-400">
                                            +{(betAmount * winnerItem.multiplier).toFixed(2)}
                                        </span>
                                        {currencyType === 'GC' ? <DiamondIcon className="w-5 h-5" /> : <ForgesCoinIcon className="w-5 h-5" />}
                                    </div>

                                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Tap to continue</span>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
