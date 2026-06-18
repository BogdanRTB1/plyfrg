/** Built-in originals opened via GlobalGameModals (not creator games). */
export const BUILT_IN_GAME_NAMES = new Set([
    "Plinko",
    "Heist",
    "Influencer",
    "Wanted",
    "Escape",
    "Bomb Defuse",
    "Mines",
    "Slots",
    "Blackjack",
    "Roulette",
    "Crash",
    "Secret Sneak",
    "Dart Wheel",
    "Aviator",
    "Tomatoes",
    "Penalty",
    "Glass Bridge",
    "CreatorApplication",
]);

export function resolveBuiltInGameLabel(
    data: string | Record<string, unknown> | null | undefined
): string | null {
    if (!data) return null;
    if (typeof data === "string") {
        return BUILT_IN_GAME_NAMES.has(data) ? data : null;
    }
    const name = typeof data.name === "string" ? data.name : null;
    if (!name || !BUILT_IN_GAME_NAMES.has(name)) return null;
    if (data.type) return null;
    return name;
}
