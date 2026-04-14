/**
 * Scratch Card Engine Configuration Schema
 * This JSON structure drives the entire scratch card game — from the engine rendering
 * to the server-side RNG to the creator dashboard.
 */

export interface ScratchSymbol {
  id: string;
  name: string;
  image: string; // base64 data URI, URL, or emoji
  payout: number; // multiplier when 3 match
}

export interface ScratchConfig {
  /** Grid dimensions */
  gridSize: '3x3' | '4x3' | '5x3';
  /** Number of rows */
  rows: number;
  /** Number of columns */
  cols: number;
  /** Custom symbols that hide under the foil */
  symbols: ScratchSymbol[];
  /** The foil/cover image (base64 or URL) — scratched away by the player */
  coverImage: string | null;
  /** Brush shape for scratching */
  brushShape: 'circle' | 'square' | 'star';
  /** Brush size in pixels */
  brushSize: number;
  /** Overall probability of generating a winning card (0-1, e.g. 0.30 = 30%) */
  winProbability: number;
  /** Theme settings */
  theme: {
    gameName: string;
    gameDescription: string;
    accentColor: string;
    backgroundColor: string;
    backgroundImage?: string;
  };
}

export const GRID_SIZE_PRESETS: Record<string, { rows: number; cols: number; label: string; description: string }> = {
  '3x3': { rows: 3, cols: 3, label: 'Classic 3×3', description: '9 cells — simple and classic' },
  '4x3': { rows: 3, cols: 4, label: 'Wide 4×3', description: '12 cells — more variety' },
  '5x3': { rows: 3, cols: 5, label: 'Extended 5×3', description: '15 cells — maximum excitement' },
};

export const BRUSH_SHAPE_PRESETS = [
  { id: 'circle', emoji: '⚪', label: 'Circle' },
  { id: 'square', emoji: '⬜', label: 'Square' },
  { id: 'star', emoji: '⭐', label: 'Star' },
];

export const WIN_PROBABILITY_PRESETS = [
  { id: 'rare', value: 0.15, label: '15% Win Rate', description: 'Rare wins — higher payouts feel rewarding' },
  { id: 'balanced', value: 0.30, label: '30% Win Rate', description: 'Balanced — good mix of wins and losses' },
  { id: 'generous', value: 0.45, label: '45% Win Rate', description: 'Generous — frequent small wins' },
];

/** Default symbols for quick start */
export const DEFAULT_SCRATCH_SYMBOLS: ScratchSymbol[] = [
  { id: 'sc_1', name: 'Cherry', image: '🍒', payout: 2 },
  { id: 'sc_2', name: 'Lemon', image: '🍋', payout: 3 },
  { id: 'sc_3', name: 'Star', image: '⭐', payout: 5 },
  { id: 'sc_4', name: 'Diamond', image: '💎', payout: 10 },
  { id: 'sc_5', name: 'Crown', image: '👑', payout: 25 },
  { id: 'sc_6', name: '7', image: '7️⃣', payout: 50 },
];

export const DEFAULT_SCRATCH_CONFIG: ScratchConfig = {
  gridSize: '3x3',
  rows: 3,
  cols: 3,
  symbols: DEFAULT_SCRATCH_SYMBOLS,
  coverImage: null,
  brushShape: 'circle',
  brushSize: 40,
  winProbability: 0.30,
  theme: {
    gameName: 'My Scratch Card',
    gameDescription: 'Scratch to reveal and win!',
    accentColor: '#f59e0b',
    backgroundColor: '#0a111a',
  },
};
