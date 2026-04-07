"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Presentation, Target, DollarSign, Activity, Gamepad2, Edit, Layers, Play, Sparkles } from 'lucide-react';
import EditCreatorModal from '@/components/EditCreatorModal';
import CreatorGameStudio from '@/components/CreatorGameStudio';
import { createClient } from '@/utils/supabase/client';

export default function CreatorStudioPage() {
    const [creatorData, setCreatorData] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'studio'>('dashboard');
    const [publishedGames, setPublishedGames] = useState<any[]>([]);

    useEffect(() => {
        const checkCreatorStatus = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                window.location.href = "/";
                return;
            }

            // Check Supabase 'creators' table
            const { data: dbCreator, error } = await supabase
                .from('creators')
                .select('*')
                .eq('id', user.id)
                .single();

            if (dbCreator) {
                // Map DB fields to UI expectations if necessary
                dbCreator.name = dbCreator.display_name;
                dbCreator.profilePicture = dbCreator.profile_picture;
                dbCreator.bannerImage = dbCreator.banner_image;
                setCreatorData(dbCreator);
            } else {
                // If not in DB, they aren't a creator yet
                window.location.href = "/become-creator";
            }
        };

        checkCreatorStatus();

        window.addEventListener('storage', checkCreatorStatus);
        return () => window.removeEventListener('storage', checkCreatorStatus);
    }, []);

    // Load published games
    useEffect(() => {
        const loadPublishedGames = () => {
            const data = localStorage.getItem('custom_published_games');
            if (data) {
                try {
                    const allGames = JSON.parse(data);
                    if (creatorData) {
                        const myGames = allGames.filter((g: any) =>
                            g.creatorId === (creatorData.id || creatorData.name) ||
                            g.creatorName === creatorData.name
                        );
                        setPublishedGames(myGames);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
        loadPublishedGames();
        window.addEventListener('storage', loadPublishedGames);
        return () => window.removeEventListener('storage', loadPublishedGames);
    }, [creatorData]);

    if (!creatorData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white bg-[#050B14]">
                <div className="w-16 h-16 border-4 border-[#00b9f0] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-bold">Loading Studio...</p>
            </div>
        );
    }

    // Mock Chart Data for Revenue & Users
    const monthlyStats = [
        { label: "Jan", revenue: 45, players: 30 },
        { label: "Feb", revenue: 65, players: 45 },
        { label: "Mar", revenue: 35, players: 35 },
        { label: "Apr", revenue: 80, players: 60 },
        { label: "May", revenue: 95, players: 80 },
        { label: "Jun", revenue: 70, players: 55 },
        { label: "Jul", revenue: 100, players: 90 }, // Current month mapping to 100% height
    ];

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050B14] relative custom-scrollbar z-0 p-6 lg:p-12 pb-32">

            {/* Ambient Backgrounds */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#00b9f0]/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row gap-6 md:items-center justify-between"
                >
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 rounded-2xl bg-[#152a3a] flex items-center justify-center text-4xl font-bold text-white border-2 border-white/10 shadow-[0_0_30px_rgba(0,185,240,0.2)] overflow-hidden">
                            {creatorData.profilePicture ? (
                                <img src={creatorData.profilePicture} className="w-full h-full object-cover" alt="Profile" />
                            ) : (
                                creatorData.name.substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00b9f0]/10 border border-[#00b9f0]/20 text-[#00b9f0] text-xs font-bold mb-2">
                                <span>Platform Partner</span>
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-1">
                                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b9f0] to-[#8adffc]">{creatorData.name}</span>!
                            </h1>
                            <p className="text-slate-400 font-medium tracking-wide">Here is an overview of your creator performance.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all hover:border-[#00b9f0]/50 hover:shadow-[0_0_20px_rgba(0,185,240,0.2)] whitespace-nowrap"
                    >
                        <Edit size={18} />
                        Edit Profile
                    </button>
                </motion.div>

                {/* Navigation Tabs */}
                <div className="flex border-b border-white/10 mb-8 pb-px">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-8 py-4 font-bold text-sm tracking-widest uppercase transition-colors relative ${activeTab === 'dashboard' ? 'text-[#00b9f0]' : 'text-slate-400 hover:text-white'}`}
                    >
                        Dashboard
                        {activeTab === 'dashboard' && (
                            <motion.div layoutId="studioTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00b9f0] shadow-[0_0_10px_#00b9f0]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('studio')}
                        className={`px-8 py-4 font-bold text-sm tracking-widest uppercase transition-colors relative flex items-center gap-2 ${activeTab === 'studio' ? 'text-purple-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Gamepad2 size={16} /> Game Studio
                        {activeTab === 'studio' && (
                            <motion.div layoutId="studioTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400 shadow-[0_0_10px_#a855f7]" />
                        )}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' ? (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-12"
                        >

                            {/* KPI Cards Grid */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6"
                            >
                                <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 relative overflow-hidden group hover:border-[#00b9f0]/40 transition-colors">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] pointer-events-none transition-all group-hover:bg-emerald-500/20"></div>
                                    <div className="flex items-center gap-4 mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <DollarSign size={24} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Est. Earnings</h3>
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-4xl font-black text-white">$12,450.00</span>
                                        <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold mt-2">
                                            <TrendingUp size={16} />
                                            <span>+14.5% this month</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none transition-all group-hover:bg-purple-500/20"></div>
                                    <div className="flex items-center gap-4 mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <Users size={24} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Players</h3>
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-4xl font-black text-white">4,821</span>
                                        <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold mt-2">
                                            <TrendingUp size={16} />
                                            <span>+420 new players</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 relative overflow-hidden group hover:border-pink-500/40 transition-colors">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-[40px] pointer-events-none transition-all group-hover:bg-pink-500/20"></div>
                                    <div className="flex items-center gap-4 mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400">
                                            <Presentation size={24} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Profile Views</h3>
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-4xl font-black text-white">18.2K</span>
                                        <div className="flex items-center gap-1 text-pink-400 text-sm font-bold mt-2">
                                            <Activity size={16} />
                                            <span>High engagement rate</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[24px] p-6 border border-white/10 relative overflow-hidden group hover:border-orange-500/40 transition-colors">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] pointer-events-none transition-all group-hover:bg-orange-500/20"></div>
                                    <div className="flex items-center gap-4 mb-4 relative z-10">
                                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                                            <Target size={24} />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Conversion</h3>
                                    </div>
                                    <div className="relative z-10">
                                        <span className="text-4xl font-black text-white">8.4%</span>
                                        <div className="flex items-center gap-1 text-emerald-400 text-sm font-bold mt-2">
                                            <TrendingUp size={16} />
                                            <span>+1.2% versus last week</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Performance Chart & Games Row */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                {/* Fake Bar Chart */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="lg:col-span-2 bg-[#0b1622]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                                >
                                    <div className="flex justify-between items-center mb-10">
                                        <div>
                                            <h2 className="text-xl font-black text-white tracking-tight">Revenue & Growth Overview</h2>
                                            <p className="text-sm text-slate-400">Monthly breakdown of your earnings vs active players generated.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#00b9f0]"></div>
                                                <span className="text-xs font-bold text-slate-300">Revenue</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                                <span className="text-xs font-bold text-slate-300">Players</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-64 flex items-end justify-between gap-4 mt-8">
                                        {monthlyStats.map((stat, idx) => (
                                            <div key={stat.label} className="flex-1 flex flex-col items-center gap-4 h-full">
                                                <div className="relative flex-1 w-full flex items-end justify-center group">
                                                    {/* Back Bar (Revenue) */}
                                                    <div
                                                        className="absolute bottom-0 w-full sm:w-12 bg-[#00b9f0] rounded-lg transition-all duration-1000 ease-out origin-bottom hover:brightness-125"
                                                        style={{ height: `${stat.revenue}%` }}
                                                    >
                                                        <div className="w-full h-full bg-white opacity-0 hover:opacity-10 transition-opacity rounded-lg"></div>
                                                    </div>
                                                    {/* Front Bar (Players) */}
                                                    <div
                                                        className="absolute bottom-0 w-full sm:w-12 bg-gradient-to-t from-purple-600 to-purple-400 rounded-lg translate-y-2 translate-x-1 opacity-90 transition-all duration-1000 ease-out origin-bottom hover:brightness-125 hover:translate-y-1"
                                                        style={{ height: `${stat.players}%` }}
                                                    >
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-400 uppercase">{stat.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 flex flex-col"
                                >
                                    <div className="w-full mb-6 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-[#00b9f0]/20 flex items-center justify-center text-[#00b9f0] border border-[#00b9f0]/30 shadow-[0_0_20px_rgba(0,185,240,0.3)] mb-4">
                                            <Gamepad2 size={32} />
                                        </div>
                                        <h2 className="text-xl font-black text-white tracking-tight">Your Games</h2>
                                        <p className="text-sm text-slate-400">{publishedGames.length > 0 ? `${publishedGames.length} game${publishedGames.length !== 1 ? 's' : ''} live in the casino` : 'Create your first game in the Game Studio!'}</p>
                                    </div>

                                    <div className="flex flex-col gap-3 w-full flex-1 justify-start overflow-y-auto custom-scrollbar max-h-[300px]">
                                        {publishedGames.length > 0 ? (
                                            publishedGames.map((game: any) => (
                                                <div key={game.id} className="relative h-20 rounded-xl overflow-hidden border border-white/10 group flex items-center px-4 gap-3 hover:border-white/20 transition-all">
                                                    {game.coverImage ? (
                                                        <img
                                                            src={game.coverImage}
                                                            alt={game.name}
                                                            className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                                                        />
                                                    ) : (
                                                        <div className="absolute inset-0 w-full h-full opacity-20" style={{ background: `linear-gradient(135deg, ${game.themeColor || '#a855f7'}40, transparent)` }} />
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-[#0f212e] via-[#0f212e]/80 to-transparent" />
                                                    <span className="relative z-10 text-2xl">{game.themeEmoji || '🎮'}</span>
                                                    <div className="relative z-10 flex-1 min-w-0">
                                                        <span className="text-sm font-black tracking-tight text-white group-hover:text-[#00b9f0] transition-colors block truncate">{game.name}</span>
                                                        <span className="text-[10px] text-slate-500">{game.type === 'ai_generated' ? '✨ AI Generated' : game.type}</span>
                                                    </div>
                                                    <div className="relative z-10 flex items-center gap-1 bg-green-500/20 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-green-500/30">
                                                        <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                                                        LIVE
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                                <div className="py-6 text-center text-slate-500 text-sm font-medium border-2 border-dashed border-white/10 rounded-xl w-full">
                                                    <Sparkles size={24} className="mx-auto text-slate-600 mb-2" />
                                                    No games yet. Open Game Studio to create one!
                                                </div>
                                                <button
                                                    onClick={() => setActiveTab('studio')}
                                                    className="mt-4 px-6 py-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all"
                                                >
                                                    Create Game
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="studio"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <CreatorGameStudio creatorData={creatorData} onGoBack={() => setActiveTab('dashboard')} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <EditCreatorModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                creatorData={creatorData}
                onSave={(updatedData) => setCreatorData(updatedData)}
            />
        </div>
    );
}
