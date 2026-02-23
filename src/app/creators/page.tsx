"use client";

import { Search, Edit, User, Globe, Trophy } from "lucide-react";

// Enhanced mock data to match the detailed card structure
const creators = [
    {
        id: 1,
        name: "AlexGaming",
        role: "Streamer & Content Creator",
        email: "alex@playforges.com",
        followers: "24.5K",
        description: "Passionate about high volatility slots and sharing big wins with the community. Streaming daily at 8 PM.",
        skills: ["Slots", "Blackjack", "Live Casino"],
        games: 12,
        featured: true
    },
    {
        id: 2,
        name: "SlotMaster",
        role: "Pro Gambler",
        followers: "18.2K",
        description: "Hunting for the max win. I analyze RTP and volatility distributions.",
        skills: ["Analytics", "Strategy", "Poker"],
        games: 8
    },
    {
        id: 3,
        name: "CryptoKing",
        role: "Crypto Enthusiast",
        followers: "12.9K",
        description: "Only playing with crypto. Fast deposits, instant withdrawals.",
        skills: ["Crypto", "Blockchain", "High Stakes"],
        games: 15
    },
    {
        id: 4,
        name: "LuckyCharm",
        role: "Casual Player",
        followers: "9.8K",
        description: "Just here for the fun times and vibes. Let's spin together!",
        skills: ["Community", "Fun", "Slots"],
        games: 5
    },
    {
        id: 5,
        name: "SpinDoctor",
        role: "Slot Reviewer",
        followers: "8.5K",
        description: "I review every new slot release so you don't have to.",
        skills: ["Reviews", "Journalism", "Critique"],
        games: 20
    },
    {
        id: 6,
        name: "JackpotJane",
        role: "High Roller",
        followers: "7.2K",
        description: "Chasing the biggest jackpots across all providers.",
        skills: ["Jackpots", "Progressive", "VIP"],
        games: 7
    },
];

export default function CreatorsPage() {
    const featuredCreator = creators[0];
    const otherCreators = creators.slice(1);

    return (
        <div className="p-8 pb-32">

            {/* Header Text */}
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold mb-2 text-white">
                    Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b9f0] to-white">Creators</span>
                </h1>
                <p className="text-slate-400">Manage your profile and showcase your best work.</p>
            </div>

            {/* Featured Profile Card */}
            <div className="bg-[#0f212e] rounded-3xl p-8 mb-16 border border-white/5 relative overflow-hidden group shadow-2xl">
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#00b9f0]/10 blur-[100px] rounded-full pointer-events-none -mr-20 -mt-20"></div>

                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                    {/* Left Column: Avatar & Basic Info */}
                    <div className="flex-shrink-0 flex flex-col gap-4">
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-full bg-[#1a2c38] flex items-center justify-center text-3xl font-bold text-[#00b9f0] border-2 border-[#2f4553] shadow-lg">
                                {featuredCreator.name.substring(0, 1)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{featuredCreator.name}</h2>
                                <p className="text-[#00b9f0] text-sm font-medium">{featuredCreator.email}</p>
                                <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-bold">{featuredCreator.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 md:mt-0">
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">About Me</h3>
                            <p className="text-slate-300 leading-relaxed text-sm">
                                {featuredCreator.description}
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {featuredCreator.skills.map(skill => (
                                    <span key={skill} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-[#00b9f0] font-medium hover:bg-white/10 transition cursor-default">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-8 right-8 hidden md:block">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition">
                            <Edit size={14} />
                            <span>Follow Profile</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Discovery Section */}
            <div className="mb-6 flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Discover Similar Minds</h2>
                <span className="px-3 py-1 rounded-full bg-[#00b9f0]/10 border border-[#00b9f0]/20 text-xs text-[#00b9f0] font-medium">
                    Based on your skills
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherCreators.map((creator) => (
                    <div key={creator.id} className="bg-[#0f212e] rounded-2xl p-6 border border-white/5 hover:border-[#00b9f0]/20 transition-all duration-300 group flex flex-col h-full hover:-translate-y-1 hover:shadow-xl">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-[#1a2c38] flex items-center justify-center text-lg font-bold text-white flex-shrink-0 border border-white/10">
                                {creator.name.substring(0, 1)}
                            </div>
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-white truncate group-hover:text-[#00b9f0] transition-colors">{creator.name}</h3>
                                    <span className="text-xs text-slate-500 font-mono">{creator.games} Games</span>
                                </div>
                                <p className="text-slate-500 text-xs truncate font-medium">0 shared skills</p>
                            </div>
                        </div>

                        <p className="text-slate-400 text-sm mb-6 flex-grow line-clamp-2">
                            {creator.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {creator.skills.slice(0, 3).map(skill => (
                                <span key={skill} className="px-2 py-1 rounded-md bg-[#1a2c38] border border-white/5 text-[10px] text-slate-400 uppercase tracking-wide font-bold">
                                    {skill}
                                </span>
                            ))}
                        </div>

                        <button className="w-full py-3 bg-[#1a2c38] hover:bg-[#2f4553] border border-white/5 rounded-lg text-sm font-bold text-slate-300 flex items-center justify-center gap-2 transition group-hover:text-white group-hover:border-white/10">
                            <Globe size={14} />
                            View Portfolio
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
