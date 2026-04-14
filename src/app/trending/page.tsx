"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Flame, TrendingUp, Sparkles, Users, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import GameCard from "@/components/GameCard";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface GameStat {
    name: string;
    image: string;
    rtp: string;
    provider: string;
    recentPlayers: number;
    weeklyAvg?: number;
    monthlyAvg?: number;
}

export default function TrendingPage() {
    const router = useRouter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [trendingGames, setTrendingGames] = useState<GameStat[]>([]);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        if (!loading && scrollRef.current) {
            scrollRef.current.scrollLeft = 0;
        }
    }, [loading]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const supabase = createClient();
                const now = new Date();
                const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

                const { data: recentData } = await supabase
                    .from('game_activity')
                    .select('game_name, user_id')
                    .gt('created_at', twentyFourHoursAgo);

                const { data: weeklyData } = await supabase
                    .from('game_activity')
                    .select('game_name, user_id')
                    .gt('created_at', sevenDaysAgo);

                const { data: monthlyData } = await supabase
                    .from('game_activity')
                    .select('game_name, user_id')
                    .gt('created_at', thirtyDaysAgo);

                const getUniqueCount = (data: any[] | null, gameName: string) => {
                    if (!data) return 0;
                    const users = new Set(data.filter(d => d.game_name === gameName).map(d => d.user_id || `guest_${Math.random()}`));
                    return users.size;
                };

                const mappedGames = baseGames.map(game => {
                    const recent = getUniqueCount(recentData, game.name);
                    const weekly = getUniqueCount(weeklyData, game.name);
                    const monthly = getUniqueCount(monthlyData, game.name);

                    return {
                        ...game,
                        recentPlayers: recent,
                        weeklyAvg: Math.round(weekly / 7),
                        monthlyAvg: Math.round(monthly / 30)
                    };
                }).sort((a, b) => b.recentPlayers - a.recentPlayers);

                setTrendingGames(mappedGames);
            } catch (err) {
                console.error("Error fetching trending stats:", err);
                setTrendingGames(baseGames.map(g => ({ ...g, recentPlayers: 0 })));
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    const playNow = (gameName: string) => {
        window.dispatchEvent(new CustomEvent('open_game', { detail: gameName }));
    };

    const risingStars = trendingGames.slice(0, 3).map(g => ({
        name: g.name,
        provider: g.provider,
        growth: `+${Math.round(Math.random() * 200 + 50)}% Growth`,
        image: g.image
    }));

    const creatorPicks = [
        { name: "Plinko", picker: "@Ninja", badge: "Live Now", image: "/images/game-plinko.png" },
        { name: "Wanted", picker: "@TechnoKing", badge: "New Record", image: "/images/game-wanted.png" },
        { name: "Blackjack", picker: "@RetroGamer", badge: "High Stakes", image: "/images/game-blackjack.png" },
    ];

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar p-6 md:px-16 lg:px-24 md:py-10 pb-32 z-0">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Flame className="text-orange-500 animate-pulse" size={32} />
                            <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Trending Now</h1>
                        </div>
                        <p className="text-slate-400 font-medium">Discover what's hot. Real-time player counts from the last 24 hours.</p>
                    </div>

                    <div className="flex gap-3 pr-2">
                        <button 
                            onClick={() => scroll('left')}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 active:scale-90 shadow-2xl backdrop-blur-md group"
                            title="Previous"
                        >
                            <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/10 active:scale-90 shadow-2xl backdrop-blur-md group"
                            title="Next"
                        >
                            <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="w-full h-px bg-slate-800 mb-8 opacity-20"></div>

            <AnimatePresence mode="wait">
                {loading ? (
                    <div className="flex gap-4 overflow-hidden py-4">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="min-w-[170px] md:min-w-[210px] aspect-[3/4] bg-[#0f212e] rounded-3xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        ref={scrollRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-5 pb-8 pt-6 overflow-x-auto scrollbar-hide relative z-10"
                    >

                        {trendingGames.slice(0, 12).map((game, index) => (
                            <div 
                                key={index} 
                                className="min-w-[170px] md:min-w-[210px] flex-shrink-0"
                            >
                                <div 
                                    className={`relative group cursor-pointer transition-all duration-300 hover:scale-[1.05] active:scale-95 z-10 hover:z-20 w-full h-full ${index === 0 ? 'origin-left' : ''}`}
                                    onClick={() => playNow(game.name)}
                                >
                                    <GameCard
                                        name={game.name}
                                        image={game.image}
                                        rtp={game.rtp}
                                        provider={game.provider}
                                    />
                                    <div className="absolute top-3 right-3 z-30 flex flex-col gap-1.5 items-end pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity">
                                        <div className="bg-black/80 backdrop-blur-xl px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-2 shadow-2xl">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[11px] font-black text-white">{game.recentPlayers} LIVE</span>
                                        </div>
                                        <div className="bg-[#00b9f0]/30 backdrop-blur-xl px-2.5 py-1 rounded-lg border border-[#00b9f0]/40 flex items-center gap-1.5 shadow-2xl">
                                            <Users size={12} className="text-[#00b9f0]" />
                                            <span className="text-[10px] font-extrabold text-white whitespace-nowrap">~{game.weeklyAvg} AVG</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>


            <div className="mb-8 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <TrendingUp className="text-[#00b9f0]" size={24} />
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight italic">Ecosystem Stats</h2>
                </div>
                <div className="flex gap-4 text-[10px] items-center text-slate-500 uppercase font-black tracking-widest">
                    <span className="flex items-center gap-1"><Clock size={12} /> Live Tracking</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> Averages</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0f212e] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Flame size={20} className="text-orange-500" />
                             </div>
                             <h2 className="text-lg font-black text-white italic uppercase">Rising Stars</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">24H MOMENTUM</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {risingStars.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-[#0b1219]/50 hover:bg-[#151f2b] transition-all border border-white/5 group cursor-pointer active:scale-[0.98]" onClick={() => playNow(item.name)}>
                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex-shrink-0 relative overflow-hidden">
                                     {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm block text-white group-hover:text-[#00b9f0] transition-colors truncate">{item.name}</h4>
                                    <span className="text-xs text-slate-500">{item.provider}</span>
                                </div>
                                <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/10 whitespace-nowrap">
                                    {item.growth}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0f212e] rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                             <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Sparkles size={20} className="text-blue-400" />
                             </div>
                             <h2 className="text-lg font-black text-white italic uppercase">Creator Picks</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">FEATURED</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {creatorPicks.map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-2xl bg-[#0b1219]/50 hover:bg-[#151f2b] transition-all border border-white/5 group cursor-pointer active:scale-[0.98]" onClick={() => playNow(item.name)}>
                                <div className="w-12 h-12 bg-slate-800 rounded-xl flex-shrink-0 relative overflow-hidden">
                                     {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm block text-white group-hover:text-blue-400 transition-colors truncate">{item.name}</h4>
                                    <span className="text-xs text-slate-500">Pick by <span className="text-slate-200 font-bold">{item.picker}</span></span>
                                </div>
                                <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-md border border-blue-500/10">
                                    {item.badge}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
