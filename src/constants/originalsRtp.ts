/** Display RTP for PlayForges Originals cards & copy (theoretical vs in-game math varies by volatility). */

export const DISPLAY_RTP = '95.0%';

export const ORIGINALS_MARKETING_RTP_BANNER =
    '~95% RTP on PlayForges Originals — volatility may vary by game.';

export const ORIGINALS_RTP_BY_GAME: Record<string, string> = {
    Plinko: DISPLAY_RTP,
    Heist: DISPLAY_RTP,
    Influencer: DISPLAY_RTP,
    Wanted: DISPLAY_RTP,
    Escape: DISPLAY_RTP,
    'Bomb Defuse': DISPLAY_RTP,
    Crash: DISPLAY_RTP,
    Mines: DISPLAY_RTP,
    Slots: DISPLAY_RTP,
    Blackjack: DISPLAY_RTP,
    Roulette: DISPLAY_RTP,
    'Secret Sneak': DISPLAY_RTP,
};

export const DEFAULT_ORIGINAL_CARD_RTP = DISPLAY_RTP;

/** Minimum RTP shown on the home page game cards (marketing display). */
export const HOME_PAGE_MIN_DISPLAY_RTP = 95;

/** Home-card RTPs (marketing display). */
export const HOME_DISPLAY_RTP_BY_GAME: Record<string, string> = {
    Crash: DISPLAY_RTP,
    Influencer: DISPLAY_RTP,
    'Secret Sneak': DISPLAY_RTP,
    Slots: DISPLAY_RTP,
    Roulette: DISPLAY_RTP,
    Heist: DISPLAY_RTP,
    Wanted: DISPLAY_RTP,
    'Bomb Defuse': DISPLAY_RTP,
    Mines: DISPLAY_RTP,
    Plinko: DISPLAY_RTP,
    Escape: DISPLAY_RTP,
    Blackjack: DISPLAY_RTP,
};

function parseRtpPercent(rtp: string): number {
    const match = rtp.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

export function displayRtpForHome(rtp: string, gameName?: string): string {
    if (gameName && HOME_DISPLAY_RTP_BY_GAME[gameName]) {
        return HOME_DISPLAY_RTP_BY_GAME[gameName];
    }

    const value = parseRtpPercent(rtp);
    if (value >= HOME_PAGE_MIN_DISPLAY_RTP) {
        return `${value.toFixed(1)}%`;
    }

    return DISPLAY_RTP;
}
