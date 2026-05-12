"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Zap, Sparkles, Play, Loader2, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import FavoriteToggle from "./FavoriteToggle";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import { recordGameSession } from "@/utils/gameBridge";
import { playSlotReelTickSound, playSlotSpinSound } from "@/utils/slotSpinSound";

interface AIGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameData: {
        id: string;
        name: string;
        creatorId?: string;
        creatorName: string;
        themeEmoji: string;
        themeColor: string;
        gameDescription: string;
        htmlCode?: string;      // Legacy AI-generated games
        slotConfig?: any;       // New slot engine games
        type?: string;          // 'slot_engine' | 'ai_generated' | 'manual_template'
    };
    diamonds: number;
    setDiamonds: (fn: (prev: number) => number) => void;
    forgesCoins: number;
    setForgesCoins: (fn: (prev: number) => number) => void;
}

const playSynthSound = (type: string) => {
    try {
        if (type === 'spin') {
            playSlotSpinSound(0.34);
            return;
        }
        if (type === 'reel_tick') {
            playSlotReelTickSound(0.26);
            return;
        }
        if (type === 'tumble') {
            const audio = new Audio('/game sounds/dice.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { });
            return;
        }

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (type === 'rise') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 2.0);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.0);
        } else if (type === 'blip') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        } else if (type === 'boom') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        } else {
            return;
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.0);
    } catch (e) { }
};

export default function AIGameModal({ isOpen, onClose, gameData, diamonds, setDiamonds, forgesCoins, setForgesCoins }: AIGameModalProps) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', multiplier: number } | null>(null);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'RESULT'>('IDLE');
    const [gameReady, setGameReady] = useState(false);
    const configSentRef = useRef(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    
    // Session tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

    // Determine which mode this game uses
    const isSlotEngine = gameData?.type === 'slot_engine' && gameData?.slotConfig;
    const iframeSrc = isSlotEngine ? '/engines/slot-engine.html' : undefined;
    const iframeSrcDoc = !isSlotEngine ? (gameData?.htmlCode || '') : undefined;

    // Send slot config to engine when ready
    const sendSlotConfig = useCallback(() => {
        if (isSlotEngine && gameData?.slotConfig && iframeRef.current?.contentWindow && !configSentRef.current) {
            iframeRef.current.contentWindow.postMessage({
                type: 'SLOT_CONFIG',
                config: gameData.slotConfig
            }, '*');
            configSentRef.current = true;
        }
    }, [isSlotEngine, gameData]);

    // Listen for postMessage from iframe
    const handleMessage = useCallback((event: MessageEvent) => {
        const data = event.data;
        if (!data || !data.type) return;

        switch (data.type) {
            case 'GAME_READY':
                setGameReady(true);
                // For slot engine games, send config
                if (isSlotEngine) {
                    setTimeout(() => sendSlotConfig(), 100);
                }
                break;
            case 'PLAY_SOUND':
                if (data.soundType) playSynthSound(data.soundType);
                break;
            case 'GAME_RESULT':
                setGameState('RESULT');
                let winAmount = 0;
                if (data.win && data.multiplier > 0) {
                    const roundedMultiplier = Number(Number(data.multiplier).toFixed(1));
                    winAmount = Number((betAmount * roundedMultiplier).toFixed(2));
                    setLastWin({ amount: winAmount, currency: currencyType, multiplier: roundedMultiplier });
                    if (currencyType === 'GC') {
                        setDiamonds((prev: number) => prev + winAmount);
                    } else {
                        setForgesCoins((prev: number) => prev + winAmount);
                    }

                    const gameDataObj = (gameData as any);
                    if (gameDataObj.winSound) {
                        try {
                            const audio = new Audio(gameDataObj.winSound);
                            audio.volume = 0.5;
                            audio.play().catch(e => console.error("Win sound failed:", e));
                        } catch (e) { }
                    } else {
                        playSynthSound('win');
                    }

                    const effect = gameDataObj.winEffect || 'confetti';
                    if (effect === 'confetti') {
                        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                    } else if (effect === 'fireworks') {
                        const duration = 2000;
                        const animationEnd = Date.now() + duration;
                        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
                        const interval: any = setInterval(function () {
                            const timeLeft = animationEnd - Date.now();
                            if (timeLeft <= 0) return clearInterval(interval);
                            const particleCount = 50 * (timeLeft / duration);
                            confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                            confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                        }, 250);
                    } else if (effect === 'stars') {
                        confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 }, shapes: ['star'], colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8'] });
                    } else if (effect === 'coins') {
                        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, zIndex: 100, shapes: ['circle'], colors: ['#FFD700', '#FDB931', '#F5A623', '#F8E71C'] });
                    }
                } else {
                    // Lost
                    setLastWin(null);
                }

                // Creator analytics are now handled by gameBridge via the game_session_complete event

                // --- SESSION TRACKING ---
                setSessionWagered(prev => prev + betAmount);
                setSessionPayout(prev => prev + winAmount);

                break;
        }
    }, [betAmount, currencyType, setDiamonds, setForgesCoins, isSlotEngine, sendSlotConfig]);

    useEffect(() => {
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleMessage]);

    useEffect(() => {
        if (!isOpen) {
            setMobileMoreOpen(false);
            // Save session to history if any bets were made
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: { 
                        gameName: gameData?.name || "AI Game", 
                        gameImage: (gameData as any)?.coverImage || "/images/game-placeholder.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType,
                        creatorId: gameData?.creatorId,
                        gameId: gameData?.id,
                    }
                }));
                setSessionWagered(0);
                setSessionPayout(0);
            }
            setGameState('IDLE');
            setGameReady(false);
            configSentRef.current = false;
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType, gameData]);

    const startGame = async () => {
        if (balance < betAmount || betAmount <= 0 || !gameReady) return;

        // Deduct bet
        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setGameState('PLAYING');

        if (isSlotEngine && gameData?.slotConfig) {
            // ─── SLOT ENGINE MODE: Call server API for RNG ───────────
            try {
                const res = await fetch('/api/spin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ config: gameData.slotConfig, bet: betAmount })
                });
                if (!res.ok) throw new Error(`API returned ${res.status}`);
                const spinResult = await res.json();
                
                // Send result to engine for animation
                iframeRef.current?.contentWindow?.postMessage({
                    type: 'START_GAME',
                    spinResult,
                    bet: betAmount
                }, '*');
            } catch (err) {
                console.error('Spin API error:', err);
                // Refund on error
                if (currencyType === 'GC') {
                    setDiamonds((prev: number) => prev + betAmount);
                } else {
                    setForgesCoins((prev: number) => prev + betAmount);
                }
                setGameState('IDLE');
            }
        } else {
            // ─── LEGACY MODE: Send START_GAME to iframe ─────────────
            iframeRef.current?.contentWindow?.postMessage(
                { type: 'START_GAME', bet: betAmount },
                '*'
            );
        }
    };

    // Safety: auto-recover if game gets stuck in PLAYING for too long
    useEffect(() => {
        if (gameState !== 'PLAYING') return;
        const stuckTimer = setTimeout(() => {
            if (gameState === 'PLAYING') {
                console.warn('Game stuck in PLAYING state — auto-recovering');
                if (currencyType === 'GC') {
                    setDiamonds((prev: number) => prev + betAmount);
                } else {
                    setForgesCoins((prev: number) => prev + betAmount);
                }
                setGameState('IDLE');
                setLastWin(null);
                iframeRef.current?.contentWindow?.postMessage({ type: 'RESET' }, '*');
            }
        }, 12000);
        return () => clearTimeout(stuckTimer);
    }, [gameState, betAmount, currencyType]);

    const resetGame = () => {
        setGameState('IDLE');
        iframeRef.current?.contentWindow?.postMessage({ type: 'RESET' }, '*');
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'PLAYING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    if (!isOpen || !gameData) return null;
    if (typeof document === "undefined") return null;

    const accentColor = gameData.themeColor || '#a855f7';

    const bettingLocked = gameState === "PLAYING";

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden bg-black md:bg-black/85 backdrop-blur-none md:backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0f212e] rounded-none md:rounded-2xl w-full max-w-5xl border shadow-2xl overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[700px] md:max-h-[90vh] min-h-0"
                style={{ borderColor: `${accentColor}40` }}
            >
                <MobileGameHudBar
                    style={{ backgroundColor: "#121c22" }}
                    className="border-white/10"
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={bettingLocked}
                            clampMin={1}
                            quickBtnClassName="shrink-0 rounded-lg border border-white/10 bg-[#0a1114] px-2 py-2 text-[11px] font-black text-slate-200 active:scale-95 disabled:opacity-40 min-h-[40px] min-w-[34px]"
                            inputClassName="min-h-[40px] min-w-[3rem] flex-1 basis-0 max-w-[6.75rem] rounded-lg border border-white/10 bg-[#0a1114] px-1 py-1 text-center text-[11px] font-mono font-bold text-white outline-none focus:border-[#00b9f0]/45 disabled:opacity-40"
                        />
                    }
                    center={
                        <button
                            type="button"
                            onClick={startGame}
                            disabled={balance < betAmount || betAmount <= 0 || bettingLocked || !gameReady}
                            className="flex h-[68px] w-[68px] items-center justify-center rounded-full text-black active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                            style={{
                                background: bettingLocked ? "#334155" : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                                color: bettingLocked ? "#94a3b8" : "#000",
                                boxShadow: bettingLocked ? "none" : `0 0 22px ${accentColor}55`,
                            }}
                            aria-label={isSlotEngine ? "Spin" : "Bet"}
                        >
                            {!gameReady ? <Loader2 className="h-7 w-7 animate-spin text-white" /> : bettingLocked ? <Loader2 className="h-7 w-7 animate-spin text-white" /> : <Zap className="h-7 w-7" strokeWidth={2.2} />}
                        </button>
                    }
                    right={
                        <>
                            <button type="button" disabled={bettingLocked} onClick={() => handleBetChange(balance)} className="shrink-0 rounded-lg border px-3 py-3 text-xs font-black active:scale-95 disabled:opacity-40" style={{ color: accentColor, borderColor: `${accentColor}50`, background: "#0a1114" }}>MAX</button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={bettingLocked}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                            />
                            <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#0a1114] p-2.5 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
                        </>
                    }
                />

                {/* BETTING PANEL — desktop only */}
                <div className="z-20 hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:flex-col md:overflow-y-auto md:overscroll-contain bg-[#121c22] p-3 md:p-6 md:gap-4 border-r border-white/5 gap-2">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Play className="text-[#00b9f0]" />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{gameData.name}</h2>
                            <FavoriteToggle gameName={gameData.name} />
                        </div>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white transition-colors" /></button>
                    </div>

                    {/* Game Info */}
                    <div className="text-xs text-slate-400 bg-black/20 rounded-lg px-3 py-2 border border-white/5">
                        <Sparkles className="inline w-3 h-3 mr-1" style={{ color: accentColor }} />
                        {gameData.gameDescription}
                        {isSlotEngine && (
                            <span className="ml-2 bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[9px] font-bold">🎰 SLOT ENGINE</span>
                        )}
                    </div>

                    {/* Currency Toggle */}
                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button
                            onClick={() => setCurrencyType('GC')}
                            disabled={gameState === 'PLAYING'}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <DiamondIcon className="w-4 h-4" /> GC
                        </button>
                        <button
                            onClick={() => setCurrencyType('FC')}
                            disabled={gameState === 'PLAYING'}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <ForgesCoinIcon className="w-4 h-4" /> FC
                        </button>
                    </div>

                    {/* Bet Amount */}
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
                                disabled={gameState === 'PLAYING'}
                                className="w-full bg-[#0a1114] border border-white/10 focus:border-[#00b9f0] focus:shadow-[0_0_10px_rgba(0,185,240,0.2)] rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'PLAYING'} className="bg-[#1a2c38] hover:bg-[#2f4553] text-[#00b9f0] text-xs font-black py-2 rounded-lg border border-[#00b9f0]/30 transition-colors">MAX</button>
                        </div>
                    </div>

                    {/* Last Win */}
                    <div className="bg-[#0a1114]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-green-500 w-4 h-4" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Win</span>
                        </div>
                        {lastWin ? (
                            <span className="text-sm font-black text-green-400 font-mono flex items-center gap-1">
                                +{lastWin.amount.toFixed(2)} {lastWin.currency === 'GC' ? <DiamondIcon className="w-3 h-3" /> : <ForgesCoinIcon className="w-3 h-3" />}
                                <span className="text-[10px] text-green-500/60 ml-1">({lastWin.multiplier.toFixed(1)}x)</span>
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-slate-600">---</span>
                        )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-auto space-y-3">
                        {gameState === 'RESULT' && (
                            <button
                                onClick={resetGame}
                                className="w-full py-2 rounded-lg text-xs font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-colors"
                            >
                                Play Again
                            </button>
                        )}
                        <button
                            onClick={startGame}
                            disabled={balance < betAmount || betAmount <= 0 || gameState === 'PLAYING' || !gameReady}
                            className="w-full h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group"
                            style={{
                                background: gameState === 'PLAYING'
                                    ? '#334155'
                                    : `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                                color: gameState === 'PLAYING' ? '#94a3b8' : '#000',
                                boxShadow: gameState === 'PLAYING' ? 'none' : `0 5px 20px ${accentColor}50`,
                            }}
                        >
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <Zap size={20} />
                                {!gameReady ? 'LOADING...' : gameState === 'PLAYING' ? 'SPINNING...' : isSlotEngine ? 'SPIN' : 'BET'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* GAME AREA — iframe */}
                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#06090c]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-3 top-3 z-[80] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-slate-300 backdrop-blur-sm active:bg-white/10 md:hidden"
                        aria-label="Close game"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    {!gameReady && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#06090c]">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor}40`, borderTopColor: 'transparent' }}></div>
                                <div className="absolute inset-0 w-16 h-16 border-4 border-b-transparent rounded-full animate-spin" style={{ borderColor: `${accentColor}`, borderBottomColor: 'transparent', animationDirection: 'reverse', animationDuration: '0.7s' }}></div>
                            </div>
                            <p className="text-slate-400 text-sm font-bold mt-4 uppercase tracking-widest">Loading Game...</p>
                        </div>
                    )}
                    {/* Dual-mode iframe: src for slot engine, srcDoc for legacy */}
                    {isSlotEngine ? (
                        <iframe
                            ref={iframeRef}
                            src="/engines/slot-engine.html"
                            className="h-full min-h-0 w-full flex-1 border-0"
                            sandbox="allow-scripts"
                            title={gameData.name}
                            onLoad={() => {
                                setTimeout(() => {
                                    if (!gameReady) setGameReady(true);
                                }, 2000);
                            }}
                        />
                    ) : (
                        <iframe
                            ref={iframeRef}
                            srcDoc={gameData?.htmlCode || ''}
                            className="h-full min-h-0 w-full flex-1 border-0"
                            sandbox="allow-scripts"
                            title={gameData.name}
                            onLoad={() => {
                                setTimeout(() => {
                                    if (!gameReady) setGameReady(true);
                                }, 2000);
                            }}
                        />
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div
                        key="ai-game-mobile-more"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 320 }}
                            className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#121c22] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                            <div className="mb-3 flex items-center justify-between gap-2">
                                <h3 className="truncate text-base font-black text-white">{gameData.name}</h3>
                                <FavoriteToggle gameName={gameData.name} />
                            </div>
                            <p className="mb-4 line-clamp-4 text-xs leading-relaxed text-slate-400">
                                <Sparkles className="mb-0.5 inline h-3 w-3" style={{ color: accentColor }} />
                                {gameData.gameDescription}
                                {isSlotEngine && (
                                    <span className="ml-2 inline-block rounded bg-purple-500/20 px-1.5 py-0.5 text-[9px] font-bold text-purple-400">SLOT ENGINE</span>
                                )}
                            </p>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Currency</p>
                            <div className="mb-4 flex rounded-xl border border-white/5 bg-[#0f171c] p-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrencyType("GC")}
                                    disabled={bettingLocked}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-xs font-black uppercase transition-all ${currencyType === "GC" ? "bg-[#00b9f0] text-[#0f212e] shadow-[0_0_12px_rgba(0,185,240,0.4)]" : "text-slate-400"}`}
                                >
                                    <DiamondIcon className="h-4 w-4" /> GC
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrencyType("FC")}
                                    disabled={bettingLocked}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-xs font-black uppercase transition-all ${currencyType === "FC" ? "bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "text-slate-400"}`}
                                >
                                    <ForgesCoinIcon className="h-4 w-4" /> FC
                                </button>
                            </div>
                            <label className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Bet amount</label>
                            <div className="relative mb-4">
                                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                                    {currencyType === "GC" ? <DiamondIcon className="h-5 w-5 opacity-70" /> : <ForgesCoinIcon className="h-5 w-5 opacity-70" />}
                                </div>
                                <input
                                    type="number"
                                    value={betAmount}
                                    onChange={(e) => handleBetChange(Number(e.target.value))}
                                    disabled={bettingLocked}
                                    className="w-full rounded-xl border border-white/10 bg-[#0a1114] py-3 pl-10 pr-4 font-mono text-lg font-bold text-white outline-none focus:border-[#00b9f0] disabled:opacity-50"
                                />
                                <p className="mt-1 text-right text-[10px] font-mono text-slate-500">Bal: {balance.toFixed(2)}</p>
                            </div>
                            <div className="mb-4 rounded-xl border border-green-500/20 bg-[#0a1114]/50 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-green-500" />
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Last win</span>
                                    </div>
                                    {lastWin ? (
                                        <span className="flex items-center gap-1 font-mono text-sm font-black text-green-400">
                                            +{lastWin.amount.toFixed(2)} {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}
                                            <span className="text-[10px] text-green-500/60">({lastWin.multiplier.toFixed(1)}x)</span>
                                        </span>
                                    ) : (
                                        <span className="font-mono text-xs text-slate-600">—</span>
                                    )}
                                </div>
                            </div>
                            {gameState === "RESULT" && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetGame();
                                        setMobileMoreOpen(false);
                                    }}
                                    className="mb-3 w-full rounded-xl border border-white/10 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-white/5"
                                >
                                    Play again
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setMobileMoreOpen(false)}
                                className="w-full rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-white active:bg-white/10"
                            >
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
