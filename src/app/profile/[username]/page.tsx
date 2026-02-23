"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User as UserIcon, Calendar, Trophy, Medal, Star, Shield, Lock, Activity, Mail } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function ProfilePage() {
    const params = useParams();
    const username = decodeURIComponent(params.username as string);
    const supabase = createClient();

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // This simulates finding the user. 
    // Usually, you need a public 'profiles' table in Supabase 
    // since auth.users cannot be queried directly from the frontend.
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // First, check if there's a logged-in user to see their own profile
                const { data: { user } } = await supabase.auth.getUser();

                // If it's the current user searching their own username
                const currentUserUsername = user?.user_metadata?.full_name || user?.email?.split('@')[0];

                if (currentUserUsername && currentUserUsername.toLowerCase() === username.toLowerCase()) {
                    setProfile({
                        username: currentUserUsername,
                        avatar: user?.user_metadata?.avatar_url,
                        bio: user?.user_metadata?.bio || "No bio yet.",
                        visibility: user?.user_metadata?.profile_visibility || 'public',
                        email: user?.user_metadata?.show_email ? user?.email : null,
                        joinDate: new Date(user?.created_at as string).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                        isOwner: true
                    });
                } else {
                    // MOCK INTERFACE: For demonstration until a 'profiles' SQL table is built in Supabase
                    // Ideally here you do: await supabase.from('profiles').select('*').eq('username', username).single()

                    // Simulated random data for demo
                    setProfile({
                        username: username,
                        avatar: null,
                        bio: `Hi, I'm ${username} and I love playing games on PlayForges!`,
                        visibility: 'public', // Set to private to test private view
                        email: null,
                        joinDate: 'February 2026',
                        isOwner: false
                    });
                }
            } catch (err: any) {
                setError("Could not load profile.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username, supabase]);

    const achievements = [
        { id: 1, title: 'First Win', icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/10', date: 'Feb 10, 2026' },
        { id: 2, title: 'High Roller', icon: Star, color: 'text-purple-400', bg: 'bg-purple-400/10', date: 'Feb 15, 2026' },
        { id: 3, title: 'Jackpot Hunter', icon: Medal, color: 'text-[#00b9f0]', bg: 'bg-[#00b9f0]/10', date: 'Feb 20, 2026' },
    ];

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

    if (profile.visibility === 'private' && !profile.isOwner) {
        return (
            <div className="min-h-screen bg-[#071d2a] pt-24 px-4 sm:px-8 pb-12">
                <div className="max-w-4xl mx-auto mt-20 text-center">
                    <div className="bg-[#0f212e] rounded-3xl p-12 border border-white/5 relative overflow-hidden">
                        <Lock size={64} className="text-slate-600 mx-auto mb-6 opacity-50" />
                        <h1 className="text-3xl font-bold text-white mb-2">This profile is private</h1>
                        <p className="text-slate-400 max-w-md mx-auto">
                            {username} has chosen to keep their profile hidden from the public.
                        </p>
                    </div>
                </div>
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
                            <div className="w-40 h-40 rounded-full bg-[#1a2c38] p-2 rounded-full border-4 border-[#071d2a] shadow-xl overflow-hidden shrink-0 mt-[-80px] sm:mt-[-100px] flex items-center justify-center">
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
                                        <span className="text-white font-bold">1,204</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm font-medium">Total Wins</span>
                                        <span className="text-emerald-400 font-bold">458</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm font-medium">Favorite Game</span>
                                        <span className="text-[#00b9f0] font-bold">Crypto Slots</span>
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
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
