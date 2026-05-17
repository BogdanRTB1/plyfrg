"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { launchGameFromQueryParam } from "@/utils/gameLaunch";

/** Handles `/?play=GameName` deep links after navigation to home. */
export default function GameLaunchHandler() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

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
