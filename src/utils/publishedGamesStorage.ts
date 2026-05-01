"use client";

import { createClient } from "@/utils/supabase/client";

const STORAGE_KEY = "custom_published_games";
const PRIMARY_BUCKET = "game-assets";
const FALLBACK_BUCKET = "avatars";

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
