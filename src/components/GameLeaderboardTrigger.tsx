"use client";

import { Trophy } from "lucide-react";

type GameLeaderboardTriggerProps = {
    variant: "header" | "mobile-menu";
    onClick: () => void;
    className?: string;
};

/** Desktop header icon or mobile sheet row — parent owns modal state. */
export default function GameLeaderboardTrigger({
    variant,
    onClick,
    className = "",
}: GameLeaderboardTriggerProps) {
    if (variant === "header") {
        return (
            <button
                type="button"
                onClick={onClick}
                title="Leaderboard"
                aria-label="Open leaderboard"
                className={`hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400 transition hover:bg-amber-500/20 hover:text-amber-300 ${className}`}
            >
                <Trophy size={16} />
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className={`mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 py-3 text-sm font-bold text-amber-300 active:bg-amber-500/20 md:hidden ${className}`}
        >
            <Trophy size={16} />
            Leaderboard
        </button>
    );
}
