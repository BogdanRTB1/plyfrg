"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Play, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { getGameCoverImage } from "@/constants/featuredGames";
import { normalizeGamePayload, launchGameDemo, launchGameReal, type GameLaunchPayload } from "@/utils/gameLaunch";

type GameLaunchPickerModalProps = {
    isOpen: boolean;
    game: GameLaunchPayload | null;
    onClose: () => void;
};

function getPickerMeta(game: GameLaunchPayload | null) {
    if (!game) return { name: "Game", image: "/images/game-plinko.png", provider: "PlayForges" };

    const normalized = normalizeGamePayload(game);
    const name = String(normalized.name || "Game");
    const image =
        (typeof normalized.coverImage === "string" && normalized.coverImage) ||
        (typeof normalized.image === "string" && normalized.image) ||
        getGameCoverImage(name);
    const provider =
        typeof normalized.creatorName === "string"
            ? `@${normalized.creatorName}`
            : String(normalized.provider || "PlayForges");

    return { name, image, provider };
}

export default function GameLaunchPickerModal({ isOpen, game, onClose }: GameLaunchPickerModalProps) {
    const { name, image, provider } = getPickerMeta(game);

    const startPlay = (mode: "real" | "demo") => {
        if (!game) return;
        onClose();
        if (mode === "demo") {
            void launchGameDemo(game, { updateUrl: true });
        } else {
            void launchGameReal(game, { updateUrl: true });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && game && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 12 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f212e] shadow-2xl"
                    >
                        <div className="relative h-40 bg-[#1a2c38]">
                            {image.startsWith("data:") ? (
                                <img src={image} alt={name} className="h-full w-full object-cover opacity-90" />
                            ) : (
                                <Image src={image} alt={name} fill className="object-cover opacity-90" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f212e] via-[#0f212e]/40 to-transparent" />
                            <button
                                type="button"
                                onClick={onClose}
                                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            <h2 className="text-2xl font-black text-white">{name}</h2>
                            <p className="mt-1 text-sm text-slate-400">{provider}</p>
                            <p className="mt-4 text-sm text-slate-300">How do you want to play?</p>

                            <div className="mt-5 grid gap-3">
                                <button
                                    type="button"
                                    onClick={() => startPlay("real")}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#00b9f0] py-3.5 text-sm font-bold text-[#0f212e] transition hover:bg-[#38bdf8]"
                                >
                                    <Play size={18} className="fill-current" />
                                    Play
                                    <span className="text-[11px] font-semibold opacity-80">(real balance)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => startPlay("demo")}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-500/15 py-3.5 text-sm font-bold text-amber-300 transition hover:bg-amber-500/25"
                                >
                                    <Sparkles size={18} />
                                    Demo Play
                                    <span className="text-[11px] font-semibold opacity-80">(99,999 · bigger wins)</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
