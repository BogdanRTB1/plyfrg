"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    clearPendingReferralCode,
    getPendingReferralCode,
} from "@/utils/referralClient";
import { refreshBalanceFromServer } from "@/utils/balanceClient";
import { REFERRED_DIAMONDS_REWARD } from "@/constants/referrals";
import { toast } from "sonner";

/** After sign-in, applies a pending referral code once (idempotent on server). */
export default function ReferralApplier() {
    const applying = useRef(false);

    useEffect(() => {
        const supabase = createClient();

        const tryApply = async () => {
            const code = getPendingReferralCode();
            if (!code || applying.current) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            applying.current = true;
            try {
                const res = await fetch("/api/referral/apply", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ referralCode: code }),
                });
                const data = await res.json();

                if (data.applied) {
                    clearPendingReferralCode();
                    toast.success(
                        `Invite bonus applied! +${REFERRED_DIAMONDS_REWARD.toLocaleString()} Diamonds.`
                    );
                    await refreshBalanceFromServer();
                    return;
                }

                if (
                    data.reason === "already_referred" ||
                    data.reason === "account_too_old"
                ) {
                    clearPendingReferralCode();
                }
            } catch (err) {
                console.error("Referral apply error:", err);
            } finally {
                applying.current = false;
            }
        };

        void tryApply();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN") {
                void tryApply();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return null;
}
