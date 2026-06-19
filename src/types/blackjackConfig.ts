export interface BlackjackConfig {
    accentColor: string;
    backgroundColor: string;
    panelColor: string;
    tableColor: string;
    backgroundImage: string | null;
    tableFeltPattern: 'solid' | 'radial' | 'stripes';
    tableOverlay: 'vignette' | 'glow' | 'none';
    cardBackImage: string | null;
    cardBackEmoji: string;
    customFaceCards: {
        J: string | null;
        Q: string | null;
        K: string | null;
        A: string | null;
    };
    dealSoundType: 'asmr' | 'classic' | 'custom';
    dealSoundFile: string | null;
    winSoundType: 'chime' | 'coins' | 'custom';
    winSoundFile: string | null;
    lossSoundType: 'buzzer' | 'sad_trombone' | 'custom';
    lossSoundFile: string | null;
    theme: {
        gameName: string;
        gameDescription: string;
    };
}

export const DEFAULT_BLACKJACK_CONFIG: BlackjackConfig = {
    accentColor: '#10b981',
    backgroundColor: '#0f212e',
    panelColor: '#121c22',
    tableColor: '#065f46',
    backgroundImage: null,
    tableFeltPattern: 'radial',
    tableOverlay: 'vignette',
    cardBackImage: null,
    cardBackEmoji: '♠',
    customFaceCards: { J: null, Q: null, K: null, A: null },
    dealSoundType: 'classic',
    dealSoundFile: null,
    winSoundType: 'chime',
    winSoundFile: null,
    lossSoundType: 'buzzer',
    lossSoundFile: null,
    theme: {
        gameName: 'My Blackjack',
        gameDescription: 'Beat the dealer to 21',
    },
};

export const BLACKJACK_CARD_BACK_PRESETS = [
    { id: 'spade', emoji: '♠', label: 'Spade' },
    { id: 'heart', emoji: '♥', label: 'Heart' },
    { id: 'diamond', emoji: '♦', label: 'Diamond' },
    { id: 'club', emoji: '♣', label: 'Club' },
    { id: 'crown', emoji: '👑', label: 'Crown' },
    { id: 'star', emoji: '⭐', label: 'Star' },
];

export const BLACKJACK_FELT_PRESETS = [
    { id: 'solid', label: 'Solid Felt', emoji: '🟩' },
    { id: 'radial', label: 'Radial Glow', emoji: '💚' },
    { id: 'stripes', label: 'Table Stripes', emoji: '🎰' },
] as const;

export const BLACKJACK_OVERLAY_PRESETS = [
    { id: 'vignette', label: 'Cinematic Vignette', emoji: '🌑' },
    { id: 'glow', label: 'Accent Glow', emoji: '✨' },
    { id: 'none', label: 'Clean / None', emoji: '⬜' },
] as const;

export const BLACKJACK_WIN_SOUNDS = [
    { id: 'chime', label: 'Victory Chime', emoji: '🎵' },
    { id: 'coins', label: 'Coin Shower', emoji: '🪙' },
    { id: 'custom', label: 'Upload Custom', emoji: '🎙️' },
];
