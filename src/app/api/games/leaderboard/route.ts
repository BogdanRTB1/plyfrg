import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LEADERBOARD_LIMIT = 25;

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

type LeaderboardRow = {
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string | null;
    totalWinnings: number;
    sessions: number;
};

/** Top players by ForgeCoins winnings (sum of FC payout) for a game. */
export async function GET(req: NextRequest) {
    try {
        const gameName = req.nextUrl.searchParams.get("game")?.trim();
        if (!gameName) {
            return NextResponse.json({ error: "game is required" }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const { data: rows, error } = await admin
            .from("user_history")
            .select("user_id, payout, profit, currency")
            .eq("game_name", gameName)
            .eq("currency", "FC")
            .not("user_id", "is", null)
            .gt("payout", 0);

        if (error) {
            console.error("leaderboard fetch:", error);
            return NextResponse.json({ error: "Failed to load leaderboard" }, { status: 500 });
        }

        const byUser = new Map<string, { fcPayout: number; sessions: number }>();

        for (const row of rows || []) {
            const userId = row.user_id as string;
            if (!userId) continue;
            const entry = byUser.get(userId) || { fcPayout: 0, sessions: 0 };
            entry.fcPayout += Number(row.payout || 0);
            entry.sessions += 1;
            byUser.set(userId, entry);
        }

        const sorted = [...byUser.entries()]
            .map(([userId, stats]) => ({
                userId,
                totalWinnings: stats.fcPayout,
                sessions: stats.sessions,
            }))
            .filter((e) => e.totalWinnings > 0)
            .sort((a, b) => b.totalWinnings - a.totalWinnings)
            .slice(0, LEADERBOARD_LIMIT);

        const userIds = sorted.map((e) => e.userId);
        const profilesById = new Map<string, { username: string | null; avatar_url: string | null }>();

        if (userIds.length > 0) {
            const { data: profiles } = await admin
                .from("profiles")
                .select("id, username, avatar_url")
                .in("id", userIds);

            for (const profile of profiles || []) {
                profilesById.set(profile.id, {
                    username: profile.username,
                    avatar_url: profile.avatar_url,
                });
            }
        }

        const entries: LeaderboardRow[] = [];

        for (let i = 0; i < sorted.length; i++) {
            const row = sorted[i];
            const profile = profilesById.get(row.userId);
            let username = profile?.username?.trim() || null;

            if (!username) {
                const { data: authData } = await admin.auth.admin.getUserById(row.userId);
                const meta = authData?.user?.user_metadata || {};
                username =
                    (typeof meta.full_name === "string" && meta.full_name) ||
                    (typeof meta.name === "string" && meta.name) ||
                    authData?.user?.email?.split("@")[0] ||
                    `Player ${i + 1}`;
            }

            entries.push({
                rank: i + 1,
                userId: row.userId,
                username,
                avatarUrl: profile?.avatar_url || null,
                totalWinnings: Number(row.totalWinnings.toFixed(2)),
                sessions: row.sessions,
            });
        }

        return NextResponse.json({
            gameName,
            entries,
            limit: LEADERBOARD_LIMIT,
        });
    } catch (err) {
        console.error("leaderboard error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
