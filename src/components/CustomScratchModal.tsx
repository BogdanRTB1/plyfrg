"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, RotateCcw, Minus, Plus, MoreHorizontal, Zap } from 'lucide-react';
import { DiamondIcon, ForgesCoinIcon } from './CurrencyIcons';
import MobileGameHudBar, { MobileHudBetRow, MobileHudCurrencyToggle } from './MobileGameHudBar';
import { resumeGameAudio } from '@/utils/gameAudioContext';
import { playSynthSound } from '@/utils/playSynthSound';

interface CustomScratchModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameData: any;
    diamonds: number;
    setDiamonds: (d: number | ((prev: number) => number)) => void;
    forgesCoins: number;
    setForgesCoins: (f: number | ((prev: number) => number)) => void;
}

export default function CustomScratchModal({
    isOpen, onClose, gameData,
    diamonds, setDiamonds, forgesCoins, setForgesCoins
}: CustomScratchModalProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [engineReady, setEngineReady] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [bet, setBet] = useState(10);
    const [currency, setCurrency] = useState<'diamonds' | 'forgesCoins'>('diamonds');
    const [lastWin, setLastWin] = useState<number | null>(null);
    const [totalProfit, setTotalProfit] = useState(0);
    const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

    const balance = currency === 'diamonds' ? diamonds : forgesCoins;
    const intBalance = Math.max(1, Math.floor(balance));

    // Send config on engine ready
    const sendConfig = useCallback(() => {
        const config = gameData?.scratchConfig || gameData?.config;
        if (!iframeRef.current?.contentWindow || !config) return;
        iframeRef.current.contentWindow.postMessage({
            type: 'SCRATCH_CONFIG',
            config: config
        }, '*');
    }, [gameData]);

    useEffect(() => {
        if (!isOpen) {
            setMobileMoreOpen(false);
            setEngineReady(false);
            setIsPlaying(false);
            setLastWin(null);
            return;
        }

        const handleMessage = (event: MessageEvent) => {
            if (!event.data || typeof event.data !== 'object') return;

            if (event.data.type === 'GAME_READY' && event.data.engine === 'scratch') {
                setEngineReady(true);
                sendConfig();
            }

            if (event.data.type === 'PLAY_SOUND' && event.data.soundType) {
                playSynthSound(event.data.soundType);
            }

            if (event.data.type === 'SCRATCH_RESULT') {
                setIsPlaying(false);
                if (event.data.win && event.data.multiplier > 0) {
                    const winAmt = Math.round(bet * event.data.multiplier);
                    setLastWin(winAmt);
                    setTotalProfit(prev => prev + winAmt - bet);
                    if (currency === 'diamonds') {
                        setDiamonds((prev: number) => prev + winAmt);
                    } else {
                        setForgesCoins((prev: number) => prev + winAmt);
                    }
                } else {
                    setLastWin(0);
                    setTotalProfit(prev => prev - bet);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [isOpen, bet, currency, sendConfig, setDiamonds, setForgesCoins]);

    const handlePlay = () => {
        if (isPlaying || !engineReady) return;
        if (balance < bet) {
            alert('Insufficient balance!');
            return;
        }

        // Deduct bet
        if (currency === 'diamonds') {
            setDiamonds((prev: number) => prev - bet);
        } else {
            setForgesCoins((prev: number) => prev - bet);
        }

        resumeGameAudio();
        setIsPlaying(true);
        setLastWin(null);

        iframeRef.current?.contentWindow?.postMessage({
            type: 'START_GAME',
            bet
        }, '*');
    };

    const handleReset = () => {
        setIsPlaying(false);
        setLastWin(null);
        iframeRef.current?.contentWindow?.postMessage({ type: 'RESET' }, '*');
    };

    if (!isOpen) return null;

    const accent = gameData?.themeColor || gameData?.scratchConfig?.theme?.accentColor || '#f59e0b';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black md:bg-black/80 backdrop-blur-none md:backdrop-blur-sm z-[9999] flex items-stretch md:items-center justify-center p-0 md:p-4 overflow-hidden"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-[#0b1622] rounded-none md:rounded-[28px] border border-white/10 w-full max-w-2xl h-[100dvh] max-h-[100dvh] md:h-auto md:max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col min-h-0"
                    style={{ boxShadow: `0 0 60px ${accent}20` }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                style={{ background: `${accent}20` }}>
                                🎟️
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white tracking-tight">
                                    {gameData?.name || 'Scratch Card'}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    by {gameData?.creatorName || 'Creator'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Engine */}
                    <div className="relative bg-[#060b11] flex-1 min-h-0 md:h-[420px] md:flex-none md:shrink-0">
                        <iframe
                            ref={iframeRef}
                            src="/engines/scratch-engine.html"
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                            title="Scratch Card Game"
                        />
                        {!engineReady && (
                            <div className="absolute inset-0 bg-[#060b11] flex items-center justify-center">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="animate-spin" size={32} style={{ color: accent }} />
                                    <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Loading...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <MobileGameHudBar
                        style={{ backgroundColor: "#0b1622" }}
                        className="border-white/10 md:hidden"
                        left={
                            <MobileHudBetRow
                                betAmount={bet}
                                balance={intBalance}
                                onBetChange={(n) => setBet(Math.max(1, Math.min(intBalance, n)))}
                                disabled={isPlaying}
                                clampMin={1}
                                integerOnly
                                quickBtnClassName="shrink-0 rounded-lg border border-white/10 bg-[#0a111a] px-2 py-2 text-[11px] font-black text-slate-200 active:scale-95 disabled:opacity-40 min-h-[40px] min-w-[34px]"
                                inputClassName="min-h-[40px] min-w-[3rem] flex-1 basis-0 max-w-[6.75rem] rounded-lg border border-white/10 bg-[#0a111a] px-1 py-1 text-center text-[11px] font-mono font-bold text-white outline-none focus:opacity-100 disabled:opacity-40"
                            />
                        }
                        center={
                            <button
                                type="button"
                                onClick={handlePlay}
                                disabled={isPlaying || !engineReady || balance < bet}
                                className="flex h-[68px] w-[68px] items-center justify-center rounded-full text-white active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
                                style={{
                                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                    boxShadow: `0 0 22px ${accent}55`,
                                }}
                                aria-label="New card"
                            >
                                {isPlaying ? <Loader2 className="h-7 w-7 animate-spin" /> : <Zap className="h-7 w-7" strokeWidth={2.2} />}
                            </button>
                        }
                        right={
                            <>
                                <button type="button" disabled={isPlaying} onClick={() => setBet(Math.max(1, Math.floor(balance)))} className="shrink-0 rounded-lg border px-3 py-3 text-xs font-black active:scale-95 disabled:opacity-40" style={{ color: accent, borderColor: `${accent}50`, background: "#0a111a" }}>MAX</button>
                                <MobileHudCurrencyToggle
                                    isGC={currency === "diamonds"}
                                    disabled={isPlaying}
                                    onToggle={() => setCurrency((c) => (c === "diamonds" ? "forgesCoins" : "diamonds"))}
                                />
                                <button type="button" onClick={() => setMobileMoreOpen(true)} className="shrink-0 rounded-lg border border-white/10 bg-[#0a111a] p-2.5 text-slate-300 active:bg-white/10" aria-label="More options"><MoreHorizontal className="h-5 w-5" /></button>
                            </>
                        }
                    />

                    {/* Controls — desktop */}
                    <div className="hidden border-t border-white/10 p-3 sm:p-5 md:block md:space-y-4 md:pb-5">
                        {/* Bet & Currency */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Bet Amount</label>
                                <div className="flex items-center gap-2 bg-[#0a111a] rounded-xl border border-white/10 p-1">
                                    <button onClick={() => setBet(Math.max(1, bet - 5))}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                                        <Minus size={14} />
                                    </button>
                                    <input type="number" value={bet} min={1}
                                        onChange={(e) => setBet(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="flex-1 bg-transparent text-center text-white font-bold text-lg focus:outline-none" />
                                    <button onClick={() => setBet(bet + 5)}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors">
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Currency</label>
                                <div className="flex bg-[#0a111a] rounded-xl border border-white/10 p-1 gap-1">
                                    <button onClick={() => setCurrency('diamonds')}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${currency === 'diamonds' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-white'}`}>
                                        <DiamondIcon className="w-3.5 h-3.5" /> {Math.floor(diamonds)}
                                    </button>
                                    <button onClick={() => setCurrency('forgesCoins')}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${currency === 'forgesCoins' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:text-white'}`}>
                                        <ForgesCoinIcon className="w-4 h-4" /> {forgesCoins.toFixed(2)}
                                    </button>
                                </div>
                            </div>

                            {lastWin !== null && (
                                <div className="text-center">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Last Result</label>
                                    <div className={`text-lg font-black ${lastWin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {lastWin > 0 ? `+${lastWin}` : `−${bet}`}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={handlePlay}
                                disabled={isPlaying || !engineReady || balance < bet}
                                className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white hover:brightness-110 hover:-translate-y-0.5"
                                style={{
                                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                    boxShadow: `0 4px 20px ${accent}40`
                                }}
                            >
                                {isPlaying ? (
                                    <><Loader2 className="animate-spin" size={16} /> Scratching...</>
                                ) : (
                                    '🎟️ New Card'
                                )}
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 rounded-xl bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 font-bold flex items-center gap-2 border border-white/5 transition-colors"
                            >
                                <RotateCcw size={16} /> Reset
                            </button>
                        </div>

                        {/* Profit tracker */}
                        <div className="flex items-center justify-center gap-6 text-xs">
                            <span className="text-slate-500 font-bold">Session Profit:</span>
                            <span className={`font-black ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {totalProfit >= 0 ? '+' : ''}{totalProfit}
                            </span>
                        </div>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {mobileMoreOpen && (
                        <motion.div key="scratch-mobile-more" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[10002] flex flex-col justify-end md:hidden" onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="min-h-0 flex-1 bg-black/55" aria-label="Close menu" onClick={() => setMobileMoreOpen(false)} />
                            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 320 }} className="max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain rounded-t-2xl border border-white/10 border-b-0 bg-[#0b1622] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
                                <p className="mb-3 text-center text-sm font-bold text-white">{gameData?.name || "Scratch"}</p>
                                <div className="mb-4 flex flex-wrap gap-2">
                                    <button type="button" onClick={handleReset} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-slate-200 active:bg-white/10">
                                        <RotateCcw size={16} /> Reset
                                    </button>
                                </div>
                                {lastWin !== null && (
                                    <div className="mb-4 rounded-xl border border-white/10 bg-[#0a111a] p-3 text-center">
                                        <span className="text-[10px] font-bold uppercase text-slate-500">Last result</span>
                                        <div className={`mt-1 text-lg font-black ${lastWin > 0 ? "text-green-400" : "text-red-400"}`}>{lastWin > 0 ? `+${lastWin}` : `−${bet}`}</div>
                                    </div>
                                )}
                                <div className="mb-4 flex items-center justify-center gap-2 text-xs">
                                    <span className="font-bold text-slate-500">Session:</span>
                                    <span className={`font-black ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{totalProfit >= 0 ? "+" : ""}{totalProfit}</span>
                                </div>
                                <button type="button" onClick={() => setMobileMoreOpen(false)} className="w-full rounded-xl border border-white/10 bg-[#1a2c38] py-3 text-sm font-bold text-white active:bg-white/10">Done</button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </AnimatePresence>
    );
}
