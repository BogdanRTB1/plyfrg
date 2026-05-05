"use client";

import { type CSSProperties, type ReactNode, useEffect, useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";

type MobileGameHudBarProps = {
    /** Left cluster (bet shortcuts — prefer {@link MobileHudBetRow}) */
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
export const mobileHudCenterBtn =
    "flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full shadow-lg active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45";

/** ½ / 2× + numeric field for mobile HUD (keyboard input, no ± steppers). */
export function MobileHudBetRow({
    betAmount,
    balance,
    onBetChange,
    disabled,
    clampMin = 0,
    integerOnly = false,
    quickBtnClassName = "shrink-0 rounded-lg border border-white/10 bg-[#1a2c38] px-1.5 py-1.5 text-[10px] font-black text-slate-200 shadow-sm active:scale-95 disabled:opacity-40 min-h-[34px] min-w-[30px]",
    inputClassName = "min-h-[32px] w-full min-w-0 rounded-md border border-white/10 bg-[#0a1114] px-0.5 py-0.5 text-center text-[11px] font-mono font-bold text-white outline-none focus:border-[#00b9f0]/55 disabled:opacity-40",
}: {
    betAmount: number;
    balance: number;
    onBetChange: (amount: number) => void;
    disabled?: boolean;
    /** Minimum after commit (e.g. 1 for some games). */
    clampMin?: number;
    /** Integer bets (scratch, etc.). */
    integerOnly?: boolean;
    quickBtnClassName?: string;
    inputClassName?: string;
}) {
    const [draft, setDraft] = useState(() => (integerOnly ? String(Math.round(betAmount)) : String(betAmount)));

    useEffect(() => {
        setDraft(integerOnly ? String(Math.round(betAmount)) : String(betAmount));
    }, [betAmount, integerOnly]);

    const commitDraft = () => {
        const raw = draft.replace(",", ".").trim();
        if (raw === "" || raw === ".") {
            setDraft(integerOnly ? String(Math.round(betAmount)) : String(betAmount));
            return;
        }
        let n = Number(raw);
        if (Number.isNaN(n)) {
            setDraft(integerOnly ? String(Math.round(betAmount)) : String(betAmount));
            return;
        }
        if (integerOnly) n = Math.floor(n);
        const cap = integerOnly ? Math.floor(balance) : balance;
        n = Math.max(clampMin, n);
        if (n > cap) n = cap;
        const rounded = integerOnly ? n : Number(n.toFixed(2));
        onBetChange(rounded);
        setDraft(integerOnly ? String(rounded) : String(rounded));
    };

    const onInputChange = (t: string) => {
        const normalized = t.replace(",", ".");
        if (integerOnly) {
            if (normalized === "" || /^\d+$/.test(normalized)) setDraft(normalized);
            return;
        }
        if (normalized === "" || /^\d*\.?\d{0,2}$/.test(normalized)) setDraft(normalized);
    };

    const half = () => {
        const v = betAmount / 2;
        if (integerOnly) onBetChange(Math.max(clampMin, Math.floor(v)));
        else onBetChange(Math.max(clampMin, Number(v.toFixed(2))));
    };

    const dbl = () => {
        const cap = integerOnly ? Math.floor(balance) : balance;
        const raw = Math.min(cap, betAmount * 2);
        if (integerOnly) onBetChange(Math.max(clampMin, Math.floor(raw)));
        else onBetChange(Math.max(clampMin, Number(raw.toFixed(2))));
    };

    return (
        <div className="flex shrink-0 items-end gap-1">
            <button type="button" disabled={disabled} onClick={half} className={quickBtnClassName}>
                ½
            </button>
            <button type="button" disabled={disabled} onClick={dbl} className={quickBtnClassName}>
                2×
            </button>
            <div className="flex max-w-[4.75rem] min-w-0 flex-1 flex-col gap-0.5 sm:max-w-[5.25rem]">
                <span className="px-0.5 text-[8px] font-black uppercase tracking-wide text-slate-500">
                    Bet
                </span>
                <input
                    type="text"
                    inputMode="decimal"
                    enterKeyHint="done"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Bet amount"
                    disabled={disabled}
                    value={draft}
                    onChange={(e) => onInputChange(e.target.value)}
                    onBlur={commitDraft}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    }}
                    className={inputClassName}
                />
            </div>
        </div>
    );
}

/** FC/GC toggle: icon only (no text) for compact mobile HUD. */
export function MobileHudCurrencyToggle({
    isGC,
    disabled,
    onToggle,
    className = "",
}: {
    isGC: boolean;
    disabled?: boolean;
    onToggle: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onToggle}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 active:scale-95 disabled:opacity-40 ${
                isGC ? "bg-[#00b9f0] text-[#0f212e]" : "bg-amber-500 text-black"
            } ${className}`}
            aria-label={isGC ? "Gold Coins (GC) — tap to switch to Forges Coins (FC)" : "Forges Coins (FC) — tap to switch to Gold Coins (GC)"}
        >
            {isGC ? <DiamondIcon className="h-6 w-6" /> : <ForgesCoinIcon className="h-6 w-6" />}
        </button>
    );
}

/**
 * Mobile control strip: side actions | large center play | side actions.
 * Desktop keeps the full panel; this row is md:hidden only.
 */
export default function MobileGameHudBar({ left, center, right, className = "", style }: MobileGameHudBarProps) {
    useBodyScrollLock(true);
    return (
        <div
            className={`flex min-h-[72px] md:hidden shrink-0 w-full flex-row items-center justify-between gap-1 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#0d161c]/95 backdrop-blur-md z-30 touch-manipulation ${className}`}
            style={style}
            role="toolbar"
            aria-label="Game controls"
        >
            <div className="flex min-w-0 flex-1 items-center justify-start gap-1 overflow-hidden">{left}</div>
            <div className="flex shrink-0 items-center justify-center px-0.5">{center}</div>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden">{right}</div>
        </div>
    );
}
