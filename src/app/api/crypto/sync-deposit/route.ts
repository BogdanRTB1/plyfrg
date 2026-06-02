import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    applyPaymentUpdate,
    creditDepositIfEligible,
    CryptoPaymentRow,
} from "@/utils/creditDeposit";
import {
    fetchNowPaymentById,
    fetchNowPaymentsByOrderId,
    isCompletedPaymentStatus,
} from "@/utils/nowpayments";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

async function refreshPaymentFromNowPayments(
    admin: ReturnType<typeof getSupabaseAdmin>,
    payment: CryptoPaymentRow
): Promise<{ status: string; payment: CryptoPaymentRow }> {
    let remote: Record<string, unknown> | null = null;

    if (payment.nowpayments_id) {
        remote = await fetchNowPaymentById(payment.nowpayments_id);
    } else if (payment.order_id) {
        const list = await fetchNowPaymentsByOrderId(payment.order_id);
        const completed = list.find(
            (p: { payment_status?: string }) => isCompletedPaymentStatus(p?.payment_status)
        );
        remote = (completed as Record<string, unknown>) || (list[0] as Record<string, unknown>) || null;
    }

    if (!remote) {
        return { status: payment.payment_status || "waiting", payment };
    }

    const status = String(remote.payment_status || payment.payment_status || "waiting");
    const npId = remote.payment_id != null ? String(remote.payment_id) : payment.nowpayments_id;

    await applyPaymentUpdate(admin, payment.id, {
        nowpayments_id: npId,
        payment_status: status,
        pay_amount: remote.pay_amount,
        pay_currency: remote.pay_currency,
        pay_address: remote.pay_address,
        actually_paid: remote.actually_paid,
        outcome_amount: remote.outcome_amount,
    });

    return {
        status,
        payment: {
            ...payment,
            nowpayments_id: npId,
            payment_status: status,
        },
    };
}

/** Called after NOWPayments success redirect — reconciles pending deposits and credits balance. */
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const admin = getSupabaseAdmin();
        const { data: { user }, error: authError } = await admin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: pending, error: listError } = await admin
            .from("crypto_payments")
            .select("*")
            .eq("user_id", user.id)
            .eq("credited", false)
            .order("created_at", { ascending: false })
            .limit(5);

        if (listError) {
            console.error("sync-deposit list error:", listError);
            return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
        }

        let creditedCount = 0;
        let diamondsAdded = 0;
        let forgesAdded = 0;

        for (const row of (pending || []) as CryptoPaymentRow[]) {
            const { status, payment: refreshed } = await refreshPaymentFromNowPayments(admin, row);

            if (!isCompletedPaymentStatus(status)) continue;

            const result = await creditDepositIfEligible(admin, refreshed, status);
            if (result.credited) {
                creditedCount += 1;
                diamondsAdded += Math.floor(Number(refreshed.bundle_diamonds || 0));
                forgesAdded += Number(refreshed.bundle_forges_coins || 0);
            }
        }

        const { data: balance } = await admin
            .from("user_balances")
            .select("diamonds, forges_coins")
            .eq("id", user.id)
            .maybeSingle();

        return NextResponse.json({
            success: true,
            credited: creditedCount,
            diamondsAdded,
            forgesAdded,
            balance: {
                diamonds: Math.floor(Number(balance?.diamonds || 0)),
                forges_coins: Number(Number(balance?.forges_coins || 0).toFixed(2)),
            },
        });
    } catch (err) {
        console.error("sync-deposit error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
