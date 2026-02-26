"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollReset() {
    const pathname = usePathname();

    useEffect(() => {
        // Find all scrollable containers and scroll them to the top on navigation
        const scrollContainers = document.querySelectorAll('.overflow-y-auto, .custom-scrollbar');
        scrollContainers.forEach(container => {
            container.scrollTo(0, 0);
        });

        // Also scroll window just in case
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}
