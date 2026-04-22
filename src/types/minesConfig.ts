/**
 * Mines (Câmpul Minat) Game Configuration Schema
 * This JSON structure drives the entire mines game — from the grid rendering
 * to visual effects, audio, and creator branding.
 */

export type MinesGridSize = '3x3' | '5x5' | '7x7';

export interface MinesConfig {
  /** Grid size — determines total cells and difficulty */
  gridSize: MinesGridSize;

  // ─── Visual Assets ──────────────────────────────────────────────────────
  /** Custom mine/bomb artwork (base64 or URL) */
  mineImage: string | null;
  /** Custom safe/gem artwork (base64 or URL) */
  gemImage: string | null;
  /** "BUSTED" fullscreen overlay image (meme, streamer B&W photo, etc.) */
  bustImage: string | null;
  /** Semi-transparent watermark/logo behind the grid (brand identity) */
  watermarkImage: string | null;
  /** Background image for the game area */
  backgroundImage: string | null;

  // ─── Colors ─────────────────────────────────────────────────────────────
  /** Accent color for UI elements (buttons, borders, glows) */
  accentColor: string;
  /** Background color for the game panel */
  backgroundColor: string;
  /** Unrevealed tile color */
  tileColor: string;

  // ─── Audio ──────────────────────────────────────────────────────────────
  /** Progressive suspense — tone/BPM increases with each safe reveal */
  enableProgressiveSuspense: boolean;
  /** Loss sound preset */
  lossSoundType: 'sad_trombone' | 'piano' | 'custom' | 'none';
  /** Custom loss audio file (base64 data URL) */
  lossSoundFile: string | null;
  /** Custom safe-reveal sound file (base64 data URL) */
  revealSoundFile: string | null;

  // ─── Animations ─────────────────────────────────────────────────────────
  /** Enable 3D flip animation when revealing safe tiles */
  enableFlipAnimation: boolean;
  /** Bust animation style when hitting a mine */
  bustAnimationStyle: 'explosion' | 'fullscreen_image' | 'shake';

  // ─── Theme ──────────────────────────────────────────────────────────────
  theme: {
    gameName: string;
    gameDescription: string;
  };
}

// ─── Grid Size Presets ────────────────────────────────────────────────────────
export const GRID_SIZE_PRESETS: Record<MinesGridSize, { rows: number; cols: number; total: number; label: string; description: string }> = {
  '3x3': { rows: 3, cols: 3, total: 9, label: '3×3', description: 'Quick rounds — 9 tiles' },
  '5x5': { rows: 5, cols: 5, total: 25, label: '5×5', description: 'Classic — 25 tiles' },
  '7x7': { rows: 7, cols: 7, total: 49, label: '7×7', description: 'Extended — 49 tiles' },
};

// ─── Bust Animation Presets ──────────────────────────────────────────────────
export const BUST_ANIMATION_PRESETS = [
  { id: 'explosion', emoji: '💥', label: 'Explosion', description: 'Classic bomb explosion effect' },
  { id: 'fullscreen_image', emoji: '🖼️', label: 'Fullscreen Image', description: 'Show custom bust image (meme/streamer)' },
  { id: 'shake', emoji: '📳', label: 'Screen Shake', description: 'Intense screen shake + red flash' },
] as const;

// ─── Loss Sound Presets ──────────────────────────────────────────────────────
export const LOSS_SOUND_PRESETS = [
  { id: 'sad_trombone', emoji: '🎺', label: 'Sad Trombone', description: 'The classic "wah wah wah" sound' },
  { id: 'piano', emoji: '🎹', label: 'Sad Piano', description: 'A melancholic piano melody' },
  { id: 'custom', emoji: '📁', label: 'Custom Upload', description: 'Upload your own loss sound' },
  { id: 'none', emoji: '🔇', label: 'None', description: 'No loss sound effect' },
] as const;

// ─── Default Config ──────────────────────────────────────────────────────────
export const DEFAULT_MINES_CONFIG: MinesConfig = {
  gridSize: '5x5',
  mineImage: null,
  gemImage: null,
  bustImage: null,
  watermarkImage: null,
  backgroundImage: null,
  accentColor: '#f97316',
  backgroundColor: '#06090c',
  tileColor: '#1a2c38',
  enableProgressiveSuspense: true,
  lossSoundType: 'sad_trombone',
  lossSoundFile: null,
  revealSoundFile: null,
  enableFlipAnimation: true,
  bustAnimationStyle: 'fullscreen_image',
  theme: {
    gameName: 'My Mines Game',
    gameDescription: 'Reveal the safe tiles and avoid the mines!',
  },
};
