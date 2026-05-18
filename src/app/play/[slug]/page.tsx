"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { launchGame, resolveGameFromSlug } from "@/utils/gameLaunch";

export default function PlayGamePage() {
    const params = useParams();
    const router = useRouter();
    const slug = decodeURIComponent((params.slug as string) || "");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!slug) {
            setError("Invalid game link.");
            return;
        }

        let cancelled = false;

        void (async () => {
            const resolved = await resolveGameFromSlug(slug);
            if (cancelled) return;

            if (resolved) {
                await launchGame(resolved, { updateUrl: false });
                router.replace("/");
                return;
            }

            setError("Game not found. It may have been removed or is not published yet.");
        })();

        return () => {
            cancelled = true;
        };
    }, [slug, router]);

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            {error ? (
                <>
                    <p className="text-lg font-bold text-white">{error}</p>
                    <button
                        type="button"
                        onClick={() => router.push("/casino")}
                        className="rounded-xl bg-[#00b9f0] px-6 py-3 text-sm font-bold text-[#0f212e]"
                    >
                        Browse Casino
                    </button>
                </>
            ) : (
                <>
                    <Loader2 className="h-10 w-10 animate-spin text-[#00b9f0]" />
                    <p className="text-slate-400 font-medium">Loading…</p>
                </>
            )}
        </div>
    );
}

