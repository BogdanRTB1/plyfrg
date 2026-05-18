"use client";

import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { saveAuthReturnPath } from "@/utils/authReturn";
import type { GameLaunchPayload } from "@/utils/gameLaunch";

type Props = {
    game: GameLaunchPayload | null;
    visible: boolean;
};

function returnPathForGame(game: GameLaunchPayload | null): string {
    if (!game) return "/casino";
    if (typeof game === "string") {
        return `/play/${encodeURIComponent(game)}`;
    }
    if (game.id) return `/play/${encodeURIComponent(String(game.id))}`;
    if (game.name) return `/play/${encodeURIComponent(String(game.name))}`;
    return "/casino";
}

export default function GameGuestAuthBar({ game, visible }: Props) {
    if (!visible) return null;

    const handleRegister = () => {
        saveAuthReturnPath(returnPathForGame(game));
        window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: "signup" }));
    };

    const handleLogin = () => {
        saveAuthReturnPath(returnPathForGame(game));
        window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: "login" }));
    };

    return (
        <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-20 left-1/2 z-[120] w-[min(100%,22rem)] -translate-x-1/2 px-3 md:bottom-6"
        >
            <div className="rounded-2xl border border-[#00b9f0]/30 bg-[#0f212e]/95 p-4 shadow-[0_0_30px_rgba(0,185,240,0.15)] backdrop-blur-md">
                <p className="mb-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                    Create a free account to save progress
                </p>
                <motion.div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleRegister}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00b9f0] to-[#0072f0] py-3 text-sm font-black uppercase tracking-wide text-[#0f212e] active:scale-95"
                    >
                        <UserPlus size={16} />
                        Register
                    </button>
                    <button
                        type="button"
                        onClick={handleLogin}
                        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-bold text-white active:scale-95"
                    >
                        Log in
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
}
