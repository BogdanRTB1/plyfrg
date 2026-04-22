/**
 * Case Opening Game Configuration Schema
 * Drives the entire case opening experience — from the roulette band
 * to item rarities, probabilities, and creator branding.
 */

// ─── Rarity Tiers ────────────────────────────────────────────────────────────
export type CaseRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITY_CONFIG: Record<CaseRarity, { label: string; color: string; glowColor: string; emoji: string }> = {
  common: { label: 'Common', color: '#9ca3af', glowColor: 'rgba(156,163,175,0.5)', emoji: '⚪' },
  rare: { label: 'Rare', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.5)', emoji: '🔵' },
  epic: { label: 'Epic', color: '#a855f7', glowColor: 'rgba(168,85,247,0.5)', emoji: '🟣' },
  legendary: { label: 'Legendary', color: '#f59e0b', glowColor: 'rgba(245,158,11,0.6)', emoji: '🟡' },
};

// ─── Case Item ───────────────────────────────────────────────────────────────
export interface CaseItem {
  id: string;
  /** Display name of the item/prize */
  name: string;
  /** Payout multiplier (e.g. 0.1x, 1x, 5x, 50x) */
  multiplier: number;
  /** Rarity tier — controls glow, border color, sound intensity */
  rarity: CaseRarity;
  /** Probability as a percentage (0-100). All items should sum to 100. */
  probability: number;
  /** Item image (base64 or URL). If null, shows multiplier text */
  image: string | null;
  /** Item color for the roulette band card background */
  color: string;
}

// ─── Case Design Style ──────────────────────────────────────────────────────
export type CaseDesignStyle = 'safe' | 'treasure' | 'cardboard' | 'card_pack' | 'custom';

export const CASE_DESIGN_PRESETS = [
  { id: 'safe', emoji: '🔒', label: 'Safe', description: 'Heavy vault / safe door' },
  { id: 'treasure', emoji: '🏴‍☠️', label: 'Treasure Chest', description: 'Pirate-style treasure chest' },
  { id: 'cardboard', emoji: '📦', label: 'Cardboard Box', description: 'Delivery package with logo' },
  { id: 'card_pack', emoji: '🃏', label: 'Card Pack', description: 'Trading card booster pack' },
  { id: 'custom', emoji: '🖼️', label: 'Custom Image', description: 'Upload your own case design' },
] as const;

// ─── Opening Sound Presets ──────────────────────────────────────────────────
export const OPENING_SOUND_PRESETS = [
  { id: 'chains', emoji: '⛓️', label: 'Chains Breaking', description: 'Metal chains snapping' },
  { id: 'lock', emoji: '🔓', label: 'Lock Opening', description: 'Lock click + creak' },
  { id: 'zipper', emoji: '🤐', label: 'Zipper', description: 'Zip open sound' },
  { id: 'none', emoji: '🔇', label: 'None', description: 'No opening sound' },
] as const;

// ─── Full Config ─────────────────────────────────────────────────────────────
export interface CaseConfig {
  /** Collection/theme name (e.g. "Halloween Box", "VIP Box") */
  collectionName: string;

  // ─── Visual ─────────────────────────────────────────────────────────────
  /** Case design style */
  caseDesign: CaseDesignStyle;
  /** Custom case image (base64/URL) — used when caseDesign is 'custom' */
  caseImage: string | null;
  /** Background image for the game area */
  backgroundImage: string | null;
  /** Accent color */
  accentColor: string;
  /** Background color */
  backgroundColor: string;
  /** Enable rarity glow borders on roulette band items */
  enableRarityGlow: boolean;

  // ─── Audio ──────────────────────────────────────────────────────────────
  /** Opening sequence sound preset */
  openingSoundType: 'chains' | 'lock' | 'zipper' | 'none';
  /** Custom opening sound file (base64 data URL) */
  openingSoundFile: string | null;
  /** Enable explosion sound on rare+ items */
  enableRareExplosionSound: boolean;

  // ─── Items & Mechanics ──────────────────────────────────────────────────
  /** All items in the case */
  items: CaseItem[];
  /** Roulette band scroll speed — lower = faster, higher = more suspense */
  scrollDuration: number;

  // ─── Theme ──────────────────────────────────────────────────────────────
  theme: {
    gameName: string;
    gameDescription: string;
  };
}

// ─── Default Items ───────────────────────────────────────────────────────────
export const DEFAULT_CASE_ITEMS: CaseItem[] = [
  { id: 'item_1', name: '0.1x', multiplier: 0.1, rarity: 'common', probability: 35, image: null, color: '#374151' },
  { id: 'item_2', name: '0.5x', multiplier: 0.5, rarity: 'common', probability: 25, image: null, color: '#4b5563' },
  { id: 'item_3', name: '1x', multiplier: 1.0, rarity: 'rare', probability: 18, image: null, color: '#1e40af' },
  { id: 'item_4', name: '2x', multiplier: 2.0, rarity: 'rare', probability: 10, image: null, color: '#1d4ed8' },
  { id: 'item_5', name: '5x', multiplier: 5.0, rarity: 'epic', probability: 7, image: null, color: '#7e22ce' },
  { id: 'item_6', name: '10x', multiplier: 10.0, rarity: 'epic', probability: 3.5, image: null, color: '#9333ea' },
  { id: 'item_7', name: '25x', multiplier: 25.0, rarity: 'legendary', probability: 1, image: null, color: '#b45309' },
  { id: 'item_8', name: '50x', multiplier: 50.0, rarity: 'legendary', probability: 0.45, image: null, color: '#d97706' },
  { id: 'item_9', name: '100x', multiplier: 100.0, rarity: 'legendary', probability: 0.05, image: null, color: '#f59e0b' },
];

// ─── Default Config ──────────────────────────────────────────────────────────
export const DEFAULT_CASE_CONFIG: CaseConfig = {
  collectionName: 'Classic Case',
  caseDesign: 'safe',
  caseImage: null,
  backgroundImage: null,
  accentColor: '#f59e0b',
  backgroundColor: '#06090c',
  enableRarityGlow: true,
  openingSoundType: 'chains',
  openingSoundFile: null,
  enableRareExplosionSound: true,
  items: DEFAULT_CASE_ITEMS,
  scrollDuration: 5,
  theme: {
    gameName: 'My Case Opening',
    gameDescription: 'Open the case and discover your prize!',
  },
};

// ─── Scroll Speed Presets ────────────────────────────────────────────────────
export const SCROLL_SPEED_PRESETS = [
  { id: 'fast', value: 3, label: 'Fast', description: '3 seconds — quick reveal' },
  { id: 'standard', value: 5, label: 'Standard', description: '5 seconds — classic suspense' },
  { id: 'slow', value: 8, label: 'Slow', description: '8 seconds — maximum tension' },
] as const;
