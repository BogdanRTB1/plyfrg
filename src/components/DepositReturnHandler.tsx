"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

/** After NOWPayments success_url redirect, sync deposit and refresh wallet balance. */
export default function DepositReturnHandler() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const handled = useRef(false);

    useEffect(() => {
        const deposit = searchParams.get("deposit");
        if (!deposit || handled.current) return;
        if (deposit !== "success" && deposit !== "cancel") return;

        handled.current = true;

        const cleanUrl = () => {
            const url = new URL(window.location.href);
            url.searchParams.delete("deposit");
            router.replace(url.pathname + url.search, { scroll: false });
        };

        if (deposit === "cancel") {
            toast.message("Payment cancelled");
            cleanUrl();
            return;
        }

        void (async () => {
            try {
                const supabase = createClient();
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    toast.error("Please log in to complete your deposit sync.");
                    cleanUrl();
                    return;
                }

                const pendingRaw = sessionStorage.getItem("pending_crypto_payment");
                let pendingPayload: Record<string, string> = {};
                if (pendingRaw) {
                    try {
                        pendingPayload = JSON.parse(pendingRaw);
                    } catch {
                        pendingPayload = {};
                    }
                }

                const res = await fetch("/api/crypto/sync-deposit", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(pendingPayload),
                });
                const data = await res.json();

                sessionStorage.removeItem("pending_crypto_payment");

                if (!res.ok) {
                    toast.error(data.error || "Could not confirm deposit. Contact support if funds were charged.");
                    cleanUrl();
                    return;
                }

                if (data.credited > 0) {
                    toast.success(
                        `Deposit confirmed! +${Number(data.diamondsAdded || 0).toLocaleString()} Diamonds and +${Number(data.forgesAdded || 0)} Forges Coins.`
                    );
                    if (data.balance) {
                        localStorage.setItem("user_diamonds", String(data.balance.diamonds));
                        localStorage.setItem("user_forges_coins", String(data.balance.forges_coins));
                    }
                    window.dispatchEvent(new Event("balance_updated"));
                } else if ((data.updated ?? 0) > 0) {
                    toast.info(
                        "Payment recorded — waiting for blockchain confirmation. Balance updates when status is finished."
                    );
                } else {
                    toast.info(
                        "Payment received — your balance will update in a few minutes once confirmed on the network."
                    );
                }
            } catch (err) {
                console.error("Deposit sync error:", err);
                toast.error("Could not sync deposit. Please refresh or contact support.");
            } finally {
                cleanUrl();
            }
        })();
    }, [searchParams, pathname, router]);

    return null;
}
