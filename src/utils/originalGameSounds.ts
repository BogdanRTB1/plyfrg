/**
 * Per-game Web Audio profiles for PlayForges original (lobby) games.
 */

import { getSharedAudioContext, resumeGameAudio } from "./gameAudioContext";
import { playSlotReelTickSound, playSlotSpinSound } from "./slotSpinSound";

export type OriginalGameId =
    | "mines"
    | "slots"
    | "crash"
    | "plinko"
    | "blackjack"
    | "roulette"
    | "heist"
    | "influencer"
    | "escape"
    | "bomb"
    | "sneak"
    | "dart"
    | "aviator"
    | "tomatoes"
    | "football"
    | "glassBridge"
    | "wanted";

export type OriginalSoundEvent = "bet" | "win" | "lose" | "reveal" | "spin" | "crash";

function getCtx(): AudioContext | null {
    return getSharedAudioContext();
}

export function resumeOriginalGameAudio() {
    resumeGameAudio();
}

function tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    freqEnd?: number,
    startAt?: number
) {
    const ctx = getCtx();
    if (!ctx) return;
    const t0 = startAt ?? ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t0 + duration);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(volume, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
}

function arpeggio(notes: number[], noteLen: number, type: OscillatorType, volume: number, gap = 0.07) {
    const ctx = getCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    notes.forEach((f, i) => tone(f, noteLen, type, volume, undefined, t0 + i * gap));
}

function noiseBurst(duration: number, volume: number, filterFreq = 900) {
    const ctx = getCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const n = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-4 * (i / d.length));
    }
    n.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(volume, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    n.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    n.start(t0);
    n.stop(t0 + duration);
}

// ─── Per-game sound builders ───────────────────────────────────────────────

const sounds: Record<OriginalGameId, Record<OriginalSoundEvent, (v?: number) => void>> = {
    mines: {
        bet: (v = 0.1) => tone(880, 0.05, "square", v, 440),
        reveal: (v = 0.09) => tone(620 + Math.random() * 40, 0.05, "sine", v, 920),
        win: (v = 0.13) => arpeggio([784, 988, 1175], 0.09, "sine", v * 0.9),
        lose: (v = 0.14) => { noiseBurst(0.25, v * 0.8, 200); tone(120, 0.3, "sawtooth", v, 50); },
        spin: (v = 0.08) => tone(400, 0.04, "triangle", v),
        crash: (v = 0.12) => tone(120, 0.3, "sawtooth", v, 50),
    },
    slots: {
        bet: (v = 0.1) => playSlotSpinSound(v * 0.85),
        spin: (v = 0.32) => playSlotSpinSound(v),
        reveal: (v = 0.08) => playSlotReelTickSound(v),
        win: (v = 0.14) => arpeggio([523, 659, 784, 1047], 0.1, "square", v * 0.7),
        lose: (v = 0.11) => tone(220, 0.2, "triangle", v, 140),
        crash: (v = 0.11) => tone(180, 0.25, "sawtooth", v, 90),
    },
    crash: {
        bet: (v = 0.1) => { tone(120, 0.15, "sawtooth", v * 0.5, 280); noiseBurst(0.08, v * 0.3, 400); },
        win: (v = 0.14) => arpeggio([440, 554, 659, 880], 0.08, "sine", v * 0.85, 0.06),
        lose: (v = 0.13) => tone(200, 0.2, "sawtooth", v, 80),
        reveal: (v = 0.08) => tone(300, 0.04, "sine", v, 500),
        spin: (v = 0.08) => tone(200, 0.06, "sawtooth", v, 400),
        crash: (v = 0.16) => { noiseBurst(0.35, v, 150); tone(90, 0.5, "sawtooth", v * 0.9, 40); },
    },
    plinko: {
        bet: (v = 0.1) => tone(300, 0.06, "triangle", v, 180),
        reveal: (v = 0.07) => tone(500 + Math.random() * 200, 0.03, "sine", v * 0.6),
        win: (v = 0.12) => arpeggio([392, 523, 659, 784], 0.07, "triangle", v * 0.85, 0.05),
        lose: (v = 0.1) => tone(250, 0.15, "triangle", v, 160),
        spin: (v = 0.08) => tone(350, 0.04, "triangle", v, 250),
        crash: (v = 0.11) => tone(200, 0.2, "triangle", v, 100),
    },
    blackjack: {
        bet: (v = 0.1) => { noiseBurst(0.06, v * 0.4, 1200); tone(180, 0.04, "square", v * 0.5); },
        reveal: (v = 0.08) => tone(240, 0.03, "square", v * 0.7),
        win: (v = 0.13) => arpeggio([349, 440, 523], 0.1, "square", v * 0.65),
        lose: (v = 0.12) => arpeggio([300, 260, 220], 0.12, "sawtooth", v * 0.6, 0.1),
        spin: (v = 0.08) => tone(200, 0.04, "square", v),
        crash: (v = 0.11) => tone(150, 0.25, "sawtooth", v, 70),
    },
    roulette: {
        bet: (v = 0.1) => tone(420, 0.05, "sine", v, 320),
        spin: (v = 0.28) => playSlotReelTickSound(v * 0.9),
        reveal: (v = 0.09) => tone(680, 0.04, "sine", v, 520),
        win: (v = 0.14) => arpeggio([440, 554, 659], 0.11, "sine", v),
        lose: (v = 0.11) => tone(280, 0.22, "triangle", v, 180),
        crash: (v = 0.11) => tone(200, 0.2, "triangle", v, 100),
    },
    heist: {
        bet: (v = 0.1) => tone(200, 0.08, "square", v, 400),
        reveal: (v = 0.08) => tone(350, 0.05, "square", v, 500),
        win: (v = 0.14) => arpeggio([392, 494, 587, 740], 0.09, "square", v * 0.75, 0.08),
        lose: (v = 0.12) => tone(180, 0.28, "sawtooth", v, 90),
        spin: (v = 0.08) => tone(250, 0.05, "square", v),
        crash: (v = 0.15) => { arpeggio([400, 320, 240], 0.15, "sawtooth", v * 0.7, 0.12); noiseBurst(0.2, v * 0.5, 300); },
    },
    influencer: {
        bet: (v = 0.1) => tone(880, 0.04, "sine", v, 1200),
        reveal: (v = 0.08) => tone(1000, 0.03, "sine", v),
        win: (v = 0.13) => arpeggio([523, 659, 784, 988], 0.07, "sine", v * 0.8, 0.05),
        lose: (v = 0.13) => { tone(150, 0.1, "square", v); tone(120, 0.25, "sawtooth", v * 0.8, 70); },
        spin: (v = 0.08) => tone(700, 0.04, "sine", v, 900),
        crash: (v = 0.12) => tone(100, 0.35, "square", v, 60),
    },
    escape: {
        bet: (v = 0.1) => {
            const ctx = getCtx();
            if (!ctx) return;
            const t0 = ctx.currentTime;
            tone(80, 0.06, "triangle", v * 0.6, 120, t0);
            tone(100, 0.06, "triangle", v * 0.4, 140, t0 + 0.07);
        },
        reveal: (v = 0.08) => tone(200, 0.04, "triangle", v, 280),
        win: (v = 0.13) => arpeggio([330, 415, 494, 587], 0.09, "triangle", v),
        lose: (v = 0.12) => { arpeggio([440, 380, 320], 0.08, "square", v * 0.5, 0.09); noiseBurst(0.15, v * 0.4, 800); },
        spin: (v = 0.08) => tone(150, 0.05, "triangle", v),
        crash: (v = 0.14) => { arpeggio([500, 420, 340, 260], 0.1, "square", v * 0.55, 0.11); },
    },
    bomb: {
        bet: (v = 0.1) => tone(160, 0.06, "square", v, 220),
        reveal: (v = 0.09) => tone(400, 0.04, "square", v, 600),
        win: (v = 0.13) => arpeggio([440, 554, 659], 0.1, "square", v * 0.7),
        lose: (v = 0.16) => { noiseBurst(0.4, v, 180); tone(80, 0.45, "sawtooth", v * 0.85, 35); },
        spin: (v = 0.08) => tone(200, 0.05, "square", v),
        crash: (v = 0.16) => { noiseBurst(0.4, v, 180); tone(80, 0.45, "sawtooth", v * 0.85, 35); },
    },
    sneak: {
        bet: (v = 0.09) => tone(220, 0.05, "triangle", v * 0.5, 180),
        reveal: (v = 0.07) => tone(280, 0.03, "triangle", v * 0.4),
        win: (v = 0.12) => arpeggio([392, 494, 587], 0.08, "triangle", v * 0.85, 0.06),
        lose: (v = 0.13) => { tone(600, 0.15, "square", v * 0.6); tone(400, 0.2, "square", v * 0.4, 200); },
        spin: (v = 0.07) => tone(250, 0.04, "triangle", v),
        crash: (v = 0.13) => { tone(700, 0.12, "square", v * 0.55); tone(500, 0.18, "square", v * 0.45, 250); },
    },
    dart: {
        bet: (v = 0.1) => { noiseBurst(0.05, v * 0.5, 2000); tone(600, 0.04, "triangle", v, 300); },
        spin: (v = 0.25) => playSlotReelTickSound(v * 0.85),
        reveal: (v = 0.08) => tone(500, 0.03, "triangle", v, 800),
        win: (v = 0.14) => arpeggio([659, 784, 988], 0.1, "triangle", v),
        lose: (v = 0.11) => tone(300, 0.18, "triangle", v, 180),
        crash: (v = 0.11) => tone(250, 0.2, "triangle", v, 120),
    },
    aviator: {
        bet: (v = 0.1) => { tone(110, 0.2, "sawtooth", v * 0.45, 220); },
        reveal: (v = 0.08) => tone(180, 0.05, "sawtooth", v, 320),
        win: (v = 0.14) => arpeggio([440, 554, 659, 880], 0.08, "sine", v, 0.06),
        lose: (v = 0.13) => tone(160, 0.25, "sawtooth", v, 70),
        spin: (v = 0.09) => tone(140, 0.08, "sawtooth", v, 260),
        crash: (v = 0.16) => { noiseBurst(0.3, v * 0.7, 250); tone(70, 0.5, "sawtooth", v, 35); },
    },
    tomatoes: {
        bet: (v = 0.1) => { noiseBurst(0.04, v * 0.6, 600); },
        reveal: (v = 0.08) => noiseBurst(0.06, v * 0.5, 800),
        win: (v = 0.13) => { noiseBurst(0.12, v * 0.7, 400); arpeggio([349, 440], 0.08, "sawtooth", v * 0.5); },
        lose: (v = 0.1) => tone(200, 0.12, "triangle", v, 120),
        spin: (v = 0.08) => noiseBurst(0.03, v * 0.4, 500),
        crash: (v = 0.11) => tone(180, 0.15, "triangle", v, 90),
    },
    football: {
        bet: (v = 0.1) => { noiseBurst(0.05, v * 0.55, 300); tone(150, 0.04, "sine", v * 0.5, 80); },
        reveal: (v = 0.08) => tone(200, 0.04, "sine", v),
        win: (v = 0.14) => arpeggio([392, 494, 587, 659], 0.09, "sine", v * 0.9, 0.08),
        lose: (v = 0.11) => tone(280, 0.2, "triangle", v, 160),
        spin: (v = 0.08) => noiseBurst(0.04, v * 0.4, 400),
        crash: (v = 0.11) => tone(220, 0.18, "triangle", v, 120),
    },
    glassBridge: {
        bet: (v = 0.1) => tone(1200, 0.04, "sine", v * 0.6, 800),
        reveal: (v = 0.09) => tone(900 + Math.random() * 100, 0.05, "sine", v, 600),
        win: (v = 0.13) => arpeggio([587, 740, 880], 0.1, "sine", v * 0.85),
        lose: (v = 0.15) => { noiseBurst(0.2, v * 0.8, 2500); tone(400, 0.08, "sine", v * 0.5, 100); },
        spin: (v = 0.08) => tone(700, 0.04, "sine", v),
        crash: (v = 0.15) => { noiseBurst(0.25, v, 2000); tone(300, 0.1, "sine", v, 80); },
    },
    wanted: {
        bet: (v = 0.1) => tone(196, 0.08, "triangle", v, 294),
        reveal: (v = 0.08) => tone(247, 0.05, "triangle", v, 330),
        win: (v = 0.13) => arpeggio([294, 370, 440, 494], 0.1, "triangle", v * 0.9, 0.09),
        lose: (v = 0.12) => arpeggio([330, 294, 247], 0.12, "sawtooth", v * 0.65, 0.1),
        spin: (v = 0.08) => tone(220, 0.05, "triangle", v),
        crash: (v = 0.14) => { arpeggio([440, 370, 294, 220], 0.11, "sawtooth", v * 0.7, 0.1); noiseBurst(0.15, v * 0.45, 500); },
    },
};

export function playGameSound(game: OriginalGameId, event: OriginalSoundEvent, volume?: number) {
    const fn = sounds[game]?.[event];
    if (fn) fn(volume);
}

/** @deprecated Use playGameSound(game, "bet") */
export const playOriginalBetSound = (v?: number) => playGameSound("mines", "bet", v);
export const playOriginalWinSound = (v?: number) => playGameSound("mines", "win", v);
export const playOriginalLoseSound = (v?: number) => playGameSound("mines", "lose", v);
export const playOriginalRevealSound = (v?: number) => playGameSound("mines", "reveal", v);
export const playOriginalTickSound = (v?: number) => playGameSound("roulette", "spin", v);
export const playOriginalSpinSound = (v?: number) => playGameSound("slots", "spin", v);
export const playOriginalCrashSound = (v?: number) => playGameSound("crash", "crash", v);
