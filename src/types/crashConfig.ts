/**
 * Crash Game Engine Configuration Schema
 * This JSON structure drives the entire crash game — from the engine rendering
 * to the server-side RNG to the creator dashboard.
 */

export interface CrashConfig {
  /** The flying object — can be an emoji, base64, or URL */
  flyingObject: string;
  /** Optional crash/explosion image */
  crashImage: string | null;
  /** Background image for the game area */
  backgroundImage: string | null;
  /** Accent color for the graph line */
  accentColor: string;
  /** Background color for the game */
  backgroundColor: string;
  /** Graph line color */
  graphColor: string;
  /** Maximum multiplier the game can reach before forced crash */
  maxMultiplier: number;
  /** House Edge percentage (e.g. 5 = 5% house edge, meaning ~95% RTP) */
  houseEdge: number;
  /** Acceleration curve — controls how fast the multiplier grows visually
   *  Lower = slower growth, Higher = faster growth
   *  Default is 0.08 (standard), range 0.03 - 0.15 */
  accelerationCurve: number;
  /** Theme settings */
  theme: {
    gameName: string;
    gameDescription: string;
  };
}

export const DEFAULT_CRASH_CONFIG: CrashConfig = {
  flyingObject: '🚀',
  crashImage: null,
  backgroundImage: null,
  accentColor: '#22c55e',
  backgroundColor: '#06090c',
  graphColor: '#22c55e',
  maxMultiplier: 1000,
  houseEdge: 5,
  accelerationCurve: 0.08,
  theme: {
    gameName: 'My Crash Game',
    gameDescription: 'A thrilling multiplier experience',
  },
};

/** Flying object presets for quick selection */
export const FLYING_OBJECT_PRESETS = [
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'plane', emoji: '✈️', label: 'Airplane' },
  { id: 'balloon', emoji: '🎈', label: 'Balloon' },
  { id: 'ufo', emoji: '🛸', label: 'UFO' },
  { id: 'bird', emoji: '🦅', label: 'Eagle' },
  { id: 'comet', emoji: '☄️', label: 'Comet' },
  { id: 'diamond', emoji: '💎', label: 'Diamond' },
  { id: 'bitcoin', emoji: '₿', label: 'Crypto' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
];

/** Acceleration curve presets */
export const ACCELERATION_PRESETS = [
  { id: 'slow', value: 0.04, label: 'Slow', description: 'Gradual climb — more time to think' },
  { id: 'standard', value: 0.08, label: 'Standard', description: 'Classic crash speed' },
  { id: 'fast', value: 0.12, label: 'Fast', description: 'Quick acceleration — high tension' },
];

/** House edge presets */
export const HOUSE_EDGE_PRESETS = [
  { id: 'low', value: 3, label: '3% Edge', description: '97% RTP — player-friendly', rtp: 97 },
  { id: 'medium', value: 5, label: '5% Edge', description: '95% RTP — balanced', rtp: 95 },
  { id: 'high', value: 8, label: '8% Edge', description: '92% RTP — higher margin', rtp: 92 },
];
