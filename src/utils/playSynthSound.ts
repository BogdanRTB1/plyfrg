/**
 * Synth sounds for iframe games (slot engine, AI HTML, scratch) via PLAY_SOUND postMessage.
 */

import { getSharedAudioContext } from "./gameAudioContext";
import { playSlotReelTickSound, playSlotSpinSound } from "./slotSpinSound";

export function playSynthSound(type: string) {
    try {
        if (type === "spin") {
            playSlotSpinSound(0.34);
            return;
        }
        if (type === "reel_tick") {
            playSlotReelTickSound(0.26);
            return;
        }
        if (type === "tumble") {
            const audio = new Audio("/game sounds/dice.mp3");
            audio.volume = 0.5;
            void audio.play().catch(() => {});
            return;
        }

        const ctx = getSharedAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t0 = ctx.currentTime;

        if (type === "rise") {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(80, t0);
            osc.frequency.exponentialRampToValueAtTime(400, t0 + 2.0);
            gain.gain.setValueAtTime(0.1, t0);
            gain.gain.linearRampToValueAtTime(0, t0 + 2.0);
        } else if (type === "blip") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(600, t0);
            osc.frequency.exponentialRampToValueAtTime(1200, t0 + 0.1);
            gain.gain.setValueAtTime(0.1, t0);
            gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.1);
        } else if (type === "boom") {
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(100, t0);
            osc.frequency.exponentialRampToValueAtTime(20, t0 + 0.5);
            gain.gain.setValueAtTime(0.3, t0);
            gain.gain.exponentialRampToValueAtTime(0.01, t0 + 0.5);
        } else if (type === "win") {
            osc.type = "sine";
            osc.frequency.setValueAtTime(400, t0);
            osc.frequency.setValueAtTime(600, t0 + 0.1);
            osc.frequency.setValueAtTime(800, t0 + 0.2);
            gain.gain.setValueAtTime(0.2, t0);
            gain.gain.linearRampToValueAtTime(0, t0 + 0.4);
        } else if (type === "scratch") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(320, t0);
            osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.06);
            gain.gain.setValueAtTime(0.06, t0);
            gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);
        } else if (type === "reveal") {
            arpeggio(ctx, [440, 554, 659], 0.09, "sine", 0.14);
            return;
        } else if (type === "lose") {
            osc.type = "triangle";
            osc.frequency.setValueAtTime(280, t0);
            osc.frequency.exponentialRampToValueAtTime(160, t0 + 0.22);
            gain.gain.setValueAtTime(0.12, t0);
            gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.25);
        } else {
            return;
        }

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + 2.0);
    } catch {
        /* noop */
    }
}

function arpeggio(
    ctx: AudioContext,
    notes: number[],
    noteLen: number,
    type: OscillatorType,
    volume: number,
    gap = 0.07
) {
    const t0 = ctx.currentTime;
    notes.forEach((freq, i) => {
        const start = t0 + i * gap;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(volume, start + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, start + noteLen);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + noteLen + 0.02);
    });
}
