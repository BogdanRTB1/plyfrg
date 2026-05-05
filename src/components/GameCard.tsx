"use client";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { DEFAULT_ORIGINAL_CARD_RTP } from "@/constants/originalsRtp";

interface GameCardProps {
    name: string;
    image: string;
    rtp?: string;
    provider?: string;
}

export default function GameCard({ name, image, rtp = DEFAULT_ORIGINAL_CARD_RTP, provider = "PlayForges" }: GameCardProps) {
    return (
        <div className="bg-[#0f212e] rounded-xl overflow-hidden group cursor-pointer border border-white/5 hover:border-[#00b9f0]/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#00b9f0]/10 flex flex-col h-full relative">
            <div className="relative w-full aspect-square bg-[#1a2c38] overflow-hidden">
                {/* Fallback pattern */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-bold opacity-30 select-none pointer-events-none">
                    {name}
                </div>
                {image && image.startsWith('data:') ? (
                    <img
                        src={image}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : image ? (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : null}
                
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-[#00b9f0] border border-white/10 z-10">
                    RTP {rtp}
                </div>

                {/* Desktop: reveal Play on hover. Mobile: whole card is clickable (parent handles tap) — no overlay button */}
                <div className="pointer-events-none absolute inset-x-0 -bottom-1 z-20 hidden h-3/4 flex-col justify-end bg-gradient-to-t from-[#0f212e] via-[#0f212e]/90 to-transparent p-3 pb-4 opacity-0 transition-opacity duration-300 md:flex md:opacity-0 md:group-hover:opacity-100 sm:p-4 sm:pb-5">
                    <button
                        type="button"
                        className="pointer-events-auto min-h-0 w-full touch-manipulation rounded-lg bg-[#00b9f0] py-2 text-xs font-bold text-[#0f212e] shadow-lg translate-y-4 transition-transform duration-300 hover:bg-[#38bdf8] active:scale-[0.98] sm:py-2 md:group-hover:translate-y-0"
                    >
                        Play Now
                    </button>
                </div>
            </div>
            <div className="p-4 border-t border-white/5 group-hover:border-[#00b9f0]/20 transition-colors bg-[#0f212e] flex-1">
                <h3 className="font-bold text-white leading-tight mb-1 text-sm truncate" title={name}>{name}</h3>
                <p className="text-xs text-slate-400">{provider}</p>
            </div>
        </div>
    );
}
