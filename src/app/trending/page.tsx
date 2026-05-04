"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Flame, TrendingUp, Sparkles, Users, Calendar, Clock } from "lucide-react";
import GameCard from "@/components/GameCard";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

interface GameStat {
    name: string;
    image: string;
    rtp: string;
    provider: string;
    recentPlayers: number;
    weeklyAvg?: number;
    monthlyAvg?: number;
}

const baseGames = [
    { name: "Crash", image: "/images/game-crash.png", rtp: "98.5%", provider: "InfluenBet" },
    { name: "Plinko", image: "/images/game-plinko.png", rtp: "99.0%", provider: "InfluenBet" },
    { name: "Mines", image: "/images/game-mines.png", rtp: "98.5%", provider: "InfluenBet" },
    { name: "Slots", image: "/images/game-slots.png", rtp: "96.5%", provider: "InfluenBet" },
    { name: "Blackjack", image: "/images/game-blackjack.png", rtp: "99.5%", provider: "InfluenBet" },
    { name: "Roulette", image: "/images/game-roulette.png", rtp: "97.3%", provider: "InfluenBet" },
    { name: "Aviator", image: "/images/game-aviator.png", rtp: "97.0%", provider: "InfluenBet" },
    { name: "Dart Wheel", image: "/images/game-darts.png", rtp: "98.0%", provider: "InfluenBet" },
    { name: "Penalty", image: "/images/game-penalty.png", rtp: "96.0%", provider: "InfluenBet" },
    { name: "Glass Bridge", image: "/images/game-bridge.png", rtp: "95.5%", provider: "InfluenBet" },
    { name: "Wanted", image: "/images/game-wanted.png", rtp: "96.8%", provider: "InfluenBet" },
    { name: "Escape", image: "/images/game-escape.png", rtp: "97.5%", provider: "InfluenBet" },
];

export default function TrendingPage() {
    const [trendingGames, setTrendingGames] = useState<GameStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const supabase = createClient();
                const now = new Date();
                const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

                const { data: recentData } = await supabase
                    .from("game_activity")
                    .select("game_name, user_id")
                    .gt("created_at", twentyFourHoursAgo);

                const { data: weeklyData } = await supabase
                    .from("game_activity")
                    .select("game_name, user_id")
                    .gt("created_at", sevenDaysAgo);

                const { data: monthlyData } = await supabase
                    .from("game_activity")
                    .select("game_name, user_id")
                    .gt("created_at", thirtyDaysAgo);

                const getUniqueCount = (data: any[] | null, gameName: string) => {
                    if (!data) return 0;
                    const users = new Set(
                        data.filter((d) => d.game_name === gameName).map((d) => d.user_id || `guest_${Math.random()}`)
                    );
                    return users.size;
                };

                const mappedGames = baseGames
                    .map((game) => {
                        const recent = getUniqueCount(recentData, game.name);
                        const weekly = getUniqueCount(weeklyData, game.name);
                        const monthly = getUniqueCount(monthlyData, game.name);

                        return {
                            ...game,
                            recentPlayers: recent,
                            weeklyAvg: Math.round(weekly / 7),
                            monthlyAvg: Math.round(monthly / 30),
                        };
                    })
                    .sort((a, b) => b.recentPlayers - a.recentPlayers);

                setTrendingGames(mappedGames);
            } catch (err) {
                console.error("Error fetching trending stats:", err);
                setTrendingGames(baseGames.map((g) => ({ ...g, recentPlayers: 0 })));
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const playNow = (gameName: string) => {
        window.dispatchEvent(new CustomEvent("open_game", { detail: gameName }));
    };

    const risingStars = trendingGames.slice(0, 3).map((g) => ({
        name: g.name,
        provider: g.provider,
        growth: `+${Math.round(Math.random() * 200 + 50)}%`,
        image: g.image,
    }));

    const creatorPicks = [
        { name: "Plinko", picker: "@Ninja", badge: "Live", image: "/images/game-plinko.png" },
        { name: "Wanted", picker: "@TechnoKing", badge: "Record", image: "/images/game-wanted.png" },
        { name: "Blackjack", picker: "@RetroGamer", badge: "Stakes", image: "/images/game-blackjack.png" },
    ];

    const gridClass =
        "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5";

    return (
        <div className="relative z-0 min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[#050505] pb-28 custom-scrollbar sm:pb-24">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-20 top-0 h-[420px] w-[420px] rounded-full bg-orange-500/[0.06] blur-[100px]" />
                <div className="absolute -right-20 bottom-0 h-[380px] w-[380px] rounded-full bg-[#00b9f0]/[0.05] blur-[90px]" />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-10">
                <motion.header
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 border-b border-white/[0.06] pb-8"
                >
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-3 flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 ring-1 ring-orange-500/25">
                                    <Flame className="h-6 w-6 text-orange-400" aria-hidden />
                                </span>
                                <h1 className="text-2xl font-black uppercase italic tracking-tight text-white sm:text-3xl md:text-4xl">
                                    Trending now
                                </h1>
                            </div>
                            <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
                                Most active titles in the last 24 hours — unique players from your community.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:justify-end">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                                <Clock className="h-3.5 w-3.5 text-[#00b9f0]" />
                                Live
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                7d / 30d
                            </span>
                        </div>
                    </div>
                </motion.header>

                <section aria-label="Trending games" className="mb-12 md:mb-16">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div
                                key="sk"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className={gridClass}
                            >
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex flex-col gap-2 overflow-hidden rounded-2xl border border-white/5 bg-[#0f212e]/80 p-2"
                                    >
                                        <div className="aspect-square w-full animate-pulse rounded-xl bg-[#1a2c38]" />
                                        <div className="h-3 w-3/4 animate-pulse rounded bg-[#1a2c38]" />
                                        <div className="h-2 w-1/2 animate-pulse rounded bg-[#1a2c38]/80" />
                                    </div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className={gridClass}
                            >
                                {trendingGames.slice(0, 12).map((game, index) => (
                                    <motion.article
                                        key={game.name}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index * 0.03, 0.24) }}
                                        className="flex min-w-0 flex-col gap-2"
                                    >
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => playNow(game.name)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    playNow(game.name);
                                                }
                                            }}
                                            className="group w-full cursor-pointer rounded-xl text-left transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00b9f0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
                                        >
                                            <GameCard
                                                name={game.name}
                                                image={game.image}
                                                rtp={game.rtp}
                                                provider={game.provider}
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center justify-center gap-1.5 px-0.5 sm:justify-start">
                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2 py-1 text-[10px] font-black text-white backdrop-blur-sm sm:text-[11px]">
                                                <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-400" />
                                                {game.recentPlayers} / 24h
                                            </span>
                                            <span className="inline-flex items-center gap-1 rounded-lg border border-[#00b9f0]/25 bg-[#00b9f0]/10 px-2 py-1 text-[10px] font-bold text-cyan-100 sm:text-[11px]">
                                                <Users className="h-3 w-3 shrink-0 text-[#00b9f0]" aria-hidden />
                                                ~{game.weeklyAvg}/d
                                            </span>
                                        </div>
                                    </motion.article>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>

                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 shrink-0 text-[#00b9f0]" aria-hidden />
                        <h2 className="text-lg font-bold uppercase italic tracking-tight text-white sm:text-xl">
                            Ecosystem
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 sm:text-right">Highlights &amp; featured picks</p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f212e] p-5 shadow-xl sm:rounded-3xl sm:p-6"
                    >
                        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />
                        <div className="relative mb-5 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-xl bg-orange-500/15 p-2 ring-1 ring-orange-500/20">
                                    <Flame className="h-5 w-5 text-orange-400" />
                                </div>
                                <h3 className="text-base font-black uppercase italic text-white sm:text-lg">Rising stars</h3>
                            </div>
                            <span className="rounded-md bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                24h
                            </span>
                        </div>
                        <ul className="relative flex flex-col gap-2 sm:gap-3">
                            {risingStars.map((item) => (
                                <li key={item.name}>
                                    <button
                                        type="button"
                                        onClick={() => playNow(item.name)}
                                        className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/5 bg-[#0b1219]/60 p-3 text-left transition-colors hover:border-white/10 hover:bg-[#151f2b] active:scale-[0.99] sm:gap-4 sm:p-4"
                                    >
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-800 ring-1 ring-white/10 sm:h-14 sm:w-14">
                                            {item.image ? (
                                                <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
                                            ) : null}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-bold text-white">{item.name}</p>
                                            <p className="truncate text-xs text-slate-500">{item.provider}</p>
                                        </div>
                                        <span className="shrink-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-400 sm:text-[11px]">
                                            {item.growth}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0f212e] p-5 shadow-xl sm:rounded-3xl sm:p-6"
                    >
                        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl" />
                        <div className="relative mb-5 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-xl bg-blue-500/15 p-2 ring-1 ring-blue-500/20">
                                    <Sparkles className="h-5 w-5 text-blue-400" />
                                </div>
                                <h3 className="text-base font-black uppercase italic text-white sm:text-lg">Creator picks</h3>
                            </div>
                            <span className="rounded-md bg-white/5 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                Featured
                            </span>
                        </div>
                        <ul className="relative flex flex-col gap-2 sm:gap-3">
                            {creatorPicks.map((item) => (
                                <li key={item.name}>
                                    <button
                                        type="button"
                                        onClick={() => playNow(item.name)}
                                        className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-white/5 bg-[#0b1219]/60 p-3 text-left transition-colors hover:border-white/10 hover:bg-[#151f2b] active:scale-[0.99] sm:gap-4 sm:p-4"
                                    >
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-800 ring-1 ring-white/10 sm:h-14 sm:w-14">
                                            {item.image ? (
                                                <Image src={item.image} alt="" fill className="object-cover" sizes="56px" />
                                            ) : null}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-bold text-white">{item.name}</p>
                                            <p className="truncate text-xs text-slate-500">
                                                <span className="text-slate-400">{item.picker}</span>
                                            </p>
                                        </div>
                                        <span className="max-w-[5.5rem] shrink-0 truncate rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-center text-[10px] font-black text-blue-300 sm:max-w-none sm:text-[11px]">
                                            {item.badge}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.section>
                </div>
            </div>
        </div>
    );
}
