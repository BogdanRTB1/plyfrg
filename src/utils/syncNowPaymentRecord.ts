import { SupabaseClient } from "@supabase/supabase-js";
import { findNowPaymentOnPaymentsApi } from "@/utils/nowpayments";
import { applyPaymentUpdate } from "@/utils/creditDeposit";

export type CryptoPaymentRecord = {
    id: string;
    nowpayments_id?: string | number | null;
    invoice_id?: string | null;
    order_id?: string | null;
    payment_status?: string | null;
};

type ResolveOptions = { quick?: boolean };

/** Pull latest row from NOWPayments **Payments** API and persist on crypto_payments. */
export async function syncNowPaymentRecord(
    admin: SupabaseClient,
    payment: CryptoPaymentRecord,
    options?: ResolveOptions
): Promise<{
    synced: boolean;
    remote: Record<string, unknown> | null;
    fields?: Record<string, unknown>;
    message?: string;
}> {
    const remote = await findNowPaymentOnPaymentsApi(
        {
            paymentId: payment.nowpayments_id,
            orderId: payment.order_id,
            invoiceId: payment.invoice_id,
        },
        { skipScan: options?.quick, maxPages: options?.quick ? 1 : 5 }
    );

    if (!remote) {
        const waiting = (payment.payment_status || "waiting") === "waiting";
        return {
            synced: false,
            remote: null,
            message: waiting
                ? "No row on NOWPayments Payments yet — invoice opened but crypto not sent. Payment ID appears on the Payments page after checkout."
                : "Payment not found on NOWPayments Payments list. Check order_id / API key (live vs sandbox).",
        };
    }

    const paymentId = remote.payment_id ?? remote.paymentId;
    const status = String(remote.payment_status ?? payment.payment_status ?? "waiting");

    const fields: Record<string, unknown> = {
        nowpayments_id: paymentId != null ? String(paymentId) : payment.nowpayments_id,
        payment_status: status,
        pay_amount: remote.pay_amount,
        pay_currency: remote.pay_currency,
        pay_address: remote.pay_address,
        actually_paid: remote.actually_paid,
        outcome_amount: remote.outcome_amount,
    };

    if (remote.invoice_id != null) {
        fields.invoice_id = String(remote.invoice_id);
    }

    await applyPaymentUpdate(admin, payment.id, fields);

    return { synced: true, remote, fields };
}

export type SyncNowPaymentResult = Awaited<ReturnType<typeof syncNowPaymentRecord>>;

/** @deprecated use findNowPaymentOnPaymentsApi */
export async function resolveRemoteNowPayment(
    payment: CryptoPaymentRecord,
    options?: ResolveOptions
): Promise<Record<string, unknown> | null> {
    return findNowPaymentOnPaymentsApi(
        {
            paymentId: payment.nowpayments_id,
            orderId: payment.order_id,
            invoiceId: payment.invoice_id,
        },
        { skipScan: options?.quick, maxPages: options?.quick ? 1 : 5 }
    );
}
