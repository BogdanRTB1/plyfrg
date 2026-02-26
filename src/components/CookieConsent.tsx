"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Check, X } from "lucide-react";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);

    const [preferences, setPreferences] = useState({
        necessary: true,
        analytics: true,
        marketing: true
    });

    useEffect(() => {
        const hasAccepted = localStorage.getItem("cookies_accepted");
        if (!hasAccepted) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem("cookies_accepted", "all");
        setIsVisible(false);
    };

    const handleSavePreferences = () => {
        localStorage.setItem("cookies_accepted", JSON.stringify(preferences));
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain">
                    {/* Infinite Background layer to block overscroll bounce */}
                    <div className="fixed inset-[-100vh] bg-black/80 backdrop-blur-md pointer-events-none" />

                    <div className="min-h-full flex items-center justify-center p-4 relative z-10 w-full pointer-events-auto">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-[#0f212e] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 md:p-8 max-w-lg w-full flex flex-col items-center text-center gap-6"
                        >
                            <AnimatePresence mode="wait">
                                {!showPreferences ? (
                                    <motion.div
                                        key="main"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="flex flex-col items-center gap-4 w-full"
                                    >
                                        <div className="w-16 h-16 bg-[#00b9f0]/10 text-[#00b9f0] rounded-full flex items-center justify-center text-3xl">
                                            🍪
                                        </div>
                                        <h3 className="text-white font-bold text-2xl tracking-tight">
                                            We value your privacy
                                        </h3>
                                        <p className="text-slate-400 text-sm leading-relaxed">
                                            We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking Accept, you consent to our use of cookies according to our{" "}
                                            <Link href="/terms" className="text-[#00b9f0] hover:underline font-bold transition-colors">
                                                Terms
                                            </Link>{" "}
                                            and{" "}
                                            <Link href="/privacy" className="text-[#00b9f0] hover:underline font-bold transition-colors">
                                                Privacy Policy
                                            </Link>.
                                        </p>

                                        <div className="flex flex-col sm:flex-row w-full gap-3 mt-4">
                                            <button
                                                onClick={() => setShowPreferences(true)}
                                                className="w-full px-4 py-4 bg-[#1a2c38] hover:bg-[#2f4553] border border-white/5 text-slate-300 font-bold text-sm rounded-xl transition-all"
                                            >
                                                Manage Preferences
                                            </button>
                                            <button
                                                onClick={handleAcceptAll}
                                                className="w-full px-4 py-4 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_30px_rgba(0,185,240,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2"
                                            >
                                                <Check size={18} />
                                                Accept All
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="preferences"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex flex-col w-full text-left"
                                    >
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-xl font-bold text-white">Cookie Preferences</h3>
                                            <button onClick={() => setShowPreferences(false)} className="text-slate-400 hover:text-white transition-colors">
                                                <X size={24} />
                                            </button>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center justify-between p-4 bg-[#1a2c38] border border-white/5 rounded-xl">
                                                <div className="pr-4">
                                                    <p className="font-bold text-white mb-1">Strictly Necessary</p>
                                                    <p className="text-slate-400 text-xs leading-relaxed">Essential for the site to function completely.</p>
                                                </div>
                                                <span className="text-[#00b9f0] font-bold text-[10px] uppercase tracking-wider bg-[#00b9f0]/10 px-2 py-1 rounded shrink-0">Always On</span>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-[#1a2c38] border border-white/5 rounded-xl">
                                                <div className="pr-4">
                                                    <p className="font-bold text-white mb-1">Analytics</p>
                                                    <p className="text-slate-400 text-xs leading-relaxed">Help us understand how visitors use the site.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                    <input type="checkbox" className="sr-only peer" checked={preferences.analytics} onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })} />
                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b9f0]"></div>
                                                </label>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-[#1a2c38] border border-white/5 rounded-xl">
                                                <div className="pr-4">
                                                    <p className="font-bold text-white mb-1">Marketing</p>
                                                    <p className="text-slate-400 text-xs leading-relaxed">Used to deliver more relevant advertisements.</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                    <input type="checkbox" className="sr-only peer" checked={preferences.marketing} onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })} />
                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b9f0]"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleSavePreferences}
                                            className="w-full px-4 py-4 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_30px_rgba(0,185,240,0.4)] hover:-translate-y-1"
                                        >
                                            Save Preferences
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
