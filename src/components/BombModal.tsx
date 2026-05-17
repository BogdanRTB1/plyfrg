"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Scissors, Trophy, Bomb, ShieldAlert, MoreHorizontal } from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createPortal } from "react-dom";
import FavoriteToggle from "./FavoriteToggle";
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from "./MobileGameHudBar";
import { fireWinConfetti } from "@/utils/winConfetti";
import { playGameSound, resumeOriginalGameAudio } from "@/utils/originalGameSounds";
import {
    ORIGINALS_PAYOUT,
    BOMB_ROUND_SECONDS,
    allBombSafeWiresCut,
    bombMultiplierFromSafeCuts,
    createBombWires,
    type BombWireState,
} from "@/utils/originalsMath";

const BOMB_CONFIG = {
    names: { title: "Defuse" },
    theme: { accent: "text-red-500" },
};

export default function BombModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: any) {
    const [currencyType, setCurrencyType] = useState<"GC" | "FC">("GC");
    const balance = currencyType === "GC" ? diamonds : forgesCoins;
    const [betAmount, setBetAmount] = useState(10);
    const [lastWin, setLastWin] = useState<{ amount: number; currency: "GC" | "FC" } | null>(null);

    const [sessionWagered, setSessionWagered] = useState(0);
    const [sessionPayout, setSessionPayout] = useState(0);

    const [gameState, setGameState] = useState<"IDLE" | "PLAYING" | "EXPLODED" | "WON">("IDLE");
    const [multiplier, setMultiplier] = useState(1.0);
    const [timeLeft, setTimeLeft] = useState(BOMB_ROUND_SECONDS);
    const [safeCuts, setSafeCuts] = useState(0);
    const [wires, setWires] = useState<BombWireState[]>([]);
    const [shake, setShake] = useState(false);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const safeCutsRef = useRef(0);

    const payoutPreview = (mult: number) => betAmount * mult * ORIGINALS_PAYOUT.bomb;

    const clearTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const explode = () => {
        clearTimer();
        playGameSound("bomb", "lose");
        setGameState("EXPLODED");
        setShake(true);
    };

    const startGame = () => {
        if (balance < betAmount) return;

        if (currencyType === "GC") {
            setDiamonds((prev: number) => prev - betAmount);
        } else {
            setForgesCoins((prev: number) => prev - betAmount);
        }

        setSessionWagered((prev) => prev + betAmount);
        playGameSound("bomb", "bet");

        setGameState("PLAYING");
        setMultiplier(1.0);
        setSafeCuts(0);
        safeCutsRef.current = 0;
        setTimeLeft(BOMB_ROUND_SECONDS);
        setShake(false);
        setWires(createBombWires());

        clearTimer();
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0.1) {
                    explode();
                    return 0;
                }
                return Number((prev - 0.1).toFixed(1));
            });
        }, 100);
    };

    const cutWire = (index: number) => {
        if (gameState !== "PLAYING") return;

        const wire = wires[index];
        if (wire.cut) return;

        const newWires = [...wires];
        newWires[index].cut = true;
        setWires(newWires);

        if (wire.bad) {
            explode();
            return;
        }

        playGameSound("bomb", "reveal");
        const nextSafe = safeCutsRef.current + 1;
        safeCutsRef.current = nextSafe;
        setSafeCuts(nextSafe);
        setMultiplier(bombMultiplierFromSafeCuts(nextSafe));

        if (allBombSafeWiresCut(newWires)) {
            cashOut(nextSafe);
        }
    };

    const cashOut = (forcedSafeCuts?: number) => {
        if (gameState !== "PLAYING") return;

        const cuts = forcedSafeCuts ?? safeCutsRef.current;
        if (cuts < 1) return;

        clearTimer();
        const mult = bombMultiplierFromSafeCuts(cuts);
        setMultiplier(mult);
        setGameState("WON");

        const winAmount = betAmount * mult * ORIGINALS_PAYOUT.bomb;
        setLastWin({ amount: winAmount, currency: currencyType });

        if (currencyType === "GC") {
            setDiamonds((prev: number) => prev + winAmount);
        } else {
            setForgesCoins((prev: number) => prev + winAmount);
        }

        setSessionPayout((prev) => prev + winAmount);
        playGameSound("bomb", "win");
        fireWinConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };

    const handleBetChange = (amount: number) => {
        if (gameState === "PLAYING") return;
        let newAmount = Math.max(0, amount);
        if (newAmount > balance) newAmount = balance;
        setBetAmount(Number(newAmount.toFixed(2)));
    };

    const canCashOut = gameState === "PLAYING" && safeCuts >= 1;

    useEffect(() => {
        if (isOpen) resumeOriginalGameAudio();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setMobileMoreOpen(false);
            if (sessionWagered > 0) {
                window.dispatchEvent(
                    new CustomEvent("game_session_complete", {
                        detail: {
                            gameName: "Defuse",
                            gameImage: "/images/game-bomb-v2.png",
                            wagered: sessionWagered,
                            payout: sessionPayout,
                            currency: currencyType,
                        },
                    })
                );
                setSessionWagered(0);
                setSessionPayout(0);
            }

            clearTimer();
            setGameState("IDLE");
            setSafeCuts(0);
            safeCutsRef.current = 0;
        }
    }, [isOpen, sessionWagered, sessionPayout, currencyType]);

    if (!isOpen) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden bg-black md:bg-black/80 backdrop-blur-none md:backdrop-blur-sm"
        >
            <div className="bg-[#0f212e] rounded-none md:rounded-2xl w-full max-w-4xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.1)] overflow-hidden flex flex-col-reverse md:flex-row h-[100dvh] max-h-[100dvh] md:h-[600px] md:max-h-[90vh] min-h-0">
                <MobileGameHudBar
                    className="bg-[#121c22]"
                    left={
                        <MobileHudBetRow
                            betAmount={betAmount}
                            balance={balance}
                            onBetChange={handleBetChange}
                            disabled={gameState === "PLAYING"}
                        />
                    }
                    center={
                        gameState === "PLAYING" ? (
                            <button
                                type="button"
                                onClick={() => cashOut()}
                                disabled={!canCashOut}
                                className="flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-[10px] font-black uppercase leading-tight text-white shadow-[0_0_20px_rgba(34,197,94,0.45)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                            >
                                <Scissors className="mb-0.5 h-5 w-5" />
                                <span className="text-[10px]">{canCashOut ? payoutPreview(multiplier).toFixed(0) : "—"}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={startGame}
                                disabled={balance < betAmount || betAmount <= 0}
                                className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-500 text-white shadow-[0_0_22px_rgba(239,68,68,0.35)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                                aria-label="Arm bomb"
                            >
                                <Bomb className="h-7 w-7" strokeWidth={2.2} />
                            </button>
                        )
                    }
                    right={
                        <>
                            <button
                                type="button"
                                disabled={gameState === "PLAYING"}
                                onClick={() => handleBetChange(balance)}
                                className="shrink-0 rounded-lg border border-red-500/30 bg-[#1a2c38] px-3 py-3 text-xs font-black text-red-400 active:scale-95 disabled:opacity-40"
                            >
                                MAX
                            </button>
                            <MobileHudCurrencyToggle
                                isGC={currencyType === "GC"}
                                disabled={gameState === "PLAYING"}
                                onToggle={() => setCurrencyType((c) => (c === "GC" ? "FC" : "GC"))}
                            />
                            <button
                                type="button"
                                onClick={() => setMobileMoreOpen(true)}
                                className="shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] p-2.5 text-slate-300 active:bg-white/10"
                                aria-label="More options"
                            >
                                <MoreHorizontal className="h-5 w-5" />
                            </button>
                        </>
                    }
                />

                <div className="hidden md:flex md:w-80 md:max-h-none md:shrink-0 md:overflow-y-auto md:overscroll-contain bg-[#121c22] flex-col gap-2 border-r border-white/5 p-3 md:p-6 md:gap-4 z-20">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 text-white">
                            <ShieldAlert className={BOMB_CONFIG.theme.accent} />
                            <h2 className="text-xl font-black uppercase italic tracking-widest">{BOMB_CONFIG.names.title}</h2>
                            <FavoriteToggle gameName={BOMB_CONFIG.names.title} />
                        </div>
                        <button onClick={onClose}>
                            <X className="text-slate-400 hover:text-white" />
                        </button>
                    </div>

                    <div className="bg-[#0f171c] p-1 rounded-xl flex border border-white/5">
                        <button
                            onClick={() => setCurrencyType("GC")}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === "GC" ? "bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.5)]" : "text-slate-400 hover:text-white"}`}
                        >
                            <DiamondIcon className="w-4 h-4" /> GC
                        </button>
                        <button
                            onClick={() => setCurrencyType("FC")}
                            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${currencyType === "FC" ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]" : "text-slate-400 hover:text-white"}`}
                        >
                            <ForgesCoinIcon className="w-4 h-4" /> FC
                        </button>
                    </div>

                    <div className="space-y-2 mt-2">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bet Amount</label>
                            <span className="text-xs font-mono font-bold text-slate-400 bg-black/30 px-2 py-1 rounded-md">
                                Bal: {balance.toFixed(2)}
                            </span>
                        </div>

                        <div className="relative group">
                            <motion.div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                {currencyType === "GC" ? <DiamondIcon className="w-5 h-5 opacity-70" /> : <ForgesCoinIcon className="w-5 h-5 opacity-70" />}
                            </motion.div>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => handleBetChange(Number(e.target.value))}
                                disabled={gameState === "PLAYING"}
                                className="w-full bg-[#0a1114] border border-red-500/30 focus:border-red-500 focus:shadow-[0_0_10px_rgba(239,68,68,0.2)] rounded-xl py-4 pl-10 pr-4 text-white font-mono text-xl font-bold transition-all outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <button onClick={() => handleBetChange(betAmount + 10)} disabled={gameState === "PLAYING"} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">
                                +10
                            </button>
                            <button onClick={() => handleBetChange(betAmount + 50)} disabled={gameState === "PLAYING"} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">
                                +50
                            </button>
                            <button onClick={() => handleBetChange(betAmount * 2)} disabled={gameState === "PLAYING"} className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 hover:text-white text-xs font-bold py-2.5 rounded-lg border border-white/5 transition-colors">
                                2X
                            </button>
                            <button onClick={() => handleBetChange(balance)} disabled={gameState === "PLAYING"} className="bg-[#1a2c38] hover:bg-[#2f4553] text-red-500 text-xs font-black py-2.5 rounded-lg border border-red-500/30 transition-colors">
                                MAX
                            </button>
                        </div>
                    </div>

                    {gameState === "PLAYING" && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-center">
                            Cut a safe wire to cash out · 2 traps on 5 wires
                        </p>
                    )}

                    <div className="mt-2 bg-[#0a1114]/50 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Trophy className="text-green-500 w-4 h-4" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Win</span>
                        </div>
                        {lastWin ? (
                            <span className="text-sm font-black text-green-400 font-mono flex items-center gap-1">
                                +{lastWin.amount.toFixed(2)}{" "}
                                {lastWin.currency === "GC" ? <DiamondIcon className="w-3 h-3" /> : <ForgesCoinIcon className="w-3 h-3" />}
                            </span>
                        ) : (
                            <span className="text-xs font-mono text-slate-600">---</span>
                        )}
                    </div>

                    <div className="mt-auto">
                        {gameState !== "PLAYING" ? (
                            <button
                                onClick={startGame}
                                disabled={balance < betAmount || betAmount <= 0}
                                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-orange-500 text-white h-16 rounded-xl font-black text-xl tracking-widest uppercase transition-all shadow-[0_5px_20px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    <Bomb size={20} /> ARM BOMB
                                </span>
                                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                            </button>
                        ) : (
                            <button
                                onClick={() => cashOut()}
                                disabled={!canCashOut}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white h-16 rounded-xl font-black text-2xl uppercase shadow-[0_0_30px_rgba(34,197,94,0.5)] disabled:opacity-45 disabled:cursor-not-allowed disabled:animate-none animate-pulse hover:scale-[1.02] transition-transform flex flex-col items-center justify-center"
                            >
                                <span>DEFUSE</span>
                                <span className="text-xs text-green-200 mt-[-4px]">
                                    {canCashOut ? `Take ${payoutPreview(multiplier).toFixed(2)}` : "Cut a safe wire first"}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-[#06090c] p-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-2 top-2 z-[80] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-slate-300 backdrop-blur-sm md:hidden active:bg-white/10"
                        aria-label="Close game"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="absolute inset-0 opacity-10 bg-[url('/images/game-bomb-v2.png')] bg-cover bg-center" />

                    {shake && <div className="absolute inset-0 bg-red-600 mix-blend-color z-0" />}

                    <motion.div
                        animate={shake ? { x: [-15, 15, -15, 15, -10, 10, -5, 5, 0], y: [-5, 5, -5, 5, -2, 2, 0] } : {}}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 flex flex-col items-center bg-zinc-900/90 p-8 sm:p-10 rounded-[3rem] border-[8px] border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] w-full max-w-sm sm:max-w-md"
                    >
                        <div
                            className={`w-full bg-red-950/80 border-4 ${gameState === "EXPLODED" ? "border-red-600 shadow-[0_0_30px_#dc2626]" : "border-red-900/50"} px-8 py-6 rounded-2xl mb-12 font-mono text-center relative overflow-hidden`}
                        >
                            <h3
                                className={`text-5xl sm:text-6xl font-black tracking-widest ${gameState === "EXPLODED" ? "text-red-500 animate-pulse" : "text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]"}`}
                            >
                                {timeLeft.toFixed(1)}s
                            </h3>
                            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.2)_2px,rgba(0,0,0,0.2)_4px)] pointer-events-none"></div>
                        </div>

                        <div className="absolute -top-6 bg-zinc-800 border-4 border-zinc-900 px-6 py-2 rounded-xl shadow-lg">
                            <h3 className={`text-3xl font-black ${gameState === "EXPLODED" ? "text-red-500" : gameState === "WON" ? "text-green-500" : "text-white"}`}>
                                {multiplier.toFixed(2)}x
                            </h3>
                        </div>

                        <div className="w-full space-y-3">
                            {wires.map((wire, idx) => (
                                <div key={idx} className="relative w-full h-12 flex items-center justify-center gap-4 group">
                                    <div className="w-4 h-4 rounded-full bg-zinc-700 border-2 border-zinc-500"></div>
                                    <button
                                        onClick={() => cutWire(idx)}
                                        disabled={wire.cut || gameState !== "PLAYING"}
                                        className={`w-full h-4 rounded-full transition-all flex items-center justify-center relative ${wire.color} ${wire.cut ? "opacity-20 translate-y-2 !h-2" : "hover:brightness-125 hover:h-6 cursor-pointer shadow-[0_5px_15px_rgba(0,0,0,0.5)]"}`}
                                    >
                                        {!wire.cut && gameState === "PLAYING" && (
                                            <motion.div className="absolute opacity-0 group-hover:opacity-100 bg-white/20 px-2 py-1 rounded backdrop-blur border border-white/50 text-white flex items-center gap-1 shadow-2xl scale-110 transition-all">
                                                <Scissors size={14} /> Cut
                                            </motion.div>
                                        )}
                                        <div className="absolute inset-x-0 top-1/2 h-px bg-white/20 transform -translate-y-1/2"></div>
                                    </button>
                                    <motion.div className="w-4 h-4 rounded-full bg-zinc-700 border-2 border-zinc-500" />
                                </div>
                            ))}
                        </div>

                        {gameState === "EXPLODED" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-red-950/80 rounded-[2.5rem] backdrop-blur z-20">
                                <span className="text-red-500 text-5xl font-black tracking-widest drop-shadow-[0_0_20px_#ef4444] rotate-[-5deg] border-4 border-red-500 p-4">
                                    BOOM!
                                </span>
                            </div>
                        )}
                        {gameState === "WON" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-950/80 rounded-[2.5rem] backdrop-blur z-20">
                                <span className="text-green-400 text-4xl pr-2 text-center font-black tracking-widest drop-shadow-[0_0_20px_#4ade80] border-4 border-green-500 p-4">
                                    DEFUSED
                                </span>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {mobileMoreOpen && (
                    <motion.div
                        key="bomb-mobile-more"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex flex-col justify-end md:hidden"
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
                            <motion.div className="mb-4 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{BOMB_CONFIG.names.title}</span>
                                <FavoriteToggle gameName={BOMB_CONFIG.names.title} />
                            </motion.div>
                            <div className="mb-4 flex items-center justify-between rounded-xl border border-green-500/20 bg-[#0a1114]/50 p-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400">Last win</span>
                                {lastWin ? (
                                    <span className="flex items-center gap-1 text-sm font-black text-green-400">
                                        +{lastWin.amount.toFixed(2)}{" "}
                                        {lastWin.currency === "GC" ? <DiamondIcon className="h-3 w-3" /> : <ForgesCoinIcon className="h-3 w-3" />}
                                    </span>
                                ) : (
                                    <span className="font-mono text-xs text-slate-600">—</span>
                                )}
                            </div>
                            <button type="button" onClick={() => setMobileMoreOpen(false)} className="w-full rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-white active:bg-white/10">
                                Done
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>,
        document.body
    );
}
