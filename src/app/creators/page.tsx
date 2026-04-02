"use client";

import React, { useState, useEffect } from 'react';
import { Search, Edit, User, Globe, Trophy, Play, Star, ExternalLink, Twitch, Youtube, Twitter } from "lucide-react";
import { motion } from 'framer-motion';

// Enhanced mock data to match the detailed card structure
const defaultCreators = [
    {
        id: 1,
        name: "AlexGaming",
        role: "Pro Streamer",
        email: "alex@playforges.com",
        followers: "24.5K",
        description: "Passionate about high volatility slots and sharing big wins with the community. Streaming daily at 8 PM.",
        skills: ["Slots", "Blackjack", "Live Casino"],
        games: 12,
        featured: true,
        profilePicture: null,
        bannerImage: null
    },
    {
        id: 2,
        name: "SlotMaster",
        role: "Pro Gambler",
        followers: "18.2K",
        description: "Hunting for the max win. I analyze RTP and volatility distributions.",
        skills: ["Analytics", "Strategy", "Poker"],
        games: 8,
        profilePicture: null,
        bannerImage: null
    },
    {
        id: 3,
        name: "CryptoKing",
        role: "Crypto Enthusiast",
        followers: "12.9K",
        description: "Only playing with crypto. Fast deposits, instant withdrawals.",
        skills: ["Crypto", "Blockchain", "High Stakes"],
        games: 15,
        profilePicture: null,
        bannerImage: null
    },
    {
        id: 4,
        name: "LuckyCharm",
        role: "Casual Player",
        followers: "9.8K",
        description: "Just here for the fun times and vibes. Let's spin together!",
        skills: ["Community", "Fun", "Slots"],
        games: 5,
        profilePicture: null,
        bannerImage: null
    },
];

export default function CreatorsPage() {
    const [creators, setCreators] = useState<any[]>(defaultCreators);

    useEffect(() => {
        // Load custom created creators from local storage
        const added = localStorage.getItem('added_creators');
        if (added) {
            try {
                const parsedAdded = JSON.parse(added);
                setCreators([...parsedAdded, ...defaultCreators]);
            } catch (e) {
                console.error("Could not parse added_creators", e);
            }
        }
    }, []);

    const featuredCreator = creators[0];
    const otherCreators = creators.slice(1);

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050B14] relative custom-scrollbar z-0 p-6 lg:p-12 pb-32">

            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00b9f0]/10 blur-[150px] rounded-full pointer-events-none -z-10" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
            >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00b9f0]/10 border border-[#00b9f0]/20 text-[#00b9f0] text-sm font-bold mb-4">
                    <Star size={16} fill="currentColor" />
                    <span>Playforges Elite</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black mb-4 text-white tracking-tight">
                    Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00b9f0] to-[#8adffc]">Creators</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                    Discover and collaborate with the top minds shaping the gaming experience on Playforges. Watch their streams, check their stats, and learn their strategies.
                </p>
            </motion.div>

            {/* Featured Profile Card */}
            {featuredCreator && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#0b1622]/80 backdrop-blur-xl rounded-[32px] mb-16 border border-white/10 relative overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                >
                    {/* Banner Image */}
                    <div className="absolute top-0 w-full h-48 bg-gradient-to-r from-[#0f212e] to-[#152a3a] overflow-hidden -z-10">
                        {featuredCreator.bannerImage ? (
                            <img src={featuredCreator.bannerImage} className="w-full h-full object-cover opacity-60" alt="Banner" />
                        ) : (
                            <div className="w-full h-full bg-[url('/noise.png')] mix-blend-overlay opacity-20"></div>
                        )}
                        <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-[#0b1622]/80 to-transparent"></div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 relative z-10 pt-24 px-8 pb-8">
                        {/* Avatar */}
                        <div className="flex-shrink-0 flex flex-col items-center">
                            <div className="relative w-32 h-32 rounded-full bg-[#152a3a] flex items-center justify-center text-4xl font-bold text-white border-4 border-[#0b1622] shadow-[0_0_30px_rgba(0,185,240,0.3)] overflow-hidden">
                                {featuredCreator.profilePicture ? (
                                    <img src={featuredCreator.profilePicture} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    featuredCreator.name.substring(0, 2).toUpperCase()
                                )}
                            </div>

                            <div className="mt-4 flex gap-3">
                                {featuredCreator.twitchUrl && (
                                    <a href={featuredCreator.twitchUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#9146FF]/20 text-[#9146FF] hover:bg-[#9146FF] hover:text-white flex items-center justify-center transition-colors">
                                        <Twitch size={18} />
                                    </a>
                                )}
                                {featuredCreator.youtubeUrl && (
                                    <a href={featuredCreator.youtubeUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-[#FF0000]/20 text-[#FF0000] hover:bg-[#FF0000] hover:text-white flex items-center justify-center transition-colors">
                                        <Youtube size={18} />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-grow flex flex-col justify-end pt-4 md:pt-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-3xl font-black text-white tracking-tight">{featuredCreator.name}</h2>
                                        {featuredCreator.featured && (
                                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">Partner</span>
                                        )}
                                    </div>
                                    <p className="text-[#00b9f0] font-bold">{featuredCreator.followers} Followers</p>
                                </div>
                                <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#0b1622] hover:bg-slate-200 rounded-xl font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all transform hover:scale-105">
                                    <Play size={16} fill="currentColor" />
                                    <span>Watch Live</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">About Creator</h3>
                                    <p className="text-slate-300 leading-relaxed">
                                        {featuredCreator.description}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Specialties</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {featuredCreator.skills.map((skill: string) => (
                                            <span key={skill} className="px-3 py-1.5 rounded-lg bg-[#00b9f0]/10 border border-[#00b9f0]/20 text-sm text-[#00b9f0] font-bold hover:bg-[#00b9f0]/20 transition cursor-default">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Assigned Games Section */}
                            {featuredCreator.assignedGames && featuredCreator.assignedGames.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Featured Games</h3>
                                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                        {featuredCreator.assignedGames.map((game: string) => (
                                            <div key={game} className="flex-shrink-0 w-32 aspect-[3/4] rounded-xl overflow-hidden border border-white/10 relative group">
                                                <img src={`/images/${game.toLowerCase()}.png`} alt={game} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" onError={(e) => { e.currentTarget.src = '/noise.png' }} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1622] via-transparent to-transparent opacity-80"></div>
                                                <span className="absolute bottom-3 left-3 text-white font-bold text-sm tracking-tight">{game}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Discovery Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-white tracking-tight">Discover Creators</h2>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 font-bold">
                        {otherCreators.length} Available
                    </span>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search creators..."
                        className="bg-[#0b1622] border border-white/10 rounded-xl pl-10 pr-4 py-2 w-64 text-sm text-white focus:outline-none focus:border-[#00b9f0] transition-colors"
                    />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
                {otherCreators.map((creator, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        key={creator.id}
                        className="bg-[#0b1622]/80 backdrop-blur-md rounded-[24px] border border-white/10 hover:border-[#00b9f0]/30 transition-all duration-300 group flex flex-col h-full hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(0,185,240,0.1)] overflow-hidden"
                    >
                        {/* Small Banner */}
                        <div className="h-24 bg-gradient-to-r from-[#152a3a] to-[#0f212e] relative">
                            {creator.bannerImage && (
                                <img src={creator.bannerImage} className="w-full h-full object-cover opacity-50" alt="Banner" />
                            )}
                        </div>

                        <div className="px-6 pb-6 relative flex-grow flex flex-col">
                            {/* Avatar pushing up into banner */}
                            <div className="w-16 h-16 rounded-full bg-[#152a3a] flex items-center justify-center text-xl font-black text-white border-4 border-[#0b1622] absolute -top-8 overflow-hidden shadow-lg group-hover:border-[#00b9f0]/20 transition-colors">
                                {creator.profilePicture ? (
                                    <img src={creator.profilePicture} className="w-full h-full object-cover" alt="Profile" />
                                ) : (
                                    creator.name.substring(0, 2).toUpperCase()
                                )}
                            </div>

                            <div className="pt-10 mb-4 flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black text-white truncate group-hover:text-[#00b9f0] transition-colors">{creator.name}</h3>
                                    <p className="text-slate-400 text-xs font-bold">{creator.followers} Followers</p>
                                </div>
                                <div className="text-xs font-black text-[#00b9f0] bg-[#00b9f0]/10 px-2 py-1 rounded-md border border-[#00b9f0]/20">
                                    {creator.role}
                                </div>
                            </div>

                            <p className="text-slate-400 text-sm mb-6 flex-grow line-clamp-3">
                                {creator.description}
                            </p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {creator.skills.slice(0, 3).map((skill: string) => (
                                    <span key={skill} className="px-2 py-1 rounded-md bg-[#152a3a] border border-white/5 text-[10px] text-slate-300 uppercase tracking-wider font-bold">
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            {creator.assignedGames && creator.assignedGames.length > 0 && (
                                <div className="mb-6 flex gap-2">
                                    {creator.assignedGames.slice(0, 3).map((game: string) => (
                                        <div key={game} className="flex-1 aspect-[16/9] rounded-lg overflow-hidden border border-white/10 relative group bg-[#0f212e]">
                                            <img src={`/images/${game.toLowerCase()}.png`} alt={game} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" onError={(e) => { e.currentTarget.src = '/noise.png' }} />
                                            <div className="absolute inset-0 bg-[#0b1622]/40 group-hover:bg-transparent transition-colors"></div>
                                            <span className="absolute bottom-1 left-2 text-white font-bold text-[10px] truncate">{game}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-colors mt-auto">
                                <ExternalLink size={16} />
                                View Profile
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
