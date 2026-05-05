"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

export type StudioTemplatePickOption = {
    id: string;
    label: string;
    icon?: ReactNode;
};

type StudioTemplateStylePickerProps = {
    /** Visible label above the control (e.g. Workspace / Studio section). */
    fieldLabel: string;
    value: string;
    onChange: (id: string) => void;
    options: StudioTemplatePickOption[];
    /** z-index for stacking (game type dropdown uses z-50). */
    className?: string;
};

/**
 * Mobile-only collapsible picker styled like the Game Creator “template” selector
 * (full-width trigger, indigo open state, chevron, option list panel).
 */
export default function StudioTemplateStylePicker({
    fieldLabel,
    value,
    onChange,
    options,
    className = "",
}: StudioTemplateStylePickerProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const current = options.find((o) => o.id === value) ?? options[0];

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [open]);

    return (
        <div ref={rootRef} className={`relative z-40 md:hidden ${className}`}>
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-label={`${fieldLabel}: ${current?.label ?? ""}`}
                onClick={() => setOpen(!open)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left shadow-lg transition-all sm:p-4 ${
                    open
                        ? "border-indigo-500/50 bg-[#111c2a] shadow-[0_0_30px_rgba(99,102,241,0.15)]"
                        : "border-white/10 bg-[#0a111a] hover:border-white/20 hover:bg-white/[0.02]"
                }`}
            >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    {current?.icon ? (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-200">
                            {current.icon}
                        </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                        <div className="mb-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500 sm:text-[10px]">
                            {fieldLabel}
                        </div>
                        <div className="truncate text-base font-black text-white">{current?.label}</div>
                    </div>
                </div>
                <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 transition-transform sm:h-10 sm:w-10 ${
                        open ? "rotate-180 bg-indigo-500/20 text-indigo-400" : "text-slate-400"
                    }`}
                >
                    <ChevronDown size={18} className="sm:h-5 sm:w-5" />
                </div>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-[min(55vh,400px)] overflow-y-auto rounded-2xl border border-white/10 bg-[#0f1722] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.7)] overscroll-contain"
                        role="listbox"
                    >
                        {options.map((o) => (
                            <button
                                key={o.id}
                                type="button"
                                role="option"
                                aria-selected={o.id === value}
                                onClick={() => {
                                    onChange(o.id);
                                    setOpen(false);
                                }}
                                className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all sm:gap-3 sm:rounded-xl sm:p-3 ${
                                    o.id === value
                                        ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                                        : "border-transparent bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
                                }`}
                            >
                                {o.icon ? (
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-200">
                                        {o.icon}
                                    </div>
                                ) : null}
                                <span className="min-w-0 flex-1 truncate text-sm font-black sm:text-base">{o.label}</span>
                                {o.id === value ? (
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                                        <Check size={14} className="text-white" />
                                    </div>
                                ) : null}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
