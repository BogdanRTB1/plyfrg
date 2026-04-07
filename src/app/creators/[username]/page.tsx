"use client";
/* eslint-disable */
// @ts-nocheck

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User as UserIcon, Calendar, Trophy, Medal, Star, Shield, Lock, Activity, Mail, GamepadIcon, Play, Twitch, Youtube, Twitter } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import AIGameModal from "@/components/AIGameModal";

export default function CreatorProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = decodeURIComponent(params.username as string);
    const supabase = createClient();

    const [creatorData, setCreatorData] = useState<any>(null);
    const [creatorGames, setCreatorGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isFollowing, setIsFollowing] = useState(false);
    const [globalFollowers, setGlobalFollowers] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [uniquePlayers, setUniquePlayers] = useState(0);

    const [isAIGameOpen, setIsAIGameOpen] = useState(false);
    const [activeCustomGame, setActiveCustomGame] = useState<any>(null);
    const [diamonds, setDiamonds] = useState(0);
    const [forgesCoins, setForgesCoins] = useState(0);
    const [playerUsername, setPlayerUsername] = useState<string | null>(null);

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
        const fetchCreator = async () => {
            try {
                // Find if this user is a creator via Supabase
                const { data: dbCreator, error: creatorErr } = await supabase
                    .from('creators')
                    .select('*')
                    .ilike('display_name', username)
                    .single();

                if (!dbCreator) {
                    router.push(`/profile/${username}`);
                    return;
                }

                setCreatorData(dbCreator);
                setGlobalFollowers(dbCreator.followers_count || 0);

                // Fetch the linked player profile to get the correct player username
                const { data: p } = await supabase
                    .from('profiles')
                    .select('username')
                    .eq('id', dbCreator.id)
                    .single();
                
                if (p) {
                    setPlayerUsername(p.username);
                }


                const { data: { user } } = await supabase.auth.getUser();
                setCurrentUserId(user?.id || null);
                
                if (user?.id) {
                    const followState = localStorage.getItem(`following_${user.id}_${dbCreator.display_name}`);
                    if (followState) setIsFollowing(true);
                }
                
                setUniquePlayers(Math.floor(Math.random() * 5000) + 150);

                // Load custom created games
                const aiGamesStr = localStorage.getItem('custom_published_games');
                if (aiGamesStr) {
                    try {
                        const parsed = JSON.parse(aiGamesStr);
                        const filtered = parsed.filter((g: any) => 
                            g.creatorName?.toLowerCase() === username.toLowerCase() || 
                            g.creatorName?.toLowerCase() === dbCreator.display_name?.toLowerCase()
                        );
                        setCreatorGames(filtered);
                    } catch (e) {
                        console.error(e);
                    }
                }
            } catch (err: any) {
                console.error("Creator Profile load error:", err);
                setError("Could not load creator profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchCreator();
    }, [username, supabase, router]);

    const getFollowersCountDisplay = () => {
        const total = globalFollowers;
        if (total >= 1000000) return (total / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (total >= 1000) return (total / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return total.toString();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#071d2a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#00b9f0] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!creatorData) return null;

    return (
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#050B14] pb-24 relative">
            {/* Ambient lights */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00b9f0]/10 blur-[150px] rounded-full pointer-events-none z-0" />
            <div className="absolute top-1/2 left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

            {/* Creator Banner */}
            <div className="h-[400px] sm:h-[500px] w-full relative z-10">
                {creatorData.banner_image ? (
                    <Image src={creatorData.banner_image} alt="Banner" layout="fill" objectFit="cover" className="opacity-80 mix-blend-screen" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#1e293b] to-[#050B14]"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-[#050B14]/20 to-transparent"></div>
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-30 mix-blend-overlay"></div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 -mt-48 relative z-20">
                <div className="bg-[#0b1622]/60 backdrop-blur-3xl rounded-[40px] border border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.8)] p-8 sm:p-12">
                    
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row gap-10 items-start md:items-end mb-12 relative">
                        {/* Avatar */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="w-48 h-48 md:w-56 md:h-56 rounded-[2rem] bg-[#0f212e] border-4 border-white/10 shadow-[0_20px_50px_rgba(0,185,240,0.2)] overflow-hidden shrink-0 flex items-center justify-center relative group mt-[-100px] md:mt-[-140px] rotate-[-2deg] hover:rotate-0 transition-transform duration-500"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#00b9f0] to-purple-600 opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            {creatorData.profile_picture ? (
                                <img src={creatorData.profile_picture} alt={creatorData.display_name} className="w-full h-full object-cover rounded-[1.8rem] relative z-10" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-6xl font-black text-white relative z-10">
                                    {(creatorData.display_name || "CR").substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </motion.div>

                        {/* Details */}
                        <div className="flex-1 w-full pb-2">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-[#00b9f0] bg-[#00b9f0]/10 px-3 py-1 rounded-full border border-[#00b9f0]/20 font-black uppercase tracking-widest text-xs">Elite Creator</span>
                                    {isFollowing && <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-bold text-xs flex items-center gap-1"><Star size={12} className="fill-emerald-400"/> Following</span>}
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-xl">
                                    {creatorData.display_name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-[#1a2c38] flex items-center justify-center border border-white/5"><UserIcon size={18} className="text-[#00b9f0]"/></div>
                                        <div>
                                            <div className="text-white text-lg">{getFollowersCountDisplay()}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-500">Followers</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-[#1a2c38] flex items-center justify-center border border-white/5"><GamepadIcon size={18} className="text-amber-400"/></div>
                                        <div>
                                            <div className="text-white text-lg">{creatorGames.length}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-500">Games</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-[#1a2c38] flex items-center justify-center border border-white/5"><Activity size={18} className="text-purple-400"/></div>
                                        <div>
                                            <div className="text-white text-lg">{uniquePlayers}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-slate-500">Unique Players</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        
                        {/* Actions Right Side */}
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-4 w-full md:w-auto shrink-0 md:min-w-[200px]">
                            <div className="flex gap-2 flex-col w-full">
                                <button 
                                    onClick={async () => {
                                        if (!currentUserId) {
                                            window.dispatchEvent(new CustomEvent('open_auth_modal', { detail: 'login' }));
                                            return;
                                        }
                                        
                                        const isFollowingNow = !isFollowing;
                                        const newCount = isFollowingNow ? globalFollowers + 1 : Math.max(0, globalFollowers - 1);
                                        
                                        // Optimistic UI
                                        setIsFollowing(isFollowingNow);
                                        setGlobalFollowers(newCount);

                                        try {
                                            const { error } = await supabase
                                                .from('creators')
                                                .update({ followers_count: newCount })
                                                .eq('id', creatorData.id);

                                            if (error) throw error;

                                            if (isFollowingNow) {
                                                localStorage.setItem(`following_${currentUserId}_${creatorData.display_name}`, 'true');
                                            } else {
                                                localStorage.removeItem(`following_${currentUserId}_${creatorData.display_name}`);
                                            }
                                            
                                            window.dispatchEvent(new CustomEvent('creator_stats_updated'));
                                        } catch (err) {
                                            console.error("Follow error:", err);
                                            setIsFollowing(!isFollowingNow);
                                            setGlobalFollowers(isFollowingNow ? newCount - 1 : newCount + 1);
                                        }
                                    }}
                                    className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(0,185,240,0.3)] hover:shadow-[0_0_30px_rgba(0,185,240,0.5)] transform hover:-translate-y-1 ${isFollowing ? 'bg-[#152a3a] text-white border border-white/10' : 'bg-gradient-to-r from-[#00b9f0] to-[#0088b0] text-[#050B14]'}`}
                                >
                                    <Star size={20} className={isFollowing ? "fill-white" : "fill-[#050B14]"} />
                                    {isFollowing ? 'Unfollow' : 'Follow Creator'}
                                </button>

                                
                                <button 
                                    onClick={() => router.push(`/profile/${playerUsername || username}`)}

                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                                >
                                    View Player Profile
                                </button>
                            </div>
                            
                            <div className="flex gap-2 justify-center w-full">
                                {creatorData.twitch_url && (
                                    <a href={creatorData.twitch_url} target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-xl bg-[#0f212e] text-[#9146FF] border border-[#9146FF]/20 hover:bg-[#9146FF] hover:text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg group">
                                        <Twitch size={20} className="group-hover:scale-110 transition-transform" />
                                    </a>
                                )}
                                {creatorData.youtube_url && (
                                    <a href={creatorData.youtube_url} target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-xl bg-[#0f212e] text-[#FF0000] border border-[#FF0000]/20 hover:bg-[#FF0000] hover:text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg group">
                                        <Youtube size={20} className="group-hover:scale-110 transition-transform" />
                                    </a>
                                )}
                                {creatorData.twitter_url && (
                                    <a href={creatorData.twitter_url} target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-xl bg-[#0f212e] text-[#1DA1F2] border border-[#1DA1F2]/20 hover:bg-[#1DA1F2] hover:text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg group">
                                        <Twitter size={20} className="group-hover:scale-110 transition-transform" />
                                    </a>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mt-4">
                        {/* Left Col: Info */}
                        <div className="lg:col-span-1 space-y-8">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><UserIcon size={16} className="text-[#00b9f0]"/> About</h3>
                                <p className="text-slate-400 leading-relaxed font-medium">
                                    {creatorData.bio || "This creator prefers to let their games do the talking."}
                                </p>
                            </div>
                        </div>

                        {/* Right Col: Games */}
                        <div className="lg:col-span-3">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-8 tracking-tight">
                                <Play size={24} className="text-[#00b9f0] fill-current" />
                                Portfolio & Games
                            </h2>
                            
                            {creatorGames.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {creatorGames.map((game, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * idx }}
                                            key={idx} 
                                            className="bg-[#0f212e] hover:bg-[#162c3d] cursor-pointer transition-all duration-300 border border-white/5 hover:border-[#00b9f0]/40 rounded-3xl overflow-hidden group hover:-translate-y-2 shadow-lg hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex flex-col"
                                            onClick={() => {
                                                if (game.isManualTemplate) {
                                                    window.location.href = `/?play=${game.name}`;
                                                } else {
                                                    setActiveCustomGame(game);
                                                    setIsAIGameOpen(true);
                                                }
                                            }}
                                        >
                                            <div className="aspect-[16/10] bg-gradient-to-br from-[#0b1622] to-[#152a3a] relative flex items-center justify-center p-4 overflow-hidden">
                                                {/* Background patterns */}
                                                <div className="absolute inset-0 bg-[#00b9f0]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0 mix-blend-overlay"></div>
                                                {game.isManualTemplate ? (
                                                    <img src={`/images/${game.type}.png`} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" onError={(e) => { e.currentTarget.src = '/noise.png' }} />
                                                ) : game.coverImage ? (
                                                    <img src={game.coverImage} alt={game.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                                                ) : (
                                                    <>
                                                        <span className="text-[70px] relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-2xl">
                                                            {game.themeEmoji || game.assets?.icon || "🎮"}
                                                        </span>
                                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#00b9f0]/20 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                                    </>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0f212e] via-transparent to-transparent opacity-80 z-10 pointer-events-none"></div>
                                            </div>
                                            <div className="p-6 flex flex-col flex-1 relative z-20">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-black text-white truncate group-hover:text-[#00b9f0] transition-colors">{game.name}</h3>
                                                    {game.isManualTemplate && <span className="bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase px-2 py-1 rounded border border-amber-500/20">Official</span>}
                                                </div>
                                                <p className="text-xs text-slate-400 mb-6 truncate">{game.gameDescription || `An exclusive game created by ${creatorData?.display_name}`}</p>
                                                
                                                <div className="mt-auto w-full bg-white/5 group-hover:bg-[#00b9f0] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-white/5 group-hover:border-[#00b9f0]">
                                                    <Play size={14} className="fill-current" />
                                                    Play Game
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#0f212e] rounded-3xl p-16 border border-white/5 flex flex-col items-center justify-center text-center backdrop-blur-sm relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('/noise.png')] mix-blend-overlay opacity-20"></div>
                                    <GamepadIcon size={64} className="text-[#00b9f0]/30 mb-6 relative z-10" />
                                    <p className="text-2xl font-black text-white mb-3 relative z-10 tracking-tight">No games yet</p>
                                    <p className="text-slate-400 text-base max-w-md relative z-10">This creator hasn't published any games to their public portfolio yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
