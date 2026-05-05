import { ORIGINALS_RTP_BY_GAME } from "@/constants/originalsRtp";

export type FeaturedGame = {
    name: string;
    rtp: string;
    provider: string;
    badge?: "Hot" | "New" | "Live";
};

const GAME_COVER_IMAGES: Record<string, string> = {
    Plinko: "/images/game-plinko.png",
    Heist: "/images/game-heist-v2.png",
    Influencer: "/images/game-influencer-v2.png",
    Wanted: "/images/game-influencer-run.png",
    Escape: "/images/game-escape-v3.png",
    "Bomb Defuse": "/images/game-bomb-v2.png",
    Crash: "/images/game-crash.png",
    Mines: "/images/game-mines.png",
    Slots: "/images/game-slots.png",
    Blackjack: "/images/game-blackjack.png",
    Roulette: "/images/game-roulette.png",
    "Secret Sneak": "/images/game-secret-sneak.png",
};

export const getGameCoverImage = (name: string): string => {
    return GAME_COVER_IMAGES[name] || "/images/game-plinko.png";
};

export const FEATURED_GAMES: FeaturedGame[] = [
    { name: "Plinko", rtp: ORIGINALS_RTP_BY_GAME.Plinko, provider: "PlayForges", badge: "Live" },
    { name: "Heist", rtp: ORIGINALS_RTP_BY_GAME.Heist, provider: "PlayForges", badge: "Live" },
    { name: "Influencer", rtp: ORIGINALS_RTP_BY_GAME.Influencer, provider: "PlayForges", badge: "Live" },
    { name: "Wanted", rtp: ORIGINALS_RTP_BY_GAME.Wanted, provider: "PlayForges", badge: "Live" },
    { name: "Escape", rtp: ORIGINALS_RTP_BY_GAME.Escape, provider: "PlayForges", badge: "Live" },
    { name: "Bomb Defuse", rtp: ORIGINALS_RTP_BY_GAME["Bomb Defuse"], provider: "PlayForges", badge: "Live" },
    { name: "Crash", rtp: ORIGINALS_RTP_BY_GAME.Crash, provider: "PlayForges", badge: "Hot" },
    { name: "Mines", rtp: ORIGINALS_RTP_BY_GAME.Mines, provider: "PlayForges", badge: "Live" },
    { name: "Slots", rtp: ORIGINALS_RTP_BY_GAME.Slots, provider: "PlayForges", badge: "Live" },
    { name: "Blackjack", rtp: ORIGINALS_RTP_BY_GAME.Blackjack, provider: "PlayForges", badge: "Live" },
    { name: "Roulette", rtp: ORIGINALS_RTP_BY_GAME.Roulette, provider: "PlayForges", badge: "Live" },
    { name: "Secret Sneak", rtp: ORIGINALS_RTP_BY_GAME["Secret Sneak"], provider: "PlayForges", badge: "Live" },
];
