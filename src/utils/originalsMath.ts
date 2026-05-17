/**
 * House-favored math for PlayForges Originals (~86–90% target RTP).
 * All random outcomes for lobby games should flow through these helpers.
 */

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Payout = bet × multiplier × house factor (profit tax on crash-style games). */
export function applyOriginalsPayout(bet: number, multiplier: number, payoutFactor: number) {
    return bet * multiplier * payoutFactor;
}

/** Standard crash curve — instant 1x bust ~15.5%, heavy tail trimmed. */
export function generateCrashPoint() {
    const instantBustChance = 0.165;
    if (Math.random() < instantBustChance) return 1.0;
    const u = Math.max(0.0001, Math.random());
    return clamp((1 - instantBustChance) / (1 - u), 1.0, 80);
}

/** Heist / Escape style linear multiplier ramp. */
export function generateRampCrashPoint() {
    const e = 2 ** (Math.random() * 2.65);
    return Math.max(1.0, e * 0.48);
}

export const ORIGINALS_PAYOUT = {
    crash: 0.94,
    heist: 0.88,
    escape: 0.88,
    aviator: 0.94,
    sneak: 0.88,
    bomb: 0.82,
    wanted: 0.88,
    influencer: 0.85,
    plinko: 0.92,
    football: 0.86,
    tomatoes: 0.86,
    glassBridge: 0.88,
} as const;

/** Plinko bucket index 0–16 for multiplier array in PlinkoModal. */
export function pickPlinkoBucketIndex(): number {
    const r = Math.random();
    if (r < 0.00004) return Math.random() < 0.5 ? 0 : 16;
    if (r < 0.00015) return Math.random() < 0.5 ? 1 : 15;
    if (r < 0.0005) return Math.random() < 0.5 ? 2 : 14;
    if (r < 0.002) return Math.random() < 0.5 ? 3 : 13;
    if (r < 0.008) return Math.random() < 0.5 ? 4 : 12;
    if (r < 0.03) return Math.random() < 0.5 ? 5 : 11;
    if (r < 0.12) return Math.random() < 0.5 ? 6 : 10;
    const inner = Math.random();
    if (inner < 0.52) return 7;
    if (inner < 0.78) return 8;
    return 9;
}

/** Slots symbol indices 0–5; returns null when no triple win. */
export function pickSlotsReels(symCount: number): number[] | null {
    const pickNonTriple = (): number[] => {
        for (let k = 0; k < 40; k++) {
            const a = Math.floor(Math.random() * symCount);
            const b = Math.floor(Math.random() * symCount);
            const c = Math.floor(Math.random() * symCount);
            if (!(a === b && b === c)) return [a, b, c];
        }
        return [0, 1, 2];
    };

    const r0 = Math.random();
    if (r0 < 0.805) return null;
    if (r0 < 0.945) return [0, 0, 0];
    if (r0 < 0.982) return [1, 1, 1];
    if (r0 < 0.994) return [2, 2, 2];
    if (r0 < 0.9985) return [3, 3, 3];
    if (r0 < 0.9997) return [4, 4, 4];
    return [5, 5, 5];
}

/** Roulette — optional house nudge on red/black bets (~88% RTP). */
export function pickRouletteWinningNumber(
    segments: { color: string }[],
    betColor: "red" | "black" | "green"
): number {
    let n = Math.floor(Math.random() * segments.length);
    if (betColor !== "green" && Math.random() < 0.28) {
        let guard = 0;
        while (segments[n]?.color === betColor && guard < 40) {
            n = Math.floor(Math.random() * segments.length);
            guard++;
        }
    }
    return n;
}

export function pickGlassBridgeStepHolds(): boolean {
    return Math.random() < 0.31;
}

/** Tomatoes target index. */
export function pickTomatoTargetIndex(): number {
    const r = Math.random();
    if (r < 0.06) return 0;
    if (r < 0.16) return 1;
    if (r < 0.28) return 2;
    if (r < 0.4) return 3;
    if (r < 0.52) return 4;
    return 5;
}

export function pickFootballOutcome(): { scored: boolean; multiplier: number } {
    const scored = Math.random() < 0.36;
    const multiplier = scored ? 1.35 + Math.random() * 0.85 : 0;
    return { scored, multiplier: Number(multiplier.toFixed(2)) };
}

/** Dart segment index for DART_CONFIG.segments length 6. */
export function pickDartSegmentIndex(segmentCount: number): number {
    const r = Math.random();
    if (r < 0.34) return Math.min(4, segmentCount - 1);
    if (r < 0.54) return 1;
    if (r < 0.72) return 2;
    if (r < 0.88) return 3;
    if (r < 0.96) return 0;
    return Math.min(5, segmentCount - 1);
}

export function pickInfluencerTick(): { kind: "growth" } | { kind: "event"; mult: number; isBad: boolean } {
    if (Math.random() > 0.58) {
        return { kind: "growth" };
    }
    const goods = [
        { mult: 1.22 }, { mult: 1.15 }, { mult: 1.12 }, { mult: 1.28 },
    ];
    const bads = [
        { mult: 0.42 }, { mult: 0.35 }, { mult: 0.55 }, { mult: 0.28 }, { mult: 0.48 },
    ];
    const isBad = Math.random() < 0.76;
    const pool = isBad ? bads : goods;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    return { kind: "event", mult: pick.mult, isBad };
}

export function getInfluencerGrowthStep() {
    return 0.038;
}

export function generateSneakBustSeconds() {
    return -Math.log(Math.random()) * 1.55;
}

export function getSneakMultiplierPerSecond() {
    return 0.28;
}

/** Mines lobby multiplier after n safe reveals. */
export function calcMinesLobbyMultiplier(revealedSafe: number, totalTiles = 25, mineCount = 7) {
    if (revealedSafe === 0) return 1;
    const safeTiles = totalTiles - mineCount;
    let fairMult = 1;
    for (let i = 0; i < revealedSafe; i++) {
        fairMult *= (totalTiles - i) / (safeTiles - i);
    }
    const houseDiscount = 0.8 - revealedSafe * 0.012;
    return Number((fairMult * Math.max(houseDiscount, 0.66)).toFixed(1));
}

export function applyBlackjackPayout(bet: number, multiplier: number) {
    let winAmount = bet * multiplier;
    if (multiplier > 1) {
        const profit = winAmount - bet;
        winAmount = bet + profit * 0.85;
    }
    return winAmount;
}

/** Bomb Defuse — 5 wires, 2 are traps; multiplier only grows on safe cuts (no passive timer ramp). */
export const BOMB_WIRE_COUNT = 5;
export const BOMB_BAD_WIRE_COUNT = 2;
export const BOMB_ROUND_SECONDS = 7;
export const BOMB_SAFE_CUT_MULT = 1.18;

export type BombWireState = { id: number; color: string; colorHex: string; cut: boolean; bad: boolean };

const BOMB_WIRE_COLORS = [
    { color: "bg-red-500", colorHex: "#ef4444" },
    { color: "bg-blue-500", colorHex: "#3b82f6" },
    { color: "bg-green-500", colorHex: "#22c55e" },
    { color: "bg-yellow-500", colorHex: "#eab308" },
    { color: "bg-purple-500", colorHex: "#a855f7" },
] as const;

export function createBombWires(): BombWireState[] {
    const wires: BombWireState[] = BOMB_WIRE_COLORS.map((c, id) => ({
        id,
        color: c.color,
        colorHex: c.colorHex,
        cut: false,
        bad: false,
    }));
    const badIdx = new Set<number>();
    while (badIdx.size < BOMB_BAD_WIRE_COUNT) {
        badIdx.add(Math.floor(Math.random() * BOMB_WIRE_COUNT));
    }
    badIdx.forEach((i) => {
        wires[i].bad = true;
    });
    return wires;
}

export function bombMultiplierFromSafeCuts(safeCuts: number) {
    if (safeCuts <= 0) return 1;
    return Number(Math.pow(BOMB_SAFE_CUT_MULT, safeCuts).toFixed(2));
}

export function countBombSafeCuts(wires: BombWireState[]) {
    return wires.filter((w) => w.cut && !w.bad).length;
}

export function allBombSafeWiresCut(wires: BombWireState[]) {
    const safeTotal = wires.filter((w) => !w.bad).length;
    return countBombSafeCuts(wires) >= safeTotal;
}
