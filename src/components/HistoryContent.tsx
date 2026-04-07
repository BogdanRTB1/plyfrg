"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, ChevronLeft, ChevronRight, Calendar, Coins, TrendingUp, History, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";
import { createClient } from "@/utils/supabase/client";

interface GameSession {
    id: string;
    game: string;
    image: string;
    time: string;
    bet: number;
    multiplier: number;
    payout: number;
    status: 'win' | 'loss';
    currency?: 'GC' | 'FC';
}

export default function HistoryContent() {
    const [filter, setFilter] = useState('all');
    const [historyData, setHistoryData] = useState<GameSession[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            setHistoryData([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('user_history')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (data) {
            const formatted: GameSession[] = data.map(session => ({
                id: session.id.substring(0, 8),
                game: session.game_name,
                image: session.game_image || '/images/game-placeholder.png',
                time: new Date(session.created_at).toLocaleString('ro-RO'),
                bet: Number(session.wagered),
                multiplier: Number(session.wagered) > 0 ? Number(session.payout) / Number(session.wagered) : 0,
                payout: Number(session.payout),
                status: session.status as 'win' | 'loss',
                currency: session.currency as 'GC' | 'FC'
            }));
            setHistoryData(formatted);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
        window.addEventListener('history_updated', fetchHistory);
        return () => window.removeEventListener('history_updated', fetchHistory);
    }, []);

    const filteredData = historyData.filter(session => {
        if (filter === 'all') return true;
        if (filter === 'wins') return session.payout > session.bet;
        if (filter === 'losses') return session.payout <= session.bet;
        if (filter === 'high-rollers') return session.bet >= 100;
        return true;
    });

    const totalWagered = historyData.reduce((acc, curr) => acc + curr.bet, 0);
    const totalPayout = historyData.reduce((acc, curr) => acc + curr.payout, 0);
    const totalProfit = totalPayout - totalWagered;

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#050505] relative">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] mix-blend-screen"></div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32 min-h-[100dvh] md:min-h-0 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
                >
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
                            <History className="text-[#00b9f0]" size={36} />
                            Game History
                        </h1>
                        <p className="text-slate-400">View and analyze your past gameplay sessions.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-[#0f212e] border border-white/5 rounded-xl p-4 flex items-center gap-4 min-w-[180px]">
                            <div className="p-3 bg-green-500/10 rounded-lg text-green-500">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Total Profit</p>
                                <div className="flex items-center gap-1.5">
                                    <p className={`text-xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
                                    </p>
                                    <ForgesCoinIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#0f212e] border border-white/5 rounded-xl p-4 flex items-center gap-4 min-w-[180px]">
                            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500">
                                <Coins size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase">Wagered</p>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xl font-bold text-white">{totalWagered.toFixed(2)}</p>
                                    <ForgesCoinIcon className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="bg-[#0f212e] border border-white/5 rounded-2xl p-4 mb-8 flex justify-between items-center">
                    <div className="flex gap-2">
                        {['all', 'wins', 'losses', 'high-rollers'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? 'bg-[#00b9f0] text-[#0f212e]' : 'bg-[#1a2c38] text-slate-400 hover:text-white'}`}
                            >
                                {f.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="bg-[#0f212e] border border-white/5 rounded-2xl overflow-hidden shadow-xl"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#1a2c38]/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Game</th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4 text-right">Wagered</th>
                                    <th className="p-4 text-right">Multiplier</th>
                                    <th className="p-4 text-right">Profit / Loss</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading history...</td></tr>
                                ) : filteredData.length > 0 ? (
                                    filteredData.map((session, idx) => (
                                        <tr key={`${session.id}-${idx}`} className="hover:bg-white/[0.04] transition-colors border-b border-white/[0.02] last:border-0 group">
                                            <td className="p-4 pl-6 font-bold text-white whitespace-nowrap">{session.game}</td>
                                            <td className="p-4 text-sm text-slate-400 whitespace-nowrap opacity-60 group-hover:opacity-100 transition-opacity">{session.time}</td>
                                            <td className="p-4 text-right text-slate-300 font-mono">
                                                {session.bet.toFixed(2)} <ForgesCoinIcon className="inline w-4 h-4 ml-1 align-sub" />
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-black tracking-tight ${session.payout > session.bet ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {session.multiplier.toFixed(2)}x
                                                </span>
                                            </td>
                                            <td className={`p-4 text-right font-black ${session.payout - session.bet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {(session.payout - session.bet).toFixed(2)} <ForgesCoinIcon className="inline w-4 h-4 ml-1 align-sub" />
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center transition-transform group-hover:scale-110">
                                                    <ShieldCheck size={18} className="text-slate-600 group-hover:text-[#00b9f0] transition-colors" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={6} className="p-12 text-center text-slate-600 italic">No game history found. Play a game to see your results!</td></tr>
                                )}

                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
