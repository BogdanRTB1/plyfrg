"use client";

import { useLayoutEffect } from "react";

let depth = 0;
let savedScrollY = 0;
let prevHtmlOverflow = "";
let prevBodyOverflow = "";
let prevHtmlOverscroll = "";
let prevBodyOverscroll = "";

function applyLock() {
    if (typeof document === "undefined") return;
    depth += 1;
    if (depth > 1) return;

    const html = document.documentElement;
    const body = document.body;
    savedScrollY = window.scrollY;

    prevHtmlOverflow = html.style.overflow;
    prevBodyOverflow = body.style.overflow;
    prevHtmlOverscroll = html.style.overscrollBehavior;
    prevBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    body.style.position = "fixed";
    body.style.top = `-${savedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
}

function releaseLock() {
    if (typeof document === "undefined") return;
    depth = Math.max(0, depth - 1);
    if (depth > 0) return;

    const html = document.documentElement;
    const body = document.body;

    html.style.overflow = prevHtmlOverflow;
    body.style.overflow = prevBodyOverflow;
    html.style.overscrollBehavior = prevHtmlOverscroll;
    body.style.overscrollBehavior = prevBodyOverscroll;
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";

    window.scrollTo(0, savedScrollY);
}

/**
 * Locks page scroll behind fullscreen overlays (mobile rubber-band / pull-to-refresh).
 * Ref-counted so nested overlays (or Strict Mode double-mount) do not unlock early.
 */
export function useBodyScrollLock(locked: boolean) {
    useLayoutEffect(() => {
        if (!locked) return;
        applyLock();
        return () => releaseLock();
    }, [locked]);
}
