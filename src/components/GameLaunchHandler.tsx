"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { launchGameFromQueryParam, launchGameReal, resolveGameFromSlug } from "@/utils/gameLaunch";
import { consumeAuthReturnPath } from "@/utils/authReturn";

/** Handles `/?play=GameName` deep links and re-opens games after register/login. */
export default function GameLaunchHandler() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        const supabase = createClient();

        const resumeGameAfterAuth = async () => {
            const returnPath = consumeAuthReturnPath();
            if (!returnPath?.startsWith("/play/")) return;

            const slug = returnPath.replace(/^\/play\//, "");
            const resolved = await resolveGameFromSlug(slug);
            if (resolved) launchGameReal(resolved, { updateUrl: false });
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session && event === "SIGNED_IN") {
                void resumeGameAfterAuth();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (pathname !== "/") return;

        const playParam = searchParams.get("play");
        if (!playParam) return;

        void (async () => {
            await launchGameFromQueryParam(playParam);
            const url = new URL(window.location.href);
            url.searchParams.delete("play");
            window.history.replaceState(null, "", url.pathname + url.search);
        })();
    }, [pathname, searchParams]);

    return null;
}
