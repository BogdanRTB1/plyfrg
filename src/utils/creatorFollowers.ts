export function getCreatorDisplayFollowers(
    organic: number | null | undefined,
    fake: number | null | undefined
): number {
    return Math.max(0, Number(organic || 0) + Number(fake || 0));
}

export function sortCreatorsByDisplayFollowers<
    T extends { followers_count?: number | null; fake_followers?: number | null },
>(creators: T[]): T[] {
    return [...creators].sort(
        (a, b) =>
            getCreatorDisplayFollowers(b.followers_count, b.fake_followers) -
            getCreatorDisplayFollowers(a.followers_count, a.fake_followers)
    );
}

/** Columns for creator follower display (requires migration). */
export const CREATOR_FOLLOWERS_SELECT =
    "display_name, profile_picture, followers_count, fake_followers";

export const CREATOR_FOLLOWERS_SELECT_FALLBACK =
    "display_name, profile_picture, followers_count";

export function isMissingFakeFollowersColumn(
    error: { message?: string } | null | undefined
): boolean {
    if (!error?.message) return false;
    const msg = error.message.toLowerCase();
    return msg.includes("fake_followers") && msg.includes("does not exist");
}

type CreatorFollowerRow = {
    display_name: string;
    profile_picture: string | null;
    followers_count: number | null;
    fake_followers?: number | null;
};

/** Fetch creators with fake_followers when migrated; falls back to organic-only. */
export async function fetchCreatorsForDisplay(
    supabase: { from: (table: string) => any },
    options?: {
        /** @deprecated DB order uses organic only; use sortByTotalFollowers for display ranking */
        orderByFollowers?: boolean;
        /** Sort by organic + fake (desc) before applying limit. Default true when limit is set. */
        sortByTotalFollowers?: boolean;
        limit?: number;
        ilikeDisplayName?: string;
        single?: boolean;
    }
): Promise<{ data: CreatorFollowerRow[] | CreatorFollowerRow | null; error: Error | null }> {
    const sortByTotal =
        options?.sortByTotalFollowers ??
        (Boolean(options?.limit) && !options?.single);

    const buildQuery = (select: string) => {
        let q = supabase.from("creators").select(select);
        if (options?.ilikeDisplayName) {
            q = q.ilike("display_name", options.ilikeDisplayName);
        }
        if (!sortByTotal && options?.orderByFollowers !== false) {
            q = q.order("followers_count", { ascending: false });
        }
        if (options?.limit && !sortByTotal) {
            q = q.limit(options.limit);
        }
        if (options?.single) {
            return q.maybeSingle();
        }
        return q;
    };

    let result = await buildQuery(CREATOR_FOLLOWERS_SELECT);
    if (isMissingFakeFollowersColumn(result.error)) {
        result = await buildQuery(CREATOR_FOLLOWERS_SELECT_FALLBACK);
    }

    if (result.error) {
        return { data: null, error: result.error };
    }

    const rows = result.data;
    let normalized = Array.isArray(rows)
        ? rows.map((row: CreatorFollowerRow) => ({ ...row, fake_followers: row.fake_followers ?? 0 }))
        : rows
          ? { ...rows, fake_followers: rows.fake_followers ?? 0 }
          : null;

    if (Array.isArray(normalized) && sortByTotal) {
        normalized = sortCreatorsByDisplayFollowers(normalized);
        if (options?.limit) {
            normalized = normalized.slice(0, options.limit);
        }
    }

    return { data: normalized, error: null };
}
