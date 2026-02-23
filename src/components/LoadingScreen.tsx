"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoadingScreen() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading time or wait for resources
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000); // 2 seconds loading screen

        return () => clearTimeout(timer);
    }, []);

    if (!loading) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center animate-out fade-out duration-700 fill-mode-forwards" style={{ animationDelay: '1.2s' }}>
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00b9f0]/10 via-transparent to-transparent opacity-50"></div>

            <div className="relative z-10 flex flex-col items-center gap-8">
                <div className="relative">
                    {/* Logo Glow */}
                    <div className="absolute inset-0 bg-[#00b9f0] rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    <Image
                        src="/logo_transparent.png"
                        alt="PlayForges"
                        width={120}
                        height={120}
                        className="relative z-10 animate-bounce-slow drop-shadow-[0_0_25px_rgba(0,185,240,0.4)]"
                        priority
                    />
                </div>

                {/* Text Logo */}
                <h1 className="text-4xl font-extrabold text-white tracking-tight animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                    Play<span className="text-[#00b9f0]">Forges</span>
                </h1>

                {/* Loading Indicator */}
                <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mt-4 relative">
                    <div className="absolute h-full bg-[#00b9f0] animate-[loading_1.5s_infinite_linear] rounded-full shadow-[0_0_10px_rgba(0,185,240,0.5)]"></div>
                </div>
            </div>
        </div>
    );
}
