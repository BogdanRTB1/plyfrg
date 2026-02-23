"use client";

import { Dices, Search, Filter, Sparkles, TrendingUp } from "lucide-react";
import GameCard from "@/components/GameCard";
import { motion } from "framer-motion";

export default function CasinoPage() {
    const allGames = [
        // Influencer Games (Top Priority)
        { name: "Ninja's Crash", image: "/images/game-crash.png", rtp: "98.5%", provider: "@Ninja", badge: "Hot" },
        { name: "Plinko by xQc", image: "/images/game-plinko.png", rtp: "99.0%", provider: "@xQc" },
        { name: "Pixel Poker", image: null, rtp: "98.0%", provider: "@RetroGamer" },
        { name: "Crypto Quest", image: null, rtp: "95.5%", provider: "@TechnoKing", badge: "Featured" },

        // Other Popular Games
        { name: "Minesweeper Pro", image: "/images/game-mines.png", rtp: "98.5%", provider: "InfluenBet" },
        { name: "Cosmic Slots", image: "/images/game-slots.png", rtp: "96.5%", provider: "GalaxyGames" },
        { name: "High Roller Blackjack", image: "/images/game-blackjack.png", rtp: "99.5%", provider: "TableMasters" },
        { name: "Neon Roulette", image: "/images/game-roulette.png", rtp: "97.3%", provider: "CyberSlots" },
        { name: "Dragon's Luck", image: null, rtp: "96.0%", provider: "Provider X", badge: "New" },
        { name: "Space Gems", image: null, rtp: "97.0%", provider: "StarStudios" },
        { name: "Wild West Shootout", image: null, rtp: "96.2%", provider: "WesternGaming" },
        { name: "Cyberpunk Dice", image: null, rtp: "99.0%", provider: "CyberSlots" },
    ];

    const categories = ["All Games", "Influencers", "Slots", "Live Casino", "Table Games", "New Releases"];

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar p-6 md:p-10 pb-32 z-0">
            {/* Ambient Background Glow */}
            <div className="absolute top-[10%] left-[20%] w-[40%] h-[300px] bg-sky-600/10 blur-[120px] rounded-full pointer-events-none z-[-1]" />
            <div className="absolute top-[30%] right-[10%] w-[30%] h-[200px] bg-[#00b9f0]/10 blur-[100px] rounded-full pointer-events-none z-[-1]" />

            {/* Header Section */}
            <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold mb-4"
                    >
                        <Sparkles size={14} />
                        <span>Discover Top Games</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex items-center gap-4 mb-2"
                    >
                        <div className="w-12 h-12 bg-gradient-to-br from-[#00b9f0] to-[#0072f0] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00b9f0]/30">
                            <Dices size={24} className="text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Casino</h1>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg max-w-2xl"
                    >
                        Explore thousands of games created by top influencers and leading providers.
                    </motion.p>
                </div>

                {/* Search and Filter */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto"
                >
                    <div className="relative group w-full sm:w-64">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00b9f0] transition-colors pointer-events-none">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search games..."
                            className="w-full bg-[#0f212e] border border-white/5 rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00b9f0]/50 focus:ring-1 focus:ring-[#00b9f0]/50 transition-all font-medium"
                        />
                    </div>
                    <button className="flex items-center justify-center gap-2 bg-[#0f212e] border border-white/5 hover:bg-white/5 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all w-full sm:w-auto">
                        <Filter size={16} />
                        <span>Filters</span>
                    </button>
                </motion.div>
            </div>

            {/* Categories */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar scroll-smooth"
            >
                {categories.map((category, idx) => (
                    <button
                        key={idx}
                        className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${idx === 0
                            ? "bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.3)]"
                            : "bg-[#0f212e] border border-white/5 hover:bg-white/10 text-slate-300"
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </motion.div>

            {/* Games Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6"
            >
                {allGames.map((game, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * (index % 10) }}
                    >
                        <div className="relative h-full">
                            <GameCard
                                name={game.name}
                                image={game.image || ""}
                                rtp={game.rtp}
                                provider={game.provider}
                            />
                            {game.badge && (
                                <div className="absolute top-2 left-2 z-20">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${game.badge === 'Hot' ? 'bg-orange-500/90 text-white border-orange-400/50 shadow-[0_0_10px_rgba(249,115,22,0.5)]' :
                                        game.badge === 'New' ? 'bg-emerald-500/90 text-white border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.5)]' :
                                            'bg-purple-500/90 text-white border-purple-400/50 shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                                        }`}>
                                        {game.badge}
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

        </div>
    );
}
