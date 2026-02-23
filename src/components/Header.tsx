"use client";
/* eslint-disable */
// @ts-nocheck
import { toast } from "sonner";

import { useState, useEffect, useRef } from "react";
import { Search, Bell, LogOut, User as UserIcon, Settings, ChevronDown, Wallet, History } from "lucide-react";
import Link from "next/link";
import AuthModal from "./AuthModal";
import ConfirmModal from "./ConfirmModal";
import WalletModal from "./WalletModal";
import { createClient } from "@/utils/supabase/client";

export default function Header() {
    const [isAuthOpen, setIsAuthOpen] = useState<'login' | 'signup' | null>(null);
    const [user, setUser] = useState<any>(null);
    const [activeDropdown, setActiveDropdown] = useState<'user' | 'notifications' | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [balance, setBalance] = useState(0.00);

    // Ref for detecting clicks outside dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);
    const userDropdownRef = useRef<HTMLDivElement>(null);

    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            // Close dropdowns on auth change
            setActiveDropdown(null);
            setShowLogoutConfirm(false);
        });

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
        toast.success("You signed out of your account");

        // Force a hard refresh and redirect to lobby to clear all states
        window.location.href = "/";
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <>
            <header className="h-20 px-8 flex items-center justify-between bg-[#071d2a]/95 backdrop-blur-xl sticky top-0 z-40 border-b border-white/5 animate-in fade-in slide-in-from-top-8 duration-1000 ease-out fill-mode-both delay-[1500ms]">
                <div className="relative group w-[400px]">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00b9f0] transition-colors pointer-events-none">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search for games, creators..."
                        className="w-full bg-[#0f212e] border border-white/5 rounded-full py-2.5 pl-12 pr-6 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-[#0f212e] border border-white/5 rounded-full p-1 pl-4 flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance:</span>
                        <span className="text-sm font-bold text-white">$0.00</span>
                        <button
                            className="bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,185,240,0.3)] hover:shadow-[0_0_20px_rgba(0,185,240,0.5)]"
                            onClick={() => setIsWalletOpen(true)}
                        >
                            Wallet
                        </button>
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            className={`p-2.5 hover:text-white hover:bg-white/5 rounded-full transition-colors relative ${activeDropdown === 'notifications' ? 'bg-white/5 text-white' : 'text-slate-400'}`}
                            onClick={() => setActiveDropdown(activeDropdown === 'notifications' ? null : 'notifications')}
                        >
                            <Bell size={20} />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#071d2a]"></span>
                        </button>

                        {activeDropdown === 'notifications' && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-[#0f212e] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                                <div className="px-4 py-3 border-b border-white/5 mb-1 flex justify-between items-center">
                                    <p className="text-sm font-bold text-white">Notifications</p>
                                    <button className="text-xs text-[#00b9f0] hover:text-[#38bdf8] font-medium transition-colors">Mark all read</button>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors border-b last:border-0 border-white/5 relative group">
                                            <div className="absolute left-2 top-4 w-1.5 h-1.5 bg-[#00b9f0] rounded-full"></div>
                                            <div className="pl-3">
                                                <p className="text-sm text-slate-300 font-medium leading-snug mb-1 group-hover:text-white transition-colors">
                                                    Your deposit of <span className="text-white font-bold">$50.00</span> has been successfully processed.
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium">2 hours ago</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors">
                                        <div className="pl-3 opacity-60">
                                            <p className="text-sm text-slate-300 font-medium leading-snug mb-1">
                                                Welcome to PlayForges! confirm your email to claim 50 free spins.
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium">1 day ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {user ? (
                        <div className="relative" ref={userDropdownRef}>
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
                                className="text-white hover:text-[#00b9f0] font-bold text-sm px-4 py-2 transition-colors"
                                onClick={() => setIsAuthOpen('login')}
                            >
                                Log In
                            </button>
                            <button
                                className="bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] px-5 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_25px_rgba(0,185,240,0.4)] hover:-translate-y-0.5"
                                onClick={() => setIsAuthOpen('signup')}
                            >
                                Register
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
                balance={balance}
                setBalance={setBalance}
            />
        </>
    );
}
