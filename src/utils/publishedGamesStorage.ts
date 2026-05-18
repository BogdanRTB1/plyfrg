"use client";

import { createClient } from "@/utils/supabase/client";

const STORAGE_KEY = "custom_published_games";
const PRIMARY_BUCKET = "game-assets";
const FALLBACK_BUCKET = "avatars";
const CREATOR_GAMES_TABLE = "creator_games";
const MAX_PUBLISHED_GAMES = 50;

const getFileExtensionForDataUrl = (dataUrl: string) => {
    const mime = dataUrl.match(/^data:(.*?);base64,/)?.[1] || "";
    if (mime.includes("png")) return "png";
    if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
    if (mime.includes("gif")) return "gif";
    if (mime.includes("svg")) return "svg";
    if (mime.includes("mp3")) return "mp3";
    if (mime.includes("wav")) return "wav";
    if (mime.includes("ogg")) return "ogg";
    if (mime.includes("webp")) return "webp";
    return "bin";
};

const hasEmbeddedAsset = (value: any): boolean => {
    if (typeof value === "string") return value.startsWith("data:");
    if (Array.isArray(value)) return value.some(hasEmbeddedAsset);
    if (value && typeof value === "object") return Object.values(value).some(hasEmbeddedAsset);
    return false;
};

const uploadDataUrlToSupabase = async (dataUrl: string, folderPrefix: string) => {
    const supabase = createClient();
    const ext = getFileExtensionForDataUrl(dataUrl);
    const filePath = `${folderPrefix}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const response = await fetch(dataUrl);
    const blob = await response.blob();

    const uploadToBucket = async (bucket: string) => {
        const { error } = await supabase.storage.from(bucket).upload(filePath, blob, {
            upsert: false,
            contentType: blob.type || undefined
        });
        if (error) throw error;
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        return data.publicUrl;
    };

    try {
        return await uploadToBucket(PRIMARY_BUCKET);
    } catch {
        return await uploadToBucket(FALLBACK_BUCKET);
    }
};

const replaceDataUrlsWithStorageUrls = async (
    value: any,
    folderPrefix: string,
    cache: Map<string, string>
): Promise<any> => {
    if (typeof value === "string" && value.startsWith("data:")) {
        if (cache.has(value)) return cache.get(value);
        const publicUrl = await uploadDataUrlToSupabase(value, folderPrefix);
        cache.set(value, publicUrl);
        return publicUrl;
    }

    if (Array.isArray(value)) {
        const converted = [];
        for (const item of value) {
            converted.push(await replaceDataUrlsWithStorageUrls(item, folderPrefix, cache));
        }
        return converted;
    }

    if (value && typeof value === "object") {
        const converted: Record<string, any> = {};
        for (const [key, nested] of Object.entries(value)) {
            converted[key] = await replaceDataUrlsWithStorageUrls(nested, folderPrefix, cache);
        }
        return converted;
    }

    return value;
};

export const migratePublishedGamesAssetsToSupabase = async () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    let games: any[] = [];
    try {
        games = JSON.parse(raw);
    } catch {
        return [];
    }

    if (!Array.isArray(games) || games.length === 0) return [];
    if (!games.some(hasEmbeddedAsset)) return games;

    const cache = new Map<string, string>();
    const migrated: any[] = [];

    for (const game of games) {
        if (!hasEmbeddedAsset(game)) {
            migrated.push(game);
            continue;
        }

        const creatorId = game?.creatorId || "unknown-creator";
        const folderPrefix = `creator-games/${creatorId}/${game?.type || "generic"}`;
        migrated.push(await replaceDataUrlsWithStorageUrls(game, folderPrefix, cache));
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    window.dispatchEvent(new Event("storage"));
    return migrated;
};

const setLocalGames = (games: any[], emitEvent = true) => {
    const trimmed = games.slice(0, MAX_PUBLISHED_GAMES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    if (emitEvent) {
        window.dispatchEvent(new Event("storage"));
    }
    return trimmed;
};

const getLocalGames = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const fetchGamesFromDatabase = async (): Promise<any[]> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from(CREATOR_GAMES_TABLE)
        .select("game_data")
        .order("published_at", { ascending: false });

    if (error || !data) {
        if (error) console.warn("[publishedGames] DB load failed:", error.message);
        return [];
    }

    return data.map((row: any) => row.game_data).filter((game: any) => !!game);
};

const mergePublishedGames = (dbGames: any[], localGames: any[]) => {
    const dbIds = new Set(dbGames.map((g) => g?.id).filter(Boolean));
    const localOnly = localGames.filter((g) => g?.id && !dbIds.has(g.id));
    return [...dbGames, ...localOnly].slice(0, MAX_PUBLISHED_GAMES);
};

/** Load all published creator games (works for guests — public SELECT on creator_games). */
export const loadPublishedGames = async (): Promise<any[]> => {
    const localGames = getLocalGames();
    const dbGames = await fetchGamesFromDatabase();

    if (dbGames.length > 0) {
        const merged = mergePublishedGames(dbGames, localGames);
        setLocalGames(merged, false);
        return merged;
    }

    return localGames;
};

/** Games for a specific creator profile (by auth user id). */
export const loadPublishedGamesForCreator = async (creatorId: string): Promise<any[]> => {
    if (!creatorId) return [];

    const supabase = createClient();
    const { data, error } = await supabase
        .from(CREATOR_GAMES_TABLE)
        .select("game_data")
        .eq("creator_id", creatorId)
        .order("published_at", { ascending: false });

    if (error || !data) {
        console.warn("[publishedGames] Creator games load failed:", error?.message);
        const all = await loadPublishedGames();
        return all.filter((g: any) => g?.creatorId === creatorId);
    }

    return data.map((row: any) => row.game_data).filter((game: any) => !!game);
};

export const savePublishedGame = async (game: any): Promise<{ ok: boolean; reason?: string }> => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const existing = await loadPublishedGames();
    const duplicate = existing.some((g: any) => (g?.name || "").toLowerCase() === (game?.name || "").toLowerCase() && g?.id !== game?.id);
    if (duplicate) return { ok: false, reason: "duplicate_name" };

    const merged = [game, ...existing.filter((g: any) => g?.id !== game?.id)];
    setLocalGames(merged);

    if (!session?.user) return { ok: true };

    const payload = {
        id: game.id,
        creator_id: session.user.id,
        creator_name: game.creatorName || session.user.user_metadata?.full_name || session.user.email,
        game_name: game.name,
        game_type: game.type || "custom",
        game_data: game,
        published_at: game.publishedAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from(CREATOR_GAMES_TABLE)
        .upsert(payload, { onConflict: "id" });

    if (error) {
        console.error("Failed to save game in DB:", error);
        return { ok: false, reason: "db_error" };
    }

    return { ok: true };
};

export const deletePublishedGameById = async (gameId: string): Promise<boolean> => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const existing = getLocalGames();
    setLocalGames(existing.filter((g: any) => g?.id !== gameId));

    if (!session?.user) return true;

    const { error } = await supabase
        .from(CREATOR_GAMES_TABLE)
        .delete()
        .eq("id", gameId);

    if (error) {
        console.error("Failed to delete game from DB:", error);
        return false;
    }
    return true;
};
