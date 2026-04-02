"use client";

import { Dices, Search, Filter, Sparkles, TrendingUp } from "lucide-react";
import GameCard from "@/components/GameCard";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import PlinkoModal from "@/components/PlinkoModal";
import MinesModal from "@/components/MinesModal";
import SlotsModal from "@/components/SlotsModal";
import BlackjackModal from "@/components/BlackjackModal";
import RouletteModal from "@/components/RouletteModal";
import CrashModal from "@/components/CrashModal";
import SneakModal from "@/components/SneakModal";
import DartWheelModal from "@/components/DartWheelModal";
import AviatorModal from "@/components/AviatorModal";
import AIGameModal from "@/components/AIGameModal";

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
        { name: "Secret Sneak", image: "/images/game-secret-sneak.png", rtp: "97.5%", provider: "StealthGames" },
        { name: 'Dart Wheel', image: '/images/game-dart-wheel.png', rtp: "96.8%", provider: "SpinMasters" },
        { name: 'Aviator', image: '/images/game-aviator.png', rtp: "97.0%", provider: "SkyHighGames" }
    ];

    const categories = ["All Games", "Influencers", "Slots", "Live Casino", "Table Games", "New Releases"];

    const [isPlinkoOpen, setIsPlinkoOpen] = useState(false);
    const [isMinesOpen, setIsMinesOpen] = useState(false);
    const [isSlotsOpen, setIsSlotsOpen] = useState(false);
    const [isBlackjackOpen, setIsBlackjackOpen] = useState(false);
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);
    const [isCrashOpen, setIsCrashOpen] = useState(false);
    const [isSneakOpen, setIsSneakOpen] = useState(false);
    const [isDartOpen, setIsDartOpen] = useState(false);
    const [isAviatorOpen, setIsAviatorOpen] = useState(false);

    // AI / Custom game states
    const [customGames, setCustomGames] = useState<any[]>([]);
    const [activeCustomGame, setActiveCustomGame] = useState<any>(null);
    const [isAIGameOpen, setIsAIGameOpen] = useState(false);

    const [diamonds, setDiamonds] = useState(100000);
    const [forgesCoins, setForgesCoins] = useState(100);

    // Load custom published games from localStorage
    useEffect(() => {
        const fetchCustomGames = () => {
            const data = localStorage.getItem('custom_published_games');
            if (data) {
                try {
                    setCustomGames(JSON.parse(data));
                } catch (e) {
                    console.error(e);
                }
            }
        };
        fetchCustomGames();
        window.addEventListener('storage', fetchCustomGames);
        return () => window.removeEventListener('storage', fetchCustomGames);
    }, []);

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
                        <div className="relative h-full cursor-pointer" onClick={() => {
                            if (game.name.includes('Plinko')) setIsPlinkoOpen(true);
                            if (game.name.includes('Minesweeper')) setIsMinesOpen(true);
                            if (game.name.includes('Slots')) setIsSlotsOpen(true);
                            if (game.name.includes('Blackjack')) setIsBlackjackOpen(true);
                            if (game.name.includes('Roulette')) setIsRouletteOpen(true);
                            if (game.name === 'Crash') setIsCrashOpen(true);
                            if (game.name === 'Secret Sneak') setIsSneakOpen(true);
                            if (game.name === 'Dart Wheel') setIsDartOpen(true);
                            if (game.name === 'Aviator') setIsAviatorOpen(true);
                        }}>
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
                                <div className="relative h-full cursor-pointer" onClick={() => {
                                    setActiveCustomGame(game);
                                    if (game.type === 'ai_generated' || game.type === 'manual_template') setIsAIGameOpen(true);
                                }}>
                                    <GameCard
                                        name={game.name}
                                        image={game.coverImage || ""}
                                        rtp="99.0%"
                                        provider={game.creatorName ? `@${game.creatorName}` : undefined}
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

            <PlinkoModal isOpen={isPlinkoOpen} onClose={() => setIsPlinkoOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <MinesModal isOpen={isMinesOpen} onClose={() => setIsMinesOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <SlotsModal isOpen={isSlotsOpen} onClose={() => setIsSlotsOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <BlackjackModal isOpen={isBlackjackOpen} onClose={() => setIsBlackjackOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <RouletteModal isOpen={isRouletteOpen} onClose={() => setIsRouletteOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CrashModal isOpen={isCrashOpen} onClose={() => setIsCrashOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <SneakModal isOpen={isSneakOpen} onClose={() => setIsSneakOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <DartWheelModal isOpen={isDartOpen} onClose={() => setIsDartOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <AviatorModal isOpen={isAviatorOpen} onClose={() => setIsAviatorOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />

            {activeCustomGame && (
                <AIGameModal
                    isOpen={isAIGameOpen}
                    onClose={() => { setIsAIGameOpen(false); setActiveCustomGame(null); }}
                    gameData={activeCustomGame}
                    diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins}
                />
            )}

        </div>
    );
}
