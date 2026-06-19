"use client";

import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Check } from "lucide-react";
import { REFERRED_DIAMONDS_REWARD } from "@/constants/referrals";

export type ReferralInviteInfo = {
    inviterName: string;
    avatarUrl?: string | null;
    referralCode: string;
    referredDiamonds?: number;
};

type ReferralInviteModalProps = {
    isOpen: boolean;
    invite: ReferralInviteInfo | null;
    isLoggedIn?: boolean;
    onRegister: () => void;
    onOk: () => void;
};

export default function ReferralInviteModal({
    isOpen,
    invite,
    isLoggedIn = false,
    onRegister,
    onOk,
}: ReferralInviteModalProps) {
    const diamonds = invite?.referredDiamonds ?? REFERRED_DIAMONDS_REWARD;
    const inviterName = invite?.inviterName || "Someone";

    return (
        <AnimatePresence>
            {isOpen && invite && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[115] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={onOk}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 12 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/20 bg-[#0f212e] shadow-2xl shadow-emerald-500/10"
                    >
                        <div className="relative bg-gradient-to-br from-emerald-500/15 via-[#0f212e] to-[#0f212e] px-6 pt-8 pb-6 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-emerald-500/30 bg-[#1a2c38] shadow-lg shadow-emerald-500/20">
                                {invite.avatarUrl ? (
                                    <img
                                        src={invite.avatarUrl}
                                        alt={inviterName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-black text-emerald-400">
                                        {inviterName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
                                You&apos;re invited
                            </p>
                            <h2 className="text-2xl font-black text-white leading-tight">
                                <span className="text-emerald-400">{inviterName}</span> invited you to PlayForges
                            </h2>
                            {!isLoggedIn && (
                                <p className="mt-3 text-sm text-slate-400">
                                    Create an account and receive{" "}
                                    <span className="font-bold text-white">
                                        {diamonds.toLocaleString()} Diamonds
                                    </span>{" "}
                                    as a welcome bonus.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-white/5 p-6">
                            {!isLoggedIn && (
                                <button
                                    type="button"
                                    onClick={onRegister}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 text-sm font-black uppercase tracking-wide text-[#0f212e] transition hover:bg-emerald-400"
                                >
                                    <UserPlus size={18} />
                                    Register
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onOk}
                                className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition ${
                                    isLoggedIn
                                        ? "bg-emerald-500 text-[#0f212e] hover:bg-emerald-400"
                                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                                }`}
                            >
                                <Check size={18} />
                                OK
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
