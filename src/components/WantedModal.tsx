"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Skull, Zap, ChevronLeft, ChevronRight } from "lucide-react";
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

type Lane = 0 | 1 | 2;
type GameState = "IDLE" | "COUNTDOWN" | "PLAYING" | "BUSTED" | "CASHED_OUT";

type Obstacle = {
    id: number;
    lane: Lane;
    x: number;
};

type RuntimeState = {
    elapsedMs: number;
    multiplier: number;
    nextSpawnInMs: number;
    obstacleId: number;
    obstacles: Obstacle[];
};

export default function WantedModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<'GC' | 'FC'>('GC');
    const balance = currencyType === 'GC' ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number, currency: 'GC' | 'FC', mult: number } | null>(null);

    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<GameState>("IDLE");
    const [countdown, setCountdown] = useState(3);
    const [multiplier, setMultiplier] = useState(1);
    const [playerLane, setPlayerLane] = useState<Lane>(1);
    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [elapsedMs, setElapsedMs] = useState(0);
    const [nearMissFlash, setNearMissFlash] = useState(false);

    const intervalRef = useRef<number | null>(null);
    const countdownRef = useRef<number | null>(null);
    const nearMissTimeoutRef = useRef<number | null>(null);
    const runtimeRef = useRef<RuntimeState>({
        elapsedMs: 0,
        multiplier: 1,
        nextSpawnInMs: 1000,
        obstacleId: 1,
        obstacles: [],
    });
    const roundIdRef = useRef(0);
    const playerLaneRef = useRef<Lane>(1);

    const SAFE_WINDOW_MS = 1400;
    const TICK_MS = 50;
    const PLAYER_X = 16;
    const COLLISION_MIN_X = 10;
    const COLLISION_MAX_X = 24;

    const clearAllTimers = () => {
        if (intervalRef.current !== null) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        if (countdownRef.current !== null) {
            window.clearInterval(countdownRef.current);
            countdownRef.current = null;
        }
        if (nearMissTimeoutRef.current !== null) {
            window.clearTimeout(nearMissTimeoutRef.current);
            nearMissTimeoutRef.current = null;
        }
    };

    const clampLane = (lane: number): Lane => {
        if (lane <= 0) return 0;
        if (lane >= 2) return 2;
        return lane as Lane;
    };

    const computeMultiplier = (elapsed: number) => {
        const seconds = elapsed / 1000;
        const raw = 1 + (seconds * 0.11) + Math.pow(seconds, 1.4) * 0.02;
        return Number(raw.toFixed(2));
    };

    const spawnObstacle = (state: RuntimeState): RuntimeState => {
        const lane = Math.floor(Math.random() * 3) as Lane;
        return {
            ...state,
            obstacleId: state.obstacleId + 1,
            obstacles: [...state.obstacles, { id: state.obstacleId, lane, x: 110 }],
        };
    };

    const advanceObstacles = (state: RuntimeState): RuntimeState => {
        const difficulty = Math.max(0, state.multiplier - 1);
        const speed = 1.8 + difficulty * 0.55;
        const moved = state.obstacles
            .map((obstacle) => ({ ...obstacle, x: obstacle.x - speed }))
            .filter((obstacle) => obstacle.x > -12);
        return { ...state, obstacles: moved };
    };

    const checkCollision = (state: RuntimeState): boolean => {
        if (state.elapsedMs < SAFE_WINDOW_MS) return false;
        return state.obstacles.some((obstacle) => (
            obstacle.lane === playerLaneRef.current &&
            obstacle.x <= COLLISION_MAX_X &&
            obstacle.x >= COLLISION_MIN_X
        ));
    };

    const triggerNearMiss = () => {
        setNearMissFlash(true);
        if (nearMissTimeoutRef.current !== null) {
            window.clearTimeout(nearMissTimeoutRef.current);
        }
        nearMissTimeoutRef.current = window.setTimeout(() => {
            setNearMissFlash(false);
        }, 180);
    };

    const moveLane = (dir: -1 | 0 | 1) => {
        if (gameState !== "PLAYING" && gameState !== "COUNTDOWN") return;
        const target = dir === 0 ? 1 : playerLaneRef.current + dir;
        const nextLane = clampLane(target);
        playerLaneRef.current = nextLane;
        setPlayerLane(nextLane);
    };

    const endRoundAsBusted = (roundId: number) => {
        if (roundId !== roundIdRef.current) return;
        clearAllTimers();
        setGameState("BUSTED");
    };

    const startGame = () => {
        if (balance < betAmount || betAmount <= 0) return;
        clearAllTimers();
        roundIdRef.current += 1;
        const activeRoundId = roundIdRef.current;

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered(prev => prev + betAmount);
        setGameState("COUNTDOWN");
        setCountdown(3);
        setMultiplier(1);
        setElapsedMs(0);
        setPlayerLane(1);
        playerLaneRef.current = 1;
        setObstacles([]);
        setNearMissFlash(false);

        runtimeRef.current = {
            elapsedMs: 0,
            multiplier: 1,
            nextSpawnInMs: 1000,
            obstacleId: 1,
            obstacles: [],
        };

        countdownRef.current = window.setInterval(() => {
            if (activeRoundId !== roundIdRef.current) return;

            setCountdown((prev) => {
                if (prev <= 1) {
                    if (countdownRef.current !== null) {
                        window.clearInterval(countdownRef.current);
                        countdownRef.current = null;
                    }
                    setGameState("PLAYING");

                    intervalRef.current = window.setInterval(() => {
                        if (activeRoundId !== roundIdRef.current) return;

                        let next = { ...runtimeRef.current };
                        next.elapsedMs += TICK_MS;
                        next.multiplier = computeMultiplier(next.elapsedMs);
                        next = advanceObstacles(next);

                        const difficulty = Math.max(0, next.multiplier - 1);
                        next.nextSpawnInMs -= TICK_MS;
                        if (next.nextSpawnInMs <= 0) {
                            next = spawnObstacle(next);
                            const baseCooldown = Math.max(330, 1100 - difficulty * 180);
                            next.nextSpawnInMs = baseCooldown + Math.floor(Math.random() * 220);
                        }

                        const nearMiss = next.obstacles.some((obstacle) => (
                            obstacle.lane !== playerLaneRef.current &&
                            Math.abs(obstacle.lane - playerLaneRef.current) === 1 &&
                            obstacle.x <= 22 &&
                            obstacle.x >= 13
                        ));
                        if (nearMiss) triggerNearMiss();

                        if (checkCollision(next)) {
                            runtimeRef.current = next;
                            endRoundAsBusted(activeRoundId);
                            return;
                        }

                        runtimeRef.current = next;
                        setMultiplier(next.multiplier);
                        setElapsedMs(next.elapsedMs);
                        setObstacles(next.obstacles);
                    }, TICK_MS);

                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const cashOut = () => {
        if (gameState !== "PLAYING") return;
        clearAllTimers();
        setGameState("CASHED_OUT");
        const winAmount = betAmount * multiplier;
        setLastWin({ amount: winAmount, currency: currencyType, mult: multiplier });

        if (currencyType === 'GC') {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout(prev => prev + winAmount);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    const handleBetChange = (amount: number) => {
        if (gameState === "PLAYING" || gameState === "COUNTDOWN") return;
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
                        gameName: "Wanted", 
                        gameImage: "/images/game-influencer-run.png", 
                        wagered: sessionWagered, 
                        payout: sessionPayout, 
                        currency: currencyType 
                    }
                }));
                setSessionWagered(0);
                setSessionPayout(0);
            }

            clearAllTimers();
            roundIdRef.current += 1;
            setGameState("IDLE");
            setCountdown(3);
            setMultiplier(1);
            setElapsedMs(0);
            setPlayerLane(1);
            playerLaneRef.current = 1;
            setObstacles([]);
            setNearMissFlash(false);
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType]);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
                event.preventDefault();
                moveLane(-1);
            } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
                event.preventDefault();
                moveLane(1);
            } else if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
                event.preventDefault();
                moveLane(0);
            } else if (event.code === "Space") {
                event.preventDefault();
                if (gameState === "PLAYING") cashOut();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, gameState, multiplier]);

    useEffect(() => {
        return () => clearAllTimers();
    }, []);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    const laneToY = (lane: Lane) => {
        if (lane === 0) return "22%";
        if (lane === 1) return "50%";
        return "78%";
    };
    const canStart = balance >= betAmount && betAmount > 0;
    const cashoutPreview = betAmount * multiplier;
    const survivalSeconds = (elapsedMs / 1000).toFixed(1);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`${WANTED_CONFIG.theme.background} rounded-2xl w-full max-w-5xl border border-blue-500/20 shadow-[0_0_50px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col md:flex-row h-[600px] sm:h-[700px]`}
            >
                <div className={`w-full md:w-80 ${WANTED_CONFIG.theme.panelBg} p-6 flex flex-col gap-4 border-r border-white/5 z-20`}>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <Skull className={WANTED_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase tracking-widest">Wanted Pursuit</h2>
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
                            <button onClick={() => handleBetChange(betAmount / 2)} disabled={gameState === "PLAYING" || gameState === "COUNTDOWN"} className="bg-[#1a1f2e] hover:bg-[#252b3b] text-blue-200 hover:text-white text-xs font-bold py-2 rounded-lg border border-blue-500/20 transition-colors">1/2</button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === "PLAYING" || gameState === "COUNTDOWN"} className="bg-[#1a1f2e] hover:bg-[#252b3b] text-blue-200 hover:text-white text-xs font-bold py-2 rounded-lg border border-blue-500/20 transition-colors">2X</button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === "PLAYING" || gameState === "COUNTDOWN"} className={`bg-[#1a1f2e] hover:bg-[#252b3b] ${WANTED_CONFIG.theme.accent} text-xs font-black py-2 rounded-lg border border-blue-500/30 transition-colors`}>MAX</button>
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
                        {gameState === "PLAYING" ? (
                            <button onClick={cashOut} className="w-full bg-green-500 hover:bg-green-400 text-black h-16 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(34,197,94,0.4)] relative overflow-hidden group">
                                <span className="relative z-10 flex flex-col items-center justify-center">
                                    <span className="text-base flex items-center gap-2"><Trophy size={18} /> CASHOUT</span>
                                    <span className="text-xs font-mono opacity-80 mt-[-2px]">Win {cashoutPreview.toFixed(2)}</span>
                                </span>
                            </button>
                        ) : (
                            <button onClick={startGame} disabled={!canStart} className={`w-full ${WANTED_CONFIG.theme.buttonAccent} hover:brightness-110 text-white h-14 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(59,130,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group`}>
                                <span className="relative z-10 flex gap-2 items-center justify-center">
                                    <Zap size={20} /> START RUN
                                </span>
                            </button>
                        )}
                        <div className="text-[11px] text-slate-500 text-center font-mono">
                            Controls: A/D or Arrow Left/Right, S for center, Space cashout
                        </div>
                    </div>
                </div>

                <div className={`flex-1 relative ${WANTED_CONFIG.theme.gameBg} overflow-hidden shadow-inner flex flex-col`}>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0b1325] via-[#060b16] to-[#030406]" />
                    <div className={`absolute inset-0 transition-opacity duration-200 ${nearMissFlash ? "opacity-100 bg-yellow-200/5" : "opacity-0"}`} />

                    <div className="relative z-20 p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">State</p>
                                <p className="text-sm font-bold text-white">{gameState}</p>
                            </div>
                            <div className="bg-black/50 border border-blue-500/30 rounded-xl px-5 py-2 min-w-[170px] text-center">
                                <p className="text-[10px] uppercase tracking-wider text-blue-300">Multiplier</p>
                                <p className="text-3xl font-black text-white font-mono">{multiplier.toFixed(2)}x</p>
                            </div>
                            <div className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-right">
                                <p className="text-[10px] uppercase tracking-wider text-slate-400">Survival</p>
                                <p className="text-sm font-bold text-white">{survivalSeconds}s</p>
                            </div>
                        </div>
                        <div className="mt-3 text-sm text-slate-300 font-medium">
                            Payout Preview: <span className="font-mono font-bold text-green-400">{cashoutPreview.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 mx-6 mb-5 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                        {[0, 1, 2].map((lane) => (
                            <div
                                key={lane}
                                className="absolute left-0 right-0 border-t border-white/10"
                                style={{ top: laneToY(lane as Lane), transform: "translateY(-50%)" }}
                            />
                        ))}

                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.08), rgba(255,255,255,0.08) 2px, transparent 2px, transparent 40px)" }} />

                        <motion.div
                            className="absolute h-12 w-12 rounded-xl bg-cyan-400/90 border-2 border-white shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center justify-center"
                            animate={{ top: laneToY(playerLane), left: `${PLAYER_X}%` }}
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                            style={{ transform: "translate(-50%, -50%)" }}
                        >
                            <span className="text-[#02222d] font-black">YOU</span>
                        </motion.div>

                        {obstacles.map((obstacle) => (
                            <motion.div
                                key={obstacle.id}
                                className="absolute h-10 w-10 rounded-lg bg-red-500 border border-red-300 shadow-[0_0_12px_rgba(239,68,68,0.55)]"
                                style={{
                                    top: laneToY(obstacle.lane),
                                    left: `${obstacle.x}%`,
                                    transform: "translate(-50%, -50%)",
                                }}
                            />
                        ))}

                        {gameState === "COUNTDOWN" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                                <div className="text-center">
                                    <p className="text-xs uppercase tracking-widest text-slate-300 mb-2">Get Ready</p>
                                    <p className="text-7xl font-black text-white">{countdown}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative z-20 mb-6 px-6">
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => moveLane(-1)}
                                disabled={gameState !== "PLAYING" && gameState !== "COUNTDOWN"}
                                className="h-12 rounded-xl bg-[#141922] border border-white/10 text-white font-bold hover:bg-[#1b2330] disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                <ChevronLeft size={16} /> LEFT
                            </button>
                            <button
                                onClick={() => moveLane(0)}
                                disabled={gameState !== "PLAYING" && gameState !== "COUNTDOWN"}
                                className="h-12 rounded-xl bg-[#141922] border border-white/10 text-white font-bold hover:bg-[#1b2330] disabled:opacity-40"
                            >
                                CENTER
                            </button>
                            <button
                                onClick={() => moveLane(1)}
                                disabled={gameState !== "PLAYING" && gameState !== "COUNTDOWN"}
                                className="h-12 rounded-xl bg-[#141922] border border-white/10 text-white font-bold hover:bg-[#1b2330] disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                RIGHT <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {gameState === "BUSTED" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-[60] bg-red-950/65 backdrop-blur-sm pointer-events-none"
                            >
                                <div className="text-center border border-red-400/40 p-10 rounded-3xl bg-black/70">
                                    <Skull className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                    <h1 className="text-4xl font-black text-red-400 uppercase tracking-wider mb-2">Busted</h1>
                                    <p className="text-red-200 font-mono">Lost {betAmount.toFixed(2)} {currencyType}</p>
                                </div>
                            </motion.div>
                        )}
                        {gameState === "CASHED_OUT" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex items-center justify-center z-[60] bg-green-950/65 backdrop-blur-sm pointer-events-none"
                            >
                                <div className="text-center border border-green-400/40 p-10 rounded-3xl bg-black/70">
                                    <h1 className="text-4xl font-black text-green-400 uppercase tracking-wider mb-2">Escaped</h1>
                                    <p className="text-white font-mono text-xl">{multiplier.toFixed(2)}x</p>
                                    <p className="text-green-300 font-mono mt-1">+{lastWin?.amount.toFixed(2)} {currencyType}</p>
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
