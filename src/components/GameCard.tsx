"use client";
import Image from "next/image";

interface GameCardProps {
    name: string;
    image: string;
    rtp?: string;
    provider?: string;
}

export default function GameCard({ name, image, rtp = "99.0%", provider = "PlayForges" }: GameCardProps) {
    return (
        <div className="bg-[#0f212e] rounded-xl overflow-hidden group cursor-pointer border border-white/5 hover:border-[#00b9f0]/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-[#00b9f0]/10 flex flex-col h-full">
            <div className="relative w-full aspect-square bg-[#1a2c38] overflow-hidden">
                {/* Fallback pattern */}
                <div className="absolute inset-0 flex items-center justify-center text-slate-600 font-bold opacity-30 select-none pointer-events-none">
                    {name}
                </div>
                {image && (
                    <Image
                        src={image}
                        alt={name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                )}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-[#00b9f0] border border-white/10 z-10">
                    RTP {rtp}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-[#0f212e] via-[#0f212e]/80 to-transparent flex flex-col justify-end h-3/4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                    <button className="w-full py-2 bg-[#00b9f0] text-[#0f212e] text-xs font-bold rounded shadow-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:bg-[#38bdf8]">Play Now</button>
                </div>
            </div>
            <div className="p-4 border-t border-white/5 group-hover:border-[#00b9f0]/20 transition-colors bg-[#0f212e] flex-1">
                <h3 className="font-bold text-white leading-tight mb-1 text-sm truncate" title={name}>{name}</h3>
                <p className="text-xs text-slate-400">{provider}</p>
            </div>
        </div>
    );
}
