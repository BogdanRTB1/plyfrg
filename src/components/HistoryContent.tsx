"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Download, ChevronLeft, ChevronRight, Calendar, Gamepad2, Coins, TrendingUp, History, ShieldCheck } from "lucide-react";
import Image from "next/image";

interface GameSession {
    id: string;
    game: string;
    image: string;
    time: string;
    bet: number;
    multiplier: number;
    payout: number;
    status: 'win' | 'loss';
    provablyFair: string;
}

export default function HistoryContent() {
    const [filter, setFilter] = useState('all');

    // Mock Data
    const historyData: GameSession[] = [
        { id: "bet_29384", game: "Plinko", image: "/images/game-plinko.png", time: "2 mins ago", bet: 50.00, multiplier: 130.00, payout: 6500.00, status: 'win', provablyFair: "Verify" },
        { id: "bet_29383", game: "Crash", image: "/images/game-crash.png", time: "15 mins ago", bet: 25.00, multiplier: 1.00, payout: 0.00, status: 'loss', provablyFair: "Verify" },
        { id: "bet_29382", game: "Slots", image: "/images/game-slots.png", time: "1 hour ago", bet: 10.00, multiplier: 5.50, payout: 55.00, status: 'win', provablyFair: "Verify" },
        { id: "bet_29381", game: "Roulette", image: "/images/game-roulette.png", time: "3 hours ago", bet: 100.00, multiplier: 0.00, payout: 0.00, status: 'loss', provablyFair: "Verify" },
        { id: "bet_29380", game: "Mines", image: "/images/game-mines.png", time: "5 hours ago", bet: 20.00, multiplier: 2.45, payout: 49.00, status: 'win', provablyFair: "Verify" },
        { id: "bet_29379", game: "Plinko", image: "/images/game-plinko.png", time: "8 hours ago", bet: 50.00, multiplier: 0.20, payout: 10.00, status: 'loss', provablyFair: "Verify" },
        { id: "bet_29378", game: "Blackjack", image: "/images/game-blackjack.png", time: "1 day ago", bet: 200.00, multiplier: 2.00, payout: 400.00, status: 'win', provablyFair: "Verify" },
        { id: "bet_29377", game: "Crash", image: "/images/game-crash.png", time: "1 day ago", bet: 30.00, multiplier: 1.10, payout: 33.00, status: 'win', provablyFair: "Verify" },
        { id: "bet_29376", game: "Slots", image: "/images/game-slots.png", time: "2 days ago", bet: 15.00, multiplier: 0.00, payout: 0.00, status: 'loss', provablyFair: "Verify" },
        { id: "bet_29375", game: "Mines", image: "/images/game-mines.png", time: "2 days ago", bet: 25.00, multiplier: 5.00, payout: 125.00, status: 'win', provablyFair: "Verify" },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#050505] relative">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] mix-blend-screen"></div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32 min-h-[100dvh] md:min-h-0 relative z-10">
                {/* Header Section */}
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

                    <div className="w-full grid grid-cols-2 md:flex gap-3 md:gap-4 md:w-auto">
                        <div className="bg-[#0f212e] border border-white/5 rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-4 md:min-w-[200px] overflow-hidden">
                            <div className="p-2 md:p-3 bg-green-500/10 rounded-lg text-green-500 shrink-0">
                                <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase truncate">Total Profit</p>
                                <p className="text-sm md:text-xl font-bold text-white truncate">+$4,250.50</p>
                            </div>
                        </div>
                        <div className="bg-[#0f212e] border border-white/5 rounded-xl p-3 md:p-4 flex items-center gap-2 md:gap-4 md:min-w-[200px] overflow-hidden">
                            <div className="p-2 md:p-3 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
                                <Coins className="w-5 h-5 md:w-6 md:h-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase truncate">Wagered</p>
                                <p className="text-sm md:text-xl font-bold text-white truncate">$12,450.00</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Filters & Controls */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="bg-[#0f212e] border border-white/5 rounded-2xl p-4 mb-8 flex flex-col md:flex-row justify-between gap-4"
                >
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                        {['all', 'wins', 'losses', 'high-rollers'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize whitespace-nowrap transition-all ${filter === f
                                    ? 'bg-[#00b9f0] text-[#0f212e] shadow-[0_0_15px_rgba(0,185,240,0.3)]'
                                    : 'bg-[#1a2c38] text-slate-400 hover:text-white hover:bg-[#2f4553]'
                                    }`}
                            >
                                {f.replace('-', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00b9f0] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search by game or ID..."
                                className="w-full bg-[#1a2c38] border border-white/5 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00b9f0] transition-all"
                            />
                        </div>
                        <button className="p-2 bg-[#1a2c38] hover:bg-[#2f4553] text-slate-400 hover:text-white rounded-lg border border-white/5 transition-colors">
                            <Filter size={20} />
                        </button>
                        <button className="p-2 bg-[#1a2c38] hover:bg-[#2f4553] text-slate-400 hover:text-white rounded-lg border border-white/5 transition-colors">
                            <Download size={20} />
                        </button>
                    </div>
                </motion.div>

                {/* Data Table */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="bg-[#0f212e] border border-white/5 rounded-2xl overflow-hidden shadow-xl"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#1a2c38]/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-white/5">
                                    <th className="p-4 pl-6">Game</th>
                                    <th className="p-4">Time</th>
                                    <th className="p-4 text-right">Bet Amount</th>
                                    <th className="p-4 text-right">Multiplier</th>
                                    <th className="p-4 text-right">Payout</th>
                                    <th className="p-4 text-center">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {historyData.map((session, index) => (
                                    <motion.tr
                                        key={session.id}
                                        variants={item}
                                        className="hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#1a2c38] rounded-lg p-1.5 border border-white/5 group-hover:border-[#00b9f0]/30 transition-colors">
                                                    <Image src={session.image} alt={session.game} width={40} height={40} className="w-full h-full object-contain" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-sm">{session.game}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{session.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-400 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="opacity-50" />
                                                {session.time}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right font-medium text-slate-300">
                                            ${session.bet.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${session.multiplier >= 1
                                                ? 'bg-[#00b9f0]/10 text-[#00b9f0]'
                                                : 'bg-slate-700/30 text-slate-500'
                                                }`}>
                                                {session.multiplier.toFixed(2)}x
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold">
                                            <span className={session.payout > 0 ? 'text-green-500' : 'text-slate-500'}>
                                                {session.payout > 0 ? '+' : ''}${session.payout.toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button className="text-xs font-medium text-slate-500 hover:text-white hover:underline transition-colors flex items-center justify-center gap-1 mx-auto">
                                                <ShieldCheck size={12} />
                                                Verify
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-white/5 flex items-center justify-between">
                        <p className="text-sm text-slate-500">Showing <span className="text-white font-bold">1-10</span> of <span className="text-white font-bold">128</span> results</p>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-lg bg-[#1a2c38] hover:bg-[#2f4553] text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeft size={16} />
                            </button>
                            <button className="p-2 rounded-lg bg-[#1a2c38] hover:bg-[#2f4553] text-slate-400 hover:text-white transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}


