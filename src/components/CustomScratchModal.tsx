"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, RotateCcw, Minus, Plus } from 'lucide-react';
import { DiamondIcon, ForgesCoinIcon } from './CurrencyIcons';

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

    const balance = currency === 'diamonds' ? diamonds : forgesCoins;

    // Send config on engine ready
    const sendConfig = useCallback(() => {
        if (!iframeRef.current?.contentWindow || !gameData?.scratchConfig) return;
        iframeRef.current.contentWindow.postMessage({
            type: 'SCRATCH_CONFIG',
            config: gameData.scratchConfig
        }, '*');
    }, [gameData]);

    useEffect(() => {
        if (!isOpen) {
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
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-[#0b1622] rounded-[28px] border border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl relative"
                    style={{ boxShadow: `0 0 60px ${accent}20` }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/10">
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
                    <div className="relative bg-[#060b11]" style={{ height: '420px' }}>
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

                    {/* Controls */}
                    <div className="p-5 border-t border-white/10 space-y-4">
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
            </motion.div>
        </AnimatePresence>
    );
}
