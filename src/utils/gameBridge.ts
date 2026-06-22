"use client";

import { createClient } from "./supabase/client";

/**
 * Universal Game Bridge for PlayForges
 * Handles consolidated history and balance persistence for ANY game.
 */

export interface GameReport {
    gameName: string;
    gameImage: string;
    wagered: number;
    payout: number;
    currency: 'GC' | 'FC';
    // Creator game fields
    creatorId?: string;
    gameId?: string;
}

import { isDemoSessionActive } from "./demoPlay";

export const recordGameSession = async (report: GameReport) => {
    if (report.wagered === 0 && report.payout === 0) return;
    if (isDemoSessionActive()) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const historyEntry = {
        game_name: report.gameName,
        game_image: report.gameImage,
        wagered: report.wagered,
        payout: report.payout,
        profit: report.payout - report.wagered,
        status: report.payout >= report.wagered ? 'win' : 'loss',
        currency: report.currency,
        user_id: user?.id || null
    };

    // Always update Local Fallback for instant UI response and safety
    const localHist = JSON.parse(localStorage.getItem('playforges_history') || '[]');
    localHist.unshift({
        ...historyEntry,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
    });
    localStorage.setItem('playforges_history', JSON.stringify(localHist.slice(0, 50)));

    if (user) {
        // Save to Supabase
        const { error } = await supabase.from('user_history').insert([historyEntry]);
        if (error) console.error("History Save Error:", error.message);

        const playerLoss = report.wagered - report.payout;
        if (playerLoss > 0) {
            void recordReferrerSessionProfit(report, supabase);
        }
    }

    // Always fire update event for UI
    window.dispatchEvent(new Event('history_updated'));

    // ── Creator Analytics ──────────────────────────────────────────────
    // Only record creator analytics for creator games (not built-in games)
    if (report.creatorId && report.gameId) {
        await recordCreatorAnalytics(report, user?.id || null);
    }
};

/**
 * Record creator analytics: earnings (only from player losses) and game plays.
 * 
 * Profit model: creator earns 30% of (wagered - payout) when player lost.
 * The remaining 70% goes to the site. If the player came out profitable, creator earns nothing.
 */
const recordCreatorAnalytics = async (
    report: GameReport,
    playerId: string | null
) => {
    const supabase = createClient();
    const now = new Date().toISOString();

    try {
        // Always record the game play session
        const { error: playError } = await supabase.from('creator_game_plays').insert([{
            creator_id: report.creatorId,
            game_id: report.gameId,
            game_name: report.gameName || '',
            player_id: playerId,
            wagered: report.wagered,
            payout: report.payout,
            currency: report.currency,
            created_at: now,
        }]);

        if (playError) {
            console.error('[Creator Analytics] Game play insert failed:', playError.message, playError.details);
        }

        // Only record earnings if the player LOST money (wagered > payout)
        const playerLoss = report.wagered - report.payout;
        if (playerLoss > 0) {
            // Creator earns 30% of the player loss — 70% goes to the site
            const creatorProfit = Number((playerLoss * 0.30).toFixed(2));
            const { error: earnError } = await supabase.from('creator_earnings').insert([{
                creator_id: report.creatorId,
                game_id: report.gameId,
                game_name: report.gameName || '',
                player_id: playerId,
                wagered: report.wagered,
                payout: report.payout,
                profit: creatorProfit,
                currency: report.currency,
                created_at: now,
            }]);

            if (earnError) {
                console.error('[Creator Analytics] Earnings insert failed:', earnError.message, earnError.details);
            }
        }
    } catch (e) {
        console.error('[Creator Analytics] Exception:', e);
    }
};

/**
 * Record a game entry activity (Trending and Popularity tracker).
 */
export const recordGameActivity = async (gameName: string) => {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const activityEntry = {
            game_name: gameName,
            user_id: user?.id || null,
            is_guest: !user,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase.from('game_activity').insert([activityEntry]);
        if (error) console.error("Activity Track Error:", error.message);
    } catch (e) {
        console.error("Activity Track Exception:", e);
    }
};

const recordReferrerSessionProfit = async (
    report: GameReport,
    supabase: ReturnType<typeof createClient>
) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        await fetch("/api/referral/session-profit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                wagered: report.wagered,
                payout: report.payout,
                currency: report.currency,
                gameName: report.gameName,
            }),
        });
    } catch (e) {
        console.error("[Referral] Session profit error:", e);
    }
};

/**
 * Record a profile view for a creator.
 */
export const recordCreatorProfileView = async (creatorId: string) => {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('creator_profile_views').insert([{
            creator_id: creatorId,
            viewer_id: user?.id || null,
            created_at: new Date().toISOString(),
        }]);

        if (error) {
            console.error('[Creator Analytics] Profile view insert failed:', error.message, error.details);
        }
    } catch (e) {
        console.error('[Creator Analytics] Profile view exception:', e);
    }
};

const bridge = {
    recordGameSession,
    recordGameActivity,
    recordCreatorProfileView
};

export default bridge;
