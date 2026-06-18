"use client";

import { Dices, Search, Filter, Sparkles } from "lucide-react";
import GameCard from "@/components/GameCard";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { FEATURED_GAMES, getGameCoverImage } from "@/constants/featuredGames";
import { loadPublishedGames } from "@/utils/publishedGamesStorage";
import { openGamePicker } from "@/utils/gameLaunch";

export default function CasinoPage() {
    const allGames = FEATURED_GAMES.map((game) => ({
        ...game,
        image: getGameCoverImage(game.name),
    }));

    const categories = ["All Games", "Trending", "New Releases", "Table Games", "Instant Win"] as const;
    type Category = (typeof categories)[number];

    // AI / Custom game states
    const [customGames, setCustomGames] = useState<any[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category>("All Games");

    // Balance & User state for potential other uses (if any left, though mostly removed)
    const [diamonds, setDiamonds] = useState(0);
    const [forgesCoins, setForgesCoins] = useState(0);

    useEffect(() => {
        const sync = () => {
            const d = localStorage.getItem('user_diamonds');
            const f = localStorage.getItem('user_forges_coins');
            if (d) setDiamonds(parseInt(d));
            if (f) setForgesCoins(parseFloat(f));
        };
        sync();
        window.addEventListener('balance_updated', sync);
        window.addEventListener('storage', sync);
        return () => {
            window.removeEventListener('balance_updated', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    // Load custom published games from localStorage
    useEffect(() => {
        const fetchCustomGames = async () => {
            try {
                const games = await loadPublishedGames();
                setCustomGames(games || []);
            } catch (e) {
                console.error(e);
            }
        };
        void fetchCustomGames();
        const handleStorage = () => { void fetchCustomGames(); };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const playNow = (game: string | Record<string, unknown>) => {
        openGamePicker(game);
    };

    const filteredGames = useMemo(() => {
        const g = allGames;
        if (activeCategory === "All Games") return g;
        if (activeCategory === "Trending") {
            const hot = g.filter((x: { badge?: string }) => x.badge === "Hot");
            return hot.length ? hot : g.slice(0, 6);
        }
        if (activeCategory === "New Releases") {
            const neu = g.filter((x: { badge?: string }) => x.badge === "New");
            return neu.length ? neu : g.filter((x: { badge?: string }) => x.badge).slice(-4);
        }
        if (activeCategory === "Table Games") return g.filter((x: { name: string }) => ["Blackjack", "Roulette"].includes(x.name));
        if (activeCategory === "Instant Win") {
            return g.filter((x: { name: string }) => !["Blackjack", "Roulette"].includes(x.name));
        }
        return g;
    }, [activeCategory]);

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar p-4 sm:p-6 md:p-10 pb-32 z-0">
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

            {/* Categories: dropdown on mobile (easy thumb use), chips on md+ */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mb-8"
            >
                <label className="md:hidden block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value as Category)}
                    className="md:hidden w-full bg-[#0f212e] border border-white/10 rounded-xl py-3.5 px-4 text-sm font-bold text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] mb-3 min-h-[48px] touch-manipulation"
                    aria-label="Game category"
                >
                    {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
                <div className="hidden md:flex flex-wrap items-center gap-2">
                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            onClick={() => setActiveCategory(category)}
                            className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                activeCategory === category
                                    ? "bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.3)]"
                                    : "bg-[#0f212e] border border-white/5 hover:bg-white/10 text-slate-300"
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Games Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
            >
                {filteredGames.map((game, index) => (
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
                                onClick={() => playNow(game.name)}
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

            {/* Creator / AI Games Section */}
            {customGames.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                        <h2 className="text-2xl font-bold text-white">Creator Games</h2>
                        <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full">{customGames.length} games</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {customGames.map((game: any, index: number) => (
                            <motion.div
                                key={game.id || index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                            >
                                <div className="relative h-full">
                                    <GameCard
                                        name={game.name}
                                        image={game.coverImage || ""}
                                        rtp="88.0%"
                                        provider={game.creatorName ? `@${game.creatorName}` : undefined}
                                        onClick={() => playNow(game)}
                                    />
                                    <div className="absolute top-2 left-2 z-20">
                                        <span className="px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-md border bg-fuchsia-500/90 text-white border-fuchsia-400/50 shadow-[0_0_10px_rgba(217,70,239,0.5)]">
                                            AI
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

        </div>
    );
}
