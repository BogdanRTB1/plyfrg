"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import {
    getPendingReferralCode,
    markReferralInviteAcknowledged,
    normalizeReferralCode,
    storePendingReferralCode,
    wasReferralInviteAcknowledged,
} from "@/utils/referralClient";
import ReferralInviteModal, { ReferralInviteInfo } from "@/components/ReferralInviteModal";

/** Captures ?ref=CODE, stores it, and shows invite modal for new visitors. */
export default function ReferralHandler() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const handledRef = useRef<string | null>(null);

    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteInfo, setInviteInfo] = useState<ReferralInviteInfo | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const cleanRefFromUrl = () => {
        const url = new URL(window.location.href);
        if (!url.searchParams.has("ref")) return;
        url.searchParams.delete("ref");
        router.replace(url.pathname + url.search, { scroll: false });
    };

    useEffect(() => {
        const ref = searchParams.get("ref");
        const code = normalizeReferralCode(ref);
        if (!code) return;
        if (handledRef.current === code) return;

        storePendingReferralCode(code);

        if (wasReferralInviteAcknowledged(code)) {
            handledRef.current = code;
            cleanRefFromUrl();
            return;
        }

        handledRef.current = code;

        void (async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                setIsLoggedIn(!!session?.user);

                const res = await fetch(`/api/referral/preview?code=${encodeURIComponent(code)}`);
                const data = await res.json();

                if (!res.ok || !data.valid) {
                    cleanRefFromUrl();
                    return;
                }

                setInviteInfo({
                    inviterName: data.inviterName,
                    avatarUrl: data.avatarUrl,
                    referralCode: data.referralCode || code,
                    referredDiamonds: data.referredDiamonds,
                });
                setInviteOpen(true);
            } catch (err) {
                console.error("Referral preview error:", err);
                cleanRefFromUrl();
            }
        })();
    }, [searchParams, pathname, router]);

    const closeInvite = () => {
        const code = inviteInfo?.referralCode || getPendingReferralCode();
        if (code) markReferralInviteAcknowledged(code);
        setInviteOpen(false);
        cleanRefFromUrl();
    };

    const handleRegister = () => {
        closeInvite();
        window.dispatchEvent(new CustomEvent("open_auth_modal", { detail: "signup" }));
    };

    return (
        <ReferralInviteModal
            isOpen={inviteOpen}
            invite={inviteInfo}
            isLoggedIn={isLoggedIn}
            onRegister={handleRegister}
            onOk={closeInvite}
        />
    );
}
