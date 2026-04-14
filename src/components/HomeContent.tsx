"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Gamepad2, 
    TrendingUp, 
    Trophy, 
    Zap, 
    Gift, 
    Users, 
    ShieldCheck, 
    Clock, 
    Dices, 
    ChevronLeft, 
    ChevronRight,
    Twitter,
    Instagram,
    Youtube
} from "lucide-react";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import GameCard from "./GameCard";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function HomeContent() {
    const [isRandomizing, setIsRandomizing] = useState(false);
    const [customGames, setCustomGames] = useState<any[]>([]);
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
    const [globalFollowersMap, setGlobalFollowersMap] = useState<Record<string, number>>({});
    const [topCreatorsRender, setTopCreatorsRender] = useState<any[]>([]);


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

    useEffect(() => {
        const fetchCreatorsAndFollowing = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            // Fetch Creators from Supabase
            const { data: dbCreators, error } = await supabase
                .from('creators')
                .select('display_name, profile_picture, followers_count')
                .order('followers_count', { ascending: false })
                .limit(6);

            if (error) {
                console.error("Error fetching creators:", error.message);
                return;
            }

            const fMap: Record<string, boolean> = {};
            const globalFollows: Record<string, number> = {};

            dbCreators?.forEach(c => {
                if (userId) {
                    fMap[c.display_name] = !!localStorage.getItem(`following_${userId}_${c.display_name}`);
                }
                globalFollows[c.display_name] = c.followers_count || 0;
            });

            setFollowingMap(fMap);
            setGlobalFollowersMap(globalFollows);
            
            // Map formatted creators for render
            const formatted = dbCreators?.map(c => ({
                name: c.display_name,
                image: c.profile_picture || `/images/creator-${(c.display_name.length % 3) + 1}.png`,
                followersCount: c.followers_count || 0
            })) || [];

            setTopCreatorsRender(formatted);
        };

        fetchCreatorsAndFollowing();
        
        window.addEventListener('creator_stats_updated', fetchCreatorsAndFollowing);
        return () => window.removeEventListener('creator_stats_updated', fetchCreatorsAndFollowing);
    }, []);

    const getFollowersDisplay = (count: number) => {
        if (count >= 1000000) return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return count.toString();
    };

    const toggleFollow = (creatorName: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = `/creators/${encodeURIComponent(creatorName)}`;
    };

    const originals = [
        { name: "Plinko", image: "/images/game-plinko.png", rtp: "99.0%" },
        { name: "Heist", image: "/images/game-heist-v2.png", rtp: "98.5%" },
        { name: "Influencer", image: "/images/game-influencer-v2.png", rtp: "97.8%" },
        { name: "Wanted", image: "/images/game-influencer-run.png", rtp: "98.1%" },
        { name: "Escape", image: "/images/game-escape-v3.png", rtp: "98.2%" },
        { name: "Bomb Defuse", image: "/images/game-bomb-v2.png", rtp: "99.1%" },
        { name: "Crash", image: "/images/game-crash.png", rtp: "99.0%" },
        { name: "Mines", image: "/images/game-mines.png", rtp: "99.0%" },
        { name: "Slots", image: "/images/game-slots.png", rtp: "99.0%" },
        { name: "Blackjack", image: "/images/game-blackjack.png", rtp: "99.5%" },
        { name: "Roulette", image: "/images/game-roulette.png", rtp: "97.3%" },
        { name: "Secret Sneak", image: "/images/game-secret-sneak.png", rtp: "98.5%" },
    ];

    const activeOriginals = originals.slice(0, 12);

    const recentWins = [
        { game: "Plinko", user: "Hidden_User", multiplier: "130.00", payout: "1,300 FC", icon: "/images/game-plinko.png" },
        { game: "Crash", user: "SpeedDemon", multiplier: "14.50", payout: "450 FC", icon: "/images/game-crash.png" },
        { game: "Slots", user: "LuckySpin", multiplier: "500.00", payout: "2,500 FC", icon: "/images/game-slots.png" },
        { game: "Roulette", user: "RedBlack", multiplier: "36.00", payout: "360 FC", icon: "/images/game-roulette.png" },
        { game: "Mines", user: "BombSquad", multiplier: "5.45", payout: "125 FC", icon: "/images/game-mines.png" },
    ];

    const pickRandomGame = () => {
        setIsRandomizing(true);
        setTimeout(() => {
            setIsRandomizing(false);
            const allGames = [...originals, ...customGames];
            if (allGames.length === 0) return;
            const randomPick = allGames[Math.floor(Math.random() * allGames.length)];
            window.dispatchEvent(new CustomEvent('open_game', { detail: randomPick }));
        }, 2200);
    };

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    const topCreators = topCreatorsRender;


    return (
        <motion.div initial="hidden" animate="show" variants={container} className="flex-1 h-full overflow-y-auto custom-scrollbar p-4 md:p-8 pb-32 relative">
            <AnimatePresence>
                {isRandomizing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-zinc-900 flex flex-col items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ease: "easeOut", duration: 0.5 }} className="flex flex-col items-center gap-6">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="w-16 h-16 rounded-2xl bg-[#00b9f0]/10 flex items-center justify-center border border-[#00b9f0]/30 shadow-[0_0_30px_rgba(0,185,240,0.3)]">
                                <Dices size={32} className="text-[#00b9f0]" />
                            </motion.div>
                            <h2 className="text-3xl md:text-5xl font-black text-white text-center tracking-tight">Let's see what we've got today...</h2>
                            <p className="text-slate-400 font-medium animate-pulse">Finding the perfect game</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Hero Section */}
            <motion.section variants={item} className="relative min-h-[400px] h-auto md:h-[400px] rounded-3xl overflow-hidden flex items-center p-6 sm:p-8 md:p-12 mb-12 shadow-2xl border border-white/5 group">
                <div className="absolute inset-0 bg-[#0f172a]">
                    <Image src="/images/hero-banner.png" alt="Hero Background" fill className="object-cover object-center opacity-100 transition-transform duration-700 group-hover:scale-105" priority />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/60 to-transparent"></div>
                </div>
                <div className="max-w-xl z-20 relative">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 mb-4">
                        <span className="bg-[#00b9f0]/10 text-[#00b9f0] px-3 py-1 rounded-full text-xs font-bold tracking-wider border border-[#00b9f0]/20 uppercase backdrop-blur-sm">New Season Live</span>
                    </motion.div>
                    <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 text-white leading-[1.1] tracking-tighter drop-shadow-2xl">
                        Create. Play.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b9f0] to-white drop-shadow-sm">Win Together.</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-sm sm:text-lg text-slate-300 sm:text-slate-200 mb-6 sm:mb-8 leading-relaxed max-w-xs sm:max-w-lg drop-shadow-md font-medium">The first social gaming platform where creators build the odds and fans share the victory. Join the revolution.</motion.p>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-3 md:gap-4">
                        <button onClick={pickRandomGame} className="bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] px-8 py-3.5 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(0,185,240,0.3)] hover:shadow-[0_0_30px_rgba(0,185,240,0.5)] hover:-translate-y-1 w-full sm:w-auto text-center">Start Playing</button>
                        <Link href="/creators" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm px-8 py-3.5 rounded-full font-bold border border-white/10 transition-all hover:-translate-y-1 w-full sm:w-auto text-center flex items-center justify-center">View Creators</Link>
                    </motion.div>
                </div>
            </motion.section>

            {/* Originals Section */}
            <motion.div variants={item} className="flex justify-between items-end mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 before:content-[''] before:w-1 before:h-6 before:bg-[#00b9f0] before:rounded-full">PlayForges Originals</h2>
            </motion.div>

            <motion.div variants={item} className="mb-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    {activeOriginals.map((game, index) => (
                        <div key={index} className="cursor-pointer h-full" onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: game.name }))}>
                            <GameCard name={game.name} image={game.image} rtp={game.rtp} />
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Top Creators */}
            <div className="flex justify-between items-end mb-6 mt-16">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3 before:content-[''] before:w-1 before:h-6 before:bg-[#00b9f0] before:rounded-full">Top Creators</h2>
                <Link href="/creators" className="text-sm font-bold text-[#00b9f0] hover:text-[#38bdf8] transition">View All</Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
                {topCreatorsRender.map((creator, index) => (
                    <Link href={`/creators/${encodeURIComponent(creator.name)}`} key={index} className="bg-[#0f212e] rounded-xl overflow-hidden group border border-white/5 hover:border-[#00b9f0]/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#00b9f0]/10 flex flex-col h-full relative">
                        <div className="relative w-full aspect-square bg-[#1a2c38] overflow-hidden shrink-0">
                            <img src={creator.image} alt={creator.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-[#00b9f0] border border-white/10 z-10 uppercase">Top Creator</div>
                        </div>
                        <div className="p-4 border-t border-white/5 bg-[#0f212e] flex-1">
                            <h3 className="font-bold text-white leading-tight mb-1 text-sm truncate uppercase">{creator.name}</h3>
                            <p className="text-xs text-slate-400 font-bold">{getFollowersDisplay(creator.followersCount)} Followers</p>
                        </div>
                    </Link>
                ))}
            </div>


            {/* Promotions Section */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                <div className="bg-gradient-to-br from-[#1a2c38] to-[#0f212e] rounded-2xl p-8 relative overflow-hidden group border border-white/5 hover:border-[#00b9f0]/30 transition-all shadow-lg hover:shadow-[#00b9f0]/10">
                    <div className="relative z-10">
                        <span className="bg-[#00b9f0] text-[#0f212e] text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block shadow-[0_0_10px_rgba(0,185,240,0.3)]">Daily Event</span>
                        <h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">$100k Race</h3>
                        <p className="text-slate-400 mb-8 max-w-xs text-sm font-medium leading-relaxed">Compete daily for the top spot. Wager more to climb the leaderboard and win massive prizes.</p>
                        <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all border border-white/10 hover:scale-105 active:scale-95">Join Race</button>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-12">
                        <Trophy size={220} className="text-[#00b9f0]" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#2a1a38] to-[#1a0f2e] rounded-2xl p-8 relative overflow-hidden group border border-white/5 hover:border-purple-500/30 transition-all shadow-lg hover:shadow-purple-500/10">
                    <div className="relative z-10">
                        <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block shadow-[0_0_10px_rgba(168,85,247,0.3)]">VIP Club</span>
                        <h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Rakeback</h3>
                        <p className="text-slate-400 mb-8 max-w-xs text-sm font-medium leading-relaxed">Get instant rakeback on every bet you place. The more you play, the more you earn back.</p>
                        <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all border border-white/10 hover:scale-105 active:scale-95">See Benefits</button>
                    </div>
                    <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-all duration-500 transform group-hover:scale-110 group-hover:-rotate-12">
                        <Gift size={220} className="text-purple-500" />
                    </div>
                </div>
            </motion.div>

            {/* Live Wins Table */}
            <motion.div variants={item} className="mb-16">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3 before:content-[''] before:w-1 before:h-6 before:bg-green-500 before:rounded-full">Live Wins</h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> LIVE FEED
                    </div>
                </div>
                <div className="bg-[#0f212e] rounded-2xl border border-white/5 overflow-hidden shadow-2xl overflow-x-auto scrollbar-hide">
                    <div className="min-w-[500px]">
                        <div className="grid grid-cols-4 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5 bg-[#1a2c38]/50">
                            <div className="pl-2">Game</div>
                            <div>Player</div>
                            <div className="text-right">Multiplier</div>
                            <div className="text-right pr-2">Payout</div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {recentWins.map((win, i) => (
                                <div key={i} className="grid grid-cols-4 p-4 hover:bg-white/[0.02] text-sm items-center transition-colors group">
                                    <div className="font-bold text-white flex items-center gap-3 pl-2">
                                        <div className="w-8 h-8 rounded-lg bg-[#1a2c38] p-1 border border-white/5 group-hover:border-[#00b9f0]/30 transition-colors shrink-0">
                                            <Image src={win.icon} alt={win.game} width={32} height={32} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="hidden sm:inline">{win.game}</span>
                                    </div>
                                    <div className="text-slate-300 font-medium truncate">{win.user}</div>
                                    <div className="text-right font-bold text-[#00b9f0]">{win.multiplier}x</div>
                                    <div className="text-right font-black text-green-400 pr-2 shadow-green-500/10 drop-shadow-sm flex items-center justify-end gap-1.5">
                                        <ForgesCoinIcon className="w-4 h-4 dropshadow-green" />
                                        {win.payout.replace(' FC', '')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Platform Features */}
            <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 border-t border-white/5">
                <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-[#00b9f0]/10 flex items-center justify-center text-[#00b9f0] mb-2 shadow-[0_0_20px_rgba(0,185,240,0.1)]"><ShieldCheck size={32} /></div>
                    <h3 className="text-lg font-bold text-white">Provably Fair</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Every game result is verifiable on the blockchain. 100% transparency, zero manipulation.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-2 shadow-[0_0_20px_rgba(168,85,247,0.1)]"><Zap size={32} /></div>
                    <h3 className="text-lg font-bold text-white">Instant Payouts</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Withdraw your winnings instantly via crypto. No delays, no manual reviews.</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl hover:bg-white/[0.02] transition-colors border border-transparent hover:border-white/5">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2 shadow-[0_0_20px_rgba(245,158,11,0.1)]"><Clock size={32} /></div>
                    <h3 className="text-lg font-bold text-white">24/7 Support</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">Our support team is always available to help you via live chat or email.</p>
                </div>
            </motion.div>

            {/* Footer */}
            <motion.footer variants={item} className="border-t border-white/5 pt-12 mt-8 text-sm text-slate-400">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-left">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4 text-white">
                            <div className="relative w-8 h-8">
                                <Image src="/logo_transparent.png" alt="PlayForges" fill className="object-contain" />
                            </div>
                            <span className="font-bold text-lg">PlayForges</span>
                        </div>
                        <p className="mb-4">The premier social gaming platform. Build, play, and win together in a fair and transparent ecosystem.</p>
                        <div className="flex gap-4">
                            <a href="#" className="hover:text-white transition-colors"><Instagram size={18} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Twitter size={18} /></a>
                            <a href="#" className="hover:text-white transition-colors"><Youtube size={18} /></a>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Platform</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">About Us</a></li>
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">Provably Fair</a></li>
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">VIP Club</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Support</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">Help Center</a></li>
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">Live Support</a></li>
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">FAQ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Legal</h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">Terms of Service</a></li>
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-[#00b9f0] transition-colors">AML Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <p>&copy; 2026 PlayForges. All rights reserved.</p>
                    <span className="flex items-center gap-2"><div className="w-8 h-8 border-2 border-red-600 text-red-600 rounded-full flex items-center justify-center font-black text-[10px]">18+</div> Play Responsibly</span>
                </div>
            </motion.footer>
        </motion.div>
    );
}

