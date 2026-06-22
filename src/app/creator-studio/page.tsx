"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Target, DollarSign, Activity, Gamepad2, Edit, Layers, Play, Sparkles, Clock, Trash2, Eye } from 'lucide-react';
import EditCreatorModal from '@/components/EditCreatorModal';
import CreatorGameStudio from '@/components/CreatorGameStudio';
import StudioTemplateStylePicker from '@/components/StudioTemplateStylePicker';
import { createClient } from '@/utils/supabase/client';
import { deletePublishedGameById, loadPublishedGames, migratePublishedGamesAssetsToSupabase } from '@/utils/publishedGamesStorage';
import { launchGame } from '@/utils/gameLaunch';
import { toast } from 'sonner';

export default function CreatorStudioPage() {
    const [creatorData, setCreatorData] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'studio' | 'games' | 'finances'>('dashboard');
    const [publishedGames, setPublishedGames] = useState<any[]>([]);
    const [earnings, setEarnings] = useState<any[]>([]);
    const [gamePlays, setGamePlays] = useState<any[]>([]);
    const [profileViews, setProfileViews] = useState<any[]>([]);
    const hasMigratedAssetsRef = useRef(false);
    const [creatorWithdrawAmount, setCreatorWithdrawAmount] = useState('');
    const [creatorWithdrawEmail, setCreatorWithdrawEmail] = useState('');
    const [creatorWithdrawAddress, setCreatorWithdrawAddress] = useState('');
    const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

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
        const loadPublishedGamesForCreator = async () => {
            try {
                if (!hasMigratedAssetsRef.current) {
                    await migratePublishedGamesAssetsToSupabase();
                    hasMigratedAssetsRef.current = true;
                }

                const allGames = await loadPublishedGames();
                if (!allGames?.length || !creatorData) {
                    setPublishedGames([]);
                    return;
                }

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
            void loadPublishedGamesForCreator();
        };

        void loadPublishedGamesForCreator();
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [creatorData]);

    // Load earnings, game plays, and profile views from Supabase
    useEffect(() => {
        if (!creatorData) return;
        const supabase = createClient();

        const loadAnalytics = async () => {
            try {
                // Earnings
                const { data: earningsData, error: earningsErr } = await supabase
                    .from('creator_earnings')
                    .select('*')
                    .eq('creator_id', creatorData.id)
                    .order('created_at', { ascending: false });
                
                if (earningsErr) console.error('[Dashboard] Earnings load error:', earningsErr.message);
                
                setEarnings((earningsData || []).map((e: any) => ({
                    ...e,
                    gameId: e.game_id ?? e.gameId,
                    date: e.created_at,
                    currency: e.currency || 'FC',
                    amount: Number(e.profit),
                    usdValue: Number(e.profit) * 0.80,
                })));

                // Game Plays
                const { data: playsData, error: playsErr } = await supabase
                    .from('creator_game_plays')
                    .select('*')
                    .eq('creator_id', creatorData.id)
                    .order('created_at', { ascending: false });
                
                if (playsErr) console.error('[Dashboard] Plays load error:', playsErr.message);
                
                setGamePlays((playsData || []).map((p: any) => ({
                    ...p,
                    date: p.created_at,
                    playerId: p.player_id || 'anonymous',
                    gameId: p.game_id,
                })));

                // Profile Views
                const { data: viewsData, error: viewsErr } = await supabase
                    .from('creator_profile_views')
                    .select('*')
                    .eq('creator_id', creatorData.id)
                    .order('created_at', { ascending: false });
                
                if (viewsErr) console.error('[Dashboard] Views load error:', viewsErr.message);
                
                setProfileViews((viewsData || []).map((v: any) => ({
                    ...v,
                    date: v.created_at,
                })));
            } catch (e) {
                console.error('[Dashboard] Analytics load exception:', e);
            }
        };

        loadAnalytics();
    }, [creatorData]);

    if (!creatorData) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white bg-[#050B14]">
                <div className="w-16 h-16 border-4 border-[#00b9f0] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-bold">Loading Studio...</p>
            </div>
        );
    }

    // ─── Hourly Chart Data for Today ────────────────────────────────────────
    const todayStr = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
    const todayEarnings = earnings.filter(e => e.date && e.date.startsWith(todayStr) && e.currency === 'FC');
    const totalToday = todayEarnings.reduce((acc, curr) => acc + (curr.usdValue || curr.amount * 0.80), 0);

    // Group earnings and plays by hour (0-23)
    const groupedEarningsByHour = {} as Record<number, number>;
    earnings.forEach(e => {
        if (!e.date || e.currency !== 'FC' || !e.date.startsWith(todayStr)) return;
        const hour = new Date(e.date).getHours();
        const valueInUsd = e.usdValue || e.amount * 0.80;
        groupedEarningsByHour[hour] = (groupedEarningsByHour[hour] || 0) + valueInUsd;
    });

    const groupedPlayersByHour = {} as Record<number, Set<string>>;
    gamePlays.forEach(p => {
        if (!p.date || !p.date.startsWith(todayStr)) return;
        const hour = new Date(p.date).getHours();
        if (!groupedPlayersByHour[hour]) groupedPlayersByHour[hour] = new Set();
        groupedPlayersByHour[hour].add(p.playerId);
    });

    // Build hourly stats — show last 12 hour slots up to current hour
    const currentHour = new Date().getHours();
    const startHour = Math.max(0, currentHour - 11);
    const hourlyStats: { label: string; revenue: number; players: number; realRev: number; realPlayers: number }[] = [];
    for (let h = startHour; h <= currentHour; h++) {
        const rev = groupedEarningsByHour[h] || 0;
        const pCount = groupedPlayersByHour[h] ? groupedPlayersByHour[h].size : 0;
        hourlyStats.push({
            label: `${h.toString().padStart(2, '0')}:00`,
            revenue: rev,
            players: pCount,
            realRev: rev,
            realPlayers: pCount,
        });
    }

    // Dynamic Active Players (Today)
    const todayPlays = gamePlays.filter(p => p.date && p.date.startsWith(todayStr));
    const uniquePlayersToday = new Set(todayPlays.map(p => p.playerId)).size;

    // All-time aggregates
    const totalAllTimeRevenue = earnings
        .filter(e => e.currency === 'FC')
        .reduce((acc, curr) => acc + (curr.usdValue || curr.amount * 0.80), 0);
    const totalPlays = gamePlays.length;
    const uniquePlayersAllTime = new Set(gamePlays.map(p => p.playerId)).size;

    // Dynamic Profile Views & Conversion (Today)
    const todayViews = profileViews.filter(v => v.date && v.date.startsWith(todayStr));
    const viewsTodayCount = todayViews.length;
    let conversionRate = 0;
    if (viewsTodayCount > 0) {
        conversionRate = (uniquePlayersToday / viewsTodayCount) * 100;
        if (conversionRate > 100) conversionRate = 100;
    }

    const REDEEM_USD_RATE = 0.8;
    const availableCreatorFc = earnings
        .filter((e: any) => e.currency === 'FC')
        .reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
    const availableCreatorUsd = availableCreatorFc * REDEEM_USD_RATE;

    const gameRevenueRows = publishedGames.map((game: any) => {
        const gEarn = earnings.filter((e: any) => e.gameId === game.id && e.currency === 'FC');
        const gRevenueFc = gEarn.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
        const gRevenueUsd = gEarn.reduce((acc: number, curr: any) => acc + Number(curr.usdValue || (Number(curr.amount || 0) * REDEEM_USD_RATE)), 0);
        const gPlays = gamePlays.filter((p: any) => p.gameId === game.id);
        const gUnique = new Set(gPlays.map((p: any) => p.playerId)).size;
        return {
            id: game.id,
            name: game.name,
            emoji: game.themeEmoji || '🎮',
            color: game.themeColor || '#00b9f0',
            plays: gPlays.length,
            uniquePlayers: gUnique,
            revenueFc: gRevenueFc,
            revenueUsd: gRevenueUsd,
            status: gPlays.length > 0 ? 'Active' : 'Idle',
        };
    }).sort((a, b) => b.revenueUsd - a.revenueUsd);

    const handleCreatorWithdrawal = async () => {
        const fcAmount = Number(creatorWithdrawAmount);
        const email = creatorWithdrawEmail.trim().toLowerCase();
        const btcAddress = creatorWithdrawAddress.trim();
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValid) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (!btcAddress) {
            toast.error('Please enter your BTC wallet address');
            return;
        }
        if (Number.isNaN(fcAmount) || fcAmount < 10) {
            toast.error('Minimum withdrawal is 10 FC');
            return;
        }
        if (fcAmount > availableCreatorFc) {
            toast.error('Insufficient creator earnings balance');
            return;
        }

        setIsSubmittingWithdraw(true);
        try {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Please log in first');
                setIsSubmittingWithdraw(false);
                return;
            }

            const res = await fetch('/api/creator/withdrawal-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    amountFc: fcAmount,
                    email,
                    address: btcAddress,
                    currency: 'btc',
                }),
            });
            const payload = await res.json();
            if (!res.ok || !payload.success) {
                toast.error(payload.error || 'Failed to submit creator withdrawal request');
                setIsSubmittingWithdraw(false);
                return;
            }

            toast.success('Withdrawal request submitted. It is now visible in Admin Redeems.');
            setCreatorWithdrawAmount('');
            setCreatorWithdrawEmail('');
            setCreatorWithdrawAddress('');
        } catch (e) {
            console.error(e);
            toast.error('Failed to submit creator withdrawal request');
        }
        setIsSubmittingWithdraw(false);
    };

    return (
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden bg-[#050B14] relative custom-scrollbar z-0 p-4 sm:p-6 lg:p-12 pb-32">

            {/* Ambient Backgrounds */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#00b9f0]/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header Profile Section */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-center justify-between"
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

                {/* Navigation: mobile template-style picker + desktop tabs */}
                <StudioTemplateStylePicker
                    className="mb-6"
                    fieldLabel="Workspace"
                    value={activeTab}
                    onChange={(id) => setActiveTab(id as typeof activeTab)}
                    options={[
                        { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={16} /> },
                        { id: 'studio', label: 'Game Studio', icon: <Gamepad2 size={16} /> },
                        {
                            id: 'games',
                            label: publishedGames.length > 0 ? `My Games (${publishedGames.length})` : 'My Games',
                            icon: <Layers size={16} />,
                        },
                        { id: 'finances', label: 'Finances', icon: <DollarSign size={16} /> },
                    ]}
                />
                <div className="hidden md:flex overflow-x-auto border-b border-white/10 mb-8 pb-px custom-scrollbar">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-5 sm:px-8 py-4 font-bold text-sm tracking-widest uppercase transition-colors relative whitespace-nowrap ${activeTab === 'dashboard' ? 'text-[#00b9f0]' : 'text-slate-400 hover:text-white'}`}
                    >
                        Dashboard
                        {activeTab === 'dashboard' && (
                            <motion.div layoutId="studioTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00b9f0] shadow-[0_0_10px_#00b9f0]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('studio')}
                        className={`px-5 sm:px-8 py-4 font-bold text-sm tracking-widest uppercase transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'studio' ? 'text-purple-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Gamepad2 size={16} /> Game Studio
                        {activeTab === 'studio' && (
                            <motion.div layoutId="studioTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400 shadow-[0_0_10px_#a855f7]" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('games')}
                        className={`px-5 sm:px-8 py-4 font-bold text-sm tracking-widest uppercase transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'games' ? 'text-[#00b9f0]' : 'text-slate-400 hover:text-white'}`}
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
                        className={`px-5 sm:px-8 py-4 font-bold text-sm tracking-widest uppercase transition-colors relative flex items-center gap-2 whitespace-nowrap ${activeTab === 'finances' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
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
                                                <span className="text-4xl sm:text-5xl font-black text-white">${totalAllTimeRevenue < 1000 ? totalAllTimeRevenue.toFixed(2) : (totalAllTimeRevenue / 1000).toFixed(1) + 'K'}</span>
                                                {totalAllTimeRevenue > 0 && (
                                                    <span className="flex items-center text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                        <TrendingUp size={16} className="mr-1" /> Live
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* SVG Bar Chart + Cumulative Profit Line (Hourly — Today) */}
                                    {(() => {
                                        // Pre-compute cumulative revenue for the line
                                        const cumulativeRevenue: number[] = [];
                                        let runningTotal = 0;
                                        hourlyStats.forEach(s => {
                                            runningTotal += s.realRev;
                                            cumulativeRevenue.push(runningTotal);
                                        });
                                        const maxCumulative = Math.max(...cumulativeRevenue, 0.01);
                                        const maxRev = Math.max(...hourlyStats.map(s => s.realRev), 1);
                                        const barCount = hourlyStats.length || 1;

                                        return (
                                            <div className="w-full h-48 sm:h-64 relative mb-6 z-10">
                                                {/* Bars */}
                                                <div className="absolute left-0 right-0 top-0 bottom-6 flex items-end gap-2 sm:gap-4 px-2">
                                                    {hourlyStats.map((stat, i) => {
                                                        const heightPct = (stat.realRev / maxRev) * 85;
                                                        return (
                                                            <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group">
                                                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#00b9f0] text-black text-[9px] font-black px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                                                    ${stat.realRev.toFixed(2)} | {stat.realPlayers} players
                                                                </div>
                                                                <div
                                                                    className="w-full rounded-t-lg transition-all duration-500 relative overflow-hidden"
                                                                    style={{
                                                                        height: `${Math.max(heightPct, 2)}%`,
                                                                        background: 'linear-gradient(180deg, #00b9f0, #0078a0)',
                                                                        boxShadow: stat.realRev > 0 ? '0 0 12px rgba(0,185,240,0.3)' : 'none',
                                                                    }}
                                                                >
                                                                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Cumulative Profit Line Overlay */}
                                                {maxCumulative > 0 && (
                                                    <svg
                                                        className="absolute left-0 right-0 top-0 bottom-6 pointer-events-none"
                                                        viewBox={`0 0 ${barCount * 100} 100`}
                                                        preserveAspectRatio="none"
                                                        style={{ width: '100%', height: 'calc(100% - 24px)', padding: '0 8px' }}
                                                    >
                                                        {/* Gradient fill under the line */}
                                                        <defs>
                                                            <linearGradient id="profitLineGrad" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
                                                                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>
                                                        {/* Area fill */}
                                                        <polygon
                                                            points={
                                                                cumulativeRevenue.map((val, i) => {
                                                                    const x = (i + 0.5) * (barCount * 100 / barCount);
                                                                    const y = 100 - (val / maxCumulative) * 85;
                                                                    return `${x},${y}`;
                                                                }).join(' ') +
                                                                ` ${barCount * 100},100 0,100`
                                                            }
                                                            fill="url(#profitLineGrad)"
                                                        />
                                                        {/* The line itself */}
                                                        <polyline
                                                            points={cumulativeRevenue.map((val, i) => {
                                                                const x = (i + 0.5) * (barCount * 100 / barCount);
                                                                const y = 100 - (val / maxCumulative) * 85;
                                                                return `${x},${y}`;
                                                            }).join(' ')}
                                                            fill="none"
                                                            stroke="#a855f7"
                                                            strokeWidth="2.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            vectorEffect="non-scaling-stroke"
                                                        />
                                                        {/* Dots at each data point */}
                                                        {cumulativeRevenue.map((val, i) => {
                                                            const x = (i + 0.5) * (barCount * 100 / barCount);
                                                            const y = 100 - (val / maxCumulative) * 85;
                                                            return (
                                                                <circle
                                                                    key={i}
                                                                    cx={x}
                                                                    cy={y}
                                                                    r="4"
                                                                    fill="#a855f7"
                                                                    stroke="#0b1622"
                                                                    strokeWidth="2"
                                                                    vectorEffect="non-scaling-stroke"
                                                                />
                                                            );
                                                        })}
                                                    </svg>
                                                )}

                                                {/* Cumulative total label */}
                                                {maxCumulative > 0 && (
                                                    <div className="absolute top-2 right-3 bg-purple-500/15 border border-purple-500/30 rounded-lg px-3 py-1.5 flex items-center gap-2 z-20">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.6)]" />
                                                        <span className="text-[10px] font-bold text-purple-300">Cumulative: ${runningTotal.toFixed(2)}</span>
                                                    </div>
                                                )}

                                                {/* X-axis Labels — stagger on tiny screens so hours do not overlap */}
                                                <div className="absolute bottom-0 left-0 right-0 flex px-1 sm:px-2">
                                                    {hourlyStats.map((stat, i) => {
                                                        const bc = hourlyStats.length || 1;
                                                        const tickStep = bc <= 6 ? 1 : bc <= 12 ? 3 : 4;
                                                        const showOnMobile = i % tickStep === 0 || i === bc - 1;
                                                        return (
                                                            <span key={i} className="flex min-w-0 flex-1 justify-center">
                                                                <span
                                                                    className={`text-center text-[9px] font-medium text-slate-500 sm:text-xs ${showOnMobile ? "" : "max-sm:invisible"}`}
                                                                >
                                                                    {stat.label}
                                                                </span>
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Bottom KPI Cards */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
                                        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl p-4 border border-white/5">
                                            <h4 className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">Total Plays</h4>
                                            <div className="text-lg sm:text-xl font-black text-white mb-1">{totalPlays.toLocaleString()}</div>
                                            <div className="text-slate-500 text-[10px] sm:text-xs font-bold">All time</div>
                                        </div>
                                        <div className="bg-[#00b9f0]/10 rounded-xl p-4 border border-[#00b9f0]/30 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <h4 className="text-slate-300 text-xs sm:text-sm font-medium mb-1 truncate">Today</h4>
                                                <div className="text-lg sm:text-xl font-black text-white mb-1">${totalToday < 1000 ? totalToday.toFixed(2) : (totalToday / 1000).toFixed(1) + 'K'}</div>
                                                <div className="text-[#00b9f0] text-[10px] sm:text-xs font-bold">{new Date().toLocaleDateString('default', { month: 'short', day: 'numeric' })}</div>
                                            </div>
                                        </div>
                                        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl p-4 border border-white/5">
                                            <h4 className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">Active Players</h4>
                                            <div className="text-lg sm:text-xl font-black text-white mb-1">{uniquePlayersAllTime.toLocaleString()}</div>
                                            <div className="text-slate-500 text-[10px] sm:text-xs font-bold">Unique players</div>
                                        </div>
                                        <div className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-xl p-4 border border-white/5">
                                            <h4 className="text-slate-400 text-xs sm:text-sm font-medium mb-1 truncate">Conversion</h4>
                                            <div className="text-lg sm:text-xl font-black text-white mb-1">{conversionRate > 0 ? conversionRate.toFixed(1) + '%' : '—'}</div>
                                            <div className="text-slate-500 text-[10px] sm:text-xs font-bold">Views → Plays</div>
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
                            <div className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 relative overflow-hidden">
                                 <div>
                                      <h2 className="text-3xl font-black text-white tracking-tight">Available Balance</h2>
                                      <p className="text-slate-400 font-medium">Earnings ready for withdrawal.</p>
                                 </div>
                                 <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                                          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300">Balance</p>
                                          <p className="mt-1 text-4xl font-black text-emerald-400">{availableCreatorFc.toFixed(2)} FC</p>
                                          <p className="text-sm text-emerald-200/80">~ ${availableCreatorUsd.toFixed(2)} USD at $0.80/FC</p>
                                      </div>
                                      <div className="space-y-3">
                                          <input
                                              type="number"
                                              min="10"
                                              step="0.01"
                                              value={creatorWithdrawAmount}
                                              onChange={(e) => setCreatorWithdrawAmount(e.target.value)}
                                              placeholder="Withdrawal amount (FC)"
                                              className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                          />
                                          <input
                                              type="email"
                                              value={creatorWithdrawEmail}
                                              onChange={(e) => setCreatorWithdrawEmail(e.target.value)}
                                              placeholder="Contact email"
                                              className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                          />
                                          <input
                                              type="text"
                                              value={creatorWithdrawAddress}
                                              onChange={(e) => setCreatorWithdrawAddress(e.target.value)}
                                              placeholder="BTC wallet address"
                                              className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                          />
                                          <button
                                              onClick={handleCreatorWithdrawal}
                                              disabled={isSubmittingWithdraw || !creatorWithdrawAmount || !creatorWithdrawEmail || !creatorWithdrawAddress || Number(creatorWithdrawAmount) < 10}
                                              className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest rounded-xl transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                          >
                                              {isSubmittingWithdraw ? 'Submitting...' : 'Submit Withdrawal'}
                                          </button>
                                      </div>
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
                                            {gameRevenueRows.map((win, i) => (
                                                <div key={win.id || i} className="grid grid-cols-4 p-5 hover:bg-white/[0.04] text-sm items-center transition-all duration-300 group">
                                                    <div className="font-black text-white flex items-center gap-4 pl-4">
                                                        <div className="w-10 h-10 rounded-xl bg-[#1a2c38] flex items-center justify-center text-xl border border-white/10 group-hover:border-white/30 transition-all shrink-0 group-hover:scale-110" style={{ boxShadow: `0 0 20px ${win.color}30` }}>
                                                            {win.emoji}
                                                        </div>
                                                        <span className="hidden sm:inline truncate max-w-[140px] text-base group-hover:text-[#00b9f0] transition-colors">{win.name}</span>
                                                    </div>
                                                    <div className="font-bold text-xs flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${win.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-slate-500'}`}></div>
                                                        <span className={win.status === 'Active' ? 'text-emerald-400' : 'text-slate-400'}>{win.status}</span>
                                                    </div>
                                                    <div className="text-right font-bold text-slate-300 text-base">{win.plays.toLocaleString()}</div>
                                                    <div className="text-right font-black pr-4 text-xl tracking-tight">
                                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.6)]">
                                                            ${win.revenueUsd.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {gameRevenueRows.length === 0 && (
                                                <div className="p-8 text-center text-slate-500 text-sm">No game revenue yet.</div>
                                            )}
                                        </div>
                                    </div>
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
                                            {game.type === 'wheel' && (
                                                <div className="absolute top-2 left-2 bg-rose-500/20 text-rose-400 text-[10px] font-bold px-2 py-1 rounded-full border border-rose-500/30 backdrop-blur-sm z-10">
                                                    🎡 WHEEL
                                                </div>
                                            )}
                                            {game.type === 'mines' && (
                                                <div className="absolute top-2 left-2 bg-orange-500/20 text-orange-400 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-500/30 backdrop-blur-sm z-10">
                                                    💣 MINES
                                                </div>
                                            )}
                                            {game.type === 'case' && (
                                                <div className="absolute top-2 left-2 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded-full border border-indigo-500/30 backdrop-blur-sm z-10">
                                                    📦 CASE
                                                </div>
                                            )}
                                            {game.type === 'hilo' && (
                                                <div className="absolute top-2 left-2 bg-sky-500/20 text-sky-400 text-[10px] font-bold px-2 py-1 rounded-full border border-sky-500/30 backdrop-blur-sm z-10">
                                                    🃏 HI-LO
                                                </div>
                                            )}
                                            {game.type === 'blackjack' && (
                                                <div className="absolute top-2 left-2 bg-teal-500/20 text-teal-400 text-[10px] font-bold px-2 py-1 rounded-full border border-teal-500/30 backdrop-blur-sm z-10">
                                                    🂡 BJ
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
                                                            onClick={() => launchGame(game)}
                                                            className="text-slate-600 hover:text-[#00b9f0] transition-colors p-1.5 rounded hover:bg-[#00b9f0]/10"
                                                            title="Play"
                                                        >
                                                            <Play size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                if (confirm('Delete this game?')) {
                                                                    void deletePublishedGameById(game.id).then(() => {
                                                                        window.dispatchEvent(new Event('storage'));
                                                                    });
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
