"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Check } from "lucide-react";

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted cookies
        const hasAccepted = localStorage.getItem("cookies_accepted");
        if (!hasAccepted) {
            // Add a small delay for animation effect
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem("cookies_accepted", "true");
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden pointer-events-auto bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-[#0f212e] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 md:p-8 max-w-lg w-full flex flex-col items-center text-center gap-6"
                    >
                        <div className="flex flex-col items-center gap-4">
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
                        </div>
                        <button
                            onClick={handleAccept}
                            className="w-full px-8 py-4 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold text-lg rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_30px_rgba(0,185,240,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2 active:scale-95 duration-200"
                        >
                            <Check size={24} />
                            I Accept Cookies
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
