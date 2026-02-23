"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, RotateCw } from "lucide-react";
import confetti from "canvas-confetti";
import { createPortal } from "react-dom";

interface PlinkoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PlinkoModal({ isOpen, onClose }: PlinkoModalProps) {
    const [balance, setBalance] = useState(1000);
    const [betAmount, setBetAmount] = useState(10);
    const [history, setHistory] = useState<number[]>([]);
    const [dropping, setDropping] = useState(false);
    const [pins, setPins] = useState<{ x: number; y: number }[]>([]);
    const [ballPath, setBallPath] = useState<{ x: number; y: number }[]>([]);

    // Refs for cleanup
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Game constants
    const ROWS = 16;
    const PIN_SIZE = 4;
    const BALL_SIZE = 8;
    const WIDTH = 600;
    const HEIGHT = 400;
    const MULTIPLIERS = [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110];

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

        setBalance(prev => prev - betAmount);
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
                    // Determine multiplier - logic simplified for determinism/demo
                    const randomBucketForDemo = Math.floor(Math.random() * MULTIPLIERS.length);
                    const multiplier = MULTIPLIERS[randomBucketForDemo];

                    const winAmount = betAmount * multiplier;
                    setBalance(prev => prev + winAmount);
                    setHistory(prev => [multiplier, ...prev].slice(0, 5));

                    if (multiplier >= 10) {
                        confetti({
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
    }, [dropping, balance, betAmount, ROWS, WIDTH, HEIGHT, MULTIPLIERS]);

    // Handle closing via parent prop, ensure cleanup
    useEffect(() => {
        if (!isOpen) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            setDropping(false);
            setBallPath([]);
        }
    }, [isOpen]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    // Safe ball position access
    const lastBallPos = ballPath.length > 0 ? ballPath[ballPath.length - 1] : null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0f212e] rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]"
            >
                {/* Controls */}
                <div className="w-full md:w-80 bg-[#1a2c38] p-6 flex flex-col gap-6 border-r border-white/5">
                    <div className="flex justify-between items-center md:hidden mb-4">
                        <h2 className="text-xl font-bold text-white">Plinko</h2>
                        <button onClick={onClose}><X className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Bet Amount</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(Number(e.target.value))}
                                className="w-full bg-[#0f212e] border border-white/10 rounded-lg p-3 text-white font-bold focus:border-[#00b9f0] outline-none"
                            />
                            <div className="absolute right-2 top-1.5 flex gap-1">
                                <button onClick={() => setBetAmount(prev => Math.max(1, prev / 2))} className="px-2 py-1.5 bg-[#2f4553] rounded text-xs text-white font-bold hover:bg-[#3d5564]">½</button>
                                <button onClick={() => setBetAmount(prev => prev * 2)} className="px-2 py-1.5 bg-[#2f4553] rounded text-xs text-white font-bold hover:bg-[#3d5564]">2×</button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={dropBall}
                        disabled={dropping || balance < betAmount}
                        className="w-full md:mt-auto bg-[#00b9f0] hover:bg-[#38bdf8] disabled:opacity-50 disabled:cursor-not-allowed text-[#0f212e] h-14 rounded-xl font-black text-lg shadow-[0_4px_0_#0090bc] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-2"
                    >
                        {dropping ? <RotateCw className="animate-spin" /> : 'BET'}
                    </button>

                    <div className="bg-[#0f212e] p-4 rounded-xl border border-white/5">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Balance</p>
                        <p className="text-white text-xl font-mono">${balance.toFixed(2)}</p>
                    </div>
                </div>

                {/* Game Board */}
                <div className="flex-1 relative bg-[#0f212e] p-4 overflow-hidden flex flex-col">
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
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <X className="text-slate-400 hover:text-white" />
                        </button>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center">
                        <div className="relative" style={{ width: WIDTH, height: HEIGHT }}>
                            {/* Pins */}
                            {pins.map((pin, i) => (
                                <div
                                    key={i}
                                    className="absolute rounded-full bg-white shadow-[0_0_5px_white]"
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
                                    className="absolute bg-[#00b9f0] rounded-full shadow-[0_0_10px_#00b9f0] z-10"
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
            </motion.div>
        </div>,
        document.body
    );
}
