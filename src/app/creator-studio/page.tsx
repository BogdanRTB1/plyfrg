"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Presentation, Target, DollarSign, Activity, Gamepad2, Edit, Layers, Play, Sparkles, Clock, Trash2, Eye } from 'lucide-react';
import EditCreatorModal from '@/components/EditCreatorModal';
import CreatorGameStudio from '@/components/CreatorGameStudio';
import { createClient } from '@/utils/supabase/client';
import { migratePublishedGamesAssetsToSupabase } from '@/utils/publishedGamesStorage';

export default function CreatorStudioPage() {
    const [creatorData, setCreatorData] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'games' | 'finances'>('dashboard');
    const [publishedGames, setPublishedGames] = useState<any[]>([]);
    const [earnings, setEarnings] = useState<any[]>([]);
    const [gamePlays, setGamePlays] = useState<any[]>([]);
    const [profileViews, setProfileViews] = useState<any[]>([]);
    const hasMigratedAssetsRef = useRef(false);

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
                .maybeSingle();

            if (error) {
                console.error('Failed to verify creator status:', error);
                return;
            }

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
        const loadPublishedGames = async () => {
            try {
                if (!hasMigratedAssetsRef.current) {
                    await migratePublishedGamesAssetsToSupabase();
                    hasMigratedAssetsRef.current = true;
                }

                const data = localStorage.getItem('custom_published_games');
                if (!data || !creatorData) {
                    setPublishedGames([]);
                    return;
                }

                const allGames = JSON.parse(data);
                const myGames = allGames.filter((g: any) =>
                    g.creatorId === (creatorData.id || creatorData.name) ||
                    g.creatorName === creatorData.name
                );
                setPublishedGames(myGames);
            } catch (e) {
                console.error(e);
            }
        };

        const handleStorage = () => {
            void loadPublishedGames();
        };

        void loadPublishedGames();
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [creatorData]);

    // Load earnings
    useEffect(() => {
        const loadEarnings = () => {
             if (creatorData) {
                  try {
                      const data = localStorage.getItem('creator_earnings');
                      if (data) {
                          const allEarnings = JSON.parse(data);
                          const myEarnings = allEarnings.filter((e: any) => 
                              e.creatorId === (creatorData.id || creatorData.name) || 
                              e.creatorName === creatorData.name
                          );
                          setEarnings(myEarnings);
                      }
                  } catch (e) {
                      console.error(e);
                  }
             }
        };
        loadEarnings();
        window.addEventListener('storage', loadEarnings);
        return () => window.removeEventListener('storage', loadEarnings);
    }, [creatorData]);

    // Load game plays
    useEffect(() => {
        const loadGamePlays = () => {
             if (creatorData) {
                  try {
                      const data = localStorage.getItem('creator_game_plays');
                      if (data) {
                          const allPlays = JSON.parse(data);
                          const myPlays = allPlays.filter((p: any) => 
                              p.creatorId === (creatorData.id || creatorData.name)
                          );
                          setGamePlays(myPlays);
                      }
                  } catch (e) {
                      console.error(e);
                  }

                  try {
                      const vdata = localStorage.getItem('creator_profile_views');
                      if (vdata) {
                          const allViews = JSON.parse(vdata);
                          const myViews = allViews.filter((v: any) => 
                              v.creatorId === (creatorData.id || creatorData.name) || v.creatorName === creatorData.name
                          );
                          setProfileViews(myViews);
                      }
                  } catch (e) {
                      console.error(e);
                  }
             }
        };
        loadGamePlays();
        window.addEventListener('storage', loadGamePlays);
        return () => window.removeEventListener('storage', loadGamePlays);
    }, [creatorData]);

    if (!creatorData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white bg-[#050B14]">
                <div className="w-16 h-16 border-4 border-[#00b9f0] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-bold">Loading Studio...</p>
            </div>
        );
    }

    // Dynamic Chart Data for Revenue
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const thisMonthEarnings = earnings.filter(e => e.date && e.date.startsWith(currentMonthStr) && e.currency === 'FC');
    const totalThisMonth = thisMonthEarnings.reduce((acc, curr) => acc + (curr.usdValue || curr.amount * 0.90), 0);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const groupedEarnings = {} as Record<string, number>;
    earnings.forEach(e => {
        if (!e.date || e.currency !== 'FC') return;
        const monthIndex = new Date(e.date).getMonth();
        const valueInUsd = e.usdValue || e.amount * 0.90;
        groupedEarnings[months[monthIndex]] = (groupedEarnings[months[monthIndex]] || 0) + valueInUsd;
    });

    const groupedPlayers = {} as Record<string, Set<string>>;
    gamePlays.forEach(p => {
        if (!p.date) return;
        const monthIndex = new Date(p.date).getMonth();
        const monthLabel = months[monthIndex];
        if (!groupedPlayers[monthLabel]) groupedPlayers[monthLabel] = new Set();
        groupedPlayers[monthLabel].add(p.playerId);
    });

    const currentMonthIdx = new Date().getMonth();
    const startMonthIdx = Math.max(0, currentMonthIdx - 5); // display up to 6 months
    const monthlyStats = [];
    
    const fakeRevenues = [240, 180, 350, 420, 290, 385];
    const fakePlayers = [12000, 15000, 24000, 31000, 28000, 35000];
    
    for (let i = 0; i < 6; i++) {
        const monthIdx = (startMonthIdx + i) % 12;
        const rev = fakeRevenues[i];
        const pCount = fakePlayers[i];
        monthlyStats.push({
            label: months[monthIdx],
            revenue: (rev / 450) * 100, // max is 450
            players: (pCount / 40000) * 100, // max is 40k
            realRev: rev,
            realPlayers: pCount
        });
    }

    // Dynamic Active Players
    const thisMonthPlays = gamePlays.filter(p => p.date && p.date.startsWith(currentMonthStr));
    const uniquePlayersThisMonth = new Set(thisMonthPlays.map(p => p.playerId)).size;

    // Dynamic Profile Views & Conversion
    const thisMonthViews = profileViews.filter(v => v.date && v.date.startsWith(currentMonthStr));
    const viewsThisMonthCount = thisMonthViews.length;
    let conversionRate = 0;
    if (viewsThisMonthCount > 0) {
        conversionRate = (uniquePlayersThisMonth / viewsThisMonthCount) * 100;
        if (conversionRate > 100) conversionRate = 100; // Cap it gracefully for testing edge-cases
    }

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
                    <button
                        onClick={() => setActiveTab('games')}
                        className={`px-8 py-4 font-bold text-sm tracking-widest uppercase transition-colors relative flex items-center gap-2 ${activeTab === 'games' ? 'text-[#00b9f0]' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Layers size={16} /> My Games
                        {publishedGames.length > 0 && (
                            <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${activeTab === 'games' ? 'bg-[#00b9f0] text-black' : 'bg-white/10 text-white'}`}>{publishedGames.length}</span>
                        )}
                        {activeTab === 'games' && (
                            <motion.div layoutId="studioTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00b9f0] shadow-[0_0_10px_#00b9f0]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('finances')}
                        className={`px-8 py-4 font-bold text-sm tracking-widest uppercase transition-colors relative flex items-center gap-2 ${activeTab === 'finances' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <DollarSign size={16} /> Finances
                        {activeTab === 'finances' && (
                            <motion.div layoutId="studioTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_10px_#10b981]" />
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

                            {/* Shopify-Style Dashboard (1 Month View) */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="lg:col-span-2 bg-[#0b1622]/90 backdrop-blur-xl rounded-[24px] p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
                                        <div>
                                            <h2 className="text-slate-400 font-medium mb-1 text-sm">Total Revenue</h2>
                                            <div className="flex items-center gap-3">
                                                <span className="text-4xl sm:text-5xl font-black text-white">$105K</span>
                                                <span className="flex items-center text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                    <TrendingUp size={16} className="mr-1" /> 84%
                                                </span>
                                            </div>
                                        </div>
                                        <button className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-white font-bold transition-colors">
                                            <Presentation size={16} /> Report
                                        </button>
                                    </div>

                                    {/* SVG Line Chart (1 Month) */}
                                    <div className="w-full h-48 sm:h-64 relative mb-12 z-10">
                                        {/* Y-axis Labels */}
                                        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs text-slate-500 font-medium">
                                            <span>$5K</span>
                                            <span>$2.5K</span>
                                            <span>$0</span>
                                        </div>

                                        {/* Chart Container */}
                                        <div className="absolute left-12 right-0 top-2 bottom-6">
                                            {/* Horizontal Grid Lines */}
                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                                <div className="w-full h-px bg-white/5"></div>
                                                <div className="w-full h-px bg-white/5"></div>
                                                <div className="w-full h-px bg-white/5"></div>
                                            </div>

                                            <svg className="w-full h-full overflow-visible relative z-10" preserveAspectRatio="none" viewBox="0 0 1000 100">
                                                {/* Dotted Line (Previous Month) */}
                                                <path 
                                                    d="M 0 95 C 50 95, 80 80, 120 85 C 160 90, 200 40, 250 30 C 300 20, 350 95, 400 80 C 450 65, 500 50, 550 40 C 600 30, 650 60, 700 55 C 750 50, 800 80, 850 70 C 900 60, 950 85, 1000 80" 
                                                    fill="none" 
                                                    stroke="rgba(255,255,255,0.2)" 
                                                    strokeWidth="2" 
                                                    strokeDasharray="8,8" 
                                                />
                                                
                                                {/* Solid Line (Current Month) */}
                                                <path 
                                                    d="M 0 95 C 100 95, 150 70, 180 50 C 210 30, 250 20, 280 40 C 310 60, 330 10, 360 20 C 390 30, 420 80, 450 70 C 480 60, 500 40, 550 35 C 600 30, 620 60, 650 70 C 680 80, 700 30, 750 45 C 800 60, 820 40, 850 45 C 880 50, 920 90, 950 80 C 980 70, 990 95, 1000 95" 
                                                    fill="none" 
                                                    stroke="#00b9f0" 
                                                    strokeWidth="3.5" 
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="drop-shadow-[0_0_12px_rgba(0,185,240,0.6)]"
                                                />
                                            </svg>
                                        </div>

                                        {/* X-axis Labels */}
                                        <div className="absolute left-12 right-0 bottom-0 flex justify-between text-[10px] sm:text-xs text-slate-500 font-medium">
                                            <span>Apr 1</span>
                                            <span>Apr 10</span>
                                            <span>Apr 20</span>
                                            <span>Apr 30</span>
                                        </div>
                                    </div>

                                    {/* Bottom KPI Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
                                        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl p-4 border border-white/5">
                                            <h4 className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">Total Plays</h4>
                                            <div className="text-lg sm:text-xl font-black text-white mb-1">142.5K</div>
                                            <div className="text-emerald-400 text-[10px] sm:text-xs font-bold flex items-center"><TrendingUp size={12} className="mr-1"/> 37%</div>
                                        </div>
                                        <div className="bg-[#00b9f0]/10 rounded-xl p-4 border border-[#00b9f0]/30 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <h4 className="text-slate-300 text-xs sm:text-sm font-medium mb-1 truncate">Total Revenue</h4>
                                                <div className="text-lg sm:text-xl font-black text-white mb-1">$105K</div>
                                                <div className="text-emerald-400 text-[10px] sm:text-xs font-bold flex items-center"><TrendingUp size={12} className="mr-1"/> 84%</div>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl p-4 border border-white/5">
                                            <h4 className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">Active Players</h4>
                                            <div className="text-lg sm:text-xl font-black text-white mb-1">45.2K</div>
                                            <div className="text-emerald-400 text-[10px] sm:text-xs font-bold flex items-center"><TrendingUp size={12} className="mr-1"/> 60%</div>
                                        </div>
                                        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl p-4 border border-white/5">
                                            <h4 className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">Conversion</h4>
                                            <div className="text-lg sm:text-xl font-black text-white mb-1">8.68%</div>
                                            <div className="text-emerald-400 text-[10px] sm:text-xs font-bold flex items-center"><TrendingUp size={12} className="mr-1"/> 15%</div>
                                        </div>
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
                    ) : activeTab === 'finances' ? (
                        <motion.div
                            key="finances"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Payout Header */}
                            <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                                 <div>
                                      <h2 className="text-3xl font-black text-white tracking-tight">Available Balance</h2>
                                      <p className="text-slate-400 font-medium">Earnings ready for withdrawal.</p>
                                 </div>
                                 <div className="flex items-center gap-6">
                                      <span className="text-5xl font-black text-emerald-400">${totalThisMonth.toFixed(2)}</span>
                                      <button 
                                          onClick={() => {
                                              if (totalThisMonth < 100) {
                                                   alert('Minimum $100 payout is required.');
                                              } else {
                                                   alert('Withdrawal request initialized! Processing...');
                                              }
                                          }}
                                          disabled={totalThisMonth < 100}
                                          className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                      >
                                          Withdraw
                                      </button>
                                 </div>
                            </div>
                            
                            {/* TikTok Flex - My Games Earnings */}
                            <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                                {/* Ambient glow for flashiness */}
                                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>

                                <div className="flex justify-between items-end mb-8 relative z-10">
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                                            My Games Revenue
                                            <div className="flex items-center gap-2 text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div> LIVE EARNINGS
                                            </div>
                                        </h2>
                                        <p className="text-slate-400 text-sm font-medium">Lifetime revenue generated from games you've created.</p>
                                    </div>
                                </div>
                                
                                <div className="bg-[#0f212e]/90 rounded-3xl border border-white/10 overflow-hidden shadow-2xl overflow-x-auto scrollbar-hide relative z-10 backdrop-blur-md">
                                    <div className="min-w-[500px]">
                                        <div className="grid grid-cols-4 p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-white/5 bg-[#1a2c38]/80">
                                            <div className="pl-4">Game Name</div>
                                            <div>Status</div>
                                            <div className="text-right">Total Plays</div>
                                            <div className="text-right pr-4">Total Revenue</div>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {[
                                                { game: "Hype Drop", status: "Active", plays: "142,450", payout: "$ 385.50", color: "#00b9f0", emoji: "🚀" },
                                                { game: "Viral Slots", status: "Active", plays: "98,230", payout: "$ 290.00", color: "#a855f7", emoji: "🎰" },
                                                { game: "Creator Clash", status: "Active", plays: "115,800", payout: "$ 400.00", color: "#f59e0b", emoji: "🥊" },
                                                { game: "Mystery Box", status: "Active", plays: "89,120", payout: "$ 310.25", color: "#10b981", emoji: "📦" },
                                                { game: "Influencer Run", status: "Trending", plays: "155,400", payout: "$ 395.00", color: "#ec4899", emoji: "🏃" },
                                            ].map((win, i) => (
                                                <div key={i} className="grid grid-cols-4 p-5 hover:bg-white/[0.04] text-sm items-center transition-all duration-300 group">
                                                    <div className="font-black text-white flex items-center gap-4 pl-4">
                                                        <div className="w-10 h-10 rounded-xl bg-[#1a2c38] flex items-center justify-center text-xl border border-white/10 group-hover:border-white/30 transition-all shrink-0 group-hover:scale-110" style={{ boxShadow: `0 0 20px ${win.color}30` }}>
                                                            {win.emoji}
                                                        </div>
                                                        <span className="hidden sm:inline truncate max-w-[140px] text-base group-hover:text-[#00b9f0] transition-colors">{win.game}</span>
                                                    </div>
                                                    <div className="font-bold text-xs flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${win.status === 'Trending' ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'bg-emerald-500 shadow-[0_0_10px_#10b981]'}`}></div>
                                                        <span className={win.status === 'Trending' ? 'text-pink-400' : 'text-emerald-400'}>{win.status}</span>
                                                    </div>
                                                    <div className="text-right font-bold text-slate-300 text-base">{win.plays}</div>
                                                    <div className="text-right font-black pr-4 text-xl tracking-tight">
                                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                                                            {win.payout}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table Breakdown */}
                            <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/10">
                                 <h2 className="text-xl font-black text-white tracking-tight mb-6">Game Performance</h2>
                                 <div className="w-full overflow-x-auto">
                                      <table className="w-full text-left border-collapse">
                                           <thead>
                                                <tr className="border-b border-white/10">
                                                     <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Game Name</th>
                                                     <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Total Earnings</th>
                                                     <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Unique Players</th>
                                                </tr>
                                           </thead>
                                           <tbody>
                                                {publishedGames.map(game => {
                                                     const gEarn = earnings.filter(e => e.gameId === game.id);
                                                     const gTotal = gEarn.reduce((acc, curr) => acc + (curr.usdValue || curr.amount * 0.90), 0);
                                                     const gPlays = gamePlays.filter(p => p.gameId === game.id);
                                                     const gUnique = new Set(gPlays.map(p => p.playerId)).size;
                                                     return (
                                                         <tr key={game.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                              <td className="p-4 flex items-center gap-3 text-sm font-bold text-white">
                                                                   <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-lg" style={{ background: `${game.themeColor || '#00b9f0'}20` }}>
                                                                       {game.themeEmoji || '🎮'}
                                                                   </div>
                                                                   {game.name}
                                                              </td>
                                                              <td className="p-4 text-sm font-mono text-emerald-400">${gTotal.toFixed(2)}</td>
                                                              <td className="p-4 text-sm font-bold text-slate-300">{gUnique}</td>
                                                         </tr>
                                                     )
                                                })}
                                                {publishedGames.length === 0 && (
                                                     <tr>
                                                          <td colSpan={3} className="p-8 text-center text-slate-500 text-sm">No games published yet.</td>
                                                     </tr>
                                                )}
                                           </tbody>
                                      </table>
                                 </div>
                            </div>
                        </motion.div>
                    ) : activeTab === 'games' ? (
                        <motion.div
                            key="games"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Header */}
                            <div className="bg-[#0b1622]/90 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b9f0]/10 rounded-full blur-[100px] pointer-events-none" />
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-[#00b9f0]/20 flex items-center justify-center text-[#00b9f0] border border-[#00b9f0]/30">
                                            <Gamepad2 size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-black text-white tracking-tight">My Games</h2>
                                            <p className="text-slate-400 text-sm font-medium">
                                                {publishedGames.length > 0
                                                    ? `${publishedGames.length} game${publishedGames.length !== 1 ? 's' : ''} live in the casino`
                                                    : 'No games published yet. Create one in the Game Studio!'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('studio')}
                                        className="px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
                                    >
                                        <Sparkles size={16} /> Create New Game
                                    </button>
                                </div>
                            </div>

                            {/* Games Grid */}
                            {publishedGames.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                    {publishedGames.map((game: any) => (
                                        <motion.div
                                            key={game.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="group relative h-[270px] bg-[#0b1622]/90 rounded-2xl overflow-hidden border border-white/10 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl backdrop-blur-xl"
                                            style={{ boxShadow: `0 0 0 0 transparent` }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${game.themeColor || '#a855f7'}50`; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${game.themeColor || '#a855f7'}20`; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                                        >
                                            <div className="absolute inset-0 bg-[#152a3a]">
                                                {game.coverImage ? (
                                                    <img
                                                        src={game.coverImage}
                                                        alt={game.name}
                                                        className="w-full h-full object-cover transition-[filter,opacity] duration-300 ease-out group-hover:brightness-110 group-hover:opacity-95"
                                                        style={{ display: 'block' }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-5xl">{game.themeEmoji || '🎮'}</div>
                                                )}
                                            </div>

                                            <div
                                                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                                                style={{ background: `radial-gradient(120% 70% at 50% 0%, ${(game.themeColor || '#a855f7')}44 0%, transparent 70%)` }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-[#08131f]/35 to-[#0b1622] pointer-events-none" />

                                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/20 text-green-400 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/30 backdrop-blur-sm z-10">
                                                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                                LIVE
                                            </div>
                                            {game.type === 'slot_engine' && (
                                                <div className="absolute top-2 left-2 bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-1 rounded-full border border-purple-500/30 backdrop-blur-sm z-10">
                                                    🎰 SLOT
                                                </div>
                                            )}
                                            {game.type === 'crash' && (
                                                <div className="absolute top-2 left-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/30 backdrop-blur-sm z-10">
                                                    🚀 CRASH
                                                </div>
                                            )}
                                            {game.type === 'scratch' && (
                                                <div className="absolute top-2 left-2 bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/30 backdrop-blur-sm z-10">
                                                    🎟️ SCRATCH
                                                </div>
                                            )}
                                            {(game.type === 'ai_generated' || game.type === 'manual_template') && (
                                                <div className="absolute top-2 left-2 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-full border border-cyan-500/30 backdrop-blur-sm z-10">
                                                    ✨ AI
                                                </div>
                                            )}

                                            <div className="absolute inset-x-0 bottom-0 p-4 z-10">
                                                <h4 className="text-white font-black text-sm truncate mb-1">{game.name}</h4>
                                                <p className="text-slate-400 text-[11px] truncate mb-3">{game.gameDescription || 'Custom game'}</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400/90">
                                                        <Clock size={10} />
                                                        {new Date(game.publishedAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => window.dispatchEvent(new CustomEvent('open_game', { detail: game }))}
                                                            className="text-slate-600 hover:text-[#00b9f0] transition-colors p-1.5 rounded hover:bg-[#00b9f0]/10"
                                                            title="Play"
                                                        >
                                                            <Play size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Delete this game?')) {
                                                                    const data = localStorage.getItem('custom_published_games');
                                                                    if (data) {
                                                                        const allGames = JSON.parse(data);
                                                                        const filtered = allGames.filter((g: any) => g.id !== game.id);
                                                                        localStorage.setItem('custom_published_games', JSON.stringify(filtered));
                                                                        window.dispatchEvent(new Event('storage'));
                                                                    }
                                                                }
                                                            }}
                                                            className="text-slate-600 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-red-500/10"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[32px] p-16 border border-white/10 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center text-4xl mb-6 border border-white/10">🎮</div>
                                    <h3 className="text-xl font-black text-white mb-2">No Games Published Yet</h3>
                                    <p className="text-slate-400 text-sm mb-6 max-w-md">Head over to the Game Studio to create and customize your first game. Once published, it will appear here and in the Casino Lobby!</p>
                                    <button
                                        onClick={() => setActiveTab('studio')}
                                        className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold text-sm rounded-xl hover:brightness-110 transition-all shadow-lg shadow-purple-500/20"
                                    >
                                        Open Game Studio
                                    </button>
                                </div>
                            )}
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
