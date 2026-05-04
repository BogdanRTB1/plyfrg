"use client";
/* eslint-disable */
// @ts-nocheck
import { toast } from "sonner";

import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, LogOut, User as UserIcon, Settings, ChevronDown, Wallet, History, Menu } from "lucide-react";

import Link from "next/link";
import AuthModal from "./AuthModal";
import ConfirmModal from "./ConfirmModal";
import WalletModal from "./WalletModal";
import { createClient } from "@/utils/supabase/client";
import { useMobileNav } from "@/components/MobileNavProvider";

function NotificationItem({ n, markOneAsRead, formatDate }: { n: any, markOneAsRead: (id: string) => void, formatDate: (d: string) => string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (n.is_read) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    markOneAsRead(n.id);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 } // Trigger when 50% visible
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [n.id, n.is_read, markOneAsRead]);

    return (
        <div ref={ref} className={`px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors border-b last:border-0 border-white/5 relative group ${!n.is_read ? 'bg-white/[0.01]' : ''}`}>
            {!n.is_read && <div className="absolute left-2 top-4 w-1.5 h-1.5 bg-[#00b9f0] rounded-full shadow-[0_0_8px_rgba(0,185,240,0.8)] animate-pulse"></div>}
            <div className="pl-3">
                <p className="text-xs font-bold text-white mb-0.5">{n.title}</p>
                <p className={`text-sm font-medium leading-snug mb-1 group-hover:text-white transition-colors ${!n.is_read ? 'text-[#e0e0e0]' : 'text-slate-400'}`}>
                    {n.message}
                </p>
                <p className="text-[10px] text-[#00b9f0] font-bold opacity-80">{formatDate(n.created_at)}</p>
            </div>
        </div>
    );
}

const CreatorLink = ({ user, supabase, onNav }: any) => {
    const [creatorName, setCreatorName] = useState<string | null>(() => {
        // Read from cache immediately to avoid delay
        if (typeof window !== 'undefined') {
            return localStorage.getItem('creator_display_name') || null;
        }
        return null;
    });

    useEffect(() => {
        if (!user) return;
        const check = async () => {
            const { data } = await supabase.from('creators').select('id, display_name').eq('id', user.id).single();
            if (data?.display_name) {
                setCreatorName(data.display_name);
                localStorage.setItem('creator_display_name', data.display_name);
            } else {
                setCreatorName(null);
                localStorage.removeItem('creator_display_name');
            }
        };
        check();
    }, [user, supabase]);

    if (!creatorName) return null;

    return (
        <Link
            href={`/creators/${encodeURIComponent(creatorName)}`}
            className="flex items-center gap-3 px-3 py-2.5 text-[#00b9f0] hover:text-[#00b9f0] hover:bg-[#00b9f0]/5 rounded-lg transition-colors text-sm font-bold border border-[#00b9f0]/10 mt-1"
            onClick={onNav}
        >
            <UserIcon size={16} />
            <span>Creator Profile</span>
        </Link>
    );
};

export default function Header() {

    const [isAuthOpen, setIsAuthOpen] = useState<'login' | 'signup' | null>(null);
    const [user, setUser] = useState<any>(null);
    const [activeDropdown, setActiveDropdown] = useState<'user' | 'notifications' | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [diamonds, setDiamonds] = useState(0);
    const [forgesCoins, setForgesCoins] = useState(0.00);

    // Sync balance with localStorage
    useEffect(() => {
        const handleSync = () => {
            const d = localStorage.getItem('user_diamonds');
            const f = localStorage.getItem('user_forges_coins');
            if (d) setDiamonds(parseInt(d));
            if (f) setForgesCoins(parseFloat(f));
        };
        handleSync();
        window.addEventListener('balance_updated', handleSync);
        window.addEventListener('storage', handleSync);
        return () => {
            window.removeEventListener('balance_updated', handleSync);
            window.removeEventListener('storage', handleSync);
        };
    }, []);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async (userId: string) => {
        const { data } = await supabase.from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);

        if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.is_read).length);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        await supabase.from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    const markOneAsRead = async (id: string) => {
        if (!user) return;

        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // DB update
        await supabase.from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', user.id);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    // Ref for detecting clicks outside dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userDropdownRef = useRef<HTMLDivElement>(null);

    const supabase = createClient();
    const { toggle } = useMobileNav();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                fetchNotifications(user.id);
            }
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchNotifications(session.user.id);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
            // Close dropdowns on auth change
            setActiveDropdown(null);
            setShowLogoutConfirm(false);
        });

        // Listen for programmatic auth modal open (e.g. from Follow button when not logged in)
        const handleOpenAuth = ((e: CustomEvent) => {
            const mode = e.detail as 'login' | 'signup';
            setIsAuthOpen(mode || 'login');
        }) as EventListener;
        window.addEventListener('open_auth_modal', handleOpenAuth);

        // Click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            const isOutsideNotifications = !dropdownRef.current || !dropdownRef.current.contains(event.target as Node);
            const isOutsideUser = !userDropdownRef.current || !userDropdownRef.current.contains(event.target as Node);

            if (isOutsideNotifications && isOutsideUser) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('open_auth_modal', handleOpenAuth);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogoutClick = () => {
        setActiveDropdown(null);
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setShowLogoutConfirm(false);

        // Clear cached balance
        localStorage.removeItem('user_diamonds');
        localStorage.removeItem('user_forges_coins');

        toast.success("You signed out of your account");

        // Force a hard refresh and redirect to lobby to clear all states
        window.location.href = "/";
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <header className="h-16 sm:h-20 px-2 sm:px-4 md:px-8 flex items-center justify-between gap-1.5 sm:gap-3 md:gap-4 bg-[#071d2a]/95 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5 animate-in fade-in slide-in-from-top-8 duration-1000 ease-out fill-mode-both delay-[1500ms]">
                <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0 md:flex-none md:max-w-[min(100%,520px)] lg:max-w-[min(100%,600px)]">
                    <button type="button" className="md:hidden text-slate-400 hover:text-white shrink-0 p-1 -ml-0.5" onClick={toggle} aria-label="Open menu">
                        <Menu size={22} />
                    </button>
                    {/* Search: full width on mobile (logged in or out) — uses most of the bar */}
                    <div className="relative group w-full flex-1 min-w-0">
                        <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00b9f0] transition-colors pointer-events-none">
                            <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <input
                            type="search"
                            enterKeyHint="search"
                            placeholder="Games, creators…"
                            className="w-full bg-[#0f212e] border border-white/10 rounded-full py-2 pl-9 pr-3 sm:py-2.5 sm:pl-12 sm:pr-5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all font-medium"
                        />
                    </div>

                </div>

                <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0 min-w-0">

                    <div className={`bg-[#0f212e] border border-white/5 rounded-full p-1 pl-2 sm:pl-3 md:pl-4 items-center gap-1.5 sm:gap-2 md:gap-3 ${!user ? 'hidden md:flex' : 'hidden sm:flex'}`}>
                        {/* Diamonds (GC) */}
                        <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                <DiamondIcon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-bold text-white">{diamonds.toLocaleString()}</span>
                        </div>

                        <div className="w-px h-4 bg-white/10 mx-1"></div>

                        {/* Forges Coins (SC) */}
                        <div className="flex items-center gap-1.5 mr-2">
                            <ForgesCoinIcon className="w-5 h-5 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                            <span className="text-sm font-bold text-white">{forgesCoins.toFixed(2)}</span>
                        </div>

                        <button
                            className="bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] px-3 md:px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,185,240,0.3)] hover:shadow-[0_0_20px_rgba(0,185,240,0.5)] flex items-center justify-center min-w-[32px] md:min-w-0"
                            onClick={() => setIsWalletOpen(true)}
                        >
                            <span className="hidden sm:inline">Wallet</span>
                            <Wallet size={14} className="sm:hidden" />
                        </button>
                    </div>
                    {user && (
                        <button
                            className="sm:hidden p-2 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] rounded-full transition-colors shadow-[0_0_12px_rgba(0,185,240,0.25)]"
                            onClick={() => setIsWalletOpen(true)}
                            aria-label="Open wallet"
                        >
                            <Wallet size={16} />
                        </button>
                    )}

                    <div className="relative shrink-0" ref={dropdownRef}>
                        <button
                            className={`p-2.5 hover:text-white hover:bg-white/5 rounded-full transition-colors relative ${activeDropdown === 'notifications' ? 'bg-white/5 text-white' : 'text-slate-400'}`}
                            onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
                        >
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#071d2a]"></span>
                            )}
                        </button>

                        {activeDropdown === 'notifications' && (
                            <div className="fixed left-1/2 -translate-x-1/2 top-[calc(4rem+6px)] sm:top-[calc(5rem+6px)] md:absolute md:left-auto md:translate-x-0 md:right-0 md:top-full md:mt-2 w-[calc(100vw-32px)] md:w-80 max-w-sm bg-[#0f212e] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                <div className="px-4 py-3 border-b border-white/5 mb-1 flex justify-between items-center">
                                    <p className="text-sm font-bold text-white">Notifications</p>
                                    <button onClick={markAllAsRead} className="text-xs text-[#00b9f0] hover:text-[#38bdf8] font-medium transition-colors">Mark all read</button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar relative">
                                    {notifications.length > 0 ? notifications.map((n, i) => (
                                        <NotificationItem key={n.id || i} n={n} markOneAsRead={markOneAsRead} formatDate={formatDate} />
                                    )) : (
                                        <div className="px-4 py-6 text-center text-slate-500">
                                            <Bell className="mx-auto mb-2 opacity-20" size={24} />
                                            <p className="text-sm">No notifications yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {user ? (
                        <div className="relative shrink-0" ref={userDropdownRef}>
                            <button
                                className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                onClick={() => setActiveDropdown(activeDropdown === 'user' ? null : 'user')}
                                data-state={activeDropdown === 'user' ? 'open' : 'closed'}
                            >
                                <div className="w-8 h-8 rounded-full bg-[#1a2c38] flex items-center justify-center text-sm font-bold text-[#00b9f0] border border-white/10 overflow-hidden">
                                    {user.user_metadata?.avatar_url ? (
                                        <img
                                            src={user.user_metadata.avatar_url}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        user.user_metadata?.full_name
                                            ? user.user_metadata.full_name[0].toUpperCase()
                                            : user.email?.[0].toUpperCase() || 'U'
                                    )}
                                </div>
                                <span className="text-sm font-bold text-slate-200 hidden md:block">
                                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                </span>
                                <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${activeDropdown === 'user' ? 'rotate-180' : ''}`} />
                            </button>

                            {activeDropdown === 'user' && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-[#0f212e] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                    <div className="px-4 py-3 border-b border-white/5 mb-1">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Signed in as</p>
                                        <p className="text-sm font-bold text-white truncate" title={user.email}>
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="p-1">
                                        <Link
                                            href={`/profile/${user.user_metadata?.full_name || user.email?.split('@')[0]}`}
                                            className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            <UserIcon size={16} />
                                            <span>My Profile</span>
                                        </Link>
                                        
                                        {/* Creator Studio Link */}
                                        <CreatorLink user={user} supabase={supabase} onNav={() => setActiveDropdown(null)} />

                                        <Link
                                            href="/settings"

                                            className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            <Settings size={16} />
                                            <span>Settings</span>
                                        </Link>
                                        <Link
                                            href="/history"
                                            className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium"
                                            onClick={() => setActiveDropdown(null)}
                                        >
                                            <History size={16} />
                                            <span>Bet History</span>
                                        </Link>

                                        <div className="h-px bg-white/5 my-1 mx-2"></div>

                                        <button
                                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                                            onClick={handleLogoutClick}
                                        >
                                            <LogOut size={16} />
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                className="text-white hover:text-[#00b9f0] font-bold text-xs md:text-sm px-2 md:px-4 py-2 transition-colors hidden sm:block"
                                onClick={() => setIsAuthOpen('login')}
                            >
                                Log In
                            </button>
                            <button
                                className="bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] px-3 md:px-5 py-2 rounded-lg font-bold text-xs md:text-sm transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_25px_rgba(0,185,240,0.4)] hover:-translate-y-0.5"
                                onClick={() => setIsAuthOpen('signup')}
                            >
                                <span className="hidden sm:inline">Register</span>
                                <span className="sm:hidden whitespace-nowrap">Join Now</span>
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {isAuthOpen && (
                <AuthModal
                    isOpen={!!isAuthOpen}
                    onClose={() => setIsAuthOpen(null)}
                    initialMode={isAuthOpen}
                />
            )}

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={cancelLogout}
                onConfirm={confirmLogout}
                title="Log Out?"
                description="Are you sure you want to sign out of your account?"
                confirmText="Log Out"
                isDanger={true}
            />

            <WalletModal
                isOpen={isWalletOpen}
                onClose={() => setIsWalletOpen(false)}
                diamonds={diamonds}
                setDiamonds={setDiamonds}
                forgesCoins={forgesCoins}
                setForgesCoins={setForgesCoins}
            />
        </>
    );
}
