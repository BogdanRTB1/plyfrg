"use client";

import { FEATURED_GAMES } from "@/constants/featuredGames";
import { loadPublishedGames } from "@/utils/publishedGamesStorage";

export type GameLaunchPayload = string | Record<string, unknown>;

function getSlugForPayload(game: GameLaunchPayload): string | null {
    if (typeof game === "string") {
        return encodeURIComponent(game);
    }
    if (game?.id) return encodeURIComponent(String(game.id));
    if (game?.name) return encodeURIComponent(String(game.name));
    return null;
}

/** Opens a game via GlobalGameModals and updates the URL for sharing. */
export function launchGame(game: GameLaunchPayload, options?: { updateUrl?: boolean }) {
    window.dispatchEvent(new CustomEvent("open_game", { detail: game }));

    if (options?.updateUrl === false) return;

    const slug = getSlugForPayload(game);
    if (slug) {
        window.history.pushState(null, "", `/play/${slug}`);
    }
}

export function clearGamePlayUrl() {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/play/")) {
        window.history.replaceState(null, "", "/");
    }
}

/** Resolve a creator game by id or name, or a featured original by name. */
export async function resolveGameFromSlug(slug: string): Promise<GameLaunchPayload | null> {
    const decoded = decodeURIComponent(slug).trim();
    if (!decoded) return null;

    try {
        const published = await loadPublishedGames();
        const byId = published.find((g) => g?.id === decoded);
        if (byId) return byId;

        const lower = decoded.toLowerCase();
        const byName = published.find((g) => (g?.name || "").toLowerCase() === lower);
        if (byName) return byName;
    } catch (e) {
        console.error("[gameLaunch] Failed to load published games:", e);
    }

    const featured = FEATURED_GAMES.find((g) => g.name.toLowerCase() === decoded.toLowerCase());
    if (featured) return featured.name;

    return decoded;
}

/** Handle legacy `/?play=...` links from creator profiles. */
export async function launchGameFromQueryParam(playParam: string) {
    const resolved = await resolveGameFromSlug(playParam);
    launchGame(resolved ?? playParam, { updateUrl: true });
}
