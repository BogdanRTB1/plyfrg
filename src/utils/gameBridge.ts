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
}

export const recordGameSession = async (report: GameReport) => {
    if (report.wagered === 0 && report.payout === 0) return;

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

    if (user) {
        // Save to Supabase
        const { error } = await supabase.from('user_history').insert([historyEntry]);
        if (error) console.error("History Save Error:", error.message);
    } else {
        // Local Fallback
        const localHist = JSON.parse(localStorage.getItem('playforges_history') || '[]');
        localHist.unshift({
            ...historyEntry,
            id: Math.random().toString(36).substr(2, 9),
            created_at: new Date().toISOString()
        });
        localStorage.setItem('playforges_history', JSON.stringify(localHist.slice(0, 50)));
    }

    // Always fire update event for UI
    window.dispatchEvent(new Event('history_updated'));
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

const bridge = {
    recordGameSession,
    recordGameActivity
};

export default bridge;
