"use client";

import Image from "next/image";
import { Flame, TrendingUp, Sparkles } from "lucide-react";
import GameCard from "@/components/GameCard";

import { motion } from "framer-motion";

export default function TrendingPage() {
    const trendingGames = [
        { name: "Crash", image: "/images/game-crash.png", rtp: "98.5%", provider: "InfluenBet" },
        { name: "Plinko", image: "/images/game-plinko.png", rtp: "99.0%", provider: "InfluenBet" },
        { name: "Mines", image: "/images/game-mines.png", rtp: "98.5%", provider: "InfluenBet" },
        { name: "Slots", image: "/images/game-slots.png", rtp: "96.5%", provider: "InfluenBet" },
        { name: "Blackjack", image: "/images/game-blackjack.png", rtp: "99.5%", provider: "InfluenBet" },
        { name: "Roulette", image: "/images/game-roulette.png", rtp: "97.3%", provider: "InfluenBet" },
    ];

    const risingStars = [
        { name: "Dragon's Luck", provider: "Provider X", growth: "+240% Player Count", image: null },
        { name: "Cosmic Spins", provider: "GalaxyGames", growth: "+180% Player Count", image: null },
        { name: "Neon Rider", provider: "CyberSlots", growth: "+120% Player Count", image: null },
    ];

    const creatorPicks = [
        { name: "Space Gems", picker: "@Ninja", badge: "Featured", image: null },
        { name: "Crypto Quest", picker: "@TechnoKing", badge: "Featured", image: null },
        { name: "Pixel Poker", picker: "@RetroGamer", badge: "Featured", image: null },
    ];

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar p-6 md:p-10 pb-32 z-0">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-2">
                    <Flame className="text-orange-500" size={32} />
                    <h1 className="text-3xl font-bold text-white">Trending Now</h1>
                </div>
                <p className="text-slate-400">The most played games in the last 24 hours.</p>
            </motion.div>

            <div className="w-full h-px bg-slate-800 mb-8 opacity-50"></div>

            {/* Top Trending Games Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12"
            >
                {trendingGames.map((game, index) => (
                    <GameCard
                        key={index}
                        name={game.name}
                        image={game.image}
                        rtp={game.rtp}
                        provider={game.provider}
                    />
                ))}
            </motion.div>

            {/* Bottom Sections Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Rising Stars */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0f212e] rounded-2xl p-6 border border-white/5 shadow-lg"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <TrendingUp size={24} className="text-[#f97316]" />
                        <h2 className="text-lg font-bold text-[#f97316]">Rising Stars</h2>
                    </div>

                    <div className="flex flex-col gap-4">
                        {risingStars.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-[#0b1219] hover:bg-[#151f2b] transition border border-white/5 group cursor-pointer shadow-sm relative overflow-hidden">
                                {/* Placeholder Square Icon */}
                                <div className="w-10 h-10 bg-slate-700/30 rounded flex-shrink-0"></div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-bold text-sm block text-white truncate leading-tight">{item.name}</h4>
                                    <span className="text-xs text-slate-500 truncate block mt-0.5">{item.provider}</span>
                                </div>

                                <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/10">
                                    {item.growth}
                                </span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Creator Picks */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0f212e] rounded-2xl p-6 border border-white/5 shadow-lg"
                >
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles size={24} className="text-[#3b82f6]" />
                        <h2 className="text-lg font-bold text-[#3b82f6]">Creator Picks</h2>
                    </div>

                    <div className="flex flex-col gap-4">
                        {creatorPicks.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-[#0b1219] hover:bg-[#151f2b] transition border border-white/5 group cursor-pointer shadow-sm relative overflow-hidden">
                                {/* Placeholder Square Icon */}
                                <div className="w-10 h-10 bg-slate-700/30 rounded flex-shrink-0"></div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h4 className="font-bold text-sm block text-white truncate leading-tight">{item.name}</h4>
                                    <span className="text-xs text-slate-500 truncate block mt-0.5">Pick by <span className="text-slate-400 font-medium">{item.picker}</span></span>
                                </div>

                                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/10">
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
