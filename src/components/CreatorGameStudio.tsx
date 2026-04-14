"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, Sparkles, Loader2, Wand2, Save, Upload, ImageIcon, X, Eye,
  RotateCcw, Trash2, Play, Clock, Gamepad2, Palette, Volume2,
  Grid3X3, ToggleLeft, ToggleRight, Zap, Settings2, ChevronDown,
  Rocket, TrendingUp, Gauge, ShieldCheck
} from 'lucide-react';
import {
  SlotConfig, SlotSymbol, GridLayout,
  GRID_PRESETS, VOLATILITY_PRESETS, DEFAULT_SYMBOLS, DEFAULT_SLOT_CONFIG
} from '@/types/slotConfig';
import {
  CrashConfig, DEFAULT_CRASH_CONFIG,
  FLYING_OBJECT_PRESETS, ACCELERATION_PRESETS, HOUSE_EDGE_PRESETS
} from '@/types/crashConfig';
import {
  ScratchConfig, ScratchSymbol, DEFAULT_SCRATCH_CONFIG, DEFAULT_SCRATCH_SYMBOLS,
  GRID_SIZE_PRESETS, BRUSH_SHAPE_PRESETS, WIN_PROBABILITY_PRESETS
} from '@/types/scratchConfig';

// ─── Sound Helper ──────────────────────────────────────────────────────────
const playSynthSound = (type: string) => {
    try {
        if (type === 'spin') {
            const audio = new Audio('/game sounds/slots.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
            return;
        }
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        if (type === 'blip') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        } else if (type === 'win') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
            osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
        } else { return; }
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.0);
    } catch(e) {}
};

// ─── Win Effects ───────────────────────────────────────────────────────────
const WIN_EFFECTS = [
    { id: 'confetti', icon: '🎉', name: 'Confetti' },
    { id: 'fireworks', icon: '🎆', name: 'Fireworks' },
    { id: 'stars', icon: '⭐', name: 'Stars' },
    { id: 'coins', icon: '💰', name: 'Coins' },
    { id: 'none', icon: '❌', name: 'None' },
];

type GameType = 'slots' | 'crash' | 'scratch';

interface CreatorGameStudioProps {
    creatorData: any;
    onGoBack: () => void;
}

export default function CreatorGameStudio({ creatorData, onGoBack }: CreatorGameStudioProps) {
    // ─── Game Type ────────────────────────────────────────────────────────
    const [gameType, setGameType] = useState<GameType>('slots');

    // ─── Slot Config State ─────────────────────────────────────────────────
    const [gridLayout, setGridLayout] = useState<GridLayout>('5x3');
    const [volatility, setVolatility] = useState<'low' | 'medium' | 'high'>('medium');
    const [symbols, setSymbols] = useState<SlotSymbol[]>([...DEFAULT_SYMBOLS]);
    const [gameName, setGameName] = useState('My Slot Game');
    const [gameDescription, setGameDescription] = useState('A custom slot experience');
    const [accentColor, setAccentColor] = useState('#a855f7');
    const [backgroundColor, setBackgroundColor] = useState('#0a111a');
    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
    const [coverImage, setCoverImage] = useState<string | null>(null);

    // ─── Feature Toggles ───────────────────────────────────────────────────
    const [wildEnabled, setWildEnabled] = useState(true);
    const [wildSymbolId, setWildSymbolId] = useState('sym_w');
    const [scatterEnabled, setScatterEnabled] = useState(true);
    const [scatterSymbolId, setScatterSymbolId] = useState('sym_s');
    const [freeSpinsCount, setFreeSpinsCount] = useState(10);
    const [progressiveMultiplier, setProgressiveMultiplier] = useState(false);
    const [tumbleEnabled, setTumbleEnabled] = useState(false);

    // ─── Crash Config State ─────────────────────────────────────────────────
    const [crashFlyingObject, setCrashFlyingObject] = useState(DEFAULT_CRASH_CONFIG.flyingObject);
    const [crashFlyingObjectImage, setCrashFlyingObjectImage] = useState<string | null>(null);
    const [crashCrashImage, setCrashCrashImage] = useState<string | null>(DEFAULT_CRASH_CONFIG.crashImage);
    const [crashBgImage, setCrashBgImage] = useState<string | null>(DEFAULT_CRASH_CONFIG.backgroundImage);
    const [crashAccentColor, setCrashAccentColor] = useState(DEFAULT_CRASH_CONFIG.accentColor);
    const [crashBgColor, setCrashBgColor] = useState(DEFAULT_CRASH_CONFIG.backgroundColor);
    const [crashGraphColor, setCrashGraphColor] = useState(DEFAULT_CRASH_CONFIG.graphColor);
    const [crashMaxMultiplier, setCrashMaxMultiplier] = useState(DEFAULT_CRASH_CONFIG.maxMultiplier);
    const [crashHouseEdge, setCrashHouseEdge] = useState(DEFAULT_CRASH_CONFIG.houseEdge);
    const [crashAcceleration, setCrashAcceleration] = useState(DEFAULT_CRASH_CONFIG.accelerationCurve);
    const [crashGameName, setCrashGameName] = useState(DEFAULT_CRASH_CONFIG.theme.gameName);
    const [crashGameDescription, setCrashGameDescription] = useState(DEFAULT_CRASH_CONFIG.theme.gameDescription);
    const [crashCoverImage, setCrashCoverImage] = useState<string | null>(null);

    // ─── Scratch Config State ────────────────────────────────────────────
    const [scratchGridSize, setScratchGridSize] = useState<'3x3' | '4x3' | '5x3'>(DEFAULT_SCRATCH_CONFIG.gridSize);
    const [scratchSymbols, setScratchSymbols] = useState<ScratchSymbol[]>([...DEFAULT_SCRATCH_SYMBOLS]);
    const [scratchCoverImage, setScratchCoverImage] = useState<string | null>(null);
    const [scratchBrushShape, setScratchBrushShape] = useState<'circle' | 'square' | 'star'>(DEFAULT_SCRATCH_CONFIG.brushShape);
    const [scratchBrushSize, setScratchBrushSize] = useState(DEFAULT_SCRATCH_CONFIG.brushSize);
    const [scratchWinProbability, setScratchWinProbability] = useState(DEFAULT_SCRATCH_CONFIG.winProbability);
    const [scratchAccentColor, setScratchAccentColor] = useState(DEFAULT_SCRATCH_CONFIG.theme.accentColor);
    const [scratchBgColor, setScratchBgColor] = useState(DEFAULT_SCRATCH_CONFIG.theme.backgroundColor);
    const [scratchGameName, setScratchGameName] = useState(DEFAULT_SCRATCH_CONFIG.theme.gameName);
    const [scratchGameDescription, setScratchGameDescription] = useState(DEFAULT_SCRATCH_CONFIG.theme.gameDescription);
    const [scratchLobbyCover, setScratchLobbyCover] = useState<string | null>(null);

    // ─── UI State ──────────────────────────────────────────────────────────
    const [winEffect, setWinEffect] = useState('confetti');
    const [winSound, setWinSound] = useState<string | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState<'design' | 'grid' | 'paytable' | 'features' | 'preview'>('design');
    const [crashActiveSection, setCrashActiveSection] = useState<'design' | 'engine' | 'preview'>('design');
    const [scratchActiveSection, setScratchActiveSection] = useState<'design' | 'paytable' | 'preview'>('design');
    const [engineReady, setEngineReady] = useState(false);
    const [crashEngineReady, setCrashEngineReady] = useState(false);
    const [scratchEngineReady, setScratchEngineReady] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const crashIframeRef = useRef<HTMLIFrameElement>(null);
    const scratchIframeRef = useRef<HTMLIFrameElement>(null);

    // ─── Derived Values ────────────────────────────────────────────────────
    const gridPreset = GRID_PRESETS[gridLayout];
    const rows = gridPreset.rows;
    const cols = gridPreset.cols;

    // ─── Listen for engine messages ────────────────────────────────────────
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!event.data || typeof event.data !== 'object') return;
            if (event.data.type === 'GAME_READY') {
                if (event.data.engine === 'crash') {
                    setCrashEngineReady(true);
                } else if (event.data.engine === 'scratch') {
                    setScratchEngineReady(true);
                } else {
                    setEngineReady(true);
                }
            }
            if (event.data.type === 'PLAY_SOUND' && event.data.soundType) {
                playSynthSound(event.data.soundType);
            }
            if (event.data.type === 'GAME_RESULT' || event.data.type === 'CRASH_RESULT' || event.data.type === 'SCRATCH_RESULT') {
                setIsTesting(false);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []); // Only register listener once

    // ─── Build Config JSON ─────────────────────────────────────────────────
    const buildConfig = useCallback((): SlotConfig => {
        return {
            gridLayout,
            rows: gridPreset.rows,
            cols: gridPreset.cols,
            symbols,
            volatility,
            features: {
                wildEnabled,
                wildSymbolId: wildEnabled ? wildSymbolId : undefined,
                scatterEnabled,
                scatterSymbolId: scatterEnabled ? scatterSymbolId : undefined,
                freeSpinsCount,
                progressiveMultiplier,
                tumbleEnabled,
            },
            theme: {
                gameName,
                gameDescription,
                accentColor,
                backgroundColor,
                backgroundImage: backgroundImage || undefined,
            },
        };
    }, [gridLayout, gridPreset, symbols, volatility, wildEnabled, wildSymbolId, scatterEnabled, scatterSymbolId, freeSpinsCount, progressiveMultiplier, tumbleEnabled, gameName, gameDescription, accentColor, backgroundColor, backgroundImage]);

    // ─── Build Crash Config JSON ──────────────────────────────────────────
    const buildCrashConfig = useCallback((): CrashConfig => {
        return {
            flyingObject: crashFlyingObjectImage || crashFlyingObject,
            crashImage: crashCrashImage,
            backgroundImage: crashBgImage,
            accentColor: crashAccentColor,
            backgroundColor: crashBgColor,
            graphColor: crashGraphColor,
            maxMultiplier: crashMaxMultiplier,
            houseEdge: crashHouseEdge,
            accelerationCurve: crashAcceleration,
            theme: {
                gameName: crashGameName,
                gameDescription: crashGameDescription,
            },
        };
    }, [crashFlyingObject, crashFlyingObjectImage, crashCrashImage, crashBgImage, crashAccentColor, crashBgColor, crashGraphColor, crashMaxMultiplier, crashHouseEdge, crashAcceleration, crashGameName, crashGameDescription]);

    // ─── Send config to engine iframe ──────────────────────────────────────
    const sendConfigToEngine = useCallback(() => {
        if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage({
                type: 'SLOT_CONFIG',
                config: buildConfig()
            }, '*');
        }
    }, [buildConfig]);

    const sendCrashConfigToEngine = useCallback(() => {
        if (crashIframeRef.current?.contentWindow) {
            crashIframeRef.current.contentWindow.postMessage({
                type: 'CRASH_CONFIG',
                config: buildCrashConfig()
            }, '*');
        }
    }, [buildCrashConfig]);

    // Update engine on config changes
    useEffect(() => {
        if (engineReady) {
            const timeout = setTimeout(sendConfigToEngine, 100); // Debounce
            return () => clearTimeout(timeout);
        }
    }, [engineReady, sendConfigToEngine]);

    useEffect(() => {
        if (crashEngineReady) {
            const timeout = setTimeout(sendCrashConfigToEngine, 100); // Debounce
            return () => clearTimeout(timeout);
        }
    }, [crashEngineReady, sendCrashConfigToEngine]);

    // ─── Build Scratch Config JSON ────────────────────────────────────────
    const buildScratchConfig = useCallback((): ScratchConfig => {
        const preset = GRID_SIZE_PRESETS[scratchGridSize];
        return {
            gridSize: scratchGridSize,
            rows: preset.rows,
            cols: preset.cols,
            symbols: scratchSymbols,
            coverImage: scratchCoverImage,
            brushShape: scratchBrushShape,
            brushSize: scratchBrushSize,
            winProbability: scratchWinProbability,
            theme: {
                gameName: scratchGameName,
                gameDescription: scratchGameDescription,
                accentColor: scratchAccentColor,
                backgroundColor: scratchBgColor,
            },
        };
    }, [scratchGridSize, scratchSymbols, scratchCoverImage, scratchBrushShape, scratchBrushSize, scratchWinProbability, scratchGameName, scratchGameDescription, scratchAccentColor, scratchBgColor]);

    const sendScratchConfigToEngine = useCallback(() => {
        if (scratchIframeRef.current?.contentWindow) {
            scratchIframeRef.current.contentWindow.postMessage({
                type: 'SCRATCH_CONFIG',
                config: buildScratchConfig()
            }, '*');
        }
    }, [buildScratchConfig]);

    useEffect(() => {
        if (scratchEngineReady) {
            const timeout = setTimeout(sendScratchConfigToEngine, 100); // Debounce
            return () => clearTimeout(timeout);
        }
    }, [scratchEngineReady, sendScratchConfigToEngine]);

    // ─── Test Spin ─────────────────────────────────────────────────────────
    const handleTestSpin = async () => {
        if (isTesting || !engineReady) return;
        setIsTesting(true);
        
        try {
            const res = await fetch('/api/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config: buildConfig(), bet: 10 })
            });
            const result = await res.json();
            
            // Send result to engine for animation
            iframeRef.current?.contentWindow?.postMessage({
                type: 'START_GAME',
                spinResult: result,
                bet: 10
            }, '*');
        } catch (err) {
            console.error('Test spin error:', err);
            setIsTesting(false);
        }
    };

    // ─── Test Crash Demo ────────────────────────────────────────────────────
    const handleTestCrash = () => {
        if (isTesting || !crashEngineReady) return;
        setIsTesting(true);
        crashIframeRef.current?.contentWindow?.postMessage({ type: 'START_DEMO' }, '*');
        // Auto-reset after a reasonable timeout
        setTimeout(() => setIsTesting(false), 8000);
    };

    // ─── Test Scratch ──────────────────────────────────────────────────────
    const handleTestScratch = () => {
        if (isTesting || !scratchEngineReady) return;
        setIsTesting(true);
        scratchIframeRef.current?.contentWindow?.postMessage({ type: 'RESET' }, '*');
        setTimeout(() => setIsTesting(false), 1000);
    };

    // ─── File Upload Helpers ───────────────────────────────────────────────
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void, maxWidth = 800) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    callback(canvas.toDataURL('image/webp', 0.8));
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSymbolImageUpload = (symbolId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX = 128;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                    else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/webp', 0.85);
                    setSymbols(prev => prev.map(s => s.id === symbolId ? { ...s, image: dataUrl } : s));
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { alert("Audio file too large. Limit: 2MB."); return; }
            const reader = new FileReader();
            reader.onloadend = () => callback(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    // ─── Apply Volatility Preset ───────────────────────────────────────────
    const applyVolatility = (vol: 'low' | 'medium' | 'high') => {
        setVolatility(vol);
        const preset = VOLATILITY_PRESETS[vol];
        setSymbols(prev => prev.map((sym, i) => {
            const tier = i / (prev.length - 1); // 0=lowest, 1=highest
            const scale = 1 + tier * 2; // multiply for rare symbols
            return {
                ...sym,
                payouts: {
                    3: Math.round(preset.baseMultipliers[3] * scale * 10) / 10,
                    4: Math.round(preset.baseMultipliers[4] * scale * 10) / 10,
                    5: Math.round(preset.baseMultipliers[5] * scale * 10) / 10,
                },
            };
        }));
    };

    // ─── Delete Game ───────────────────────────────────────────────────────
    const deleteGame = (gameId: string) => {
        const data = localStorage.getItem('custom_published_games');
        if (data) {
            const allGames = JSON.parse(data);
            const filtered = allGames.filter((g: any) => g.id !== gameId);
            localStorage.setItem('custom_published_games', JSON.stringify(filtered));
            window.dispatchEvent(new Event('storage'));
        }
    };

    // ─── Publish ───────────────────────────────────────────────────────────
    const handlePublish = () => {
        if (gameType === 'slots') {
            if (!gameName.trim()) { alert("Please provide a game name."); return; }
            if (!coverImage) { alert("Please upload a cover image before publishing."); return; }

            const existingStr = localStorage.getItem('custom_published_games');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            if (existing.some((g: any) => g.name.toLowerCase() === gameName.trim().toLowerCase())) {
                alert("A game with this name already exists. Please choose a unique name.");
                return;
            }

            setIsPublishing(true);

            setTimeout(() => {
                const slotConfig = buildConfig();
                const newGame = {
                    id: 'slot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    creatorId: creatorData.id || creatorData.name,
                    creatorName: creatorData.name,
                    type: 'slot_engine',
                    name: gameName,
                    gameDescription,
                    coverImage,
                    themeEmoji: '🎰',
                    themeColor: accentColor,
                    slotConfig,
                    winEffect,
                    winSound,
                    publishedAt: new Date().toISOString()
                };

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                localStorage.setItem('custom_published_games', JSON.stringify([newGame, ...games]));
                window.dispatchEvent(new Event('storage'));
                setIsPublishing(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setGameName('My Slot Game');
                    setGameDescription('A custom slot experience');
                    setCoverImage(null);
                    setIsSuccess(false);
                }, 2500);
            }, 1500);
        } else if (gameType === 'crash') {
            // Crash publish
            if (!crashGameName.trim()) { alert("Please provide a game name."); return; }
            if (!crashCoverImage) { alert("Please upload a cover image before publishing."); return; }

            const existingStr = localStorage.getItem('custom_published_games');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            if (existing.some((g: any) => g.name.toLowerCase() === crashGameName.trim().toLowerCase())) {
                alert("A game with this name already exists. Please choose a unique name.");
                return;
            }

            setIsPublishing(true);

            setTimeout(() => {
                const crashConfig = buildCrashConfig();
                const newGame = {
                    id: 'crash_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    creatorId: creatorData.id || creatorData.name,
                    creatorName: creatorData.name,
                    type: 'crash',
                    name: crashGameName,
                    gameDescription: crashGameDescription,
                    coverImage: crashCoverImage,
                    themeEmoji: '🚀',
                    themeColor: crashGraphColor,
                    config: {
                        ...crashConfig,
                        rocketImage: crashFlyingObjectImage || null,
                    },
                    winEffect,
                    winSound,
                    publishedAt: new Date().toISOString()
                };

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                localStorage.setItem('custom_published_games', JSON.stringify([newGame, ...games]));
                window.dispatchEvent(new Event('storage'));
                setIsPublishing(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setCrashGameName('My Crash Game');
                    setCrashGameDescription('A thrilling multiplier experience');
                    setCrashCoverImage(null);
                    setIsSuccess(false);
                }, 2500);
            }, 1500);
        } else if (gameType === 'scratch') {
            // Scratch publish
            if (!scratchGameName.trim()) { alert("Please provide a game name."); return; }
            if (!scratchLobbyCover) { alert("Please upload a cover image before publishing."); return; }

            const existingStr = localStorage.getItem('custom_published_games');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            if (existing.some((g: any) => g.name.toLowerCase() === scratchGameName.trim().toLowerCase())) {
                alert("A game with this name already exists. Please choose a unique name.");
                return;
            }

            setIsPublishing(true);

            setTimeout(() => {
                const scratchConfig = buildScratchConfig();
                const newGame = {
                    id: 'scratch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    creatorId: creatorData.id || creatorData.name,
                    creatorName: creatorData.name,
                    type: 'scratch',
                    name: scratchGameName,
                    gameDescription: scratchGameDescription,
                    coverImage: scratchLobbyCover,
                    themeEmoji: '🎟️',
                    themeColor: scratchAccentColor,
                    scratchConfig,
                    winEffect,
                    winSound,
                    publishedAt: new Date().toISOString()
                };

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                localStorage.setItem('custom_published_games', JSON.stringify([newGame, ...games]));
                window.dispatchEvent(new Event('storage'));
                setIsPublishing(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setScratchGameName('My Scratch Card');
                    setScratchGameDescription('Scratch to reveal and win!');
                    setScratchLobbyCover(null);
                    setIsSuccess(false);
                }, 2500);
            }, 1500);
        }
    };

    // ─── Toggle Component ──────────────────────────────────────────────────
    const Toggle = ({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) => (
        <button
            onClick={onToggle}
            className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all duration-300 ${enabled
                ? 'bg-gradient-to-r from-[#a855f7]/10 to-purple-600/5 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                : 'bg-[#0a111a]/50 border-white/5 hover:border-white/10'
            }`}
        >
            {enabled ? <ToggleRight size={20} className="text-purple-400 shrink-0" /> : <ToggleLeft size={20} className="text-slate-600 shrink-0" />}
            <span className={`text-sm font-bold ${enabled ? 'text-white' : 'text-slate-500'}`}>{label}</span>
        </button>
    );

    // ─── Section Nav ───────────────────────────────────────────────────────
    const sections = [
        { id: 'design', icon: <Palette size={16} />, label: 'Design' },
        { id: 'grid', icon: <Grid3X3 size={16} />, label: 'Grid' },
        { id: 'paytable', icon: <Zap size={16} />, label: 'Paytable' },
        { id: 'features', icon: <Settings2 size={16} />, label: 'Features' },
        { id: 'preview', icon: <Eye size={16} />, label: 'Preview' },
    ] as const;

    // ════════════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════════════
    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-6">
            <div className="bg-[#0b1622]/90 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                {/* ─── Header ─────────────────────────────────────────────── */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gameType === 'crash' ? 'bg-emerald-500/20 text-emerald-400' : gameType === 'scratch' ? 'bg-amber-500/20 text-amber-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                {gameType === 'crash' ? <Rocket size={24} /> : gameType === 'scratch' ? <Sparkles size={24} /> : <Sparkles size={24} />}
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Game Creator Studio</h2>
                        </div>
                        <p className="text-slate-400 font-medium">Choose a game type and customize every detail — then publish to the casino lobby.</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <button
                        onClick={() => setGameType('slots')}
                        className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                            gameType === 'slots'
                                ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-600/5 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
                                : 'border-white/10 bg-[#0a111a] hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                    >
                        {gameType === 'slots' && <div className="absolute top-3 right-3"><Check size={16} className="text-purple-400" /></div>}
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${gameType === 'slots' ? 'bg-purple-500/20' : 'bg-white/5'}`}>🎰</div>
                            <div>
                                <h3 className={`text-lg font-black ${gameType === 'slots' ? 'text-white' : 'text-slate-300'}`}>Slot Machine</h3>
                                <p className="text-xs text-slate-500">Classic reels & paytable</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setGameType('crash')}
                        className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                            gameType === 'crash'
                                ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                                : 'border-white/10 bg-[#0a111a] hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                    >
                        {gameType === 'crash' && <div className="absolute top-3 right-3"><Check size={16} className="text-emerald-400" /></div>}
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${gameType === 'crash' ? 'bg-emerald-500/20' : 'bg-white/5'}`}>🚀</div>
                            <div>
                                <h3 className={`text-lg font-black ${gameType === 'crash' ? 'text-white' : 'text-slate-300'}`}>Crash Game</h3>
                                <p className="text-xs text-slate-500">Multiplier rises — cash out!</p>
                            </div>
                        </div>
                    </button>
                    <button
                        onClick={() => setGameType('scratch')}
                        className={`relative group p-5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                            gameType === 'scratch'
                                ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-600/5 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                                : 'border-white/10 bg-[#0a111a] hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                    >
                        {gameType === 'scratch' && <div className="absolute top-3 right-3"><Check size={16} className="text-amber-400" /></div>}
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${gameType === 'scratch' ? 'bg-amber-500/20' : 'bg-white/5'}`}>🎟️</div>
                            <div>
                                <h3 className={`text-lg font-black ${gameType === 'scratch' ? 'text-white' : 'text-slate-300'}`}>Scratch Card</h3>
                                <p className="text-xs text-slate-500">Scratch to reveal & win!</p>
                            </div>
                        </div>
                    </button>
                </div>

                {isSuccess ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] border-2 border-green-500/50">
                            <Check size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Game Published!</h3>
                        <p className="text-slate-400 max-w-md">{gameType === 'crash' ? 'Your crash game is now live! Players can bet and ride the multiplier.' : gameType === 'scratch' ? 'Your scratch card is now live! Players can scratch and win prizes.' : 'Your slot game is now live in the Casino Lobby. Players can spin and you\'ll earn a cut!'}</p>
                    </div>
                ) : (
                    <div className="space-y-6">


                        {/* ─── Section Navigation ─────────────────────────────── */}
                        {gameType === 'slots' && (
                        <div className="flex bg-[#0a111a] rounded-xl p-1 border border-white/10 gap-1 overflow-x-auto">
                            {sections.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSection(s.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeSection === s.id
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {s.icon}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        )}

                        {gameType === 'crash' && (
                        <div className="flex bg-[#0a111a] rounded-xl p-1 border border-white/10 gap-1 overflow-x-auto">
                            {[
                                { id: 'design', icon: <Palette size={16} />, label: 'Design & Assets' },
                                { id: 'engine', icon: <Gauge size={16} />, label: 'Engine Params' },
                                { id: 'preview', icon: <Eye size={16} />, label: 'Preview & Publish' },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setCrashActiveSection(s.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${crashActiveSection === s.id
                                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {s.icon}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        )}

                        {gameType === 'scratch' && (
                        <div className="flex bg-[#0a111a] rounded-xl p-1 border border-white/10 gap-1 overflow-x-auto">
                            {[
                                { id: 'design', icon: <Palette size={16} />, label: 'Design & Symbols' },
                                { id: 'paytable', icon: <Zap size={16} />, label: 'Paytable & Odds' },
                                { id: 'preview', icon: <Eye size={16} />, label: 'Preview & Publish' },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setScratchActiveSection(s.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${scratchActiveSection === s.id
                                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg shadow-amber-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {s.icon}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* SLOTS SECTIONS                                      */}
                        {/* ════════════════════════════════════════════════════ */}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* SECTION: Design & Theme                            */}
                        {/* ════════════════════════════════════════════════════ */}
                        {gameType === 'slots' && activeSection === 'design' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Palette size={16} className="text-purple-400" /> Appearance & Branding
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Name & Description */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Title</label>
                                            <input type="text" value={gameName} onChange={(e) => setGameName(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/20 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                                            <input type="text" value={gameDescription} onChange={(e) => setGameDescription(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-purple-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Accent Color</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-sm">{accentColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Background</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-sm">{backgroundColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Background Image & Cover */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Background Image</label>
                                            <label className="flex items-center justify-center gap-2 bg-[#0a111a] rounded-xl h-28 border border-dashed border-purple-400/30 hover:border-purple-400 hover:bg-purple-400/5 cursor-pointer transition-all relative overflow-hidden group">
                                                {backgroundImage ? (
                                                    <>
                                                        <img src={backgroundImage} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                                        <span className="relative z-10 text-xs text-white font-bold bg-purple-500/80 px-4 py-2 rounded-lg backdrop-blur">Change Background</span>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Upload size={18} className="text-slate-500 group-hover:text-purple-400 transition-colors" />
                                                        <span className="text-[11px] text-slate-400 font-bold">Upload Background</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setBackgroundImage)} />
                                            </label>
                                            {backgroundImage && (
                                                <button className="text-[10px] text-slate-500 hover:text-red-400 mt-1 transition-colors" onClick={() => setBackgroundImage(null)}>Remove</button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                                Lobby Cover Image <span className="text-red-400">*</span>
                                            </label>
                                            <label className="relative w-full aspect-video rounded-xl bg-[#0a111a] border border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-purple-400 group cursor-pointer transition-all block">
                                                {coverImage ? (
                                                    <>
                                                        <img src={coverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white font-bold bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">Change</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon size={24} className="text-slate-500 group-hover:text-purple-400 mb-1 transition-colors" />
                                                        <span className="text-xs text-slate-400 font-bold">Upload Cover</span>
                                                        <span className="text-[10px] text-red-400/80 mt-1 font-bold">Required to publish</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, setCoverImage)} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Victory Celebration */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#160b1e] border border-purple-500/20 rounded-2xl p-5 mt-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className="text-amber-400" />
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Victory Celebration</span>
                                        </div>
                                        <label className={`text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border ${winSound ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'}`}>
                                            <span className="flex items-center gap-1.5"><Volume2 size={12} />{winSound ? 'Audio Ready' : 'Add Sound'}</span>
                                            <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, setWinSound)} />
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {WIN_EFFECTS.map(effect => (
                                            <button key={effect.id} onClick={() => setWinEffect(effect.id)}
                                                className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${winEffect === effect.id ? 'bg-gradient-to-b from-purple-500/20 to-purple-600/10 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                                                <span className={`text-xl mb-1 ${winEffect === effect.id ? 'scale-110' : 'opacity-60'}`}>{effect.icon}</span>
                                                <span className={`text-[9px] font-bold uppercase ${winEffect === effect.id ? 'text-white' : 'text-slate-500'}`}>{effect.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {winSound && <button className="text-[10px] text-slate-500 hover:text-red-400 mt-2" onClick={() => setWinSound(null)}>Remove Audio</button>}
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* SECTION: Grid Layout                                */}
                        {/* ════════════════════════════════════════════════════ */}
                        {gameType === 'slots' && activeSection === 'grid' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Grid3X3 size={16} className="text-blue-400" /> Grid Layout
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {(Object.entries(GRID_PRESETS) as [GridLayout, typeof GRID_PRESETS['3x3']][]).map(([key, preset]) => (
                                        <button
                                            key={key}
                                            onClick={() => setGridLayout(key)}
                                            className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden group ${gridLayout === key
                                                ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-600/5 shadow-[0_0_30px_rgba(168,85,247,0.15)]'
                                                : 'border-white/10 bg-[#0a111a] hover:border-white/20 hover:bg-white/[0.02]'
                                            }`}
                                        >
                                            {gridLayout === key && <div className="absolute top-3 right-3"><Check size={16} className="text-purple-400" /></div>}
                                            
                                            {/* Mini grid preview */}
                                            <div className="flex gap-1 mb-4">
                                                {Array.from({ length: preset.cols }).map((_, c) => (
                                                    <div key={c} className="flex flex-col gap-1">
                                                        {Array.from({ length: preset.rows }).map((_, r) => (
                                                            <div key={r} className={`w-4 h-4 rounded-sm transition-all ${gridLayout === key ? 'bg-purple-500/40' : 'bg-white/10 group-hover:bg-white/15'}`} />
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <h4 className={`text-lg font-black mb-1 ${gridLayout === key ? 'text-white' : 'text-slate-300'}`}>{preset.label}</h4>
                                            <p className="text-xs text-slate-500 font-medium">{preset.description}</p>
                                            <div className="mt-2 text-2xl font-black text-purple-400/40">{key}</div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* SECTION: Paytable & Volatility                     */}
                        {/* ════════════════════════════════════════════════════ */}
                        {gameType === 'slots' && activeSection === 'paytable' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Zap size={16} className="text-amber-400" /> Paytable & Volatility
                                </h3>

                                {/* Volatility Presets */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Volatility Template</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(Object.entries(VOLATILITY_PRESETS) as [string, typeof VOLATILITY_PRESETS['low']][]).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => applyVolatility(key as any)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${volatility === key
                                                    ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-3 h-3 rounded-full ${key === 'low' ? 'bg-green-400' : key === 'medium' ? 'bg-amber-400' : 'bg-red-400'}`} />
                                                    <span className={`text-sm font-black ${volatility === key ? 'text-white' : 'text-slate-400'}`}>{preset.label}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">{preset.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Symbol Table */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Symbols & Payouts</label>
                                        <button onClick={() => {
                                            const id = 'sym_' + Date.now();
                                            setSymbols(prev => [...prev, { id, name: 'New Symbol', image: '🎯', type: 'normal', payouts: { 3: 2, 4: 5, 5: 15 } }]);
                                        }} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-500/30 transition-colors">
                                            + Add Symbol
                                        </button>
                                    </div>

                                    <div className="bg-[#0a111a] rounded-xl border border-white/10 overflow-hidden">
                                        {/* Header */}
                                        <div className="grid grid-cols-[60px_1fr_80px_60px_60px_60px_40px] gap-2 p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-[#080d14]">
                                            <div>Icon</div>
                                            <div>Name</div>
                                            <div>Type</div>
                                            <div className="text-center">3×</div>
                                            <div className="text-center">4×</div>
                                            <div className="text-center">5×</div>
                                            <div></div>
                                        </div>

                                        {/* Symbol Rows */}
                                        {symbols.map((sym) => (
                                            <div key={sym.id} className="grid grid-cols-[60px_1fr_80px_60px_60px_60px_40px] gap-2 p-3 items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                {/* Icon */}
                                                <label className="w-10 h-10 rounded-lg bg-[#121c22] border border-white/10 flex items-center justify-center cursor-pointer hover:border-purple-400/50 transition-colors relative overflow-hidden group">
                                                    {sym.image.startsWith('data:image') || sym.image.startsWith('http') || sym.image.startsWith('/')
                                                        ? <img src={sym.image} className="w-full h-full object-contain p-1" alt="" />
                                                        : <span className="text-lg">{sym.image}</span>
                                                    }
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Upload size={12} className="text-white" />
                                                    </div>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSymbolImageUpload(sym.id, e)} />
                                                </label>

                                                {/* Name */}
                                                <input type="text" value={sym.name} onChange={(e) => setSymbols(prev => prev.map(s => s.id === sym.id ? { ...s, name: e.target.value } : s))}
                                                    className="bg-transparent border-b border-white/5 focus:border-purple-400 text-white text-sm font-bold px-1 py-1 focus:outline-none transition-colors" />

                                                {/* Type */}
                                                <select value={sym.type} onChange={(e) => {
                                                    const newType = e.target.value as 'normal' | 'wild' | 'scatter';
                                                    setSymbols(prev => prev.map(s => s.id === sym.id ? { ...s, type: newType } : s));
                                                    if (newType === 'wild') setWildSymbolId(sym.id);
                                                    if (newType === 'scatter') setScatterSymbolId(sym.id);
                                                }}
                                                    className="bg-[#0a111a] border border-white/10 text-white text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer">
                                                    <option value="normal">Normal</option>
                                                    <option value="wild">Wild</option>
                                                    <option value="scatter">Scatter</option>
                                                </select>

                                                {/* Payouts */}
                                                {[3, 4, 5].map(n => (
                                                    <input key={n} type="number" step="0.1" min="0"
                                                        value={sym.payouts[n as 3 | 4 | 5] || 0}
                                                        onChange={(e) => setSymbols(prev => prev.map(s => s.id === sym.id ? { ...s, payouts: { ...s.payouts, [n]: parseFloat(e.target.value) || 0 } } : s))}
                                                        className="w-full bg-[#0d1520] border border-white/5 text-center text-white font-mono text-xs rounded-lg py-1 focus:outline-none focus:border-purple-400 transition-colors" />
                                                ))}

                                                {/* Delete */}
                                                <button onClick={() => { if (symbols.length > 2) setSymbols(prev => prev.filter(s => s.id !== sym.id)); }}
                                                    className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10 mx-auto" disabled={symbols.length <= 2}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* SECTION: Features (Toggles)                        */}
                        {/* ════════════════════════════════════════════════════ */}
                        {gameType === 'slots' && activeSection === 'features' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Settings2 size={16} className="text-emerald-400" /> Special Mechanics
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <Toggle enabled={wildEnabled} onToggle={() => setWildEnabled(!wildEnabled)} label="Wild Symbol (substitutes any)" />
                                        {wildEnabled && (
                                            <div className="ml-8 p-3 bg-[#0a111a] rounded-xl border border-white/5">
                                                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Wild Symbol</label>
                                                <select value={wildSymbolId} onChange={(e) => setWildSymbolId(e.target.value)}
                                                    className="w-full bg-[#121c22] border border-white/10 text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none">
                                                    {symbols.map(s => <option key={s.id} value={s.id}>{s.image} {s.name}</option>)}
                                                </select>
                                            </div>
                                        )}

                                        <Toggle enabled={scatterEnabled} onToggle={() => setScatterEnabled(!scatterEnabled)} label="Scatter → Triggers Free Spins" />
                                        {scatterEnabled && (
                                            <div className="ml-8 p-3 bg-[#0a111a] rounded-xl border border-white/5 space-y-3">
                                                <div>
                                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Scatter Symbol</label>
                                                    <select value={scatterSymbolId} onChange={(e) => setScatterSymbolId(e.target.value)}
                                                        className="w-full bg-[#121c22] border border-white/10 text-white text-xs font-bold rounded-lg px-3 py-2 focus:outline-none">
                                                        {symbols.map(s => <option key={s.id} value={s.id}>{s.image} {s.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">Free Spins Count (3+ scatters)</label>
                                                    <input type="number" min="1" max="50" value={freeSpinsCount} onChange={(e) => setFreeSpinsCount(parseInt(e.target.value) || 10)}
                                                        className="w-20 bg-[#121c22] border border-white/10 text-white text-sm font-mono text-center rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <Toggle enabled={progressiveMultiplier} onToggle={() => setProgressiveMultiplier(!progressiveMultiplier)} label="Progressive Multiplier (grows on wins)" />
                                        <Toggle enabled={tumbleEnabled} onToggle={() => setTumbleEnabled(!tumbleEnabled)} label="Tumble / Cascade (winning symbols disappear)" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* SECTION: Live Preview                               */}
                        {/* ════════════════════════════════════════════════════ */}
                        {gameType === 'slots' && activeSection === 'preview' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Eye size={16} className="text-cyan-400" /> Live Preview & Test
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Engine Preview */}
                                    <div className="lg:col-span-2 space-y-3">
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative" style={{ boxShadow: `0 0 40px ${accentColor}15` }}>
                                            <iframe
                                                ref={iframeRef}
                                                src="/engines/slot-engine.html"
                                                className="w-full h-full border-0"
                                                sandbox="allow-scripts"
                                                title="Slot Engine Preview"
                                            />
                                            {!engineReady && (
                                                <div className="absolute inset-0 bg-[#060b11] flex items-center justify-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="animate-spin text-purple-400" size={32} />
                                                        <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Loading Engine...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Test Controls */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleTestSpin}
                                                disabled={!engineReady || isTesting}
                                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:brightness-110 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
                                            >
                                                {isTesting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                                                {isTesting ? 'Spinning...' : 'Test Spin'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    iframeRef.current?.contentWindow?.postMessage({ type: 'RESET' }, '*');
                                                }}
                                                className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/5 transition-colors"
                                            >
                                                <RotateCcw size={16} /> Reset
                                            </button>
                                        </div>
                                    </div>

                                    {/* Config Summary */}
                                    <div className="space-y-4">
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Configuration</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Grid</span><span className="text-white font-mono">{gridLayout}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Symbols</span><span className="text-white font-mono">{symbols.length}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Volatility</span><span className="text-white font-mono capitalize">{volatility}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Wild</span><span className={wildEnabled ? 'text-green-400' : 'text-slate-600'}>{wildEnabled ? '✓' : '✗'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Scatter</span><span className={scatterEnabled ? 'text-green-400' : 'text-slate-600'}>{scatterEnabled ? '✓' : '✗'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Free Spins</span><span className="text-white font-mono">{scatterEnabled ? freeSpinsCount : '-'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Progressive</span><span className={progressiveMultiplier ? 'text-green-400' : 'text-slate-600'}>{progressiveMultiplier ? '✓' : '✗'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Tumble</span><span className={tumbleEnabled ? 'text-green-400' : 'text-slate-600'}>{tumbleEnabled ? '✓' : '✗'}</span></div>
                                            </div>
                                        </div>

                                        {/* Symbol Preview */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Symbols</h4>
                                            <div className="grid grid-cols-4 gap-2">
                                                {symbols.map(s => (
                                                    <div key={s.id} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${s.type === 'wild' ? 'bg-purple-500/10 border border-purple-500/20' : s.type === 'scatter' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/[0.02] border border-white/5'}`}>
                                                        <div className="text-xl">
                                                            {s.image.startsWith('data:image') || s.image.startsWith('http') ? <img src={s.image} className="w-6 h-6 object-contain" alt="" /> : s.image}
                                                        </div>
                                                        <span className="text-[8px] text-slate-500 font-bold uppercase truncate w-full text-center">{s.type !== 'normal' ? s.type : s.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Publish Button */}
                                        <button
                                            onClick={handlePublish}
                                            disabled={isPublishing || !gameName.trim() || !coverImage}
                                            className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${isPublishing || !gameName.trim() || !coverImage
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:brightness-110 hover:-translate-y-1 shadow-[0_5px_20px_rgba(168,85,247,0.3)]'
                                            }`}
                                        >
                                            {isPublishing ? <><Loader2 className="animate-spin" size={20} /> Publishing...</> : <><Save size={20} /> Publish to Lobby</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* CRASH SECTIONS                                      */}
                        {/* ════════════════════════════════════════════════════ */}

                        {/* ─── Crash Design & Assets ──────────────────────── */}
                        {gameType === 'crash' && crashActiveSection === 'design' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Palette size={16} className="text-emerald-400" /> Design & Graphics
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Name & Description */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Title</label>
                                            <input type="text" value={crashGameName} onChange={(e) => setCrashGameName(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-emerald-400 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400/20 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                                            <input type="text" value={crashGameDescription} onChange={(e) => setCrashGameDescription(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-emerald-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Graph Color</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={crashGraphColor} onChange={(e) => setCrashGraphColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{crashGraphColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Accent</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={crashAccentColor} onChange={(e) => setCrashAccentColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{crashAccentColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Background</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={crashBgColor} onChange={(e) => setCrashBgColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{crashBgColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Images */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Background Image</label>
                                            <label className="flex items-center justify-center gap-2 bg-[#0a111a] rounded-xl h-28 border border-dashed border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 cursor-pointer transition-all relative overflow-hidden group">
                                                {crashBgImage ? (
                                                    <>
                                                        <img src={crashBgImage} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                                        <span className="relative z-10 text-xs text-white font-bold bg-emerald-500/80 px-4 py-2 rounded-lg backdrop-blur">Change Background</span>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Upload size={18} className="text-slate-500 group-hover:text-emerald-400 transition-colors" />
                                                        <span className="text-[11px] text-slate-400 font-bold">Upload Background</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCrashBgImage)} />
                                            </label>
                                            {crashBgImage && (
                                                <button className="text-[10px] text-slate-500 hover:text-red-400 mt-1 transition-colors" onClick={() => setCrashBgImage(null)}>Remove</button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                                Lobby Cover Image <span className="text-red-400">*</span>
                                            </label>
                                            <label className="relative w-full aspect-video rounded-xl bg-[#0a111a] border border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-emerald-400 group cursor-pointer transition-all block">
                                                {crashCoverImage ? (
                                                    <>
                                                        <img src={crashCoverImage} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white font-bold bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">Change</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon size={24} className="text-slate-500 group-hover:text-emerald-400 mb-1 transition-colors" />
                                                        <span className="text-xs text-slate-400 font-bold">Upload Cover</span>
                                                        <span className="text-[10px] text-red-400/80 mt-1 font-bold">Required to publish</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, setCrashCoverImage)} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Flying Object Selector */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#0b1a15] border border-emerald-500/20 rounded-2xl p-5 mt-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Rocket size={16} className="text-emerald-400" />
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Flying Object</span>
                                        </div>
                                        <label className={`text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border ${crashFlyingObjectImage ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}>
                                            <span className="flex items-center gap-1.5"><Upload size={12} />{crashFlyingObjectImage ? 'Custom Image' : 'Upload Custom'}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCrashFlyingObjectImage, 128)} />
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                                        {FLYING_OBJECT_PRESETS.map(obj => (
                                            <button key={obj.id} onClick={() => { setCrashFlyingObject(obj.emoji); setCrashFlyingObjectImage(null); }}
                                                className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${crashFlyingObject === obj.emoji && !crashFlyingObjectImage ? 'bg-gradient-to-b from-emerald-500/20 to-emerald-600/10 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                                                <span className={`text-xl mb-1 ${crashFlyingObject === obj.emoji && !crashFlyingObjectImage ? 'scale-110' : 'opacity-60'}`}>{obj.emoji}</span>
                                                <span className={`text-[8px] font-bold uppercase ${crashFlyingObject === obj.emoji && !crashFlyingObjectImage ? 'text-white' : 'text-slate-500'}`}>{obj.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {crashFlyingObjectImage && (
                                        <div className="flex items-center gap-3 mt-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                            <img src={crashFlyingObjectImage} alt="custom" className="w-10 h-10 rounded-lg object-contain bg-black/30" />
                                            <span className="text-xs text-emerald-400 font-bold">Custom image uploaded</span>
                                            <button className="ml-auto text-[10px] text-slate-500 hover:text-red-400" onClick={() => setCrashFlyingObjectImage(null)}>Remove</button>
                                        </div>
                                    )}
                                </div>

                                {/* Crash / Explosion Image */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#1a0b0b] border border-red-500/20 rounded-2xl p-5">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">💥</span>
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Crash / Explosion Image</span>
                                        </div>
                                    </div>
                                    <label className="flex items-center justify-center gap-2 bg-[#0a111a] rounded-xl h-24 border border-dashed border-red-400/30 hover:border-red-400 hover:bg-red-400/5 cursor-pointer transition-all relative overflow-hidden group">
                                        {crashCrashImage ? (
                                            <>
                                                <img src={crashCrashImage} alt="crash" className="h-16 object-contain" />
                                                <span className="text-xs text-white font-bold bg-red-500/80 px-3 py-1.5 rounded-lg backdrop-blur">Change</span>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload size={18} className="text-slate-500 group-hover:text-red-400 transition-colors" />
                                                <span className="text-[11px] text-slate-400 font-bold">Upload Explosion Image (optional)</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCrashCrashImage, 200)} />
                                    </label>
                                    {crashCrashImage && (
                                        <button className="text-[10px] text-slate-500 hover:text-red-400 mt-1 transition-colors" onClick={() => setCrashCrashImage(null)}>Remove</button>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Crash Engine Params ────────────────────────── */}
                        {gameType === 'crash' && crashActiveSection === 'engine' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Gauge size={16} className="text-amber-400" /> Engine Parameters
                                </h3>

                                {/* House Edge / RTP */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-emerald-400" /> House Edge / RTP
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {HOUSE_EDGE_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setCrashHouseEdge(preset.value)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${crashHouseEdge === preset.value
                                                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-3 h-3 rounded-full ${preset.id === 'low' ? 'bg-green-400' : preset.id === 'medium' ? 'bg-amber-400' : 'bg-red-400'}`} />
                                                    <span className={`text-sm font-black ${crashHouseEdge === preset.value ? 'text-white' : 'text-slate-400'}`}>{preset.label}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">{preset.description}</p>
                                                <div className="mt-2 text-lg font-black text-emerald-400/40">{preset.rtp}% RTP</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 bg-[#0a111a] p-3 rounded-xl border border-white/5">
                                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Custom Edge %</label>
                                        <input type="number" min="1" max="20" step="0.5" value={crashHouseEdge}
                                            onChange={(e) => setCrashHouseEdge(Math.min(20, Math.max(1, parseFloat(e.target.value) || 5)))}
                                            className="w-20 bg-[#121c22] border border-white/10 text-white text-sm font-mono text-center rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400" />
                                        <span className="text-xs text-slate-400 font-bold">→ RTP: {(100 - crashHouseEdge).toFixed(1)}%</span>
                                    </div>
                                </div>

                                {/* Max Multiplier */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                        <TrendingUp size={14} className="text-amber-400" /> Max Multiplier Limit
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        {[100, 500, 1000, 5000].map(val => (
                                            <button
                                                key={val}
                                                onClick={() => setCrashMaxMultiplier(val)}
                                                className={`py-3 rounded-xl border-2 font-black text-center transition-all ${crashMaxMultiplier === val
                                                    ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-600/5 text-white'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20 text-slate-400'
                                                }`}
                                            >
                                                {val >= 1000 ? (val / 1000) + 'K' : val}x
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 bg-[#0a111a] p-3 rounded-xl border border-white/5">
                                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Custom Max</label>
                                        <input type="number" min="10" max="100000" value={crashMaxMultiplier}
                                            onChange={(e) => setCrashMaxMultiplier(Math.max(10, parseInt(e.target.value) || 1000))}
                                            className="w-24 bg-[#121c22] border border-white/10 text-white text-sm font-mono text-center rounded-lg px-3 py-2 focus:outline-none focus:border-amber-400" />
                                        <span className="text-xs text-slate-400 font-bold">× maximum multiplier</span>
                                    </div>
                                </div>

                                {/* Acceleration Curve */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                        <Gauge size={14} className="text-cyan-400" /> Acceleration Curve
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {ACCELERATION_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setCrashAcceleration(preset.value)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${crashAcceleration === preset.value
                                                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-3 h-3 rounded-full ${preset.id === 'slow' ? 'bg-blue-400' : preset.id === 'standard' ? 'bg-cyan-400' : 'bg-orange-400'}`} />
                                                    <span className={`text-sm font-black ${crashAcceleration === preset.value ? 'text-white' : 'text-slate-400'}`}>{preset.label}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">{preset.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 bg-[#0a111a] p-3 rounded-xl border border-white/5">
                                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Custom Value</label>
                                        <input type="range" min="0.03" max="0.15" step="0.01" value={crashAcceleration}
                                            onChange={(e) => setCrashAcceleration(parseFloat(e.target.value))}
                                            className="flex-1 accent-cyan-400 h-2" />
                                        <span className="text-sm text-white font-mono font-bold w-12 text-center">{crashAcceleration.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Quick Stats Summary */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#0b1a15] border border-emerald-500/20 rounded-2xl p-5">
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-3 flex items-center gap-2">
                                        <Zap size={14} className="text-amber-400" /> Engine Summary
                                    </h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                        <div className="flex flex-col items-center gap-1 bg-[#06090c] rounded-xl p-3 border border-white/5">
                                            <span className="text-slate-500 font-bold">RTP</span>
                                            <span className="text-xl font-black text-emerald-400">{(100 - crashHouseEdge).toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 bg-[#06090c] rounded-xl p-3 border border-white/5">
                                            <span className="text-slate-500 font-bold">Max Mult</span>
                                            <span className="text-xl font-black text-amber-400">{crashMaxMultiplier >= 1000 ? (crashMaxMultiplier / 1000) + 'K' : crashMaxMultiplier}×</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 bg-[#06090c] rounded-xl p-3 border border-white/5">
                                            <span className="text-slate-500 font-bold">Speed</span>
                                            <span className="text-xl font-black text-cyan-400">{crashAcceleration <= 0.05 ? 'Slow' : crashAcceleration <= 0.09 ? 'Normal' : 'Fast'}</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-1 bg-[#06090c] rounded-xl p-3 border border-white/5">
                                            <span className="text-slate-500 font-bold">Object</span>
                                            <span className="text-2xl">{crashFlyingObjectImage ? '📸' : crashFlyingObject}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Crash Preview & Publish ────────────────────── */}
                        {gameType === 'crash' && crashActiveSection === 'preview' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Eye size={16} className="text-cyan-400" /> Live Preview & Test
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Engine Preview */}
                                    <div className="lg:col-span-2 space-y-3">
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative" style={{ boxShadow: `0 0 40px ${crashGraphColor}15` }}>
                                            <iframe
                                                ref={crashIframeRef}
                                                src="/engines/crash-engine.html"
                                                className="w-full h-full border-0"
                                                sandbox="allow-scripts"
                                                title="Crash Engine Preview"
                                            />
                                            {!crashEngineReady && (
                                                <div className="absolute inset-0 bg-[#060b11] flex items-center justify-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="animate-spin text-emerald-400" size={32} />
                                                        <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Loading Crash Engine...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Test Controls */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleTestCrash}
                                                disabled={!crashEngineReady || isTesting}
                                                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                {isTesting ? <Loader2 className="animate-spin" size={16} /> : <Rocket size={16} />}
                                                {isTesting ? 'Flying...' : 'Test Flight'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    crashIframeRef.current?.contentWindow?.postMessage({ type: 'RESET' }, '*');
                                                    setIsTesting(false);
                                                }}
                                                className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/5 transition-colors"
                                            >
                                                <RotateCcw size={16} /> Reset
                                            </button>
                                        </div>
                                    </div>

                                    {/* Config Summary & Publish */}
                                    <div className="space-y-4">
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Configuration</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Type</span><span className="text-emerald-400 font-bold">Crash Game</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">House Edge</span><span className="text-white font-mono">{crashHouseEdge}%</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">RTP</span><span className="text-white font-mono">{(100 - crashHouseEdge).toFixed(1)}%</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Max Mult</span><span className="text-white font-mono">{crashMaxMultiplier}×</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Acceleration</span><span className="text-white font-mono">{crashAcceleration.toFixed(2)}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Object</span><span className="text-lg">{crashFlyingObjectImage ? '📸 Custom' : crashFlyingObject}</span></div>
                                            </div>
                                        </div>

                                        {/* JSON Preview */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Engine JSON</h4>
                                            <pre className="text-[10px] text-slate-400 font-mono overflow-auto max-h-[150px] custom-scrollbar bg-black/30 rounded-lg p-2">
{JSON.stringify({
  maxMultiplier: crashMaxMultiplier,
  houseEdge: crashHouseEdge,
  rtp: (100 - crashHouseEdge),
  accelerationCurve: crashAcceleration,
}, null, 2)}
                                            </pre>
                                        </div>

                                        {/* Publish Button */}
                                        <button
                                            onClick={handlePublish}
                                            disabled={isPublishing || !crashGameName.trim() || !crashCoverImage}
                                            className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${isPublishing || !crashGameName.trim() || !crashCoverImage
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:brightness-110 hover:-translate-y-1 shadow-[0_5px_20px_rgba(16,185,129,0.3)]'
                                            }`}
                                        >
                                            {isPublishing ? <><Loader2 className="animate-spin" size={20} /> Publishing...</> : <><Save size={20} /> Publish to Lobby</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* SCRATCH CARD SECTIONS                               */}
                        {/* ════════════════════════════════════════════════════ */}

                        {/* ─── Scratch Design & Symbols ─────────────────────── */}
                        {gameType === 'scratch' && scratchActiveSection === 'design' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Palette size={16} className="text-amber-400" /> Design & Symbols
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Name & Description */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Title</label>
                                            <input type="text" value={scratchGameName} onChange={(e) => setScratchGameName(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                                            <input type="text" value={scratchGameDescription} onChange={(e) => setScratchGameDescription(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-amber-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Accent Color</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={scratchAccentColor} onChange={(e) => setScratchAccentColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-sm">{scratchAccentColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Background</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={scratchBgColor} onChange={(e) => setScratchBgColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-sm">{scratchBgColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cover & Lobby Image */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Scratch Foil Image</label>
                                            <label className="flex items-center justify-center gap-2 bg-[#0a111a] rounded-xl h-28 border border-dashed border-amber-400/30 hover:border-amber-400 hover:bg-amber-400/5 cursor-pointer transition-all relative overflow-hidden group">
                                                {scratchCoverImage ? (
                                                    <>
                                                        <img src={scratchCoverImage} alt="foil" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                                        <span className="relative z-10 text-xs text-white font-bold bg-amber-500/80 px-4 py-2 rounded-lg backdrop-blur">Change Foil</span>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Upload size={18} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                                                        <span className="text-[11px] text-slate-400 font-bold">Upload Foil Cover (optional)</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setScratchCoverImage)} />
                                            </label>
                                            {scratchCoverImage && (
                                                <button className="text-[10px] text-slate-500 hover:text-red-400 mt-1 transition-colors" onClick={() => setScratchCoverImage(null)}>Remove</button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">
                                                Lobby Cover Image <span className="text-red-400">*</span>
                                            </label>
                                            <label className="relative w-full aspect-video rounded-xl bg-[#0a111a] border border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-amber-400 group cursor-pointer transition-all block">
                                                {scratchLobbyCover ? (
                                                    <>
                                                        <img src={scratchLobbyCover} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <span className="text-white font-bold bg-white/10 px-4 py-2 rounded-lg border border-white/20 backdrop-blur-md">Change</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <ImageIcon size={24} className="text-slate-500 group-hover:text-amber-400 mb-1 transition-colors" />
                                                        <span className="text-xs text-slate-400 font-bold">Upload Cover</span>
                                                        <span className="text-[10px] text-red-400/80 mt-1 font-bold">Required to publish</span>
                                                    </>
                                                )}
                                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleFileUpload(e, setScratchLobbyCover)} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Symbols Manager */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#1a1508] border border-amber-500/20 rounded-2xl p-5 mt-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">🎨</span>
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Hidden Symbols</span>
                                        </div>
                                        <button onClick={() => {
                                            const id = 'sc_' + Date.now();
                                            setScratchSymbols(prev => [...prev, { id, name: 'New', image: '🎯', payout: 5 }]);
                                        }} className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-500/30 transition-colors">
                                            + Add Symbol
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {scratchSymbols.map((sym) => (
                                            <div key={sym.id} className="bg-[#0a111a] rounded-xl border border-white/10 p-3 space-y-2 group hover:border-amber-500/30 transition-all">
                                                <label className="w-12 h-12 mx-auto rounded-lg bg-[#121c22] border border-white/10 flex items-center justify-center cursor-pointer hover:border-amber-400/50 transition-colors relative overflow-hidden group/icon block">
                                                    {sym.image.startsWith('data:image') || sym.image.startsWith('http') || sym.image.startsWith('/')
                                                        ? <img src={sym.image} className="w-full h-full object-contain p-1" alt="" />
                                                        : <span className="text-2xl">{sym.image}</span>
                                                    }
                                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover/icon:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Upload size={12} className="text-white" />
                                                    </div>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                const img = new Image();
                                                                img.onload = () => {
                                                                    const canvas = document.createElement('canvas');
                                                                    const MAX = 128;
                                                                    let w = img.width, h = img.height;
                                                                    if (w > h) { if (w > MAX) { h *= MAX / w; w = MAX; } }
                                                                    else { if (h > MAX) { w *= MAX / h; h = MAX; } }
                                                                    canvas.width = w; canvas.height = h;
                                                                    const ctx = canvas.getContext('2d');
                                                                    ctx?.drawImage(img, 0, 0, w, h);
                                                                    const dataUrl = canvas.toDataURL('image/webp', 0.85);
                                                                    setScratchSymbols(prev => prev.map(s => s.id === sym.id ? { ...s, image: dataUrl } : s));
                                                                };
                                                                img.src = reader.result as string;
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                </label>
                                                <input type="text" value={sym.name} onChange={(e) => setScratchSymbols(prev => prev.map(s => s.id === sym.id ? { ...s, name: e.target.value } : s))}
                                                    className="w-full bg-transparent border-b border-white/5 focus:border-amber-400 text-white text-xs font-bold text-center px-1 py-1 focus:outline-none transition-colors" />
                                                {scratchSymbols.length > 2 && (
                                                    <button onClick={() => setScratchSymbols(prev => prev.filter(s => s.id !== sym.id))}
                                                        className="w-full text-[10px] text-slate-600 hover:text-red-400 transition-colors text-center">Remove</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Brush Shape */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#1a1508] border border-amber-500/20 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                                        <span className="text-lg">🖌️</span>
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Brush Shape</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {BRUSH_SHAPE_PRESETS.map(brush => (
                                            <button key={brush.id} onClick={() => setScratchBrushShape(brush.id as any)}
                                                className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${scratchBrushShape === brush.id ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                                                <span className={`text-2xl mb-1 ${scratchBrushShape === brush.id ? 'scale-110' : 'opacity-60'}`}>{brush.emoji}</span>
                                                <span className={`text-[10px] font-bold uppercase ${scratchBrushShape === brush.id ? 'text-white' : 'text-slate-500'}`}>{brush.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 bg-[#0a111a] p-3 rounded-xl border border-white/5">
                                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Brush Size</label>
                                        <input type="range" min="20" max="80" value={scratchBrushSize}
                                            onChange={(e) => setScratchBrushSize(parseInt(e.target.value))}
                                            className="flex-1 accent-amber-400 h-2" />
                                        <span className="text-sm text-white font-mono font-bold w-10 text-center">{scratchBrushSize}px</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Scratch Paytable & Odds ─────────────────────── */}
                        {gameType === 'scratch' && scratchActiveSection === 'paytable' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Zap size={16} className="text-amber-400" /> Paytable & Odds
                                </h3>

                                {/* Win Probability */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                        <ShieldCheck size={14} className="text-amber-400" /> Win Probability
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {WIN_PROBABILITY_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setScratchWinProbability(preset.value)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${scratchWinProbability === preset.value
                                                    ? 'border-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-600/5'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`w-3 h-3 rounded-full ${preset.id === 'rare' ? 'bg-red-400' : preset.id === 'balanced' ? 'bg-amber-400' : 'bg-green-400'}`} />
                                                    <span className={`text-sm font-black ${scratchWinProbability === preset.value ? 'text-white' : 'text-slate-400'}`}>{preset.label}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">{preset.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-3 flex items-center gap-4 bg-[#0a111a] p-3 rounded-xl border border-white/5">
                                        <label className="text-xs font-bold text-slate-500 whitespace-nowrap">Custom %</label>
                                        <input type="range" min="5" max="60" step="1" value={scratchWinProbability * 100}
                                            onChange={(e) => setScratchWinProbability(parseInt(e.target.value) / 100)}
                                            className="flex-1 accent-amber-400 h-2" />
                                        <span className="text-sm text-white font-mono font-bold w-12 text-center">{Math.round(scratchWinProbability * 100)}%</span>
                                    </div>
                                </div>

                                {/* Grid Size */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                                        <Grid3X3 size={14} className="text-cyan-400" /> Grid Size
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(Object.entries(GRID_SIZE_PRESETS) as [string, typeof GRID_SIZE_PRESETS['3x3']][]).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => setScratchGridSize(key as any)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${scratchGridSize === key
                                                    ? 'border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}
                                            >
                                                {scratchGridSize === key && <div className="absolute top-3 right-3"><Check size={14} className="text-cyan-400" /></div>}
                                                <div className="flex gap-1 mb-3">
                                                    {Array.from({ length: preset.cols }).map((_, c) => (
                                                        <div key={c} className="flex flex-col gap-1">
                                                            {Array.from({ length: preset.rows }).map((_, r) => (
                                                                <div key={r} className={`w-3 h-3 rounded-sm transition-all ${scratchGridSize === key ? 'bg-cyan-500/40' : 'bg-white/10'}`} />
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                                <h4 className={`text-sm font-black mb-1 ${scratchGridSize === key ? 'text-white' : 'text-slate-300'}`}>{preset.label}</h4>
                                                <p className="text-[10px] text-slate-500">{preset.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Symbol Payouts Table */}
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Symbol Payouts (3-match multiplier)</label>
                                    <div className="bg-[#0a111a] rounded-xl border border-white/10 overflow-hidden">
                                        <div className="grid grid-cols-[60px_1fr_100px] gap-2 p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-[#080d14]">
                                            <div>Icon</div>
                                            <div>Name</div>
                                            <div className="text-center">Payout (×bet)</div>
                                        </div>
                                        {scratchSymbols.map((sym) => (
                                            <div key={sym.id} className="grid grid-cols-[60px_1fr_100px] gap-2 p-3 items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                                <div className="w-10 h-10 rounded-lg bg-[#121c22] border border-white/10 flex items-center justify-center">
                                                    {sym.image.startsWith('data:image') || sym.image.startsWith('http')
                                                        ? <img src={sym.image} className="w-full h-full object-contain p-1" alt="" />
                                                        : <span className="text-lg">{sym.image}</span>
                                                    }
                                                </div>
                                                <span className="text-white text-sm font-bold">{sym.name}</span>
                                                <input type="number" min="1" step="1" value={sym.payout}
                                                    onChange={(e) => setScratchSymbols(prev => prev.map(s => s.id === sym.id ? { ...s, payout: parseInt(e.target.value) || 1 } : s))}
                                                    className="w-full bg-[#0d1520] border border-white/5 text-center text-white font-mono text-sm rounded-lg py-2 focus:outline-none focus:border-amber-400 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Scratch Preview & Publish ───────────────────── */}
                        {gameType === 'scratch' && scratchActiveSection === 'preview' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Eye size={16} className="text-cyan-400" /> Live Preview & Test
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Engine Preview */}
                                    <div className="lg:col-span-2 space-y-3">
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative" style={{ boxShadow: `0 0 40px ${scratchAccentColor}15` }}>
                                            <iframe
                                                ref={scratchIframeRef}
                                                src="/engines/scratch-engine.html"
                                                className="w-full h-full border-0"
                                                sandbox="allow-scripts"
                                                title="Scratch Card Preview"
                                            />
                                            {!scratchEngineReady && (
                                                <div className="absolute inset-0 bg-[#060b11] flex items-center justify-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <Loader2 className="animate-spin text-amber-400" size={32} />
                                                        <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Loading Scratch Engine...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Test Controls */}
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleTestScratch}
                                                disabled={!scratchEngineReady || isTesting}
                                                className="flex-1 bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                                            >
                                                {isTesting ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
                                                {isTesting ? 'Generating...' : 'New Card'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    scratchIframeRef.current?.contentWindow?.postMessage({ type: 'RESET' }, '*');
                                                    setIsTesting(false);
                                                }}
                                                className="bg-[#1a2c38] hover:bg-[#2f4553] text-slate-300 px-6 py-3 rounded-xl font-bold flex items-center gap-2 border border-white/5 transition-colors"
                                            >
                                                <RotateCcw size={16} /> Reset
                                            </button>
                                        </div>
                                    </div>

                                    {/* Config Summary & Publish */}
                                    <div className="space-y-4">
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Configuration</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Type</span><span className="text-amber-400 font-bold">Scratch Card</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Grid</span><span className="text-white font-mono">{scratchGridSize}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Symbols</span><span className="text-white font-mono">{scratchSymbols.length}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Win Rate</span><span className="text-white font-mono">{Math.round(scratchWinProbability * 100)}%</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Brush</span><span className="text-white capitalize">{scratchBrushShape}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Custom Foil</span><span className={scratchCoverImage ? 'text-green-400' : 'text-slate-600'}>{scratchCoverImage ? '✓' : '✗'}</span></div>
                                            </div>
                                        </div>

                                        {/* JSON Preview */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Engine JSON</h4>
                                            <pre className="text-[10px] text-slate-400 font-mono overflow-auto max-h-[150px] custom-scrollbar bg-black/30 rounded-lg p-2">
{JSON.stringify({
  gridSize: scratchGridSize,
  winProbability: scratchWinProbability,
  brushShape: scratchBrushShape,
  symbolCount: scratchSymbols.length,
  payouts: scratchSymbols.map(s => ({ name: s.name, payout: s.payout })),
}, null, 2)}
                                            </pre>
                                        </div>

                                        {/* Publish Button */}
                                        <button
                                            onClick={handlePublish}
                                            disabled={isPublishing || !scratchGameName.trim() || !scratchLobbyCover}
                                            className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${isPublishing || !scratchGameName.trim() || !scratchLobbyCover
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white hover:brightness-110 hover:-translate-y-1 shadow-[0_5px_20px_rgba(245,158,11,0.3)]'
                                            }`}
                                        >
                                            {isPublishing ? <><Loader2 className="animate-spin" size={20} /> Publishing...</> : <><Save size={20} /> Publish to Lobby</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </div>
                )}
            </div>
        </motion.div>
    );
}
