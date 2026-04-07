"use client";
/* eslint-disable */
// @ts-nocheck

import {
    Home as HomeIcon,
    Rocket,
    Flame,
    Dices,
    Star,
    Headphones,
    History,
    Settings,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useMobileNav } from "@/components/MobileNavProvider";

export default function Sidebar() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [isCreator, setIsCreator] = useState(false);
    const supabase = createClient();
    const { isOpen, setIsOpen } = useMobileNav();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        const checkCreatorStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            const added = localStorage.getItem('added_creators');
            if (added) {
                try {
                    const parsedAdded = JSON.parse(added);
                    if (user && parsedAdded && parsedAdded.length > 0) {
                        const isMatched = parsedAdded.some((c: any) => c.email === user.email || String(c.id) === String(user.id) || c.userId === user.id);
                        setIsCreator(isMatched);
                    } else {
                        setIsCreator(false);
                    }
                } catch (e) { }
            } else {
                setIsCreator(false);
            }
        };

        checkCreatorStatus();

        // Listen for storage changes in case they create an account in another tab or same window
        window.addEventListener('storage', checkCreatorStatus);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('storage', checkCreatorStatus);
        };
    }, []);

    const sidebarItems = [
        { icon: <HomeIcon size={20} />, label: "Lobby", href: "/" },
        isCreator
            ? { icon: <Rocket size={20} />, label: "Creator Studio", href: "/creator-studio" }
            : { icon: <Rocket size={20} />, label: "Become a Creator", href: "/become-creator" },
        { icon: <Flame size={20} />, label: "Trending", href: "/trending" },
        { icon: <Dices size={20} />, label: "Casino", href: "/casino" },
        { icon: <Star size={20} />, label: "Originals", href: "/originals" },
        { icon: <Headphones size={20} />, label: "Live Support", href: "/support" },
        { icon: <History size={20} />, label: "History", href: "/history" },
        ...(user ? [{ icon: <Settings size={20} />, label: "Settings", href: "/settings" }] : []),
    ];

    const [favorites, setFavorites] = useState<{label: string, color: string}[]>([]);

    useEffect(() => {
        const loadFavorites = () => {
            const stored = localStorage.getItem('playforges_favorites');
            if (stored) {
                try {
                    setFavorites(JSON.parse(stored));
                } catch(e) {}
            } else {
                setFavorites([]);
            }
        };
        loadFavorites();
        window.addEventListener('favorites_updated', loadFavorites);
        return () => window.removeEventListener('favorites_updated', loadFavorites);
    }, []);

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[45] md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`fixed left-0 top-0 h-screen w-[260px] bg-[#0f212e] flex flex-col border-r border-white/5 z-50 overflow-hidden shadow-2xl transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="h-20 flex items-center justify-between px-6 bg-[#0f212e] z-10 w-full shrink-0">
                    <Link href="/" className="flex items-center gap-2 group transition-all duration-300 shrink-0" onClick={() => setIsOpen(false)}>
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
                    <button className="md:hidden text-slate-400 hover:text-white shrink-0 ml-2" onClick={() => setIsOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {sidebarItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
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

                    {favorites.length > 0 && (
                        <div className="mt-8 mb-4 px-4">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Favorites ({favorites.length}/5)</h3>
                        </div>
                    )}

                    <div className="space-y-1">
                        {favorites.map((fav, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setIsOpen(false);
                                    window.dispatchEvent(new CustomEvent('open_game', { detail: fav.label }));
                                }}
                                className="w-full flex items-center justify-between px-4 py-2 text-slate-400 hover:bg-[#1a2c38] hover:text-white rounded-lg transition-colors group"
                            >
                                <span className="flex items-center gap-3">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: fav.color }} />
                                    {fav.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Optional Footer or User Status could go here */}
            </aside>
        </>
    );
}
