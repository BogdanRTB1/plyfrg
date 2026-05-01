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
import {
  WheelConfig, WheelSegment, DEFAULT_WHEEL_CONFIG, DEFAULT_WHEEL_SEGMENTS,
  POINTER_PRESETS, TEXTURE_PRESETS, TICK_SOUND_PRESETS, SEGMENT_COLORS
} from '@/types/wheelConfig';
import {
  MinesConfig, MinesGridSize, DEFAULT_MINES_CONFIG,
  GRID_SIZE_PRESETS as MINES_GRID_PRESETS, BUST_ANIMATION_PRESETS, LOSS_SOUND_PRESETS
} from '@/types/minesConfig';
import {
  CaseConfig, CaseItem, CaseRarity, DEFAULT_CASE_CONFIG, CASE_DESIGN_PRESETS, OPENING_SOUND_PRESETS, SCROLL_SPEED_PRESETS, RARITY_CONFIG
} from '@/types/caseConfig';
import {
  HiLoConfig, DEFAULT_HILO_CONFIG, HILO_DEAL_SOUNDS, HILO_LOSS_SOUNDS
} from '@/types/hiloConfig';
import CustomHiloModal from './CustomHiloModal';
import { createClient } from '@/utils/supabase/client';

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

type GameType = 'slots' | 'crash' | 'scratch' | 'wheel' | 'mines' | 'case' | 'hilo';

interface CreatorGameStudioProps {
    creatorData: any;
    onGoBack: () => void;
}

export default function CreatorGameStudio({ creatorData, onGoBack }: CreatorGameStudioProps) {
    // ─── Game Type ────────────────────────────────────────────────────────
    const [gameType, setGameType] = useState<GameType>('slots');
    const [isGameDropdownOpen, setIsGameDropdownOpen] = useState(false);

    const GAME_TYPES_INFO = [
        { id: 'slots', label: 'Slot Machine', icon: '🎰', desc: 'Classic reels & paytable', style: 'border-purple-500 bg-purple-500/10 text-purple-400', iconBg: 'bg-purple-500/20' },
        { id: 'crash', label: 'Crash Game', icon: '🚀', desc: 'Multiplier rises & cash out', style: 'border-emerald-500 bg-emerald-500/10 text-emerald-400', iconBg: 'bg-emerald-500/20' },
        { id: 'scratch', label: 'Scratch Card', icon: '🎟️', desc: 'Scratch to reveal & win', style: 'border-amber-500 bg-amber-500/10 text-amber-400', iconBg: 'bg-amber-500/20' },
        { id: 'wheel', label: 'Wheel of Fortune', icon: '🎡', desc: 'Spin to win — custom odds', style: 'border-rose-500 bg-rose-500/10 text-rose-400', iconBg: 'bg-rose-500/20' },
        { id: 'mines', label: 'Mines', icon: '💣', desc: 'Avoid mines — reveal gems', style: 'border-orange-500 bg-orange-500/10 text-orange-400', iconBg: 'bg-orange-500/20' },
        { id: 'case', label: 'Case Opening', icon: '📦', desc: 'Unbox items & rarities', style: 'border-indigo-500 bg-indigo-500/10 text-indigo-400', iconBg: 'bg-indigo-500/20' },
        { id: 'hilo', label: 'Cards Hi-Lo', icon: '🃏', desc: 'Pick higher or lower', style: 'border-sky-500 bg-sky-500/10 text-sky-400', iconBg: 'bg-sky-500/20' }
    ];

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

    // ─── Wheel Config State ─────────────────────────────────────────────────
    const [wheelSegments, setWheelSegments] = useState<WheelSegment[]>([...DEFAULT_WHEEL_SEGMENTS]);
    const [wheelPointerStyle, setWheelPointerStyle] = useState<'arrow' | 'finger' | 'sword' | 'microphone' | 'custom'>(DEFAULT_WHEEL_CONFIG.pointerStyle);
    const [wheelPointerImage, setWheelPointerImage] = useState<string | null>(null);
    const [wheelTexture, setWheelTexture] = useState(DEFAULT_WHEEL_CONFIG.wheelTexture);
    const [wheelTickSound, setWheelTickSound] = useState(DEFAULT_WHEEL_CONFIG.tickSound);
    const [wheelTickSoundFile, setWheelTickSoundFile] = useState<string | null>(null);
    const [wheelEnableTrollWheel, setWheelEnableTrollWheel] = useState(DEFAULT_WHEEL_CONFIG.enableTrollWheel);
    const [wheelConfettiType, setWheelConfettiType] = useState<'classic' | 'custom_logo'>(DEFAULT_WHEEL_CONFIG.confettiType);
    const [wheelConfettiImage, setWheelConfettiImage] = useState<string | null>(null);
    const [wheelAccentColor, setWheelAccentColor] = useState(DEFAULT_WHEEL_CONFIG.accentColor);
    const [wheelBgColor, setWheelBgColor] = useState(DEFAULT_WHEEL_CONFIG.backgroundColor);
    const [wheelBgImage, setWheelBgImage] = useState<string | null>(null);
    const [wheelGameName, setWheelGameName] = useState(DEFAULT_WHEEL_CONFIG.theme.gameName);
    const [wheelGameDescription, setWheelGameDescription] = useState(DEFAULT_WHEEL_CONFIG.theme.gameDescription);
    const [wheelCoverImage, setWheelCoverImage] = useState<string | null>(null);
    const [wheelActiveSection, setWheelActiveSection] = useState<'design' | 'segments' | 'preview'>('design');

    // ─── Mines Config State ──────────────────────────────────────────────────
    const [minesGridSize, setMinesGridSize] = useState<MinesGridSize>(DEFAULT_MINES_CONFIG.gridSize);
    const [minesMineImage, setMinesMineImage] = useState<string | null>(DEFAULT_MINES_CONFIG.mineImage);
    const [minesGemImage, setMinesGemImage] = useState<string | null>(DEFAULT_MINES_CONFIG.gemImage);
    const [minesBustImage, setMinesBustImage] = useState<string | null>(DEFAULT_MINES_CONFIG.bustImage);
    const [minesWatermarkImage, setMinesWatermarkImage] = useState<string | null>(DEFAULT_MINES_CONFIG.watermarkImage);
    const [minesBgImage, setMinesBgImage] = useState<string | null>(DEFAULT_MINES_CONFIG.backgroundImage);
    const [minesAccentColor, setMinesAccentColor] = useState(DEFAULT_MINES_CONFIG.accentColor);
    const [minesBgColor, setMinesBgColor] = useState(DEFAULT_MINES_CONFIG.backgroundColor);
    const [minesTileColor, setMinesTileColor] = useState(DEFAULT_MINES_CONFIG.tileColor);
    const [minesEnableSuspense, setMinesEnableSuspense] = useState(DEFAULT_MINES_CONFIG.enableProgressiveSuspense);
    const [minesLossSoundType, setMinesLossSoundType] = useState(DEFAULT_MINES_CONFIG.lossSoundType);
    const [minesLossSoundFile, setMinesLossSoundFile] = useState<string | null>(DEFAULT_MINES_CONFIG.lossSoundFile);
    const [minesRevealSoundFile, setMinesRevealSoundFile] = useState<string | null>(DEFAULT_MINES_CONFIG.revealSoundFile);
    const [minesEnableFlip, setMinesEnableFlip] = useState(DEFAULT_MINES_CONFIG.enableFlipAnimation);
    const [minesBustStyle, setMinesBustStyle] = useState(DEFAULT_MINES_CONFIG.bustAnimationStyle);
    const [minesGameName, setMinesGameName] = useState(DEFAULT_MINES_CONFIG.theme.gameName);
    const [minesGameDescription, setMinesGameDescription] = useState(DEFAULT_MINES_CONFIG.theme.gameDescription);
    const [minesCoverImage, setMinesCoverImage] = useState<string | null>(null);
    const [minesActiveSection, setMinesActiveSection] = useState<'design' | 'mechanics' | 'preview'>('design');

    // ─── Case Config State ───────────────────────────────────────────────────
    const [caseCollectionName, setCaseCollectionName] = useState(DEFAULT_CASE_CONFIG.collectionName);
    const [caseDesign, setCaseDesign] = useState(DEFAULT_CASE_CONFIG.caseDesign);
    const [caseImage, setCaseImage] = useState<string | null>(DEFAULT_CASE_CONFIG.caseImage);
    const [caseBgImage, setCaseBgImage] = useState<string | null>(DEFAULT_CASE_CONFIG.backgroundImage);
    const [caseAccentColor, setCaseAccentColor] = useState(DEFAULT_CASE_CONFIG.accentColor);
    const [caseBgColor, setCaseBgColor] = useState(DEFAULT_CASE_CONFIG.backgroundColor);
    const [caseEnableRarityGlow, setCaseEnableRarityGlow] = useState(DEFAULT_CASE_CONFIG.enableRarityGlow);
    const [caseOpeningSoundType, setCaseOpeningSoundType] = useState(DEFAULT_CASE_CONFIG.openingSoundType);
    const [caseOpeningSoundFile, setCaseOpeningSoundFile] = useState<string | null>(DEFAULT_CASE_CONFIG.openingSoundFile);
    const [caseEnableRareExplosion, setCaseEnableRareExplosion] = useState(DEFAULT_CASE_CONFIG.enableRareExplosionSound);
    const [caseItems, setCaseItems] = useState<CaseItem[]>([...DEFAULT_CASE_CONFIG.items]);
    const [caseScrollDuration, setCaseScrollDuration] = useState(DEFAULT_CASE_CONFIG.scrollDuration);
    const [caseGameName, setCaseGameName] = useState(DEFAULT_CASE_CONFIG.theme.gameName);
    const [caseGameDescription, setCaseGameDescription] = useState(DEFAULT_CASE_CONFIG.theme.gameDescription);
    const [caseCoverImage, setCaseCoverImage] = useState<string | null>(null);
    const [caseActiveSection, setCaseActiveSection] = useState<'design' | 'items' | 'preview'>('design');

    // ─── HiLo Config State ───────────────────────────────────────────────────
    const [hiloGameName, setHiloGameName] = useState(DEFAULT_HILO_CONFIG.theme.gameName);
    const [hiloGameDescription, setHiloGameDescription] = useState(DEFAULT_HILO_CONFIG.theme.gameDescription);
    const [hiloCoverImage, setHiloCoverImage] = useState<string | null>(null);
    const [hiloCardBackImage, setHiloCardBackImage] = useState<string | null>(DEFAULT_HILO_CONFIG.cardBackImage);
    const [hiloFaceJ, setHiloFaceJ] = useState<string | null>(DEFAULT_HILO_CONFIG.customFaceCards.J);
    const [hiloFaceQ, setHiloFaceQ] = useState<string | null>(DEFAULT_HILO_CONFIG.customFaceCards.Q);
    const [hiloFaceK, setHiloFaceK] = useState<string | null>(DEFAULT_HILO_CONFIG.customFaceCards.K);
    const [hiloFaceA, setHiloFaceA] = useState<string | null>(DEFAULT_HILO_CONFIG.customFaceCards.A);
    const [hiloAccentColor, setHiloAccentColor] = useState(DEFAULT_HILO_CONFIG.accentColor);
    const [hiloBgColor, setHiloBgColor] = useState(DEFAULT_HILO_CONFIG.backgroundColor);
    const [hiloDealSoundType, setHiloDealSoundType] = useState(DEFAULT_HILO_CONFIG.dealSoundType);
    const [hiloDealSoundFile, setHiloDealSoundFile] = useState<string | null>(DEFAULT_HILO_CONFIG.dealSoundFile);
    const [hiloLossSoundType, setHiloLossSoundType] = useState(DEFAULT_HILO_CONFIG.lossSoundType);
    const [hiloLossSoundFile, setHiloLossSoundFile] = useState<string | null>(DEFAULT_HILO_CONFIG.lossSoundFile);
    const [hiloActiveSection, setHiloActiveSection] = useState<'design' | 'audio' | 'preview'>('design');

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
        setEngineReady(false);
        setCrashEngineReady(false);
        setScratchEngineReady(false);
    }, [gameType]);

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

    // ─── Build Wheel Config JSON ─────────────────────────────────────────────
    const buildWheelConfig = useCallback((): WheelConfig => {
        return {
            pointerStyle: wheelPointerStyle,
            pointerImage: wheelPointerImage,
            wheelTexture: wheelTexture,
            accentColor: wheelAccentColor,
            backgroundColor: wheelBgColor,
            backgroundImage: wheelBgImage,
            tickSound: wheelTickSound,
            tickSoundFile: wheelTickSoundFile,
            segments: wheelSegments,
            enableTrollWheel: wheelEnableTrollWheel,
            confettiType: wheelConfettiType,
            confettiImage: wheelConfettiImage,
            theme: {
                gameName: wheelGameName,
                gameDescription: wheelGameDescription,
            },
        };
    }, [wheelPointerStyle, wheelPointerImage, wheelTexture, wheelAccentColor, wheelBgColor, wheelBgImage, wheelTickSound, wheelTickSoundFile, wheelSegments, wheelEnableTrollWheel, wheelConfettiType, wheelConfettiImage, wheelGameName, wheelGameDescription]);

    // ─── Build Mines Config JSON ─────────────────────────────────────────────
    const buildMinesConfig = useCallback((): MinesConfig => {
        return {
            gridSize: minesGridSize,
            mineImage: minesMineImage,
            gemImage: minesGemImage,
            bustImage: minesBustImage,
            watermarkImage: minesWatermarkImage,
            backgroundImage: minesBgImage,
            accentColor: minesAccentColor,
            backgroundColor: minesBgColor,
            tileColor: minesTileColor,
            enableProgressiveSuspense: minesEnableSuspense,
            lossSoundType: minesLossSoundType,
            lossSoundFile: minesLossSoundFile,
            revealSoundFile: minesRevealSoundFile,
            enableFlipAnimation: minesEnableFlip,
            bustAnimationStyle: minesBustStyle,
            theme: {
                gameName: minesGameName,
                gameDescription: minesGameDescription,
            },
        };
    }, [minesGridSize, minesMineImage, minesGemImage, minesBustImage, minesWatermarkImage, minesBgImage, minesAccentColor, minesBgColor, minesTileColor, minesEnableSuspense, minesLossSoundType, minesLossSoundFile, minesRevealSoundFile, minesEnableFlip, minesBustStyle, minesGameName, minesGameDescription]);

    // ─── Build Case Config JSON ──────────────────────────────────────────────
    const buildCaseConfig = useCallback((): CaseConfig => {
        return {
            collectionName: caseCollectionName,
            caseDesign,
            caseImage,
            backgroundImage: caseBgImage,
            accentColor: caseAccentColor,
            backgroundColor: caseBgColor,
            enableRarityGlow: caseEnableRarityGlow,
            openingSoundType: caseOpeningSoundType,
            openingSoundFile: caseOpeningSoundFile,
            enableRareExplosionSound: caseEnableRareExplosion,
            items: caseItems,
            scrollDuration: caseScrollDuration,
            theme: {
                gameName: caseGameName,
                gameDescription: caseGameDescription,
            },
        };
    }, [caseCollectionName, caseDesign, caseImage, caseBgImage, caseAccentColor, caseBgColor, caseEnableRarityGlow, caseOpeningSoundType, caseOpeningSoundFile, caseEnableRareExplosion, caseItems, caseScrollDuration, caseGameName, caseGameDescription]);

    // ─── Build HiLo Config JSON ──────────────────────────────────────────────
    const buildHiloConfig = useCallback((): HiLoConfig => {
        return {
            cardBackImage: hiloCardBackImage,
            customFaceCards: {
                J: hiloFaceJ,
                Q: hiloFaceQ,
                K: hiloFaceK,
                A: hiloFaceA
            },
            accentColor: hiloAccentColor,
            backgroundColor: hiloBgColor,
            dealSoundType: hiloDealSoundType as any,
            dealSoundFile: hiloDealSoundFile,
            lossSoundType: hiloLossSoundType as any,
            lossSoundFile: hiloLossSoundFile,
            theme: {
                gameName: hiloGameName,
                gameDescription: hiloGameDescription
            }
        };
    }, [hiloCardBackImage, hiloFaceJ, hiloFaceQ, hiloFaceK, hiloFaceA, hiloAccentColor, hiloBgColor, hiloDealSoundType, hiloDealSoundFile, hiloLossSoundType, hiloLossSoundFile, hiloGameName, hiloGameDescription]);

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

    const DATA_URL_SIZE_LIMIT = 120_000;
    const MAX_PUBLISHED_GAMES = 50;
    const GAME_ASSETS_BUCKET = 'game-assets';
    const FALLBACK_ASSETS_BUCKET = 'avatars';
    const supabase = createClient();

    const compactLargeDataUrls = (value: any): any => {
        if (typeof value === 'string' && value.startsWith('data:') && value.length > DATA_URL_SIZE_LIMIT) {
            return null;
        }

        if (Array.isArray(value)) {
            return value.map(compactLargeDataUrls);
        }

        if (value && typeof value === 'object') {
            const compacted: Record<string, any> = {};
            Object.entries(value).forEach(([key, nestedValue]) => {
                compacted[key] = compactLargeDataUrls(nestedValue);
            });
            return compacted;
        }

        return value;
    };

    const persistPublishedGames = (games: any[]) => {
        const trimmedToLimit = games.slice(0, MAX_PUBLISHED_GAMES);

        try {
            localStorage.setItem('custom_published_games', JSON.stringify(trimmedToLimit));
            window.dispatchEvent(new Event('storage'));
            return true;
        } catch (error) {
            console.warn('Failed to store full game payload, trying compact mode.', error);
        }

        const compacted = trimmedToLimit.map(compactLargeDataUrls);
        for (let keep = compacted.length; keep >= 1; keep -= 1) {
            try {
                localStorage.setItem('custom_published_games', JSON.stringify(compacted.slice(0, keep)));
                window.dispatchEvent(new Event('storage'));
                if (keep < compacted.length) {
                    alert('Storage was almost full. Older games were trimmed to save the latest publish.');
                } else {
                    alert('Storage was full. Large embedded assets were trimmed from saved games.');
                }
                return true;
            } catch {
                // Continue trimming until payload fits.
            }
        }

        return false;
    };

    const getFileExtensionForDataUrl = (dataUrl: string) => {
        const mime = dataUrl.match(/^data:(.*?);base64,/)?.[1] || '';
        if (mime.includes('png')) return 'png';
        if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
        if (mime.includes('gif')) return 'gif';
        if (mime.includes('svg')) return 'svg';
        if (mime.includes('mp3')) return 'mp3';
        if (mime.includes('wav')) return 'wav';
        if (mime.includes('ogg')) return 'ogg';
        if (mime.includes('webp')) return 'webp';
        return 'bin';
    };

    const dataUrlToBlob = async (dataUrl: string) => {
        const response = await fetch(dataUrl);
        return response.blob();
    };

    const uploadDataUrlToSupabase = async (dataUrl: string, folderPrefix: string) => {
        const ext = getFileExtensionForDataUrl(dataUrl);
        const filePath = `${folderPrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const blob = await dataUrlToBlob(dataUrl);

        const uploadToBucket = async (bucket: string) => {
            const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
                upsert: false,
                contentType: blob.type || undefined
            });
            if (error) throw error;
            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            return data.publicUrl;
        };

        try {
            return await uploadToBucket(GAME_ASSETS_BUCKET);
        } catch {
            return await uploadToBucket(FALLBACK_ASSETS_BUCKET);
        }
    };

    const moveEmbeddedAssetsToSupabase = async (value: any, folderPrefix: string, cache: Map<string, string>): Promise<any> => {
        if (typeof value === 'string' && value.startsWith('data:')) {
            if (cache.has(value)) return cache.get(value);
            const publicUrl = await uploadDataUrlToSupabase(value, folderPrefix);
            cache.set(value, publicUrl);
            return publicUrl;
        }

        if (Array.isArray(value)) {
            const mapped = [];
            for (const entry of value) {
                mapped.push(await moveEmbeddedAssetsToSupabase(entry, folderPrefix, cache));
            }
            return mapped;
        }

        if (value && typeof value === 'object') {
            const mapped: Record<string, any> = {};
            for (const [key, nestedValue] of Object.entries(value)) {
                mapped[key] = await moveEmbeddedAssetsToSupabase(nestedValue, folderPrefix, cache);
            }
            return mapped;
        }

        return value;
    };

    const prepareGameForStorage = async (game: any) => {
        const creatorId = creatorData?.id || 'unknown-creator';
        const folderPrefix = `creator-games/${creatorId}/${game.type || 'generic'}`;
        const cache = new Map<string, string>();
        try {
            return await moveEmbeddedAssetsToSupabase(game, folderPrefix, cache);
        } catch (error) {
            console.warn('Failed to offload game assets to Supabase storage.', error);
            return game;
        }
    };

    // ─── Delete Game ───────────────────────────────────────────────────────
    const deleteGame = (gameId: string) => {
        const data = localStorage.getItem('custom_published_games');
        if (data) {
            const allGames = JSON.parse(data);
            const filtered = allGames.filter((g: any) => g.id !== gameId);
            persistPublishedGames(filtered);
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

            setTimeout(async () => {
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
                const preparedGame = await prepareGameForStorage(newGame);

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                if (!persistPublishedGames([preparedGame, ...games])) {
                    setIsPublishing(false);
                    alert('Could not save the game because browser storage is full. Remove a few old games and try again.');
                    return;
                }
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

            setTimeout(async () => {
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
                const preparedGame = await prepareGameForStorage(newGame);

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                if (!persistPublishedGames([preparedGame, ...games])) {
                    setIsPublishing(false);
                    alert('Could not save the game because browser storage is full. Remove a few old games and try again.');
                    return;
                }
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

            setTimeout(async () => {
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
                const preparedGame = await prepareGameForStorage(newGame);

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                if (!persistPublishedGames([preparedGame, ...games])) {
                    setIsPublishing(false);
                    alert('Could not save the game because browser storage is full. Remove a few old games and try again.');
                    return;
                }
                setIsPublishing(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setScratchGameName('My Scratch Card');
                    setScratchGameDescription('Scratch to reveal and win!');
                    setScratchLobbyCover(null);
                    setIsSuccess(false);
                }, 2500);
            }, 1500);
        } else if (gameType === 'wheel') {
            // Wheel publish
            if (!wheelGameName.trim()) { alert("Please provide a game name."); return; }
            if (!wheelCoverImage) { alert("Please upload a cover image before publishing."); return; }

            const existingStr = localStorage.getItem('custom_published_games');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            if (existing.some((g: any) => g.name.toLowerCase() === wheelGameName.trim().toLowerCase())) {
                alert("A game with this name already exists. Please choose a unique name.");
                return;
            }

            setIsPublishing(true);

            setTimeout(async () => {
                const wheelConfig = buildWheelConfig();
                const newGame = {
                    id: 'wheel_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    creatorId: creatorData.id || creatorData.name,
                    creatorName: creatorData.name,
                    type: 'wheel',
                    name: wheelGameName,
                    gameDescription: wheelGameDescription,
                    coverImage: wheelCoverImage,
                    themeEmoji: '🎡',
                    themeColor: wheelAccentColor,
                    wheelConfig,
                    winEffect,
                    winSound,
                    publishedAt: new Date().toISOString()
                };
                const preparedGame = await prepareGameForStorage(newGame);

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                if (!persistPublishedGames([preparedGame, ...games])) {
                    setIsPublishing(false);
                    alert('Could not save the game because browser storage is full. Remove a few old games and try again.');
                    return;
                }
                setIsPublishing(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setWheelGameName('My Wheel Game');
                    setWheelGameDescription('Spin the wheel and win big!');
                    setWheelCoverImage(null);
                    setIsSuccess(false);
                }, 2500);
            }, 1500);
        } else if (gameType === 'mines') {
            // Mines publish
            if (!minesGameName.trim()) { alert("Please provide a game name."); return; }
            if (!minesCoverImage) { alert("Please upload a cover image before publishing."); return; }

            const existingStr = localStorage.getItem('custom_published_games');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            if (existing.some((g: any) => g.name.toLowerCase() === minesGameName.trim().toLowerCase())) {
                alert("A game with this name already exists. Please choose a unique name.");
                return;
            }

            setIsPublishing(true);

            setTimeout(async () => {
                const minesConfig = buildMinesConfig();
                const newGame = {
                    id: 'mines_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    creatorId: creatorData.id || creatorData.name,
                    creatorName: creatorData.name,
                    type: 'mines',
                    name: minesGameName,
                    gameDescription: minesGameDescription,
                    coverImage: minesCoverImage,
                    themeEmoji: '💣',
                    themeColor: minesAccentColor,
                    minesConfig,
                    winEffect,
                    winSound,
                    publishedAt: new Date().toISOString()
                };
                const preparedGame = await prepareGameForStorage(newGame);

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                if (!persistPublishedGames([preparedGame, ...games])) {
                    setIsPublishing(false);
                    alert('Could not save the game because browser storage is full. Remove a few old games and try again.');
                    return;
                }
                setIsPublishing(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setMinesGameName('My Mines Game');
                    setMinesGameDescription('Reveal the safe tiles and avoid the mines!');
                    setMinesCoverImage(null);
                    setIsSuccess(false);
                }, 2500);
            }, 1500);
        } else if (gameType === 'case') {
            if (!caseGameName.trim()) { alert("Please provide a game name."); return; }
            if (!caseCoverImage) { alert("Please upload a cover image before publishing."); return; }

            const existingStr = localStorage.getItem('custom_published_games');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            if (existing.some((g: any) => g.name.toLowerCase() === caseGameName.trim().toLowerCase())) {
                alert("A game with this name already exists. Please choose a unique name.");
                return;
            }

            // Ensure probabilities sum to 100
            const totalProb = caseItems.reduce((sum, item) => sum + item.probability, 0);
            if (Math.abs(totalProb - 100) > 0.01) {
                alert(`Item probabilities must sum to exactly 100%. Currently: ${totalProb}%`);
                return;
            }

            setIsPublishing(true);

            setTimeout(async () => {
                const caseConfig = buildCaseConfig();
                const newGame = {
                    id: 'case_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    creatorId: creatorData.id || creatorData.name,
                    creatorName: creatorData.name,
                    type: 'case',
                    name: caseGameName,
                    gameDescription: caseGameDescription,
                    coverImage: caseCoverImage,
                    themeEmoji: '📦',
                    themeColor: caseAccentColor,
                    caseConfig,
                    winEffect,
                    winSound,
                    publishedAt: new Date().toISOString()
                };
                const preparedGame = await prepareGameForStorage(newGame);

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                if (!persistPublishedGames([preparedGame, ...games])) {
                    setIsPublishing(false);
                    alert('Could not save the game because browser storage is full. Remove a few old games and try again.');
                    return;
                }
                setIsPublishing(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setCaseGameName('My Case Opening');
                    setCaseGameDescription('Open the case to discover rewards!');
                    setCaseCoverImage(null);
                    setIsSuccess(false);
                }, 2500);
            }, 1500);
        } else if (gameType === 'hilo') {
            if (!hiloGameName.trim()) { alert("Please provide a game name."); return; }
            if (!hiloCoverImage) { alert("Please upload a cover image before publishing."); return; }

            const existingStr = localStorage.getItem('custom_published_games');
            const existing = existingStr ? JSON.parse(existingStr) : [];
            if (existing.some((g: any) => g.name.toLowerCase() === hiloGameName.trim().toLowerCase())) {
                alert("A game with this name already exists. Please choose a unique name.");
                return;
            }

            setIsPublishing(true);

            setTimeout(async () => {
                const hiloConfig = buildHiloConfig();
                const newGame = {
                    id: 'hilo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    creatorId: creatorData.id || creatorData.name,
                    creatorName: creatorData.name,
                    type: 'hilo',
                    name: hiloGameName,
                    gameDescription: hiloGameDescription,
                    coverImage: hiloCoverImage,
                    themeEmoji: '🃏',
                    themeColor: hiloAccentColor,
                    hiloConfig,
                    winEffect,
                    winSound,
                    publishedAt: new Date().toISOString()
                };
                const preparedGame = await prepareGameForStorage(newGame);

                const gamesStr = localStorage.getItem('custom_published_games');
                const games = gamesStr ? JSON.parse(gamesStr) : [];
                if (!persistPublishedGames([preparedGame, ...games])) {
                    setIsPublishing(false);
                    alert('Could not save the game because browser storage is full. Remove a few old games and try again.');
                    return;
                }
                setIsPublishing(false);
                setIsSuccess(true);

                setTimeout(() => {
                    setHiloGameName('My Hi-Lo Game');
                    setHiloGameDescription('Guess higher or lower!');
                    setHiloCoverImage(null);
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
        { id: 'design', icon: <Palette size={16} />, label: 'Design & Assets' },
        { id: 'grid', icon: <Grid3X3 size={16} />, label: 'Grid Layout' },
        { id: 'paytable', icon: <Zap size={16} />, label: 'Paytable & Odds' },
        { id: 'features', icon: <Settings2 size={16} />, label: 'Special Mechanics' },
        { id: 'preview', icon: <Eye size={16} />, label: 'Preview & Publish' },
    ] as const;

    // ════════════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════════════
    return (
        <>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full space-y-6">
            <div className="bg-[#0b1622]/90 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">

                {/* ─── Header ─────────────────────────────────────────────── */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gameType === 'crash' ? 'bg-emerald-500/20 text-emerald-400' : gameType === 'scratch' ? 'bg-amber-500/20 text-amber-400' : gameType === 'wheel' ? 'bg-rose-500/20 text-rose-400' : gameType === 'mines' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                {gameType === 'crash' ? <Rocket size={24} /> : gameType === 'scratch' ? <Sparkles size={24} /> : gameType === 'wheel' ? <RotateCcw size={24} /> : gameType === 'mines' ? <Grid3X3 size={24} /> : <Sparkles size={24} />}
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight">Game Creator Studio</h2>
                        </div>
                        <p className="text-slate-400 font-medium">Choose a game type and customize every detail — then publish to the casino lobby.</p>
                    </div>
                </div>

                <div className="relative mb-8 z-50">
                    <button 
                        onClick={() => setIsGameDropdownOpen(!isGameDropdownOpen)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between shadow-lg ${
                            isGameDropdownOpen 
                                ? 'bg-[#111c2a] border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]' 
                                : 'bg-[#0a111a] border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
                        }`}
                    >
                        {(() => {
                            const current = GAME_TYPES_INFO.find(t => t.id === gameType);
                            return (
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${current?.iconBg}`}>
                                        {current?.icon}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                            Selected Template
                                        </div>
                                        <h3 className="text-2xl font-black text-white">{current?.label}</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">{current?.desc}</p>
                                    </div>
                                </div>
                            );
                        })()}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white/5 transition-transform ${isGameDropdownOpen ? 'rotate-180 bg-indigo-500/20 text-indigo-400' : 'text-slate-400'}`}>
                            <ChevronDown size={20} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {isGameDropdownOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-[calc(100%+0.5rem)] left-0 right-0 bg-[#0f1722] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden z-50 p-3"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {GAME_TYPES_INFO.map((g) => (
                                        <button
                                            key={g.id}
                                            onClick={() => {
                                                setGameType(g.id as GameType);
                                                setIsGameDropdownOpen(false);
                                            }}
                                            className={`p-4 rounded-xl border text-left transition-all flex items-center gap-4 w-full group ${
                                                gameType === g.id 
                                                    ? g.style 
                                                    : 'border-transparent bg-white/[0.01] hover:bg-white/5 hover:border-white/10'
                                            }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${g.iconBg} group-hover:scale-110 transition-transform ${gameType === g.id ? 'scale-110' : ''}`}>
                                                {g.icon}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-black text-lg ${gameType === g.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{g.label}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-1">{g.desc}</p>
                                            </div>
                                            {gameType === g.id && <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Check size={14} className="opacity-100 text-white" /></div>}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {isSuccess ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mb-6 shadow-[0_0_50px_rgba(34,197,94,0.3)] border-2 border-green-500/50">
                            <Check size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-2 tracking-tight">Game Published!</h3>
                        <p className="text-slate-400 max-w-md">{gameType === 'crash' ? 'Your crash game is now live! Players can bet and ride the multiplier.' : gameType === 'scratch' ? 'Your scratch card is now live! Players can scratch and win prizes.' : gameType === 'wheel' ? 'Your wheel game is now live! Players can spin and test their luck.' : gameType === 'mines' ? 'Your mines game is now live! Players can reveal tiles and test their luck!' : 'Your slot game is now live in the Casino Lobby. Players can spin and you\'ll earn a cut!'}</p>
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

                        {gameType === 'wheel' && (
                        <div className="flex bg-[#0a111a] rounded-xl p-1 border border-white/10 gap-1 overflow-x-auto">
                            {[
                                { id: 'design', icon: <Palette size={16} />, label: 'Design & Assets' },
                                { id: 'segments', icon: <Settings2 size={16} />, label: 'Segments & Mechanics' },
                                { id: 'preview', icon: <Eye size={16} />, label: 'Preview & Publish' },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setWheelActiveSection(s.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${wheelActiveSection === s.id
                                        ? 'bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {s.icon}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        )}

                        {gameType === 'mines' && (
                        <div className="flex bg-[#0a111a] rounded-xl p-1 border border-white/10 gap-1 overflow-x-auto">
                            {[
                                { id: 'design', icon: <Palette size={16} />, label: 'Design & Assets' },
                                { id: 'mechanics', icon: <Settings2 size={16} />, label: 'Grid & Mechanics' },
                                { id: 'preview', icon: <Eye size={16} />, label: 'Preview & Publish' },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setMinesActiveSection(s.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${minesActiveSection === s.id
                                        ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg shadow-orange-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {s.icon}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        )}

                        {gameType === 'case' && (
                        <div className="flex bg-[#0a111a] rounded-xl p-1 border border-white/10 gap-1 overflow-x-auto">
                            {[
                                { id: 'design', icon: <Palette size={16} />, label: 'Design & Audio' },
                                { id: 'items', icon: <Settings2 size={16} />, label: 'Items & Rarities' },
                                { id: 'preview', icon: <Eye size={16} />, label: 'Preview & Publish' },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setCaseActiveSection(s.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${caseActiveSection === s.id
                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {s.icon}
                                    {s.label}
                                </button>
                            ))}
                        </div>
                        )}

                        {gameType === 'hilo' && (
                        <div className="flex bg-[#0a111a] rounded-xl p-1 border border-white/10 gap-1 overflow-x-auto">
                            {[
                                { id: 'design', icon: <Palette size={16} />, label: 'Design & Assets' },
                                { id: 'audio', icon: <Volume2 size={16} />, label: 'Audio Setup' },
                                { id: 'preview', icon: <Eye size={16} />, label: 'Preview & Publish' },
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setHiloActiveSection(s.id as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${hiloActiveSection === s.id
                                        ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-lg shadow-blue-500/20'
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
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative flex flex-col items-center justify-center p-8 text-center" style={{ boxShadow: `0 0 40px ${accentColor}15` }}>
                                            <div className="w-24 h-32 bg-[#121c22] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                                                <Gamepad2 className="text-purple-500/50" size={40} />
                                            </div>
                                            <h4 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Slot Engine Ready</h4>
                                            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8">Test your custom symbols, grid layouts, and logic in a fully functional preview environment.</p>
                                            <button onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: { type: 'slot_engine', slotConfig: buildConfig(), name: gameName, isPreview: true } }))} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:brightness-110 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-purple-500/20">
                                                <Play size={20} /> Launch Full Preview
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

                                        {/* Cover Image Upload */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Lobby Cover Image</h4>
                                                {coverImage && <button onClick={() => setCoverImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            {coverImage ? (
                                                <img src={coverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                                            ) : (
                                                <label className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:text-purple-400 transition-colors bg-white/5 rounded-xl p-8 justify-center border-2 border-dashed border-white/10 hover:border-purple-500/30">
                                                    <ImageIcon size={24} />
                                                    <span className="text-xs font-bold">Upload Cover Image</span>
                                                    <span className="text-[10px] text-slate-600">Required for publishing</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCoverImage, 800)} />
                                                </label>
                                            )}
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
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative flex flex-col items-center justify-center p-8 text-center" style={{ boxShadow: `0 0 40px ${crashGraphColor}15` }}>
                                            <div className="w-24 h-32 bg-[#121c22] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                                                <Rocket className="text-emerald-500/50" size={40} />
                                            </div>
                                            <h4 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Crash Engine Ready</h4>
                                            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8">Test your custom graphics, multipliers, and game logic in a fully functional preview environment.</p>
                                            <button onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: { type: 'crash', crashConfig: buildCrashConfig(), name: crashGameName, isPreview: true } }))} className="bg-gradient-to-r from-emerald-600 to-green-600 hover:brightness-110 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-emerald-500/20">
                                                <Play size={20} /> Launch Full Preview
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

                                        {/* Cover Image Upload */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Lobby Cover Image</h4>
                                                {crashCoverImage && <button onClick={() => setCrashCoverImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            {crashCoverImage ? (
                                                <img src={crashCoverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                                            ) : (
                                                <label className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:text-emerald-400 transition-colors bg-white/5 rounded-xl p-8 justify-center border-2 border-dashed border-white/10 hover:border-emerald-500/30">
                                                    <ImageIcon size={24} />
                                                    <span className="text-xs font-bold">Upload Cover Image</span>
                                                    <span className="text-[10px] text-slate-600">Required for publishing</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCrashCoverImage, 800)} />
                                                </label>
                                            )}
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
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative flex flex-col items-center justify-center p-8 text-center" style={{ boxShadow: `0 0 40px ${scratchAccentColor}15` }}>
                                            <div className="w-24 h-32 bg-[#121c22] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                                                {scratchCoverImage ? <img src={scratchCoverImage} className="absolute inset-0 w-full h-full object-cover" /> : <ImageIcon className="text-amber-500/50" size={40} />}
                                            </div>
                                            <h4 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Scratch Engine Ready</h4>
                                            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8">Test your custom card designs, scratching logic, and win animations in a fully functional preview environment.</p>
                                            <button onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: { type: 'scratch', scratchConfig: buildScratchConfig(), name: scratchGameName, isPreview: true } }))} className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-amber-500/20">
                                                <Play size={20} /> Launch Full Preview
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

                                        {/* Cover Image Upload */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Lobby Cover Image</h4>
                                                {scratchLobbyCover && <button onClick={() => setScratchLobbyCover(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            {scratchLobbyCover ? (
                                                <img src={scratchLobbyCover} alt="Cover" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                                            ) : (
                                                <label className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:text-amber-400 transition-colors bg-white/5 rounded-xl p-8 justify-center border-2 border-dashed border-white/10 hover:border-amber-500/30">
                                                    <ImageIcon size={24} />
                                                    <span className="text-xs font-bold">Upload Cover Image</span>
                                                    <span className="text-[10px] text-slate-600">Required for publishing</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setScratchLobbyCover, 800)} />
                                                </label>
                                            )}
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

                        {/* ════════════════════════════════════════════════════ */}
                        {/* WHEEL OF FORTUNE SECTIONS                           */}
                        {/* ════════════════════════════════════════════════════ */}

                        {/* ─── Wheel Design & Assets ──────────────────────── */}
                        {gameType === 'wheel' && wheelActiveSection === 'design' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Palette size={16} className="text-rose-400" /> Design & Graphics
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Name & Description */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Title</label>
                                            <input type="text" value={wheelGameName} onChange={(e) => setWheelGameName(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-rose-400 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-400/20 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                                            <input type="text" value={wheelGameDescription} onChange={(e) => setWheelGameDescription(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-rose-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Accent Color</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={wheelAccentColor} onChange={(e) => setWheelAccentColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{wheelAccentColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Background</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={wheelBgColor} onChange={(e) => setWheelBgColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{wheelBgColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Images */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Background Image</label>
                                            <label className="flex items-center justify-center gap-2 bg-[#0a111a] rounded-xl h-28 border border-dashed border-rose-400/30 hover:border-rose-400 hover:bg-rose-400/5 cursor-pointer transition-all relative overflow-hidden group">
                                                {wheelBgImage ? (
                                                    <>
                                                        <img src={wheelBgImage} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                                                        <span className="relative z-10 text-xs text-white font-bold bg-rose-500/80 px-4 py-2 rounded-lg backdrop-blur">Change Background</span>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Upload size={18} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
                                                        <span className="text-[11px] text-slate-400 font-bold">Upload Background</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setWheelBgImage)} />
                                            </label>
                                            {wheelBgImage && (
                                                <button className="text-[10px] text-slate-500 hover:text-red-400 mt-1 transition-colors" onClick={() => setWheelBgImage(null)}>Remove</button>
                                            )}
                                        </div>

                                    </div>
                                </div>

                                {/* Pointer Style Selector */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#1a0b1e] border border-rose-500/20 rounded-2xl p-5 mt-4">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">👆</span>
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Pointer / Indicator Style</span>
                                        </div>
                                        <label className={`text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border ${wheelPointerImage ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'}`}>
                                            <span className="flex items-center gap-1.5"><Upload size={12} />{wheelPointerImage ? 'Custom Image' : 'Upload Custom'}</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setWheelPointerImage, 128)} />
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {POINTER_PRESETS.map(ptr => (
                                            <button key={ptr.id} onClick={() => { setWheelPointerStyle(ptr.id as any); setWheelPointerImage(null); }}
                                                className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all ${wheelPointerStyle === ptr.id && !wheelPointerImage ? 'bg-gradient-to-b from-rose-500/20 to-rose-600/10 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                                                <span className={`text-xl mb-1 ${wheelPointerStyle === ptr.id && !wheelPointerImage ? 'scale-110' : 'opacity-60'}`}>{ptr.emoji}</span>
                                                <span className={`text-[8px] font-bold uppercase ${wheelPointerStyle === ptr.id && !wheelPointerImage ? 'text-white' : 'text-slate-500'}`}>{ptr.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {wheelPointerImage && (
                                        <div className="flex items-center gap-3 mt-3 p-2 bg-rose-500/10 rounded-lg border border-rose-500/20">
                                            <img src={wheelPointerImage} alt="custom" className="w-10 h-10 rounded-lg object-contain bg-black/30" />
                                            <span className="text-xs text-rose-400 font-bold">Custom pointer uploaded</span>
                                            <button className="ml-auto text-[10px] text-slate-500 hover:text-red-400" onClick={() => setWheelPointerImage(null)}>Remove</button>
                                        </div>
                                    )}
                                </div>

                                {/* Wheel Texture */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#1a0b1e] border border-rose-500/20 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                                        <span className="text-lg">🎨</span>
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Wheel Texture</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                        {TEXTURE_PRESETS.map(tex => (
                                            <button key={tex.id} onClick={() => setWheelTexture(tex.id as any)}
                                                className={`p-4 rounded-xl border-2 transition-all text-left ${wheelTexture === tex.id
                                                    ? 'border-rose-500 bg-gradient-to-br from-rose-500/10 to-rose-600/5'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}>
                                                <span className={`text-xl mb-2 block ${wheelTexture === tex.id ? 'scale-110' : 'opacity-60'}`}>{tex.emoji}</span>
                                                <span className={`text-xs font-black block ${wheelTexture === tex.id ? 'text-white' : 'text-slate-400'}`}>{tex.label}</span>
                                                <span className="text-[10px] text-slate-500">{tex.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Confetti Celebration */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#1a0b1e] border border-rose-500/20 rounded-2xl p-5">
                                    <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                                        <span className="text-lg">🎉</span>
                                        <span className="text-xs font-black text-white uppercase tracking-widest">Win Celebration</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setWheelConfettiType('classic')}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${wheelConfettiType === 'classic' ? 'border-rose-500 bg-gradient-to-br from-rose-500/10 to-rose-600/5' : 'border-white/10 bg-[#0a111a] hover:border-white/20'}`}>
                                            <span className="text-2xl mb-2 block">🎊</span>
                                            <span className={`text-sm font-black ${wheelConfettiType === 'classic' ? 'text-white' : 'text-slate-400'}`}>Classic Confetti</span>
                                            <p className="text-[10px] text-slate-500 mt-1">Standard colorful particles</p>
                                        </button>
                                        <button onClick={() => setWheelConfettiType('custom_logo')}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${wheelConfettiType === 'custom_logo' ? 'border-rose-500 bg-gradient-to-br from-rose-500/10 to-rose-600/5' : 'border-white/10 bg-[#0a111a] hover:border-white/20'}`}>
                                            <span className="text-2xl mb-2 block">📸</span>
                                            <span className={`text-sm font-black ${wheelConfettiType === 'custom_logo' ? 'text-white' : 'text-slate-400'}`}>Custom Logo Rain</span>
                                            <p className="text-[10px] text-slate-500 mt-1">Your logo falls as confetti</p>
                                        </button>
                                    </div>
                                    {wheelConfettiType === 'custom_logo' && (
                                        <div className="mt-3">
                                            <label className="flex items-center justify-center gap-2 bg-[#0a111a] rounded-xl h-20 border border-dashed border-rose-400/30 hover:border-rose-400 hover:bg-rose-400/5 cursor-pointer transition-all relative overflow-hidden group">
                                                {wheelConfettiImage ? (
                                                    <>
                                                        <img src={wheelConfettiImage} alt="logo" className="h-12 object-contain" />
                                                        <span className="text-xs text-rose-400 font-bold">Change Logo</span>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Upload size={16} className="text-slate-500 group-hover:text-rose-400 transition-colors" />
                                                        <span className="text-[11px] text-slate-400 font-bold">Upload Logo / Channel Icon</span>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setWheelConfettiImage, 64)} />
                                            </label>
                                            {wheelConfettiImage && <button className="text-[10px] text-slate-500 hover:text-red-400 mt-1" onClick={() => setWheelConfettiImage(null)}>Remove</button>}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Wheel Segments & Mechanics ─────────────────── */}
                        {gameType === 'wheel' && wheelActiveSection === 'segments' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Settings2 size={16} className="text-rose-400" /> Segments & Mechanics
                                </h3>

                                {/* Troll Wheel Toggle */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#1a0b1e] border border-rose-500/20 rounded-2xl p-5">
                                    <Toggle enabled={wheelEnableTrollWheel} onToggle={() => setWheelEnableTrollWheel(!wheelEnableTrollWheel)}
                                        label='🎭 Troll Wheel — Visual size ≠ Real probability' />
                                    {wheelEnableTrollWheel && (
                                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                            <p className="text-[11px] text-amber-400 font-bold">⚡ Troll Mode Active — You can make a segment look HUGE on the wheel but have a tiny actual chance. Great for stream entertainment!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Segments Table */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Wheel Segments</label>
                                        <div className="flex gap-2">
                                            <button onClick={() => {
                                                const id = 'seg_' + Date.now();
                                                const prob = 1 / (wheelSegments.length + 1);
                                                setWheelSegments(prev => [...prev, { id, label: 'New', multiplier: 1, color: SEGMENT_COLORS[prev.length % SEGMENT_COLORS.length], visualWeight: 1, realProbability: prob }]);
                                            }} className="text-xs bg-rose-500/20 text-rose-400 px-3 py-1.5 rounded-lg font-bold hover:bg-rose-500/30 transition-colors">
                                                + Add Segment
                                            </button>
                                            <button onClick={() => {
                                                const id = 'seg_sp_' + Date.now();
                                                setWheelSegments(prev => [...prev, { id, label: 'RESPIN', multiplier: 0, color: '#e67e22', visualWeight: 1, realProbability: 0.05, specialType: 'respin' }]);
                                            }} className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg font-bold hover:bg-amber-500/30 transition-colors">
                                                + Respin
                                            </button>
                                            <button onClick={() => {
                                                const id = 'seg_x2_' + Date.now();
                                                setWheelSegments(prev => [...prev, { id, label: 'x2 NEXT', multiplier: 0, color: '#9b59b6', visualWeight: 1, realProbability: 0.05, specialType: 'multiplier_x2' }]);
                                            }} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-500/30 transition-colors">
                                                + Multiplier ×2
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-[#0a111a] rounded-xl border border-white/10 overflow-hidden">
                                        {/* Table Header */}
                                        <div className={`grid gap-2 p-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-[#080d14] ${wheelEnableTrollWheel ? 'grid-cols-[40px_80px_1fr_80px_70px_70px_40px]' : 'grid-cols-[40px_80px_1fr_80px_80px_40px]'}`}>
                                            <div>Color</div>
                                            <div>Label</div>
                                            <div>Type</div>
                                            <div className="text-center">Mult</div>
                                            {wheelEnableTrollWheel && <div className="text-center">Visual W</div>}
                                            <div className="text-center">Prob %</div>
                                            <div></div>
                                        </div>

                                        {/* Segment Rows */}
                                        {wheelSegments.map((seg) => (
                                            <div key={seg.id} className={`grid gap-2 p-3 items-center border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors ${wheelEnableTrollWheel ? 'grid-cols-[40px_80px_1fr_80px_70px_70px_40px]' : 'grid-cols-[40px_80px_1fr_80px_80px_40px]'}`}>
                                                {/* Color */}
                                                <input type="color" value={seg.color}
                                                    onChange={(e) => setWheelSegments(prev => prev.map(s => s.id === seg.id ? { ...s, color: e.target.value } : s))}
                                                    className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer bg-transparent" />
                                                {/* Label */}
                                                <input type="text" value={seg.label}
                                                    onChange={(e) => setWheelSegments(prev => prev.map(s => s.id === seg.id ? { ...s, label: e.target.value } : s))}
                                                    className="bg-transparent border-b border-white/5 focus:border-rose-400 text-white text-xs font-bold px-1 py-1 focus:outline-none transition-colors" />
                                                {/* Type */}
                                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md w-fit ${seg.specialType === 'respin' ? 'bg-amber-500/20 text-amber-400' : seg.specialType === 'multiplier_x2' ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-slate-400'}`}>
                                                    {seg.specialType === 'respin' ? '🔄 Respin' : seg.specialType === 'multiplier_x2' ? '✖️2 Mult' : '💰 Normal'}
                                                </span>
                                                {/* Multiplier */}
                                                <input type="number" step="0.5" min="0" value={seg.multiplier}
                                                    onChange={(e) => setWheelSegments(prev => prev.map(s => s.id === seg.id ? { ...s, multiplier: parseFloat(e.target.value) || 0 } : s))}
                                                    disabled={!!seg.specialType}
                                                    className="w-full bg-[#0d1520] border border-white/5 text-center text-white font-mono text-xs rounded-lg py-1.5 focus:outline-none focus:border-rose-400 transition-colors disabled:opacity-40" />
                                                {/* Visual Weight (troll mode only) */}
                                                {wheelEnableTrollWheel && (
                                                    <input type="number" step="0.1" min="0.1" value={seg.visualWeight}
                                                        onChange={(e) => setWheelSegments(prev => prev.map(s => s.id === seg.id ? { ...s, visualWeight: parseFloat(e.target.value) || 1 } : s))}
                                                        className="w-full bg-[#0d1520] border border-white/5 text-center text-white font-mono text-xs rounded-lg py-1.5 focus:outline-none focus:border-amber-400 transition-colors" />
                                                )}
                                                {/* Real Probability */}
                                                <input type="number" step="1" min="1" max="100"
                                                    value={Math.round(seg.realProbability * 100)}
                                                    onChange={(e) => {
                                                        const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                                                        setWheelSegments(prev => prev.map(s => s.id === seg.id ? { ...s, realProbability: val / 100 } : s));
                                                    }}
                                                    className="w-full bg-[#0d1520] border border-white/5 text-center text-white font-mono text-xs rounded-lg py-1.5 focus:outline-none focus:border-rose-400 transition-colors" />
                                                {/* Delete */}
                                                <button onClick={() => { if (wheelSegments.length > 2) setWheelSegments(prev => prev.filter(s => s.id !== seg.id)); }}
                                                    className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-500/10 mx-auto" disabled={wheelSegments.length <= 2}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Probability sum warning */}
                                    {(() => {
                                        const total = wheelSegments.reduce((sum, s) => sum + Math.round(s.realProbability * 100), 0);
                                        return total !== 100 ? (
                                            <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                <p className="text-[11px] text-amber-400 font-bold">⚠️ Probabilities sum to {total}% — they should add up to 100%. Values will be normalized automatically at runtime.</p>
                                            </div>
                                        ) : (
                                            <div className="mt-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                                <p className="text-[11px] text-green-400 font-bold">✓ Probabilities sum to 100%</p>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Tick Sound */}
                                <div className="bg-gradient-to-br from-[#0a111a] to-[#1a0b1e] border border-rose-500/20 rounded-2xl p-5">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <Volume2 size={16} className="text-rose-400" />
                                            <span className="text-xs font-black text-white uppercase tracking-widest">Tick Sound Theme</span>
                                        </div>
                                        <label className={`text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer transition-all border ${wheelTickSoundFile ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'}`}>
                                            <span className="flex items-center gap-1.5"><Upload size={12} />{wheelTickSoundFile ? 'Custom Audio' : 'Upload Custom'}</span>
                                            <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, setWheelTickSoundFile)} />
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {TICK_SOUND_PRESETS.map(snd => (
                                            <button key={snd.id} onClick={() => { setWheelTickSound(snd.id as any); setWheelTickSoundFile(null); }}
                                                className={`flex flex-col items-center justify-center py-4 rounded-xl border transition-all ${wheelTickSound === snd.id && !wheelTickSoundFile ? 'bg-gradient-to-b from-rose-500/20 to-rose-600/10 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'bg-black/30 border-white/5 hover:bg-white/5'}`}>
                                                <span className={`text-2xl mb-1 ${wheelTickSound === snd.id && !wheelTickSoundFile ? 'scale-110' : 'opacity-60'}`}>{snd.emoji}</span>
                                                <span className={`text-[10px] font-bold uppercase ${wheelTickSound === snd.id && !wheelTickSoundFile ? 'text-white' : 'text-slate-500'}`}>{snd.label}</span>
                                                <span className="text-[9px] text-slate-600 mt-1">{snd.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {wheelTickSoundFile && <button className="text-[10px] text-slate-500 hover:text-red-400 mt-2" onClick={() => setWheelTickSoundFile(null)}>Remove Custom Audio</button>}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Wheel Preview & Publish ────────────────────── */}
                        {gameType === 'wheel' && wheelActiveSection === 'preview' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Eye size={16} className="text-cyan-400" /> Preview & Publish
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Wheel Preview Canvas */}
                                    <div className="lg:col-span-2 space-y-3">
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative flex flex-col items-center justify-center p-8 text-center" style={{ boxShadow: `0 0 40px ${wheelAccentColor}15` }}>
                                            <div className="w-24 h-32 bg-[#121c22] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                                                {wheelCoverImage ? <img src={wheelCoverImage} className="absolute inset-0 w-full h-full object-cover" /> : <RotateCcw className="text-rose-500/50" size={40} />}
                                            </div>
                                            <h4 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Wheel Engine Ready</h4>
                                            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8">Test your custom wheel segments, physics logic, and animations in a fully functional preview environment.</p>
                                            <button onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: { type: 'wheel', wheelConfig: buildWheelConfig(), name: wheelGameName, isPreview: true } }))} className="bg-gradient-to-r from-rose-600 to-pink-600 hover:brightness-110 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-rose-500/20">
                                                <Play size={20} /> Launch Full Preview
                                            </button>
                                        </div>
                                    </div>

                                    {/* Config Summary & Publish */}
                                    <div className="space-y-4">
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Configuration</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Type</span><span className="text-rose-400 font-bold">Wheel of Fortune</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Segments</span><span className="text-white font-mono">{wheelSegments.length}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Troll Mode</span><span className={wheelEnableTrollWheel ? 'text-amber-400' : 'text-slate-600'}>{wheelEnableTrollWheel ? '✓ Active' : '✗'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Texture</span><span className="text-white capitalize">{wheelTexture}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Pointer</span><span className="text-white capitalize">{wheelPointerImage ? '📸 Custom' : wheelPointerStyle}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Tick Sound</span><span className="text-white capitalize">{wheelTickSoundFile ? '📸 Custom' : wheelTickSound}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Confetti</span><span className="text-white capitalize">{wheelConfettiType === 'custom_logo' ? '📸 Logo' : 'Classic'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Specials</span><span className="text-white font-mono">{wheelSegments.filter(s => s.specialType).length}</span></div>
                                            </div>
                                        </div>

                                        {/* Segment breakdown */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2 mb-3">Segments</h4>
                                            <div className="space-y-1.5 max-h-[200px] overflow-auto custom-scrollbar">
                                                {wheelSegments.map(seg => (
                                                    <div key={seg.id} className="flex items-center gap-2 text-xs">
                                                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: seg.color }} />
                                                        <span className="text-white font-bold flex-1 truncate">{seg.label}</span>
                                                        <span className="text-slate-400 font-mono">
                                                            {seg.specialType ? (seg.specialType === 'respin' ? '🔄' : '×2') : seg.multiplier + 'x'}
                                                        </span>
                                                        <span className="text-slate-500 font-mono text-[10px]">
                                                            {Math.round(seg.realProbability * 100)}%
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Cover Image Upload */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Lobby Cover Image</h4>
                                                {wheelCoverImage && <button onClick={() => setWheelCoverImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            {wheelCoverImage ? (
                                                <img src={wheelCoverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                                            ) : (
                                                <label className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:text-rose-400 transition-colors bg-white/5 rounded-xl p-8 justify-center border-2 border-dashed border-white/10 hover:border-rose-500/30">
                                                    <ImageIcon size={24} />
                                                    <span className="text-xs font-bold">Upload Cover Image</span>
                                                    <span className="text-[10px] text-slate-600">Required for publishing</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setWheelCoverImage, 800)} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Publish Button */}
                                        <button
                                            onClick={handlePublish}
                                            disabled={isPublishing || !wheelGameName.trim() || !wheelCoverImage}
                                            className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${isPublishing || !wheelGameName.trim() || !wheelCoverImage
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white hover:brightness-110 hover:-translate-y-1 shadow-[0_5px_20px_rgba(244,63,94,0.3)]'
                                            }`}
                                        >
                                            {isPublishing ? <><Loader2 className="animate-spin" size={20} /> Publishing...</> : <><Save size={20} /> Publish to Lobby</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* MINES SECTIONS                                       */}
                        {/* ════════════════════════════════════════════════════ */}

                        {/* ═══ MINES: Design & Assets ═══ */}
                        {gameType === 'mines' && minesActiveSection === 'design' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Palette size={16} className="text-orange-400" /> Appearance & Branding
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Name & Description */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Title</label>
                                            <input type="text" value={minesGameName} onChange={(e) => setMinesGameName(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-orange-400 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:ring-2 focus:ring-orange-400/20 transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                                            <input type="text" value={minesGameDescription} onChange={(e) => setMinesGameDescription(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-orange-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all" />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Accent</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={minesAccentColor} onChange={(e) => setMinesAccentColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{minesAccentColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Background</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={minesBgColor} onChange={(e) => setMinesBgColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{minesBgColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Tiles</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={minesTileColor} onChange={(e) => setMinesTileColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{minesTileColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image Uploads */}
                                    <div className="space-y-4">
                                        {/* Mine Image */}
                                        <div className="bg-[#0a111a] border border-white/10 rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mine / Bomb Image</label>
                                                {minesMineImage && <button onClick={() => setMinesMineImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            {minesMineImage ? (
                                                <img src={minesMineImage} alt="Mine" className="w-16 h-16 object-contain rounded-lg bg-white/5 p-2 mx-auto" />
                                            ) : (
                                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-orange-400 transition-colors bg-white/5 rounded-lg p-3 justify-center border border-dashed border-white/10">
                                                    <Upload size={14} /> Upload mine artwork
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setMinesMineImage, 128)} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Gem Image */}
                                        <div className="bg-[#0a111a] border border-white/10 rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Safe / Gem Image</label>
                                                {minesGemImage && <button onClick={() => setMinesGemImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            {minesGemImage ? (
                                                <img src={minesGemImage} alt="Gem" className="w-16 h-16 object-contain rounded-lg bg-white/5 p-2 mx-auto" />
                                            ) : (
                                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-green-400 transition-colors bg-white/5 rounded-lg p-3 justify-center border border-dashed border-white/10">
                                                    <Upload size={14} /> Upload gem artwork
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setMinesGemImage, 128)} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Bust Image */}
                                        <div className="bg-[#0a111a] border border-white/10 rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">&quot;BUSTED&quot; Overlay Image</label>
                                                {minesBustImage && <button onClick={() => setMinesBustImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            <p className="text-[10px] text-slate-600">Shown fullscreen when player hits a mine (meme, streamer B&W photo, etc.)</p>
                                            {minesBustImage ? (
                                                <img src={minesBustImage} alt="Bust" className="w-full max-h-24 object-contain rounded-lg bg-white/5 p-2" />
                                            ) : (
                                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-red-400 transition-colors bg-white/5 rounded-lg p-3 justify-center border border-dashed border-white/10">
                                                    <Upload size={14} /> Upload bust overlay
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setMinesBustImage, 800)} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Watermark & Background */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-[#0a111a] border border-white/10 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brand Watermark</label>
                                            {minesWatermarkImage && <button onClick={() => setMinesWatermarkImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                        </div>
                                        <p className="text-[10px] text-slate-600">Semi-transparent logo behind the grid tiles</p>
                                        {minesWatermarkImage ? (
                                            <img src={minesWatermarkImage} alt="Watermark" className="w-20 h-20 object-contain rounded-lg bg-white/5 p-2 mx-auto opacity-50" />
                                        ) : (
                                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-orange-400 transition-colors bg-white/5 rounded-lg p-3 justify-center border border-dashed border-white/10">
                                                <Upload size={14} /> Upload watermark
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setMinesWatermarkImage, 400)} />
                                            </label>
                                        )}
                                    </div>
                                    <div className="bg-[#0a111a] border border-white/10 rounded-xl p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Background Image</label>
                                            {minesBgImage && <button onClick={() => setMinesBgImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                        </div>
                                        {minesBgImage ? (
                                            <img src={minesBgImage} alt="BG" className="w-full max-h-24 object-cover rounded-lg" />
                                        ) : (
                                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-orange-400 transition-colors bg-white/5 rounded-lg p-3 justify-center border border-dashed border-white/10">
                                                <Upload size={14} /> Upload background
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setMinesBgImage, 800)} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ MINES: Grid & Mechanics ═══ */}
                        {gameType === 'mines' && minesActiveSection === 'mechanics' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Grid3X3 size={16} className="text-orange-400" /> Grid Size & Game Mechanics
                                </h3>

                                {/* Grid Size */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Grid Size</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {(Object.entries(MINES_GRID_PRESETS) as [MinesGridSize, any][]).map(([key, preset]) => (
                                            <button
                                                key={key}
                                                onClick={() => setMinesGridSize(key)}
                                                className={`p-4 rounded-xl border-2 transition-all text-center ${minesGridSize === key
                                                    ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}
                                            >
                                                <div className="text-2xl font-black text-white mb-1">{preset.label}</div>
                                                <div className="text-[10px] text-slate-400">{preset.description}</div>
                                                <div className="text-xs text-orange-400 font-bold mt-1">{preset.total} tiles</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Animations */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Animations</label>
                                    <Toggle enabled={minesEnableFlip} onToggle={() => setMinesEnableFlip(!minesEnableFlip)} label="3D Flip Animation on Safe Reveal" />

                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 block">Bust Animation Style</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {BUST_ANIMATION_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setMinesBustStyle(preset.id as any)}
                                                className={`p-3 rounded-xl border transition-all text-center ${minesBustStyle === preset.id
                                                    ? 'border-orange-500 bg-orange-500/10'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}
                                            >
                                                <div className="text-xl mb-1">{preset.emoji}</div>
                                                <div className="text-xs font-bold text-white">{preset.label}</div>
                                                <div className="text-[10px] text-slate-500 mt-1">{preset.description}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Audio */}
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <Volume2 size={14} /> Audio Settings
                                    </label>
                                    <Toggle enabled={minesEnableSuspense} onToggle={() => setMinesEnableSuspense(!minesEnableSuspense)} label="Progressive Suspense (BPM accelerates with each safe reveal)" />

                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 block">Loss Sound</label>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                        {LOSS_SOUND_PRESETS.map(preset => (
                                            <button
                                                key={preset.id}
                                                onClick={() => setMinesLossSoundType(preset.id as any)}
                                                className={`p-3 rounded-xl border transition-all text-center ${minesLossSoundType === preset.id
                                                    ? 'border-orange-500 bg-orange-500/10'
                                                    : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                }`}
                                            >
                                                <div className="text-lg mb-1">{preset.emoji}</div>
                                                <div className="text-xs font-bold text-white">{preset.label}</div>
                                            </button>
                                        ))}
                                    </div>

                                    {minesLossSoundType === 'custom' && (
                                        <div className="bg-[#0a111a] border border-white/10 rounded-xl p-4 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500">Custom Loss Sound</span>
                                                {minesLossSoundFile && <button onClick={() => setMinesLossSoundFile(null)} className="text-xs text-red-400">Remove</button>}
                                            </div>
                                            {minesLossSoundFile ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-green-400">✓ Uploaded</span>
                                                    <audio controls src={minesLossSoundFile} className="h-8 w-full max-w-[200px]" />
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-orange-400 bg-white/5 rounded-lg p-3 justify-center border border-dashed border-white/10">
                                                    <Upload size={14} /> Upload audio (max 2MB)
                                                    <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, setMinesLossSoundFile)} />
                                                </label>
                                            )}
                                        </div>
                                    )}

                                    {/* Custom reveal sound */}
                                    <div className="bg-[#0a111a] border border-white/10 rounded-xl p-4 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Custom Reveal Sound (Optional)</span>
                                            {minesRevealSoundFile && <button onClick={() => setMinesRevealSoundFile(null)} className="text-xs text-red-400">Remove</button>}
                                        </div>
                                        {minesRevealSoundFile ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-green-400">✓ Uploaded</span>
                                                <audio controls src={minesRevealSoundFile} className="h-8 w-full max-w-[200px]" />
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-green-400 bg-white/5 rounded-lg p-3 justify-center border border-dashed border-white/10">
                                                <Upload size={14} /> Upload safe-reveal sound
                                                <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload(e, setMinesRevealSoundFile)} />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ MINES: Preview & Publish ═══ */}
                        {gameType === 'mines' && minesActiveSection === 'preview' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Eye size={16} className="text-orange-400" /> Preview & Publish
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Preview Block */}
                                    <div className="lg:col-span-2 space-y-3">
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative flex flex-col items-center justify-center p-8 text-center" style={{ boxShadow: `0 0 40px #f9731615` }}>
                                            <div className="w-24 h-32 bg-[#121c22] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                                                {minesCoverImage ? <img src={minesCoverImage} className="absolute inset-0 w-full h-full object-cover" /> : <Gamepad2 className="text-orange-500/50" size={40} />}
                                            </div>
                                            <h4 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Mines Engine Ready</h4>
                                            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8">Test your custom grid logic, bomb placements, and animations in a fully functional preview environment.</p>
                                            <button onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: { type: 'mines', minesConfig: buildMinesConfig(), name: minesGameName, isPreview: true } }))} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:brightness-110 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-orange-500/20">
                                                <Play size={20} /> Launch Full Preview
                                            </button>
                                        </div>
                                    </div>

                                    {/* Config Summary & Publish */}
                                    <div className="space-y-4">
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Configuration</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Type</span><span className="text-orange-400 font-bold">Mines</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Grid</span><span className="text-white font-mono">{MINES_GRID_PRESETS[minesGridSize].label} ({MINES_GRID_PRESETS[minesGridSize].total} tiles)</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">3D Flip</span><span className={minesEnableFlip ? 'text-green-400' : 'text-slate-600'}>{minesEnableFlip ? '✓ Enabled' : '✗'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Bust Style</span><span className="text-white capitalize">{minesBustStyle.replace('_', ' ')}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Suspense Audio</span><span className={minesEnableSuspense ? 'text-green-400' : 'text-slate-600'}>{minesEnableSuspense ? '✓ Progressive' : '✗'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Loss Sound</span><span className="text-white capitalize">{minesLossSoundType.replace('_', ' ')}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Mine Image</span><span className="text-white">{minesMineImage ? '📸 Custom' : 'Default'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Gem Image</span><span className="text-white">{minesGemImage ? '📸 Custom' : 'Default'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Bust Image</span><span className="text-white">{minesBustImage ? '📸 Custom' : 'None'}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Watermark</span><span className="text-white">{minesWatermarkImage ? '📸 Custom' : 'None'}</span></div>
                                            </div>
                                        </div>

                                        {/* Cover Image Upload */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Lobby Cover Image</h4>
                                                {minesCoverImage && <button onClick={() => setMinesCoverImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            {minesCoverImage ? (
                                                <img src={minesCoverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                                            ) : (
                                                <label className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:text-orange-400 transition-colors bg-white/5 rounded-xl p-8 justify-center border-2 border-dashed border-white/10 hover:border-orange-500/30">
                                                    <ImageIcon size={24} />
                                                    <span className="text-xs font-bold">Upload Cover Image</span>
                                                    <span className="text-[10px] text-slate-600">Required for publishing</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setMinesCoverImage, 800)} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Publish Button */}
                                        <button
                                            onClick={handlePublish}
                                            disabled={isPublishing || !minesGameName.trim() || !minesCoverImage}
                                            className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${isPublishing || !minesGameName.trim() || !minesCoverImage
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white hover:brightness-110 hover:-translate-y-1 shadow-[0_5px_20px_rgba(249,115,22,0.3)]'
                                            }`}
                                        >
                                            {isPublishing ? <><Loader2 className="animate-spin" size={20} /> Publishing...</> : <><Save size={20} /> Publish to Lobby</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* CASE SECTIONS                                        */}
                        {/* ════════════════════════════════════════════════════ */}

                        {/* ═══ CASE: Design & Audio ═══ */}
                        {gameType === 'case' && caseActiveSection === 'design' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Palette size={16} className="text-indigo-400" /> Appearance & Audio
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Game Title</label>
                                            <input type="text" value={caseGameName} onChange={(e) => setCaseGameName(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-indigo-400 rounded-xl px-4 py-3 text-white font-bold focus:outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Description</label>
                                            <input type="text" value={caseGameDescription} onChange={(e) => setCaseGameDescription(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-indigo-400 rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Collection Name</label>
                                            <input type="text" value={caseCollectionName} onChange={(e) => setCaseCollectionName(e.target.value)}
                                                className="w-full bg-[#0a111a] border border-white/10 focus:border-indigo-400 rounded-xl px-4 py-3 text-white focus:outline-none transition-all" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Accent</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={caseAccentColor} onChange={(e) => setCaseAccentColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{caseAccentColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Background</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={caseBgColor} onChange={(e) => setCaseBgColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{caseBgColor}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-4 block flex items-center gap-2">
                                            <ImageIcon size={14} /> Background Image (Optional)
                                        </label>
                                        {caseBgImage ? (
                                            <div className="relative rounded-xl overflow-hidden h-32 border border-white/10">
                                                <img src={caseBgImage} alt="" className="w-full h-full object-cover opacity-50" style={{ backgroundColor: caseBgColor }} />
                                                <button onClick={() => setCaseBgImage(null)} className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-md hover:bg-red-500 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-indigo-400 bg-white/5 rounded-xl p-4 justify-center border border-dashed border-white/10 hover:border-indigo-400/30 transition-all">
                                                <Upload size={16} /> Upload Background Image
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCaseBgImage, 1200)} />
                                            </label>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Case Design</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {CASE_DESIGN_PRESETS.map(preset => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => setCaseDesign(preset.id as any)}
                                                    className={`p-3 rounded-xl border transition-all text-left ${caseDesign === preset.id
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl">{preset.emoji}</span>
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{preset.label}</div>
                                                            <div className="text-[10px] text-slate-500">{preset.description}</div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>

                                        {caseDesign === 'custom' && (
                                            <div className="mt-3">
                                                {caseImage ? (
                                                    <div className="relative rounded-xl overflow-hidden h-32 border border-white/10 flex items-center justify-center bg-[#0a111a]">
                                                        <img src={caseImage} alt="" className="h-24 object-contain" />
                                                        <button onClick={() => setCaseImage(null)} className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-md hover:bg-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-indigo-400 bg-white/5 rounded-xl p-4 justify-center border border-dashed border-white/10 hover:border-indigo-400/30 transition-all">
                                                        <Upload size={16} /> Upload Custom Case Image
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCaseImage, 500)} />
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        <div className="h-px w-full bg-white/5 my-6" />

                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block flex items-center gap-2">
                                            <Volume2 size={14} /> Audio & Visual FX
                                        </label>
                                        
                                        <label className="text-xs font-bold text-slate-400 mt-2 block">Opening Sound</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {OPENING_SOUND_PRESETS.map(preset => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => setCaseOpeningSoundType(preset.id as any)}
                                                    className={`py-2 px-3 rounded-lg border transition-all text-left flex items-center gap-2 ${caseOpeningSoundType === preset.id
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'border-white/10 bg-[#0a111a] hover:border-white/20'
                                                    }`}
                                                >
                                                    <span>{preset.emoji}</span>
                                                    <span className="text-xs font-bold text-white">{preset.label}</span>
                                                </button>
                                            ))}
                                        </div>

                                        <Toggle enabled={caseEnableRareExplosion} onToggle={() => setCaseEnableRareExplosion(!caseEnableRareExplosion)} label="Rare+ Reveal Explosion Sounds" />
                                        <Toggle enabled={caseEnableRarityGlow} onToggle={() => setCaseEnableRarityGlow(!caseEnableRarityGlow)} label="Item Rarity Neon Glow FX" />

                                        <label className="text-xs font-bold text-slate-400 mt-2 block">Roulette Reveal Speed</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {SCROLL_SPEED_PRESETS.map(preset => (
                                                <button
                                                    key={preset.id}
                                                    onClick={() => setCaseScrollDuration(preset.value)}
                                                    className={`py-2 rounded-lg border transition-all text-center ${caseScrollDuration === preset.value
                                                        ? 'border-indigo-500 bg-indigo-500/10 text-white font-bold'
                                                        : 'border-white/10 bg-[#0a111a] text-slate-500 hover:border-white/20 hover:text-slate-300'
                                                    }`}
                                                >
                                                    <div className="text-xs">{preset.label}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ CASE: Items & Rarities ═══ */}
                        {gameType === 'case' && caseActiveSection === 'items' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                        <Settings2 size={16} className="text-indigo-400" /> Items & Rarities
                                    </h3>
                                    
                                    <div className="text-xs font-mono font-bold flex items-center gap-2">
                                        Total Probability: 
                                        <span className={Math.abs(caseItems.reduce((acc, item) => acc + item.probability, 0) - 100) < 0.01 ? 'text-green-400' : 'text-red-400'}>
                                            {caseItems.reduce((acc, item) => acc + item.probability, 0).toFixed(2)}%
                                        </span>
                                        (Must equal 100%)
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {caseItems.map((item, index) => (
                                        <div key={item.id} className="bg-[#0a111a] border border-white/10 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center group">
                                            {/* Delete Button */}
                                            <button onClick={() => {
                                                const newItems = [...caseItems];
                                                newItems.splice(index, 1);
                                                setCaseItems(newItems);
                                            }} className="absolute -left-2 top-1/2 -translate-y-1/2 md:static md:translate-y-0 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2">
                                                <Trash2 size={16} />
                                            </button>

                                            {/* Item Image */}
                                            <div className="w-16 h-16 shrink-0 rounded-lg border border-white/10 overflow-hidden relative group/img cursor-pointer bg-white/5 flex items-center justify-center">
                                                {item.image ? (
                                                    <img src={item.image} alt="" className="w-full h-full object-contain p-1" />
                                                ) : (
                                                    <span className="text-xl font-black text-white">{item.multiplier}x</span>
                                                )}
                                                <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer text-white">
                                                    <Upload size={16} />
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                                        handleFileUpload(e, (url: string | null) => {
                                                            const newItems = [...caseItems];
                                                            newItems[index].image = url;
                                                            setCaseItems(newItems);
                                                        }, 200);
                                                    }} />
                                                </label>
                                                {item.image && (
                                                    <button onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const newItems = [...caseItems];
                                                        newItems[index].image = null;
                                                        setCaseItems(newItems);
                                                    }} className="absolute top-0 right-0 p-1 text-red-500 opacity-0 group-hover/img:opacity-100 bg-black/50 rounded-bl-lg">
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3 w-full">
                                                <div className="col-span-2 md:col-span-1">
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Name</label>
                                                    <input type="text" value={item.name} onChange={(e) => {
                                                        const newItems = [...caseItems];
                                                        newItems[index].name = e.target.value;
                                                        setCaseItems(newItems);
                                                    }} className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white font-bold" />
                                                </div>
                                                
                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Rarity</label>
                                                    <select value={item.rarity} onChange={(e) => {
                                                        const newItems = [...caseItems];
                                                        newItems[index].rarity = e.target.value as CaseRarity;
                                                        setCaseItems(newItems);
                                                    }} className="w-full bg-black/30 border border-white/5 rounded-lg px-3 py-2 text-sm text-white capitalize appearance-none">
                                                        {(Object.keys(RARITY_CONFIG) as CaseRarity[]).map(r => (
                                                            <option key={r} value={r}>{RARITY_CONFIG[r].label}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Multiplier</label>
                                                    <div className="relative">
                                                        <input type="number" step="0.1" value={item.multiplier} onChange={(e) => {
                                                            const newItems = [...caseItems];
                                                            newItems[index].multiplier = Number(e.target.value);
                                                            setCaseItems(newItems);
                                                        }} className="w-full bg-black/30 border border-white/5 rounded-lg pl-3 pr-6 py-2 text-sm text-white font-mono" />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-xs">x</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Prob (%)</label>
                                                    <div className="relative">
                                                        <input type="number" step="0.01" value={item.probability} onChange={(e) => {
                                                            const newItems = [...caseItems];
                                                            newItems[index].probability = Number(e.target.value);
                                                            setCaseItems(newItems);
                                                        }} className="w-full bg-black/30 border border-white/5 rounded-lg pl-3 pr-6 py-2 text-sm text-white font-mono" />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-xs">%</span>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Color</label>
                                                    <input type="color" value={item.color} onChange={(e) => {
                                                        const newItems = [...caseItems];
                                                        newItems[index].color = e.target.value;
                                                        setCaseItems(newItems);
                                                    }} className="w-full h-9 rounded-lg border border-white/5 cursor-pointer bg-black/30 p-1" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button 
                                        onClick={() => {
                                            setCaseItems([
                                                ...caseItems,
                                                { id: 'item_' + Date.now(), name: 'New Item', multiplier: 1, rarity: 'common', probability: 0, image: null, color: '#4b5563' }
                                            ]);
                                        }}
                                        className="w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-400 hover:text-indigo-400 hover:border-indigo-400/50 hover:bg-indigo-500/5 transition-all text-sm font-bold flex justify-center items-center gap-2"
                                    >
                                        + Add New Item
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ═══ CASE: Preview & Publish ═══ */}
                        {gameType === 'case' && caseActiveSection === 'preview' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Eye size={16} className="text-indigo-400" /> Preview & Publish
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Preview container */}
                                    <div className="lg:col-span-2 space-y-3">
                                        <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative flex flex-col items-center justify-center p-8 text-center" style={{ boxShadow: `0 0 40px ${caseAccentColor}15` }}>
                                            <div className="w-24 h-32 bg-[#121c22] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                                                {caseImage ? <img src={caseImage} className="absolute inset-0 w-full h-full object-contain" /> : <div className="text-4xl">{CASE_DESIGN_PRESETS.find(d => d.id === caseDesign)?.emoji}</div>}
                                            </div>
                                            <h4 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Case Engine Ready</h4>
                                            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8">Test your custom items, probabilities, and unboxing animation in a fully functional preview environment.</p>
                                            <button onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: { type: 'case', caseConfig: buildCaseConfig(), name: caseGameName, isPreview: true } }))} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:brightness-110 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-indigo-500/20">
                                                <Play size={20} /> Launch Full Preview
                                            </button>
                                        </div>
                                    </div>

                                    {/* Config Summary & Publish */}
                                    <div className="space-y-4">
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Configuration</h4>
                                            <div className="space-y-2 text-xs">
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Type</span><span className="text-indigo-400 font-bold">Case Opening</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Items Count</span><span className="text-white font-mono">{caseItems.length}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Total Prob</span><span className={Math.abs(caseItems.reduce((acc, item) => acc + item.probability, 0) - 100) < 0.01 ? 'text-green-400' : 'text-red-400'}>{caseItems.reduce((acc, item) => acc + item.probability, 0).toFixed(2)}%</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Case Design</span><span className="text-white capitalize">{caseDesign}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Opening Sound</span><span className="text-white capitalize">{caseOpeningSoundType}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500 font-bold">Rarity Glow FX</span><span className={caseEnableRarityGlow ? 'text-green-400' : 'text-slate-600'}>{caseEnableRarityGlow ? '✓ On' : '✗ Off'}</span></div>
                                            </div>
                                        </div>

                                        {/* Cover Image Upload */}
                                        <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Lobby Cover Image</h4>
                                                {caseCoverImage && <button onClick={() => setCaseCoverImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                            </div>
                                            {caseCoverImage ? (
                                                <img src={caseCoverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                                            ) : (
                                                <label className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:text-indigo-400 transition-colors bg-white/5 rounded-xl p-8 justify-center border-2 border-dashed border-white/10 hover:border-indigo-500/30">
                                                    <ImageIcon size={24} />
                                                    <span className="text-xs font-bold">Upload Cover Image</span>
                                                    <span className="text-[10px] text-slate-600">Required for publishing</span>
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCaseCoverImage, 800)} />
                                                </label>
                                            )}
                                        </div>

                                        {/* Publish Button */}
                                        <button
                                            onClick={handlePublish}
                                            disabled={isPublishing || !caseGameName.trim() || !caseCoverImage || Math.abs(caseItems.reduce((acc, item) => acc + item.probability, 0) - 100) > 0.01}
                                            className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${isPublishing || !caseGameName.trim() || !caseCoverImage || Math.abs(caseItems.reduce((acc, item) => acc + item.probability, 0) - 100) > 0.01
                                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:brightness-110 hover:-translate-y-1 shadow-[0_5px_20px_rgba(99,102,241,0.3)]'
                                            }`}
                                        >
                                            {isPublishing ? <><Loader2 className="animate-spin" size={20} /> Publishing...</> : <><Save size={20} /> Publish to Lobby</>}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* ════════════════════════════════════════════════════ */}
                        {/* HILO SECTIONS                                        */}
                        {/* ════════════════════════════════════════════════════ */}

                        {gameType === 'hilo' && hiloActiveSection === 'design' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Palette size={16} className="text-blue-400" /> Branding & Aesthetics
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="block">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Game Name</span>
                                            <input type="text" value={hiloGameName} onChange={e => setHiloGameName(e.target.value)} className="w-full bg-[#0a111a] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 font-bold transition-all outline-none" />
                                        </label>
                                        <label className="block">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Description</span>
                                            <textarea value={hiloGameDescription} onChange={e => setHiloGameDescription(e.target.value)} className="w-full bg-[#0a111a] border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 font-medium transition-all outline-none h-24 resize-none" />
                                        </label>
                                        
                                        {/* Accent Color */}
                                        {/* Colors */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Accent Color</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={hiloAccentColor} onChange={(e) => setHiloAccentColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{hiloAccentColor}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Background Color</label>
                                                <div className="flex items-center gap-3 bg-[#0a111a] border border-white/10 rounded-xl p-3">
                                                    <input type="color" value={hiloBgColor} onChange={(e) => setHiloBgColor(e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-white/20 cursor-pointer bg-transparent" />
                                                    <span className="text-white font-mono text-xs">{hiloBgColor}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Card Design Imagery</span>
                                        <p className="text-xs text-slate-500">Personalize cards by uploading your image!</p>
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex justify-between items-center bg-[#0a111a] transition-all hover:border-blue-500/50">
                                            <label className="flex gap-4 items-center cursor-pointer flex-1">
                                                {hiloCardBackImage ? <img src={hiloCardBackImage} className="w-10 h-16 object-cover rounded-md" /> : <div className="w-10 h-16 bg-white/5 rounded-md flex items-center justify-center"><ImageIcon size={16} /></div>}
                                                <div>
                                                     <span className="font-bold text-sm block">Card Back Cover</span>
                                                     <span className="text-xs text-slate-500">Image on the back of all cards</span>
                                                </div>
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setHiloCardBackImage, 400)} />
                                            </label>
                                            {hiloCardBackImage && (
                                                <button onClick={() => setHiloCardBackImage(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg ml-2">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex justify-between items-center bg-[#0a111a] transition-all hover:border-blue-500/50">
                                            <label className="flex gap-4 items-center cursor-pointer flex-1">
                                                {hiloFaceJ ? <img src={hiloFaceJ} className="w-10 h-16 object-cover rounded-md" /> : <div className="w-10 h-16 bg-white/5 rounded-md flex items-center justify-center"><ImageIcon size={16} /></div>}
                                                <div>
                                                     <span className="font-bold text-sm block">Jack (J) Face</span>
                                                     <span className="text-xs text-slate-500">Replaces J center image</span>
                                                </div>
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setHiloFaceJ, 400)} />
                                            </label>
                                            {hiloFaceJ && (
                                                <button onClick={() => setHiloFaceJ(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg ml-2">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                         <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex justify-between items-center bg-[#0a111a] transition-all hover:border-blue-500/50">
                                            <label className="flex gap-4 items-center cursor-pointer flex-1">
                                                {hiloFaceQ ? <img src={hiloFaceQ} className="w-10 h-16 object-cover rounded-md" /> : <div className="w-10 h-16 bg-white/5 rounded-md flex items-center justify-center"><ImageIcon size={16} /></div>}
                                                <div>
                                                     <span className="font-bold text-sm block">Queen (Q) Face</span>
                                                     <span className="text-xs text-slate-500">Replaces Q center image</span>
                                                </div>
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setHiloFaceQ, 400)} />
                                            </label>
                                            {hiloFaceQ && (
                                                <button onClick={() => setHiloFaceQ(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg ml-2">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                         </div>
                                         <div className="border-2 border-dashed border-white/10 rounded-xl p-4 flex justify-between items-center bg-[#0a111a] transition-all hover:border-blue-500/50">
                                            <label className="flex gap-4 items-center cursor-pointer flex-1">
                                                {hiloFaceK ? <img src={hiloFaceK} className="w-10 h-16 object-cover rounded-md" /> : <div className="w-10 h-16 bg-white/5 rounded-md flex items-center justify-center"><ImageIcon size={16} /></div>}
                                                <div>
                                                     <span className="font-bold text-sm block">King (K) Face</span>
                                                     <span className="text-xs text-slate-500">Replaces K center image</span>
                                                </div>
                                                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, setHiloFaceK, 400)} />
                                            </label>
                                            {hiloFaceK && (
                                                <button onClick={() => setHiloFaceK(null)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg ml-2">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                         </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {gameType === 'hilo' && hiloActiveSection === 'audio' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Volume2 size={16} className="text-blue-400" /> Audio Setup
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     <div className="space-y-4">
                                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Card Deal Sound</span>
                                         <div className="grid grid-cols-1 gap-2">
                                             {HILO_DEAL_SOUNDS.map(preset => (
                                                 <button key={preset.id} onClick={() => setHiloDealSoundType(preset.id as any)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${hiloDealSoundType === preset.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-[#0a111a] hover:border-white/20'}`}>
                                                     <span className="text-xl">{preset.emoji}</span>
                                                     <span className="font-bold text-sm">{preset.label}</span>
                                                 </button>
                                             ))}
                                         </div>
                                         {hiloDealSoundType === 'custom' && (
                                            <label className="border border-white/20 rounded-lg p-3 flex gap-4 items-center cursor-pointer hover:bg-white/5">
                                                <Upload size={16} /> <span className="text-sm font-medium">{hiloDealSoundFile ? "Custom File Loaded" : "Upload MP3/WAV File"}</span>
                                                <input type="file" accept="audio/*" className="hidden" onChange={e => handleFileUpload(e, setHiloDealSoundFile)} />
                                            </label>
                                         )}
                                     </div>

                                     <div className="space-y-4">
                                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">Lose / Bust Sound</span>
                                         <div className="grid grid-cols-1 gap-2">
                                             {HILO_LOSS_SOUNDS.map(preset => (
                                                 <button key={preset.id} onClick={() => setHiloLossSoundType(preset.id as any)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${hiloLossSoundType === preset.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-[#0a111a] hover:border-white/20'}`}>
                                                     <span className="text-xl">{preset.emoji}</span>
                                                     <span className="font-bold text-sm">{preset.label}</span>
                                                 </button>
                                             ))}
                                         </div>
                                         {hiloLossSoundType === 'custom' && (
                                            <label className="border border-white/20 rounded-lg p-3 flex gap-4 items-center cursor-pointer hover:bg-white/5">
                                                <Upload size={16} /> <span className="text-sm font-medium">{hiloLossSoundFile ? "Custom File Loaded" : "Upload MP3/WAV File"}</span>
                                                <input type="file" accept="audio/*" className="hidden" onChange={e => handleFileUpload(e, setHiloLossSoundFile)} />
                                            </label>
                                         )}
                                     </div>
                                </div>
                            </motion.div>
                        )}

                        {gameType === 'hilo' && hiloActiveSection === 'preview' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
                                    <Rocket size={16} className="text-blue-400" /> Review & Publish
                                </h3>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                     {/* Preview Trigger */}
                                     <div className="lg:col-span-2 space-y-3">
                                         <div className="bg-[#060b11] border border-white/10 rounded-2xl overflow-hidden h-[450px] relative flex flex-col items-center justify-center p-8 text-center" style={{ boxShadow: `0 0 40px ${hiloAccentColor}15` }}>
                                             <div className="w-24 h-32 bg-[#121c22] rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
                                                {hiloCardBackImage ? <img src={hiloCardBackImage} className="absolute inset-0 w-full h-full object-cover" /> : <ShieldCheck className="text-blue-500/50" size={40} />}
                                             </div>
                                             <h4 className="text-xl font-black text-white mb-2 tracking-widest uppercase">Hi-Lo Engine Ready</h4>
                                             <p className="text-sm text-slate-400 max-w-sm mx-auto mb-8">Test your custom card designs, colors, and audio logic in a fully functional preview environment.</p>
                                             <button
                                                  onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: { type: 'hilo', hiloConfig: buildHiloConfig(), name: hiloGameName, isPreview: true } }))}
                                                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-blue-500/20"
                                              >
                                                  <Play size={20} /> Launch Preview
                                              </button>
                                         </div>
                                     </div>

                                     {/* Settings Preview / Publishing */}
                                     <div className="space-y-4">
                                         <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                             <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Configuration</h4>
                                             <div className="space-y-2 text-xs">
                                                 <div className="flex justify-between"><span className="text-slate-500 font-bold">Type</span><span className="text-blue-400 font-bold">Hi-Lo</span></div>
                                                 <div className="flex justify-between"><span className="text-slate-500 font-bold">Accent</span><div className="w-4 h-4 rounded" style={{backgroundColor: hiloAccentColor}}></div></div>
                                                 <div className="flex justify-between"><span className="text-slate-500 font-bold">Bg</span><div className="w-4 h-4 rounded" style={{backgroundColor: hiloBgColor}}></div></div>
                                                 <div className="flex justify-between"><span className="text-slate-500 font-bold">Custom Faces</span><span className="text-white font-mono">{[hiloFaceJ, hiloFaceQ, hiloFaceK, hiloFaceA].filter(Boolean).length}/4</span></div>
                                                 <div className="flex justify-between"><span className="text-slate-500 font-bold">Card Back</span><span className={hiloCardBackImage ? 'text-green-400' : 'text-slate-600'}>{hiloCardBackImage ? 'Custom' : 'Default'}</span></div>
                                             </div>
                                         </div>

                                         {/* Cover Image Upload */}
                                         <div className="bg-[#0a111a] rounded-xl border border-white/10 p-4 space-y-3">
                                             <div className="flex justify-between items-center">
                                                 <h4 className="text-xs font-black text-white uppercase tracking-widest">Lobby Cover Image</h4>
                                                 {hiloCoverImage && <button onClick={() => setHiloCoverImage(null)} className="text-xs text-red-400 hover:text-red-300">Remove</button>}
                                             </div>
                                             {hiloCoverImage ? (
                                                 <img src={hiloCoverImage} alt="Cover" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                                             ) : (
                                                 <label className="flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:text-blue-400 transition-colors bg-white/5 rounded-xl p-8 justify-center border-2 border-dashed border-white/10 hover:border-blue-500/30">
                                                     <ImageIcon size={24} />
                                                     <span className="text-xs font-bold">Upload Cover Image</span>
                                                     <span className="text-[10px] text-slate-600">Required for publishing</span>
                                                     <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setHiloCoverImage, 800)} />
                                                 </label>
                                             )}
                                         </div>

                                         {/* Publish Button */}
                                         <button
                                              onClick={handlePublish}
                                              disabled={isPublishing || !hiloGameName.trim() || !hiloCoverImage}
                                              className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all flex justify-center items-center gap-2 ${isPublishing || !hiloGameName.trim() || !hiloCoverImage
                                                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:brightness-110 hover:-translate-y-1 shadow-[0_5px_20px_rgba(59,130,246,0.3)]'
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
        </>
    );
}
