/**
 * Shared slot reel sounds for the HTML slot engine preview (Creator Studio),
 * AI / template slot modal, lobby slots, and any listener that forwards PLAY_SOUND.
 */

import { getSharedAudioContext } from "./gameAudioContext";

export function playSlotSpinSound(volume = 0.34): void {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    try {
        const t0 = ctx.currentTime;
        const dur = 0.62;
        const n = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < buf.length; i++) {
            const t = i / ctx.sampleRate;
            const decay = Math.exp(-3.8 * t);
            d[i] = (Math.random() * 2 - 1) * decay * volume * 3.2;
        }
        n.buffer = buf;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(2400, t0);
        bp.frequency.exponentialRampToValueAtTime(900, t0 + dur * 0.85);
        bp.Q.value = 0.55;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(volume * 0.95, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        n.connect(bp);
        bp.connect(g);
        g.connect(ctx.destination);
        n.start(t0);
        n.stop(t0 + dur + 0.02);

        for (let i = 0; i < 10; i++) {
            const clickT = t0 + 0.02 + i * 0.058;
            const osc = ctx.createOscillator();
            const cg = ctx.createGain();
            osc.type = "square";
            osc.frequency.setValueAtTime(620 + i * 18, clickT);
            cg.gain.setValueAtTime(0.0001, clickT);
            cg.gain.exponentialRampToValueAtTime(volume * 0.065, clickT + 0.004);
            cg.gain.exponentialRampToValueAtTime(0.0001, clickT + 0.036);
            osc.connect(cg);
            cg.connect(ctx.destination);
            osc.start(clickT);
            osc.stop(clickT + 0.04);
        }

        const hum = ctx.createOscillator();
        const hg = ctx.createGain();
        hum.type = "sine";
        hum.frequency.setValueAtTime(88, t0);
        hg.gain.setValueAtTime(volume * 0.06, t0);
        hg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        hum.connect(hg);
        hg.connect(ctx.destination);
        hum.start(t0);
        hum.stop(t0 + dur + 0.02);
    } catch {
        /* noop */
    }
}

export function playSlotReelTickSound(volume = 0.28): void {
    const ctx = getSharedAudioContext();
    if (!ctx) return;

    try {
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(480, t0);
        osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.045);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(volume * 0.14, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.065);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 0.08);
    } catch {
        /* noop */
    }
}
