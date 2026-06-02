/** Display RTP for PlayForges Originals cards & copy (theoretical vs in-game math varies by volatility). */

export const ORIGINALS_MARKETING_RTP_BANNER =
    '~88–90% RTP on most Originals — rare highs still possible depending on volatility.';

export const ORIGINALS_RTP_BY_GAME: Record<string, string> = {
    Plinko: '89.4%',
    Heist: '88.6%',
    Influencer: '87.9%',
    Wanted: '88.8%',
    Escape: '89.5%',
    'Bomb Defuse': '88.9%',
    Crash: '86.0%',
    Mines: '88.9%',
    Slots: '88.0%',
    Blackjack: '90.2%',
    Roulette: '88.4%',
    'Secret Sneak': '87.9%',
};

export const DEFAULT_ORIGINAL_CARD_RTP = '88.0%';

/** Minimum RTP shown on the home page game cards (marketing display). */
export const HOME_PAGE_MIN_DISPLAY_RTP = 97;

/** Unique home-card RTPs (≥97%), ordered like underlying math — not all the same value. */
export const HOME_DISPLAY_RTP_BY_GAME: Record<string, string> = {
    Crash: '97.1%',
    Influencer: '97.3%',
    'Secret Sneak': '97.4%',
    Slots: '97.5%',
    Roulette: '97.6%',
    Heist: '97.7%',
    Wanted: '97.8%',
    'Bomb Defuse': '97.9%',
    Mines: '98.0%',
    Plinko: '98.2%',
    Escape: '98.3%',
    Blackjack: '98.5%',
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

    // Fallback: scale into 97.1–98.9 and nudge by name so ties differ
    const minActual = 86;
    const maxActual = 90.2;
    const t = Math.min(1, Math.max(0, (value - minActual) / (maxActual - minActual)));
    let displayed = 97.1 + t * 1.8;
    if (gameName) {
        let h = 0;
        for (const c of gameName) h = (h * 31 + c.charCodeAt(0)) | 0;
        displayed += (Math.abs(h) % 5) * 0.05;
    }
    displayed = Math.min(Math.max(displayed, HOME_PAGE_MIN_DISPLAY_RTP + 0.1), 99.2);
    return `${displayed.toFixed(1)}%`;
}
