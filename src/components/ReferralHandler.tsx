"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { storePendingReferralCode } from "@/utils/referralClient";

/** Captures ?ref=CODE from the URL and stores it for signup / first login. */
export default function ReferralHandler() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const ref = searchParams.get("ref");
        if (!ref) return;
        storePendingReferralCode(ref);
    }, [searchParams]);

    return null;
}
