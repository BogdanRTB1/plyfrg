import { SupabaseClient } from "@supabase/supabase-js";
import { isCompletedPaymentStatus } from "@/utils/paymentStatus";

export type CryptoPaymentRow = {
    id: string;
    user_id: string;
    nowpayments_id?: string | number | null;
    invoice_id?: string | null;
    order_id?: string | null;
    payment_status?: string | null;
    bundle_diamonds?: number | null;
    bundle_forges_coins?: number | null;
    credited?: boolean | null;
    price_amount?: number | null;
};

export async function applyPaymentUpdate(
    admin: SupabaseClient,
    paymentId: string,
    fields: Record<string, unknown>
) {
    return admin
        .from("crypto_payments")
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq("id", paymentId);
}

/** Credit bundle to user_balances (source of truth for the app). Idempotent via `credited` flag. */
export async function creditDepositIfEligible(
    admin: SupabaseClient,
    payment: CryptoPaymentRow,
    paymentStatus: string
): Promise<{ credited: boolean; reason?: string }> {
    if (payment.credited) {
        return { credited: false, reason: "already_credited" };
    }

    if (!isCompletedPaymentStatus(paymentStatus)) {
        return { credited: false, reason: "not_completed" };
    }

    const diamondsToAdd = Math.floor(Number(payment.bundle_diamonds || 0));
    const fcToAdd = Number(Number(payment.bundle_forges_coins || 0).toFixed(2));

    const { data: balance, error: balanceError } = await admin
        .from("user_balances")
        .select("diamonds, forges_coins")
        .eq("id", payment.user_id)
        .maybeSingle();

    if (balanceError) {
        console.error("creditDeposit: balance fetch error", balanceError);
        return { credited: false, reason: "balance_fetch_failed" };
    }

    const currentDiamonds = Math.floor(Number(balance?.diamonds || 0));
    const currentFc = Number(Number(balance?.forges_coins || 0).toFixed(2));

    const { error: upsertError } = await admin.from("user_balances").upsert(
        {
            id: payment.user_id,
            diamonds: currentDiamonds + diamondsToAdd,
            forges_coins: Number((currentFc + fcToAdd).toFixed(2)),
            updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
    );

    if (upsertError) {
        console.error("creditDeposit: upsert error", upsertError);
        return { credited: false, reason: "balance_upsert_failed" };
    }

    const { error: markError } = await admin
        .from("crypto_payments")
        .update({
            credited: true,
            payment_status: paymentStatus,
            updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id)
        .eq("credited", false);

    if (markError) {
        console.error("creditDeposit: mark credited error", markError);
        return { credited: false, reason: "mark_credited_failed" };
    }

    await admin.from("notifications").insert({
        user_id: payment.user_id,
        title: "💎 Deposit Confirmed!",
        message: `Your payment of $${payment.price_amount ?? ""} was confirmed. ${diamondsToAdd.toLocaleString()} Diamonds and ${fcToAdd} Forges Coins were added to your account.`,
        is_read: false,
    });

    return { credited: true };
}

export async function findCryptoPayment(
    admin: SupabaseClient,
    body: {
        payment_id?: string | number | null;
        invoice_id?: string | number | null;
        order_id?: string | null;
    }
): Promise<CryptoPaymentRow | null> {
    const paymentId = body.payment_id != null ? String(body.payment_id) : null;
    const invoiceId = body.invoice_id != null ? String(body.invoice_id) : null;
    const orderId = body.order_id?.trim() || null;

    if (paymentId) {
        const { data } = await admin
            .from("crypto_payments")
            .select("*")
            .eq("nowpayments_id", paymentId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (data) return data as CryptoPaymentRow;
    }

    if (invoiceId) {
        const { data } = await admin
            .from("crypto_payments")
            .select("*")
            .eq("invoice_id", invoiceId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (data) return data as CryptoPaymentRow;

        const { data: allRecent } = await admin
            .from("crypto_payments")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
        const match = (allRecent || []).find(
            (row) => String(row.invoice_id ?? "") === invoiceId
        );
        if (match) return match as CryptoPaymentRow;
    }

    if (orderId) {
        const { data: byOrder } = await admin
            .from("crypto_payments")
            .select("*")
            .eq("order_id", orderId)
            .limit(1)
            .maybeSingle();
        if (byOrder) return byOrder as CryptoPaymentRow;

        const userId = orderId.split("_bundle_")[0];
        if (userId) {
            const { data: recent } = await admin
                .from("crypto_payments")
                .select("*")
                .eq("user_id", userId)
                .eq("credited", false)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (recent) return recent as CryptoPaymentRow;
        }
    }

    return null;
}
