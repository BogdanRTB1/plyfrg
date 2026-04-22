/**
 * Wheel of Fortune Game Configuration Schema
 * This JSON structure drives the entire wheel game — from the canvas rendering
 * to segment probabilities to the creator dashboard.
 */

export interface WheelSegment {
  id: string;
  /** Display label on the segment */
  label: string;
  /** Payout multiplier (0 = lose, 0.5 = half, 2 = double, etc.) */
  multiplier: number;
  /** Segment color (hex) */
  color: string;
  /** Visual arc weight — how large this segment appears on screen (higher = bigger slice).
   *  This is INDEPENDENT of realProbability for the "Troll Wheel" mechanic. */
  visualWeight: number;
  /** Actual mathematical probability (0-1). All segment probabilities should sum to 1. */
  realProbability: number;
  /** Special segment type */
  specialType?: 'respin' | 'multiplier_x2';
}

export interface WheelConfig {
  /** Pointer/indicator style */
  pointerStyle: 'arrow' | 'finger' | 'sword' | 'microphone' | 'custom';
  /** Custom pointer image (base64 or URL) — used when pointerStyle is 'custom' */
  pointerImage: string | null;
  /** Wheel visual texture/style */
  wheelTexture: 'flat' | '3d' | 'neon' | 'wood' | 'metal';
  /** Accent color for UI elements */
  accentColor: string;
  /** Background color */
  backgroundColor: string;
  /** Optional background image (base64 or URL) */
  backgroundImage: string | null;
  /** Ticking sound theme during spin */
  tickSound: 'mechanical' | 'digital' | 'musical' | 'custom';
  /** Custom tick sound file (base64 data URL) */
  tickSoundFile: string | null;
  /** All wheel segments */
  segments: WheelSegment[];
  /** Enable Troll Wheel mode — visual size ≠ real probability */
  enableTrollWheel: boolean;
  /** Confetti celebration type on big wins */
  confettiType: 'classic' | 'custom_logo';
  /** Custom confetti/logo image (base64) — used when confettiType is 'custom_logo' */
  confettiImage: string | null;
  /** Theme settings */
  theme: {
    gameName: string;
    gameDescription: string;
  };
}

/** Default segments for new wheel */
export const DEFAULT_WHEEL_SEGMENTS: WheelSegment[] = [
  { id: 'seg_1', label: '2x', multiplier: 2.0, color: '#e74c3c', visualWeight: 1, realProbability: 0.15, },
  { id: 'seg_2', label: '0.5x', multiplier: 0.5, color: '#3498db', visualWeight: 1, realProbability: 0.25, },
  { id: 'seg_3', label: '5x', multiplier: 5.0, color: '#f1c40f', visualWeight: 1, realProbability: 0.05, },
  { id: 'seg_4', label: '1.5x', multiplier: 1.5, color: '#2ecc71', visualWeight: 1, realProbability: 0.20, },
  { id: 'seg_5', label: '0x', multiplier: 0, color: '#95a5a6', visualWeight: 1, realProbability: 0.20, },
  { id: 'seg_6', label: '3x', multiplier: 3.0, color: '#9b59b6', visualWeight: 1, realProbability: 0.10, },
  { id: 'seg_7', label: 'RESPIN', multiplier: 0, color: '#e67e22', visualWeight: 1, realProbability: 0.05, specialType: 'respin' },
];

export const DEFAULT_WHEEL_CONFIG: WheelConfig = {
  pointerStyle: 'arrow',
  pointerImage: null,
  wheelTexture: 'neon',
  accentColor: '#e74c3c',
  backgroundColor: '#0a0014',
  backgroundImage: null,
  tickSound: 'mechanical',
  tickSoundFile: null,
  segments: DEFAULT_WHEEL_SEGMENTS,
  enableTrollWheel: false,
  confettiType: 'classic',
  confettiImage: null,
  theme: {
    gameName: 'My Wheel Game',
    gameDescription: 'Spin the wheel and win big!',
  },
};

/** Pointer style presets for quick selection */
export const POINTER_PRESETS = [
  { id: 'arrow', emoji: '▼', label: 'Arrow' },
  { id: 'finger', emoji: '👆', label: 'Finger' },
  { id: 'sword', emoji: '⚔️', label: 'Sword' },
  { id: 'microphone', emoji: '🎤', label: 'Mic' },
  { id: 'diamond', emoji: '💎', label: 'Diamond' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
];

/** Wheel texture presets */
export const TEXTURE_PRESETS = [
  { id: 'flat', emoji: '⬜', label: 'Flat / Minimal', description: 'Clean, modern look' },
  { id: '3d', emoji: '🔲', label: '3D', description: 'Raised segments with depth' },
  { id: 'neon', emoji: '💡', label: 'Neon', description: 'Glowing edges & borders' },
  { id: 'wood', emoji: '🪵', label: 'Wood', description: 'Classic wooden texture' },
  { id: 'metal', emoji: '⚙️', label: 'Metal', description: 'Brushed steel look' },
];

/** Tick sound theme presets */
export const TICK_SOUND_PRESETS = [
  { id: 'mechanical', emoji: '⚙️', label: 'Mechanical', description: 'Classic click-click' },
  { id: 'digital', emoji: '🔊', label: 'Digital', description: 'Electronic beep' },
  { id: 'musical', emoji: '🎵', label: 'Musical', description: 'Melodic chime' },
];

/** Segment color palette for quick picking */
export const SEGMENT_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6',
  '#e67e22', '#1abc9c', '#34495e', '#e84393', '#00cec9',
  '#6c5ce7', '#fd79a8', '#ffeaa7', '#dfe6e9', '#636e72',
];
