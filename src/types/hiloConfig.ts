export interface HiLoConfig {
    // Visuals
    cardBackImage: string | null;
    customFaceCards: {
        J: string | null;
        Q: string | null;
        K: string | null;
        A: string | null;
    };
    accentColor: string;
    backgroundColor: string;

    // Audio
    dealSoundType: 'asmr' | 'classic' | 'custom';
    dealSoundFile: string | null;
    lossSoundType: 'buzzer' | 'sad_trombone' | 'custom';
    lossSoundFile: string | null;

    theme: {
        gameName: string;
        gameDescription: string;
    };
}

export const DEFAULT_HILO_CONFIG: HiLoConfig = {
    cardBackImage: null,
    customFaceCards: {
        J: null,
        Q: null,
        K: null,
        A: null,
    },
    accentColor: '#3b82f6', // blue-500
    backgroundColor: '#0a111a',
    dealSoundType: 'asmr',
    dealSoundFile: null,
    lossSoundType: 'buzzer',
    lossSoundFile: null,
    theme: {
        gameName: 'Hi-Lo',
        gameDescription: 'Guess if the next card will be higher or lower!',
    },
};

export const HILO_DEAL_SOUNDS = [
    { id: 'asmr', label: 'ASMR Crisp', emoji: '🎧' },
    { id: 'classic', label: 'Classic Snap', emoji: '🎴' },
    { id: 'custom', label: 'Upload Custom', emoji: '🎙️' }
];

export const HILO_LOSS_SOUNDS = [
    { id: 'buzzer', label: 'Loud Buzzer', emoji: '🚫' },
    { id: 'sad_trombone', label: 'Sad Trombone', emoji: '🎺' },
    { id: 'custom', label: 'Upload Custom', emoji: '🎙️' }
];
