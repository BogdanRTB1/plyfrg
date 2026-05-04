"use client";

import { useLayoutEffect, useRef, useState } from "react";

/** Scales a fixed-size board (e.g. Plinko WIDTH×HEIGHT) to fit its container on small screens. */
export function useBoardFitScale(isOpen: boolean, boardWidth: number, boardHeight: number, pad = 12) {
    const hostRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
        if (!isOpen || !hostRef.current) return;
        const el = hostRef.current;
        const update = () => {
            const w = el.clientWidth;
            const h = el.clientHeight;
            if (w < 8 || h < 8) return;
            const s = Math.min(1, (w - pad) / boardWidth, (h - pad) / boardHeight);
            setScale(Math.max(0.28, Math.min(1, s)));
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.addEventListener("resize", update);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", update);
        };
    }, [isOpen, boardWidth, boardHeight, pad]);

    return { hostRef, scale };
}
