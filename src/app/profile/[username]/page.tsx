"use client";
/* eslint-disable */
// @ts-nocheck

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User as UserIcon, Calendar, Trophy, Medal, Star, Shield, Lock, Activity, Mail, GamepadIcon, Play, Twitch, Youtube, Twitter } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import AIGameModal from "@/components/AIGameModal";

export default function ProfilePage() {
    const params = useParams();
    const username = decodeURIComponent(params.username as string);
    const supabase = createClient();

    const [profile, setProfile] = useState<any>(null);
    const [creatorGames, setCreatorGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreator, setIsCreator] = useState(false);
    const [creatorData, setCreatorData] = useState<any>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [globalFollowers, setGlobalFollowers] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [uniquePlayers, setUniquePlayers] = useState(0);

    const [isAIGameOpen, setIsAIGameOpen] = useState(false);
    const [activeCustomGame, setActiveCustomGame] = useState<any>(null);
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

    // This simulates finding the user. 
    // Usually, you need a public 'profiles' table in Supabase 
    // since auth.users cannot be queried directly from the frontend.
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // First get the Supabase profile to map to a creator if they use a different influencer name
                let publicProfile = null;
                try {
                    const { data } = await supabase
                        .from('profiles')
                        .select('id, username, email')
                        .ilike('username', username)
                        .single();
                    publicProfile = data;
                } catch(e) {}

                // Find if this user is a creator
                const addedCreators = localStorage.getItem('added_creators');
                let foundCreator = null;
                if (addedCreators) {
                    try {
                        const parsed = JSON.parse(addedCreators);
                        // Search by creator name first
                        foundCreator = parsed.find((c: any) => c.name.toLowerCase() === username.toLowerCase());
                        
                        // If not found by name, check if public profile id or email matches
                        if (!foundCreator && publicProfile) {
                            foundCreator = parsed.find((c: any) => String(c.id) === String(publicProfile.id) || c.email === publicProfile.email);
                        }

                        // Also check against logged in user if they are looking at their own profile? Well this affects how it searches so let's check current user too just in case.
                        if (!foundCreator) {
                             const { data: { user } } = await supabase.auth.getUser();
                             if (user && (user.user_metadata?.full_name?.toLowerCase() === username.toLowerCase() || user.email?.split('@')[0].toLowerCase() === username.toLowerCase())) {
                                  foundCreator = parsed.find((c: any) => String(c.id) === String(user.id) || c.email === user.email);
                             }
                        }

                        if (foundCreator) {
                            setIsCreator(true);
                            setCreatorData(foundCreator);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }

                let authUser = null;
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    authUser = user;
                } catch(e) {
                    console.warn(e);
                }
                setCurrentUserId(authUser?.id || null);
                
                // Only show following state for logged in users
                if (authUser?.id) {
                    const targetFollowName = foundCreator ? foundCreator.name : username;
                    const followState = localStorage.getItem(`following_${authUser.id}_${targetFollowName}`);
                    if (followState) {
                        setIsFollowing(true);
                    }
                } else {
                    setIsFollowing(false);
                }
                
                const targetFollowNameForGlobal = foundCreator ? foundCreator.name : username;
                setGlobalFollowers(Number(localStorage.getItem(`global_followers_${targetFollowNameForGlobal}`) || 0));
                
                // Simulate unique players count
                setUniquePlayers(Math.floor(Math.random() * 5000) + 150);

                // Load custom created games for this user from local storage
                const aiGamesStr = localStorage.getItem('custom_published_games');
                let allGames: any[] = [];
                if (aiGamesStr) {
                    try {
                        const parsed = JSON.parse(aiGamesStr);
                        allGames = parsed.filter((g: any) => {
                            const matchUsername = g.creatorName?.toLowerCase() === username.toLowerCase();
                            const matchCreatorName = foundCreator && g.creatorName?.toLowerCase() === foundCreator.name.toLowerCase();
                            return matchUsername || matchCreatorName;
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }
                
                // Also merge manually assigned games from the creator profile
                if (foundCreator && foundCreator.assignedGames && Array.isArray(foundCreator.assignedGames)) {
                    const manualGames = foundCreator.assignedGames.map((gameName: string) => ({
                        id: `manual-${gameName}`,
                        gameId: gameName.toLowerCase().replace(/ /g, '-'),
                        gameType: gameName,
                        title: gameName,
                        creatorName: foundCreator.name,
                        description: `A classic ${gameName} game.`
                    }));
                    setCreatorGames(prev => [...manualGames, ...prev]);
                }
                
                // First, check if there's a logged-in user to see their own profile
                const currentUserUsername = authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0];

                if (currentUserUsername && currentUserUsername.toLowerCase() === username.toLowerCase()) {
                    setProfile({
                        username: currentUserUsername,
                        avatar: authUser?.user_metadata?.avatar_url,
                        bio: authUser?.user_metadata?.bio || "none",
                        visibility: 'public', // force public
                        email: authUser?.user_metadata?.show_email ? authUser?.email : null,
                        joinDate: new Date(authUser?.created_at as string).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                        isOwner: true
                    });
                } else {
                    // Fetch public profile from Supabase profiles table
                    const { data: publicProfile, error: profileError } = await supabase
                        .from('profiles')
                        .select('username, avatar_url, bio, created_at')
                        .ilike('username', username)
                        .single();

                    if (publicProfile) {
                        setProfile({
                            username: publicProfile.username,
                            avatar: publicProfile.avatar_url,
                            bio: publicProfile.bio || "none",
                            visibility: 'public',
                            email: null,
                            joinDate: publicProfile.created_at ? new Date(publicProfile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'New User',
                            isOwner: false
                        });
                    } else {
                        // Fallback if the user doesn't exist yet in the public table
                        setProfile({
                            username: username,
                            avatar: foundCreator ? foundCreator.profilePicture : null,
                            bio: foundCreator ? foundCreator.description : "none",
                            visibility: 'public',
                            email: null,
                            joinDate: 'New User',
                            isOwner: false
                        });
                    }
                }
            } catch (err: any) {
                console.error("Profile load error:", err);
                setError("Could not load profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();

        // Sync auth state live
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user?.id || null);
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [username, supabase]);

    const getFollowersCountDisplay = () => {
        const total = globalFollowers;
        if (total >= 1000000) return (total / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (total >= 1000) return (total / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return total.toString();
    };

    // New users shouldn't have any achievements by default
    const achievements: any[] = [];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#071d2a] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#00b9f0] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile && !creatorData) {
        return (
            <div className="min-h-screen bg-[#071d2a] flex flex-col items-center justify-center p-8 text-center">
                <UserIcon size={64} className="text-slate-600 mb-6 border-4 border-slate-700 rounded-full p-2" />
                <h1 className="text-3xl font-bold text-white mb-2">User not found</h1>
                <p className="text-slate-400 max-w-sm">The profile you are looking for does not exist or has been deleted.</p>
            </div>
        );
    }

    if (isCreator && creatorData) {
        return (
            <div className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#050B14] pb-24 relative">
                {/* Ambient lights */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00b9f0]/10 blur-[150px] rounded-full pointer-events-none z-0" />
                <div className="absolute top-1/2 left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

                {/* Creator Banner */}
                <div className="h-[400px] sm:h-[500px] w-full relative z-10">
                    {creatorData.bannerImage ? (
                        <Image src={creatorData.bannerImage} alt="Banner" layout="fill" objectFit="cover" className="opacity-80 mix-blend-screen" />
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
                                {creatorData.profilePicture ? (
                                    <img src={creatorData.profilePicture} alt={creatorData.name} className="w-full h-full object-cover rounded-[1.8rem] relative z-10" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-6xl font-black text-white relative z-10">
                                        {creatorData.name.substring(0, 2).toUpperCase()}
                                    </div>
                                )}
                            </motion.div>

                            {/* Details */}
                            <div className="flex-1 w-full pb-2">
                                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[#00b9f0] bg-[#00b9f0]/10 px-3 py-1 rounded-full border border-[#00b9f0]/20 font-black uppercase tracking-widest text-xs">{creatorData.role || "Elite Creator"}</span>
                                        {isFollowing && <span className="text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-bold text-xs flex items-center gap-1"><Star size={12} className="fill-emerald-400"/> Following</span>}
                                    </div>
                                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-4 drop-shadow-xl">
                                        {creatorData.name}
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
                                <button 
                                    onClick={() => {
                                        // Guard: must be logged in to follow
                                        if (!currentUserId) {
                                            window.dispatchEvent(new CustomEvent('open_auth_modal', { detail: 'login' }));
                                            return;
                                        }

                                        const newState = !isFollowing;
                                        const targetFollowName = creatorData ? creatorData.name : username;
                                        const currentGlobal = Number(localStorage.getItem(`global_followers_${targetFollowName}`) || 0);

                                        setIsFollowing(newState);
                                        if(newState) {
                                            localStorage.setItem(`following_${currentUserId}_${targetFollowName}`, 'true');
                                            const newTotal = currentGlobal + 1;
                                            localStorage.setItem(`global_followers_${targetFollowName}`, String(newTotal));
                                            setGlobalFollowers(newTotal);
                                        } else {
                                            localStorage.removeItem(`following_${currentUserId}_${targetFollowName}`);
                                            const newTotal = Math.max(0, currentGlobal - 1);
                                            localStorage.setItem(`global_followers_${targetFollowName}`, String(newTotal));
                                            setGlobalFollowers(newTotal);
                                        }
                                    }}
                                    className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_0_20px_rgba(0,185,240,0.3)] hover:shadow-[0_0_30px_rgba(0,185,240,0.5)] transform hover:-translate-y-1 ${isFollowing ? 'bg-[#152a3a] text-white border border-white/10' : 'bg-gradient-to-r from-[#00b9f0] to-[#0088b0] text-[#050B14]'}`}
                                >
                                    <Star size={20} className={isFollowing ? "fill-white" : "fill-[#050B14]"} />
                                    {isFollowing ? 'Unfollow' : 'Follow Creator'}
                                </button>
                                
                                <div className="flex gap-2 justify-center w-full">
                                    {creatorData.twitchUrl && (
                                        <a href={creatorData.twitchUrl} target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-xl bg-[#0f212e] text-[#9146FF] border border-[#9146FF]/20 hover:bg-[#9146FF] hover:text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg group">
                                            <Twitch size={20} className="group-hover:scale-110 transition-transform" />
                                        </a>
                                    )}
                                    {creatorData.youtubeUrl && (
                                        <a href={creatorData.youtubeUrl} target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-xl bg-[#0f212e] text-[#FF0000] border border-[#FF0000]/20 hover:bg-[#FF0000] hover:text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg group">
                                            <Youtube size={20} className="group-hover:scale-110 transition-transform" />
                                        </a>
                                    )}
                                    {creatorData.twitterUrl && (
                                        <a href={creatorData.twitterUrl} target="_blank" rel="noreferrer" className="flex-1 h-12 rounded-xl bg-[#0f212e] text-[#1DA1F2] border border-[#1DA1F2]/20 hover:bg-[#1DA1F2] hover:text-white flex items-center justify-center transition-all hover:scale-105 shadow-lg group">
                                            <Twitter size={20} className="group-hover:scale-110 transition-transform" />
                                        </a>
                                    )}
                                    {!creatorData.twitchUrl && !creatorData.youtubeUrl && !creatorData.twitterUrl && (
                                        <div className="h-12 flex-1 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                                            No Socials
                                        </div>
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
                                        {creatorData.description || "This creator prefers to let their games do the talking."}
                                    </p>
                                </div>
                                {creatorData.skills && creatorData.skills.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><Medal size={16} className="text-[#00b9f0]"/> Specialties</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {creatorData.skills.map((skill: string) => (
                                                <span key={skill} className="bg-[#0f212e] text-slate-300 px-3 py-1.5 rounded-lg border border-white/5 font-bold text-xs">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
                                                    <p className="text-xs text-slate-400 mb-6 truncate">{game.gameDescription || `An exclusive game created by ${creatorData?.name}`}</p>
                                                    
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

    // All profiles are public, removed privacy lock screen...

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#071d2a] pb-16">
            {/* Banner Header */}
            <div className="h-64 sm:h-80 w-full bg-gradient-to-b from-[#00b9f0]/20 to-[#071d2a] border-b border-white/5 relative">
                {/* Optional decorative background pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-8 -mt-24 sm:-mt-32 relative z-10">
                <div className="bg-[#0f212e]/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl p-6 sm:p-10">

                    {/* User Info Section */}
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center sm:items-end mb-10">
                        {/* Avatar */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, type: "spring" }}
                            className="relative"
                        >
                            <div className="w-40 h-40 rounded-full bg-[#1a2c38] p-2 border-4 border-[#071d2a] shadow-xl overflow-hidden shrink-0 mt-[-80px] sm:mt-[-100px] flex items-center justify-center">
                                {profile.avatar ? (
                                    <Image src={profile.avatar} alt={profile.username} width={160} height={160} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <UserIcon size={80} className="text-[#00b9f0]" />
                                )}
                            </div>
                            {profile.isOwner && (
                                <div className="absolute bottom-2 right-2 bg-[#00b9f0] p-2 rounded-full shadow-lg border-2 border-[#0f212e]" title="This is you">
                                    <Shield size={16} className="text-[#0f212e]" />
                                </div>
                            )}
                        </motion.div>

                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                                {profile.username}
                            </h1>
                            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm font-medium">
                                <span className="flex items-center gap-1.5 text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                    <Calendar size={14} className="text-[#00b9f0]" />
                                    Joined {profile.joinDate}
                                </span>
                                {profile.email && (
                                    <span className="flex items-center gap-1.5 text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Mail size={14} className="text-[#00b9f0]" />
                                        {profile.email}
                                    </span>
                                )}
                                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                                    <Activity size={14} />
                                    Online
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Bio & Stats */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-[#1a2c38] rounded-2xl p-6 border border-white/5">
                                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <UserIcon size={18} className="text-slate-400" /> Bio
                                </h3>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    {profile.bio}
                                </p>
                            </div>

                            <div className="bg-[#1a2c38] rounded-2xl p-6 border border-white/5">
                                <h3 className="text-lg font-bold text-white mb-4">Player Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm font-medium">Games Played</span>
                                        <span className="text-white font-bold">0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm font-medium">Total Wins</span>
                                        <span className="text-emerald-400 font-bold">0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm font-medium">Favorite Game</span>
                                        <span className="text-[#00b9f0] font-bold">none</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Achievements */}
                        <div className="lg:col-span-2 space-y-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4">
                                <Trophy size={22} className="text-[#00b9f0]" />
                                Achievements
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {achievements.map((ach) => (
                                    <div key={ach.id} className="bg-[#1a2c38] rounded-2xl p-5 border border-white/5 flex gap-4 items-center group hover:bg-white/5 hover:border-white/10 transition-all">
                                        <div className={`w-14 h-14 rounded-2xl ${ach.bg} ${ach.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                            <ach.icon size={28} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-200 mb-1">{ach.title}</h4>
                                            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                                <Calendar size={12} /> Unlocked on {ach.date}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                <div className="bg-[#1a2c38]/50 rounded-2xl p-5 border border-white/5 border-dashed flex gap-4 items-center justify-center opacity-70">
                                    <p className="text-sm font-bold text-slate-500">More secrets to unlock...</p>
                                </div>
                            </div>

                            {/* Creator Games Section */}
                            {creatorGames.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                                        <GamepadIcon size={22} className="text-[#00b9f0]" />
                                        Created Games ({creatorGames.length})
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {creatorGames.map((game, idx) => (
                                            <div 
                                                key={idx} 
                                                className="bg-[#1a2c38] hover:bg-[#203645] cursor-pointer transition-colors border border-white/5 rounded-xl overflow-hidden group"
                                                onClick={() => {
                                                    const e = new CustomEvent('open_custom_game', { detail: game });
                                                    window.dispatchEvent(e);
                                                }}
                                            >
                                                <div className="aspect-[4/3] bg-gradient-to-tr from-[#0b1622] to-[#152a3a] relative flex items-center justify-center p-4">
                                                    <div className="absolute inset-0 bg-[#0b1622]/40 group-hover:bg-transparent transition-colors"></div>
                                                    <span className="text-[40px] relative z-10 group-hover:scale-110 transition-transform">
                                                        {game.assets?.icon || "🎮"}
                                                    </span>
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="text-sm font-bold text-white truncate">{game.name}</h3>
                                                    <p className="text-xs text-slate-500 font-bold uppercase track-widest flex items-center gap-1 mt-1">
                                                        <Play size={10} /> Play Now
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

