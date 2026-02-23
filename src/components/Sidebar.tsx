"use client";

import {
    Home as HomeIcon,
    Rocket,
    Flame,
    Dices,
    Star,
    Headphones,
    History,
    Settings,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const sidebarItems = [
        { icon: <HomeIcon size={20} />, label: "Lobby", href: "/" },
        { icon: <Rocket size={20} />, label: "Become a Creator", href: "/become-creator" },
        { icon: <Flame size={20} />, label: "Trending", href: "/trending" },
        { icon: <Dices size={20} />, label: "Casino", href: "/casino" },
        { icon: <Star size={20} />, label: "Originals", href: "/originals" },
        { icon: <Headphones size={20} />, label: "Live Support", href: "/support" },
        { icon: <History size={20} />, label: "History", href: "/history" },
        ...(user ? [{ icon: <Settings size={20} />, label: "Settings", href: "/settings" }] : []),
    ];

    const favorites = [
        { label: "Crash", color: "#f87171" },
        { label: "Plinko", color: "#3b82f6" },
        { label: "Mines", color: "#fbbf24" },
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-[#0f212e] flex flex-col border-r border-white/5 z-50 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-left-8 duration-1000 ease-out fill-mode-both delay-[1500ms]">
            <div className="h-20 flex items-center gap-3 px-6 bg-[#0f212e] z-10">
                <Link href="/" className="flex items-center gap-2 group transition-all duration-300">
                    <div className="relative relative-group">
                        <Image
                            src="/logo_transparent.png"
                            alt="PlayForges Logo"
                            width={42}
                            height={42}
                            className="transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_15px_rgba(0,185,240,0.6)]"
                            priority
                        />
                    </div>
                    <span className="text-2xl font-extrabold text-white tracking-tight transition-all duration-300 group-hover:text-[#00b9f0] group-hover:drop-shadow-[0_0_8px_rgba(0,185,240,0.5)] group-hover:scale-105 origin-left">PlayForges</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {sidebarItems.map((item, index) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={index}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative overflow-hidden ${isActive
                                ? "bg-[#1a2c38] text-white font-semibold"
                                : "text-slate-400 hover:bg-[#1a2c38]/50 hover:text-white"
                                }`}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00b9f0] rounded-r-full shadow-[0_0_10px_#00b9f0]" />
                            )}
                            <span className={`relative z-10 transition-colors ${isActive ? "text-[#00b9f0]" : "text-slate-500 group-hover:text-white"}`}>
                                {item.icon}
                            </span>
                            <span className="relative z-10 text-sm">{item.label}</span>
                        </Link>
                    );
                })}

                <div className="mt-8 mb-4 px-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Favorites</h3>
                </div>

                <div className="space-y-1">
                    {favorites.map((fav, index) => (
                        <Link
                            href="#"
                            key={index}
                            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-[#1a2c38]/50 hover:text-white transition-colors group"
                        >
                            <div
                                className="w-2 h-2 rounded-full ring-2 ring-transparent group-hover:ring-white/10 transition-all"
                                style={{ backgroundColor: fav.color, boxShadow: `0 0 8px ${fav.color}40` }}
                            />
                            <span className="text-sm font-medium">{fav.label}</span>
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Optional Footer or User Status could go here */}
        </aside>
    );
}
