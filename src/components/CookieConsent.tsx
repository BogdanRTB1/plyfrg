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
                <motion.div
                    initial={{ y: 150, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 150, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 md:pb-8 flex justify-center pointer-events-none"
                >
                    <div className="bg-[#0f212e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-5 md:p-6 max-w-4xl w-full flex flex-col md:flex-row items-center gap-4 md:gap-8 pointer-events-auto">
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                                🍪 We use cookies
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                We use cookies and similar technologies to help personalize content, tailor and measure ads, and provide a better experience. By clicking accept, you agree to our{" "}
                                <Link href="/terms" className="text-[#00b9f0] hover:underline font-medium transition-colors">
                                    Terms & Conditions
                                </Link>{" "}
                                and{" "}
                                <Link href="/privacy" className="text-[#00b9f0] hover:underline font-medium transition-colors">
                                    Privacy Policy
                                </Link>.
                            </p>
                        </div>
                        <div className="w-full md:w-auto flex shrink-0">
                            <button
                                onClick={handleAccept}
                                className="w-full md:w-auto px-8 py-3.5 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_25px_rgba(0,185,240,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 active:scale-95 duration-200"
                            >
                                <Check size={20} />
                                Accept & Continue
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
