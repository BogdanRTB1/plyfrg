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

                // Find if this user is a creator via Supabase
                const { data: dbCreator, error: creatorErr } = await supabase
                    .from('creators')
                    .select('*')
                    .ilike('display_name', username)
                    .single();

                let foundCreator = dbCreator;

                if (!foundCreator && publicProfile) {
                    const { data: byId } = await supabase
                        .from('creators')
                        .select('*')
                        .eq('id', publicProfile.id)
                        .single();
                    foundCreator = byId;
                }

                if (foundCreator) {
                    setIsCreator(true);
                    setCreatorData(foundCreator);
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
                            const matchCreatorName = foundCreator && g.creatorName?.toLowerCase() === foundCreator.display_name?.toLowerCase();
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
                    } else if (foundCreator) {
                        // If it's a creator but not a standard profile name, redirect to the correct creator route
                        window.location.href = `/creators/${encodeURIComponent(username)}`;
                        return;
                    } else {
                        setProfile(null);
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

    if (!profile) {
        return (
            <div className="min-h-screen bg-[#071d2a] flex flex-col items-center justify-center p-8 text-center">
                <UserIcon size={64} className="text-slate-600 mb-6 border-4 border-slate-700 rounded-full p-2" />
                <h1 className="text-3xl font-bold text-white mb-2">User not found</h1>
                <p className="text-slate-400 max-w-sm">The profile you are looking for does not exist or has been deleted.</p>
            </div>
        );
    }

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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                    {profile.username}
                                </h1>
                                {isCreator && creatorData && (
                                    <button 
                                        onClick={() => window.location.href = `/creators/${encodeURIComponent(creatorData.display_name || creatorData.name || username)}`}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <Star size={16} />
                                        Visit Creator Page
                                    </button>
                                )}

                            </div>

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

