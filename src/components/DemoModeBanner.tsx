"use client";

export default function DemoModeBanner() {
    return (
        <div className="pointer-events-none fixed left-1/2 top-[max(0.75rem,env(safe-area-inset-top))] z-[250] w-[min(92vw,28rem)] -translate-x-1/2">
            <div className="rounded-xl border border-amber-400/30 bg-[#0f212e]/95 px-4 py-2 text-center shadow-[0_0_24px_rgba(245,158,11,0.15)] backdrop-blur-md">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-400">
                    Demo Play
                </p>
                <p className="mt-0.5 text-xs font-medium text-slate-300">
                    Virtual balance only — no account required
                </p>
            </div>
        </div>
    );
}
