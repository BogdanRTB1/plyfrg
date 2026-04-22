"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Trophy, Zap, RotateCw } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import confetti from "canvas-confetti";
import FavoriteToggle from "./FavoriteToggle";
import type { WheelConfig, WheelSegment } from "@/types/wheelConfig";
import { DEFAULT_WHEEL_CONFIG } from "@/types/wheelConfig";

// ─── Tick Sound Generator ──────────────────────────────────────────────────
const playTick = (tickSound: string) => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        if (tickSound === 'digital') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.03);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } else if (tickSound === 'musical') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.08);
        } else {
            // mechanical (default)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.02);
            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.04);
        }
    } catch (e) {}
};

// ─── Custom Confetti with Logo ─────────────────────────────────────────────
const fireLogoConfetti = (logoSrc: string) => {
    const img = new Image();
    img.src = logoSrc;
    img.onload = () => {
        // Create a small canvas for the shape
        const size = 24;
        const shapeCanvas = document.createElement('canvas');
        shapeCanvas.width = size;
        shapeCanvas.height = size;
        const sctx = shapeCanvas.getContext('2d');
        if (!sctx) return;
        sctx.drawImage(img, 0, 0, size, size);

        // Fall back to standard confetti with custom colors if shape API not available
        confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6', '#e67e22'],
            shapes: ['circle', 'square'],
            scalar: 1.2,
        });
    };
    img.onerror = () => {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
    };
};

export default function CustomWheelModal({ isOpen, onClose, gameData, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    // Session Tracking
    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<'IDLE' | 'SPINNING' | 'FINISHED'>('IDLE');
    const [wheelRotation, setWheelRotation] = useState(0);
    const [resultSegment, setResultSegment] = useState<WheelSegment | null>(null);
    const [nextMultiplierBonus, setNextMultiplierBonus] = useState(1); // for x2 multiplier special
    const [respinPending, setRespinPending] = useState(false);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animFrameRef = useRef<number | null>(null);
    const lastTickSegRef = useRef<number>(-1);

    // Read config from gameData
    const config: WheelConfig = gameData?.wheelConfig || DEFAULT_WHEEL_CONFIG;
    const segments = config.segments || DEFAULT_WHEEL_CONFIG.segments;

    // ─── Compute visual arcs ────────────────────────────────────────────────
    const totalVisualWeight = segments.reduce((sum: number, s: WheelSegment) => sum + s.visualWeight, 0);
    const segmentArcs = segments.map((s: WheelSegment) => (s.visualWeight / totalVisualWeight) * 360);

    // ─── Draw Wheel on Canvas ───────────────────────────────────────────────
    const drawWheel = useCallback((rotation: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(cx, cy) - 12;

        ctx.clearRect(0, 0, w, h);

        // Rotation in radians
        const rotRad = (rotation * Math.PI) / 180;
        let startAngle = rotRad - Math.PI / 2; // start from top

        // Texture-based styling
        const texture = config.wheelTexture || 'neon';

        // Draw segments
        segments.forEach((seg: WheelSegment, i: number) => {
            const arcRad = (segmentArcs[i] * Math.PI) / 180;
            const endAngle = startAngle + arcRad;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, endAngle);
            ctx.closePath();

            // Fill with segment color
            if (texture === 'neon') {
                const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
                grad.addColorStop(0, seg.color + '40');
                grad.addColorStop(0.6, seg.color + 'CC');
                grad.addColorStop(1, seg.color);
                ctx.fillStyle = grad;
            } else if (texture === '3d') {
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
                grad.addColorStop(0, seg.color);
                grad.addColorStop(0.7, seg.color + 'DD');
                grad.addColorStop(1, seg.color + '99');
                ctx.fillStyle = grad;
            } else if (texture === 'wood') {
                ctx.fillStyle = seg.color + 'CC';
            } else if (texture === 'metal') {
                const grad = ctx.createLinearGradient(
                    cx + Math.cos(startAngle) * radius,
                    cy + Math.sin(startAngle) * radius,
                    cx + Math.cos(endAngle) * radius,
                    cy + Math.sin(endAngle) * radius
                );
                grad.addColorStop(0, seg.color);
                grad.addColorStop(0.5, seg.color + 'DD');
                grad.addColorStop(1, seg.color + 'BB');
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = seg.color;
            }
            ctx.fill();

            // Segment border
            ctx.strokeStyle = texture === 'neon' ? (seg.color + '80') : 'rgba(255,255,255,0.15)';
            ctx.lineWidth = texture === 'neon' ? 2 : 1;
            ctx.stroke();

            // Neon glow effect on border
            if (texture === 'neon') {
                ctx.save();
                ctx.shadowColor = seg.color;
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(cx, cy, radius, startAngle, endAngle);
                ctx.strokeStyle = seg.color + '60';
                ctx.lineWidth = 3;
                ctx.stroke();
                ctx.restore();
            }

            // Label text
            const midAngle = startAngle + arcRad / 2;
            const textRadius = radius * 0.65;
            const tx = cx + Math.cos(midAngle) * textRadius;
            const ty = cy + Math.sin(midAngle) * textRadius;

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(midAngle + Math.PI / 2);
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Special segments get different styling
            if (seg.specialType) {
                ctx.font = 'bold 11px Inter, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
                ctx.fillText(seg.label, 0, -6);
                ctx.font = '16px sans-serif';
                ctx.fillText(seg.specialType === 'respin' ? '🔄' : '✖️2', 0, 10);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = 'rgba(0,0,0,0.8)';
                ctx.shadowBlur = 4;
                ctx.font = 'bold 18px Inter, sans-serif';
                ctx.fillText(seg.multiplier + 'x', 0, -4);
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.fillText(seg.label, 0, 14);
            }
            ctx.restore();

            startAngle = endAngle;
        });

        // Center circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.12, 0, Math.PI * 2);
        if (texture === 'neon') {
            ctx.fillStyle = '#1a0033';
            ctx.fill();
            ctx.strokeStyle = config.accentColor + '80';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.save();
            ctx.shadowColor = config.accentColor;
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();
        } else {
            ctx.fillStyle = '#1a1a2e';
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Outer ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = texture === 'neon' ? (config.accentColor + '40') : 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 8;
        ctx.stroke();

        if (texture === 'neon') {
            ctx.save();
            ctx.shadowColor = config.accentColor;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = config.accentColor + '30';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        }
    }, [segments, segmentArcs, config.wheelTexture, config.accentColor]);

    // ─── Pick winner based on real probabilities ────────────────────────────
    const pickWinner = (): number => {
        const totalProb = segments.reduce((sum: number, s: WheelSegment) => sum + s.realProbability, 0);
        let rand = Math.random() * totalProb;
        for (let i = 0; i < segments.length; i++) {
            rand -= segments[i].realProbability;
            if (rand <= 0) return i;
        }
        return segments.length - 1;
    };

    // ─── Get angle for a segment index (center of that segment) ─────────────
    const getSegmentCenterAngle = (idx: number): number => {
        let angle = 0;
        for (let i = 0; i < idx; i++) {
            angle += segmentArcs[i];
        }
        angle += segmentArcs[idx] / 2;
        return angle;
    };

    // ─── Determine which segment the pointer is on at a given rotation ──────
    const getSegmentAtPointer = (rot: number): number => {
        // Pointer is at top (0°). The wheel rotates clockwise.
        // Normalize rotation to 0-360
        let normalizedRot = ((rot % 360) + 360) % 360;
        // The top of the wheel corresponds to the start. When the wheel rotates
        // by `rot` degrees, the segment under the pointer is the one at (360 - rot).
        let angle = ((360 - normalizedRot) % 360 + 360) % 360;
        let cumulative = 0;
        for (let i = 0; i < segments.length; i++) {
            cumulative += segmentArcs[i];
            if (angle < cumulative) return i;
        }
        return segments.length - 1;
    };

    // ─── Spin the Wheel ─────────────────────────────────────────────────────
    const spinWheel = () => {
        if (gameState === 'SPINNING') return;

        if (!respinPending) {
            if (balance < betAmount || betAmount <= 0) return;
            if (currencyType === 'GC') {
                setDiamonds((prev: number) => prev - betAmount);
            } else {
                setForgesCoins((prev: number) => prev - betAmount);
            }
            setSessionWagered(prev => prev + betAmount);
        }
        setRespinPending(false);

        setGameState('SPINNING');
        setResultSegment(null);
        lastTickSegRef.current = -1;

        // Pick winner
        const winnerIdx = pickWinner();
        const winnerSegment = segments[winnerIdx];

        // Calculate target rotation to land on winner
        // We need the pointer (top) to land on the winning segment
        const winnerCenterAngle = getSegmentCenterAngle(winnerIdx);
        // Add randomness within the segment (not perfectly centered)
        const segArc = segmentArcs[winnerIdx];
        const randomOffset = (Math.random() - 0.5) * segArc * 0.6;
        // The wheel needs to rotate so that this segment is at the top (0°)
        const targetSegmentAngle = 360 - winnerCenterAngle - randomOffset;
        const spins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
        const targetRotation = wheelRotation + (360 * spins) + ((targetSegmentAngle - (wheelRotation % 360) + 360) % 360);

        // Animate with requestAnimationFrame for tick sounds
        const startRotation = wheelRotation;
        const totalDelta = targetRotation - startRotation;
        const duration = 4000; // 4 seconds
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing: cubic ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentRotation = startRotation + totalDelta * eased;

            setWheelRotation(currentRotation);
            drawWheel(currentRotation);

            // Tick sound detection
            const currentSeg = getSegmentAtPointer(currentRotation);
            if (currentSeg !== lastTickSegRef.current) {
                lastTickSegRef.current = currentSeg;
                playTick(config.tickSound || 'mechanical');
            }

            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            } else {
                // Done spinning
                setWheelRotation(currentRotation);
                setGameState('FINISHED');
                setResultSegment(winnerSegment);
                handleWin(winnerSegment);
            }
        };

        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = requestAnimationFrame(animate);
    };

    // ─── Handle Win ─────────────────────────────────────────────────────────
    const handleWin = (seg: WheelSegment) => {
        // Handle special types
        if (seg.specialType === 'respin') {
            setRespinPending(true);
            setTimeout(() => {
                spinWheel();
            }, 1500);
            return;
        }

        if (seg.specialType === 'multiplier_x2') {
            setNextMultiplierBonus(prev => prev * 2);
            return;
        }

        const effectiveMult = seg.multiplier * nextMultiplierBonus;
        const winAmount = betAmount * effectiveMult;

        setLastWin({ amount: winAmount, currency: currencyType, mult: effectiveMult });

        if (winAmount > 0) {
            if (currencyType === 'GC') {
                setDiamonds((prev: number) => prev + winAmount);
            } else {
                setForgesCoins((prev: number) => prev + winAmount);
            }
            setSessionPayout(prev => prev + winAmount);

            if (effectiveMult >= 2) {
                if (config.confettiType === 'custom_logo' && config.confettiImage) {
                    fireLogoConfetti(config.confettiImage);
                } else {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                }
            }
        }

        // Reset multiplier bonus after use
        if (nextMultiplierBonus > 1) {
            setNextMultiplierBonus(1);
        }
    };

    const handleBetChange = (amount: number) => {
        if (gameState === 'SPINNING') return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    // Draw wheel on mount and when config changes
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => drawWheel(wheelRotation), 50);
        }
    }, [isOpen, drawWheel, wheelRotation]);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            if (sessionWagered > 0) {
                window.dispatchEvent(new CustomEvent('game_session_complete', {
                    detail: {
                        gameName: gameData?.name || "Custom Wheel",
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
            setResultSegment(null);
            setNextMultiplierBonus(1);
            setRespinPending(false);
        }
    }, [isOpen]);

    // ─── Pointer Rendering ──────────────────────────────────────────────────
    const getPointerEmoji = () => {
        const style = config.pointerStyle || 'arrow';
        switch (style) {
            case 'finger': return '👆';
            case 'sword': return '⚔️';
            case 'microphone': return '🎤';
            default: return null; // arrow uses CSS triangle
        }
    };

    if (!isOpen || !gameData) return null;
    if (typeof document === "undefined") return null;

    const accentColor = config.accentColor || '#e74c3c';
    const bgColor = config.backgroundColor || '#0a0014';
    const pointerEmoji = getPointerEmoji();

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="rounded-2xl w-full max-w-5xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]"
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

                    <div className="bg-black/30 p-1 rounded-xl flex border border-white/5 mt-2">
                        <button onClick={() => setCurrencyType('GC')} disabled={gameState === 'SPINNING'}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'GC' ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]' : 'text-slate-400 hover:text-white'}`}>
                            <DiamondIcon className="w-4 h-4" /> Diamonds
                        </button>
                        <button onClick={() => setCurrencyType('FC')} disabled={gameState === 'SPINNING'}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === 'FC' ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'text-slate-400 hover:text-white'}`}>
                            <ForgesCoinIcon className="w-4 h-4" /> Coins
                        </button>
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
                                disabled={gameState === 'SPINNING'}
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white font-mono text-lg font-bold transition-all outline-none"
                                style={{ borderColor: 'rgba(255,255,255,0.1)', }}
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === 'SPINNING'}
                                className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === 'SPINNING'}
                                className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold py-2 rounded-lg border border-white/5 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === 'SPINNING'}
                                className="bg-white/5 hover:bg-white/10 text-xs font-black py-2 rounded-lg border transition-colors"
                                style={{ color: accentColor, borderColor: accentColor + '30' }}>MAX</button>
                        </div>
                    </div>

                    {/* Multiplier Bonus indicator */}
                    {nextMultiplierBonus > 1 && (
                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Next Spin Bonus</span>
                            <span className="text-lg font-black text-amber-400">×{nextMultiplierBonus}</span>
                        </div>
                    )}

                    <div className="mt-2 bg-black/30 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <RotateCw style={{ color: accentColor }} className="w-5 h-5" />
                            <span className="text-sm font-black uppercase tracking-widest">{config.theme.gameName}</span>
                            <FavoriteToggle gameName={gameData?.name || "Wheel"} />
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
                        <button
                            onClick={spinWheel}
                            disabled={gameState === 'SPINNING' || balance < betAmount || betAmount <= 0}
                            className="w-full h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group text-white"
                            style={{
                                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`,
                                boxShadow: `0 5px 20px ${accentColor}40`,
                            }}
                        >
                            <span className="relative z-10 flex gap-2 items-center justify-center">
                                <Zap size={20} />
                                {respinPending ? 'FREE RESPIN!' : gameState === 'SPINNING' ? 'SPINNING...' : 'SPIN'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* GAME AREA */}
                <div className="flex-1 relative p-2 sm:p-6 flex flex-col justify-center items-center overflow-hidden shadow-inner"
                     style={{ backgroundColor: bgColor }}>

                    {/* Background overlay */}
                    {config.backgroundImage && (
                        <div className="absolute inset-0 z-0">
                            <img src={config.backgroundImage} alt="" className="w-full h-full object-cover opacity-30" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 z-0"></div>

                    {/* Result overlay */}
                    <div className="absolute top-8 w-full flex justify-center z-30">
                        {gameState === 'FINISHED' && resultSegment && (
                            <motion.div
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="bg-black/80 border-2 px-8 py-4 rounded-2xl flex flex-col items-center"
                                style={{
                                    borderColor: accentColor,
                                    boxShadow: `0 0 20px ${accentColor}50`,
                                }}
                            >
                                {resultSegment.specialType === 'respin' ? (
                                    <>
                                        <span className="text-2xl mb-1">🔄</span>
                                        <span className="text-xl font-black text-amber-400 uppercase tracking-widest">FREE RESPIN!</span>
                                    </>
                                ) : resultSegment.specialType === 'multiplier_x2' ? (
                                    <>
                                        <span className="text-2xl mb-1">✖️2</span>
                                        <span className="text-xl font-black text-amber-400 uppercase tracking-widest">NEXT SPIN ×2!</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="text-slate-300 font-black uppercase tracking-widest text-sm mb-1">{resultSegment.label}</span>
                                        <span className="text-4xl font-black" style={{ color: accentColor }}>
                                            {(resultSegment.multiplier * nextMultiplierBonus)}x
                                        </span>
                                        {nextMultiplierBonus > 1 && (
                                            <span className="text-xs text-amber-400 font-bold mt-1">
                                                ({resultSegment.multiplier}x × {nextMultiplierBonus} bonus)
                                            </span>
                                        )}
                                    </>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* WHEEL CONTAINER */}
                    <div className="relative z-10 w-72 h-72 sm:w-[380px] sm:h-[380px]">
                        {/* Pointer */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
                            {config.pointerStyle === 'custom' && config.pointerImage ? (
                                <img src={config.pointerImage} alt="pointer" className="w-10 h-12 object-contain drop-shadow-lg" />
                            ) : pointerEmoji ? (
                                <span className="text-4xl drop-shadow-lg" style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}>
                                    {pointerEmoji}
                                </span>
                            ) : (
                                <div className="w-8 h-10 border-2 border-white drop-shadow-md"
                                    style={{
                                        backgroundColor: accentColor,
                                        clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
                                        filter: `drop-shadow(0 0 10px ${accentColor})`,
                                    }}
                                />
                            )}
                        </div>

                        {/* Canvas Wheel */}
                        <canvas
                            ref={canvasRef}
                            width={400}
                            height={400}
                            className="w-full h-full rounded-full"
                            style={{
                                filter: config.wheelTexture === 'neon'
                                    ? `drop-shadow(0 0 30px ${accentColor}30)`
                                    : 'none',
                            }}
                        />
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
