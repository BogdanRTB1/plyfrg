"use client";

import { type CSSProperties, type ReactNode } from "react";

type MobileGameHudBarProps = {
    /** Left cluster (bet shortcuts, ½, 2×, etc.) */
    left: ReactNode;
    /** Center primary action (Play / Cashout) */
    center: ReactNode;
    /** Right cluster (MAX, currency, more…) */
    right: ReactNode;
    className?: string;
    /** Merged onto the root bar (e.g. custom panel tint) */
    style?: CSSProperties;
};

/** Shared classes for HUD side buttons (optional use in game modals) */
export const mobileHudSideBtn =
    "shrink-0 rounded-xl border border-white/10 bg-[#1a2c38] px-3 py-3 text-xs font-black text-slate-100 shadow-sm active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none min-h-[44px] min-w-[40px]";

/** Primary round action — use with your game accent */
export const mobileHudCenterBtn = "flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full shadow-lg active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";

/**
 * Mobile control strip: side actions | large center play | side actions.
 * Desktop keeps the full panel; this row is md:hidden only.
 */
export default function MobileGameHudBar({ left, center, right, className = "", style }: MobileGameHudBarProps) {
    return (
        <div
            className={`flex min-h-[80px] md:hidden shrink-0 w-full flex-row items-center justify-between gap-2.5 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0d161c]/95 backdrop-blur-md z-30 touch-manipulation ${className}`}
            style={style}
            role="toolbar"
            aria-label="Game controls"
        >
            <div className="flex min-w-0 flex-1 items-center justify-start gap-2">{left}</div>
            <div className="flex shrink-0 items-center justify-center px-1">{center}</div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{right}</div>
        </div>
    );
}
