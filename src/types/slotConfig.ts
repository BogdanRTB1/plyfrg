/**
 * Slot Engine Configuration Schema
 * This JSON structure drives the entire slot game — from the engine rendering
 * to the server-side RNG to the creator dashboard.
 */

export interface SlotSymbol {
  id: string;
  name: string;
  image: string; // base64 data URI, URL, or emoji
  type: 'normal' | 'wild' | 'scatter';
  /** Payout multipliers for N-of-a-kind matches */
  payouts: {
    3?: number;
    4?: number;
    5?: number;
  };
}

export interface SlotFeatures {
  wildEnabled: boolean;
  wildSymbolId?: string;
  scatterEnabled: boolean;
  scatterSymbolId?: string;
  freeSpinsCount: number;        // e.g. 10
  progressiveMultiplier: boolean; // multiplier grows each consecutive win
  tumbleEnabled: boolean;         // winning symbols disappear, new ones fall
}

export interface SlotTheme {
  gameName: string;
  gameDescription: string;
  accentColor: string;            // e.g. '#a855f7'
  backgroundColor: string;        // e.g. '#0a111a'
  backgroundImage?: string;       // base64 or URL
}

export type GridLayout = '3x3' | '5x3' | '6x5';

export interface SlotConfig {
  gridLayout: GridLayout;
  rows: number;     // derived from gridLayout: 3, 3, or 5
  cols: number;     // derived from gridLayout: 3, 5, or 6
  symbols: SlotSymbol[];
  volatility: 'low' | 'medium' | 'high';
  features: SlotFeatures;
  theme: SlotTheme;
}

/** Result returned by the server-side /api/spin endpoint */
export interface SpinResult {
  grid: number[][];           // [row][col] = symbol index
  win: boolean;
  multiplier: number;
  winningCells: [number, number][]; // [row, col] coords of winning symbols
  freeSpinsAwarded: number;
}

/** The GRID_PRESETS map for quick dashboard use */
export const GRID_PRESETS: Record<GridLayout, { rows: number; cols: number; label: string; description: string }> = {
  '3x3': { rows: 3, cols: 3, label: 'Classic', description: '3 reels × 3 rows — retro classic feel' },
  '5x3': { rows: 3, cols: 5, label: 'Standard', description: '5 reels × 3 rows — industry standard' },
  '6x5': { rows: 5, cols: 6, label: 'Megaways', description: '6 reels × 5 rows — cascading action' },
};

/** Volatility presets auto-fill the paytable multipliers */
export const VOLATILITY_PRESETS: Record<string, { label: string; description: string; baseMultipliers: { 3: number; 4: number; 5: number } }> = {
  low:    { label: 'Low Volatility',    description: 'Frequent small wins',     baseMultipliers: { 3: 1.5, 4: 3,  5: 8 } },
  medium: { label: 'Medium Volatility', description: 'Balanced risk & reward',  baseMultipliers: { 3: 2,   4: 5,  5: 15 } },
  high:   { label: 'High Volatility',   description: 'Rare but massive payouts', baseMultipliers: { 3: 3,   4: 10, 5: 50 } },
};

/** Default symbols for quick start */
export const DEFAULT_SYMBOLS: SlotSymbol[] = [
  { id: 'sym_1', name: 'Cherry',  image: '🍒', type: 'normal',  payouts: { 3: 2,  4: 5,   5: 15 } },
  { id: 'sym_2', name: 'Lemon',   image: '🍋', type: 'normal',  payouts: { 3: 2,  4: 5,   5: 15 } },
  { id: 'sym_3', name: 'Melon',   image: '🍉', type: 'normal',  payouts: { 3: 3,  4: 8,   5: 20 } },
  { id: 'sym_4', name: 'Star',    image: '⭐', type: 'normal',  payouts: { 3: 5,  4: 15,  5: 50 } },
  { id: 'sym_5', name: 'Diamond', image: '💎', type: 'normal',  payouts: { 3: 10, 4: 25,  5: 100 } },
  { id: 'sym_w', name: 'Wild',    image: '🃏', type: 'wild',    payouts: { 3: 15, 4: 50,  5: 200 } },
  { id: 'sym_s', name: 'Scatter', image: '💫', type: 'scatter', payouts: { 3: 5,  4: 20,  5: 100 } },
];

export const DEFAULT_SLOT_CONFIG: SlotConfig = {
  gridLayout: '5x3',
  rows: 3,
  cols: 5,
  symbols: DEFAULT_SYMBOLS,
  volatility: 'medium',
  features: {
    wildEnabled: true,
    wildSymbolId: 'sym_w',
    scatterEnabled: true,
    scatterSymbolId: 'sym_s',
    freeSpinsCount: 10,
    progressiveMultiplier: false,
    tumbleEnabled: false,
  },
  theme: {
    gameName: 'My Slot Game',
    gameDescription: 'A custom slot experience',
    accentColor: '#a855f7',
    backgroundColor: '#0a111a',
  },
};
