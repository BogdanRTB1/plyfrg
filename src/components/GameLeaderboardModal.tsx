"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Loader2, Medal } from "lucide-react";
import { ForgesCoinIcon } from "./CurrencyIcons";

export type LeaderboardEntry = {
    rank: number;
    userId: string;
    username: string;
    avatarUrl: string | null;
    totalWinnings: number;
    sessions: number;
};

type GameLeaderboardModalProps = {
    isOpen: boolean;
    onClose: () => void;
    gameName: string;
};

function rankAccent(rank: number) {
    if (rank === 1) return "text-amber-400";
    if (rank === 2) return "text-slate-300";
    if (rank === 3) return "text-orange-400";
    return "text-slate-500";
}

export default function GameLeaderboardModal({ isOpen, onClose, gameName }: GameLeaderboardModalProps) {
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !gameName) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        void (async () => {
            try {
                const res = await fetch(`/api/games/leaderboard?game=${encodeURIComponent(gameName)}`);
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok) {
                    setError(data.error || "Could not load leaderboard");
                    setEntries([]);
                    return;
                }
                setEntries(data.entries || []);
            } catch {
                if (!cancelled) {
                    setError("Could not load leaderboard");
                    setEntries([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isOpen, gameName]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 40 }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex max-h-[min(85vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0f212e] shadow-2xl sm:rounded-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                                    <Trophy size={20} />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate text-lg font-black text-white">Leaderboard</h2>
                                    <p className="truncate text-xs text-slate-400">{gameName} · ForgeCoins only</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                                aria-label="Close leaderboard"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                                    <Loader2 className="h-8 w-8 animate-spin text-[#00b9f0]" />
                                    <span className="text-sm font-medium">Loading top players…</span>
                                </div>
                            ) : error ? (
                                <div className="py-16 text-center text-sm text-red-400">{error}</div>
                            ) : entries.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Medal className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                                    <p className="text-sm font-bold text-slate-400">No ForgeCoins wins yet</p>
                                    <p className="mt-1 text-xs text-slate-500">Be the first on the board!</p>
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {entries.map((entry) => (
                                        <li
                                            key={entry.userId}
                                            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                                                entry.rank <= 3
                                                    ? "border-amber-500/20 bg-amber-500/5"
                                                    : "border-white/5 bg-[#1a2c38]/50"
                                            }`}
                                        >
                                            <span className={`w-6 shrink-0 text-center text-sm font-black ${rankAccent(entry.rank)}`}>
                                                {entry.rank}
                                            </span>
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0a1114] text-sm font-bold text-[#00b9f0]">
                                                {entry.avatarUrl ? (
                                                    <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    entry.username.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-white">{entry.username}</p>
                                                <p className="text-[10px] text-slate-500">{entry.sessions} sessions</p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1.5 font-mono text-sm font-black text-amber-400">
                                                +{entry.totalWinnings.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                <ForgesCoinIcon className="h-3.5 w-3.5" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border-t border-white/5 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                            <p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                Top 25 by ForgeCoins winnings
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
