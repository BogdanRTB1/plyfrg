"use client";

import { Star, ShieldCheck, Zap, Info } from "lucide-react";
import GameCard from "@/components/GameCard";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { FEATURED_GAMES, getGameCoverImage } from "@/constants/featuredGames";
import { ORIGINALS_MARKETING_RTP_BANNER } from "@/constants/originalsRtp";
import PlinkoModal from "@/components/PlinkoModal";
import MinesModal from "@/components/MinesModal";
import SlotsModal from "@/components/SlotsModal";
import RouletteModal from "@/components/RouletteModal";
import CrashModal from "@/components/CrashModal";
import SneakModal from "@/components/SneakModal";
import InfluencerModal from "@/components/InfluencerModal";
import WantedModal from "@/components/WantedModal";
import HeistModal from "@/components/HeistModal";
import EscapeModal from "@/components/EscapeModal";
import BombModal from "@/components/BombModal";
import BlackjackModal from "@/components/BlackjackModal";

export default function OriginalsPage() {
    const originalGames = FEATURED_GAMES.map((game) => ({
        ...game,
        badge: "Live",
        image: getGameCoverImage(game.name),
    }));

    const [isPlinkoOpen, setIsPlinkoOpen] = useState(false);
    const [isMinesOpen, setIsMinesOpen] = useState(false);
    const [isSlotsOpen, setIsSlotsOpen] = useState(false);
    const [isRouletteOpen, setIsRouletteOpen] = useState(false);
    const [isCrashOpen, setIsCrashOpen] = useState(false);
    const [isSneakOpen, setIsSneakOpen] = useState(false);
    const [isHeistOpen, setIsHeistOpen] = useState(false);
    const [isInfluencerOpen, setIsInfluencerOpen] = useState(false);
    const [isWantedOpen, setIsWantedOpen] = useState(false);
    const [isEscapeOpen, setIsEscapeOpen] = useState(false);
    const [isBombOpen, setIsBombOpen] = useState(false);
    const [isBlackjackOpen, setIsBlackjackOpen] = useState(false);

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

    useEffect(() => {
        const handleOpenGame = ((e: CustomEvent) => {
            const label = e.detail;
            if (label === 'Plinko') setIsPlinkoOpen(true);
            else if (label === 'Mines') setIsMinesOpen(true);
            else if (label === 'Slots') setIsSlotsOpen(true);
            else if (label === 'Roulette') setIsRouletteOpen(true);
            else if (label === 'Crash') setIsCrashOpen(true);
            else if (label === 'Secret Sneak') setIsSneakOpen(true);
            else if (label === 'Heist') setIsHeistOpen(true);
            else if (label === 'Influencer') setIsInfluencerOpen(true);
            else if (label === 'Wanted') setIsWantedOpen(true);
            else if (label === 'Escape') setIsEscapeOpen(true);
            else if (label === 'Bomb Defuse') setIsBombOpen(true);
            else if (label === 'Blackjack') setIsBlackjackOpen(true);
        }) as EventListener;

        window.addEventListener('open_game', handleOpenGame);
        return () => window.removeEventListener('open_game', handleOpenGame);
    }, []);

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] relative custom-scrollbar p-6 md:p-10 pb-32 z-0">
            {/* Ambient Background Glow */}
            <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[60%] h-[400px] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none z-[-1]" />
            <div className="absolute top-0 right-0 w-[30%] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none z-[-1]" />

            {/* Premium Header Section */}
            <div className="mb-16 flex flex-col items-center justify-center text-center mt-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold mb-6 backdrop-blur-md shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                >
                    <ShieldCheck size={16} />
                    <span>Provably Fair Gaming</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center gap-4 mb-6"
                >
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-full blur opacity-40 group-hover:opacity-75 transition duration-500"></div>
                        <div className="w-20 h-20 bg-[#0f212e] rounded-full flex items-center justify-center relative border border-white/10 z-10 shadow-2xl">
                            <Star size={40} className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight mt-2">
                        PlayForges <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 drop-shadow-sm">Originals</span>
                    </h1>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-slate-400 text-lg md:text-xl max-w-2xl font-medium"
                >
                    {ORIGINALS_MARKETING_RTP_BANNER} In-house originals with instant payouts and verifiable fairness.
                </motion.p>
            </div>

            {/* Info Banner */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="max-w-5xl mx-auto mb-16"
            >
                <div className="bg-[#0f212e]/80 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_40px_rgba(245,158,11,0.05)]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Zap size={24} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">House-friendly math</h3>
                            <p className="text-slate-400 text-sm">RTP on each card is indicative; edge favors the house while rare big hits stay in the mix.</p>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 text-amber-400 hover:text-amber-300 font-bold bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl transition-colors border border-amber-500/20 shrink-0">
                        <Info size={16} />
                        How it works
                    </button>
                </div>
            </motion.div>

            {/* Games Grid */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto"
            >
                {originalGames.map((game, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                    >
                        <div className="relative h-full group cursor-pointer" onClick={() => {
                            if (game.name === 'Plinko') setIsPlinkoOpen(true);
                            if (game.name === 'Mines') setIsMinesOpen(true);
                            if (game.name === 'Slots') setIsSlotsOpen(true);
                            if (game.name === 'Roulette') setIsRouletteOpen(true);
                            if (game.name === 'Crash') setIsCrashOpen(true);
                            if (game.name === 'Secret Sneak') setIsSneakOpen(true);
                            if (game.name === 'Heist') setIsHeistOpen(true);
                            if (game.name === 'Influencer') setIsInfluencerOpen(true);
                            if (game.name === 'Wanted') setIsWantedOpen(true);
                            if (game.name === 'Escape') setIsEscapeOpen(true);
                            if (game.name === 'Bomb Defuse') setIsBombOpen(true);
                            if (game.name === 'Blackjack') setIsBlackjackOpen(true);
                        }}>
                            {/* Glow effect behind card for Originals */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500 z-[-1]"></div>

                            <GameCard
                                name={game.name}
                                image={game.image || ""}
                                rtp={game.rtp}
                                provider={game.provider}
                            />

                            {/* Customized Badge for Originals */}
                            <div className="absolute top-2 left-2 z-20">
                                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${game.badge === 'Live' ? 'bg-amber-500/90 text-[#0f212e] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                                    'bg-slate-800/90 text-slate-300 border-white/20 shadow-lg'
                                    }`}>
                                    {game.badge}
                                </span>
                            </div>

                            {/* Overlay for Coming Soon */}
                            {game.badge === 'Coming Soon' && (
                                <div className="absolute inset-0 bg-[#0f212e]/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center z-30 m-[1px]">
                                    <span className="font-bold text-slate-300 border border-white/10 bg-[#050505]/80 px-4 py-2 rounded-lg shadow-xl">
                                        Coming Soon
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            <PlinkoModal isOpen={isPlinkoOpen} onClose={() => setIsPlinkoOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <MinesModal isOpen={isMinesOpen} onClose={() => setIsMinesOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <SlotsModal isOpen={isSlotsOpen} onClose={() => setIsSlotsOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <RouletteModal isOpen={isRouletteOpen} onClose={() => setIsRouletteOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <CrashModal isOpen={isCrashOpen} onClose={() => setIsCrashOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <SneakModal isOpen={isSneakOpen} onClose={() => setIsSneakOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <HeistModal isOpen={isHeistOpen} onClose={() => setIsHeistOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <InfluencerModal isOpen={isInfluencerOpen} onClose={() => setIsInfluencerOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <WantedModal isOpen={isWantedOpen} onClose={() => setIsWantedOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <EscapeModal isOpen={isEscapeOpen} onClose={() => setIsEscapeOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <BombModal isOpen={isBombOpen} onClose={() => setIsBombOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />
            <BlackjackModal isOpen={isBlackjackOpen} onClose={() => setIsBlackjackOpen(false)} diamonds={diamonds} setDiamonds={setDiamonds} forgesCoins={forgesCoins} setForgesCoins={setForgesCoins} />

        </div>
    );
}
