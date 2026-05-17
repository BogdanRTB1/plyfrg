/**
 * Single shared Web Audio context for all in-browser game sounds.
 * Browsers cap concurrent AudioContext instances (~6); creating one per
 * spin/tick silently breaks audio after a few rounds.
 */

let sharedCtx: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
        const AC =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        if (!sharedCtx || sharedCtx.state === "closed") {
            sharedCtx = new AC();
        }
        if (sharedCtx.state === "suspended") {
            void sharedCtx.resume();
        }
        return sharedCtx;
    } catch {
        return null;
    }
}

export function resumeGameAudio() {
    getSharedAudioContext();
}
