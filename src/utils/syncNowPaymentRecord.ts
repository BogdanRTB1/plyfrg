import { SupabaseClient } from "@supabase/supabase-js";
import {
    fetchNowPaymentById,
    fetchNowPaymentsByInvoiceId,
    fetchNowPaymentsByOrderId,
    fetchNowPaymentsInvoiceInfo,
    isCompletedPaymentStatus,
} from "@/utils/nowpayments";
import { applyPaymentUpdate } from "@/utils/creditDeposit";

export type CryptoPaymentRecord = {
    id: string;
    nowpayments_id?: string | number | null;
    invoice_id?: string | null;
    order_id?: string | null;
    payment_status?: string | null;
};

function pickBestRemotePayment(list: Record<string, unknown>[]): Record<string, unknown> | null {
    if (!list.length) return null;
    const completed = list.find((p) =>
        isCompletedPaymentStatus(String(p.payment_status ?? ""))
    );
    return completed || list[list.length - 1];
}

/** Resolve latest NOWPayments payment payload for a stored deposit row. */
export async function resolveRemoteNowPayment(
    payment: CryptoPaymentRecord
): Promise<Record<string, unknown> | null> {
    if (payment.nowpayments_id) {
        const byId = await fetchNowPaymentById(payment.nowpayments_id);
        if (byId) return byId as Record<string, unknown>;
    }

    if (payment.invoice_id) {
        const byInvoice = await fetchNowPaymentsByInvoiceId(String(payment.invoice_id));
        const best = pickBestRemotePayment(byInvoice);
        if (best) return best;
    }

    if (payment.order_id) {
        const byOrder = await fetchNowPaymentsByOrderId(payment.order_id);
        const best = pickBestRemotePayment(byOrder);
        if (best) return best;
    }

    return null;
}

export type SyncNowPaymentResult = {
    synced: boolean;
    remote: Record<string, unknown> | null;
    fields?: Record<string, unknown>;
    /** Invoice on NP exists; customer has not sent crypto yet — no payment_id. */
    pendingInvoice?: boolean;
    message?: string;
};

/** Pull status + payment_id from NOWPayments and persist on crypto_payments. */
export async function syncNowPaymentRecord(
    admin: SupabaseClient,
    payment: CryptoPaymentRecord
): Promise<SyncNowPaymentResult> {
    const remote = await resolveRemoteNowPayment(payment);
    if (!remote) {
        if (payment.invoice_id) {
            const invoiceInfo = await fetchNowPaymentsInvoiceInfo(String(payment.invoice_id));
            if (invoiceInfo) {
                return {
                    synced: false,
                    remote: null,
                    pendingInvoice: true,
                    message:
                        "Invoice exists on NOWPayments, but no crypto payment was started yet. Payment ID appears only after the customer pays on the invoice page.",
                };
            }
        }
        return {
            synced: false,
            remote: null,
            message:
                payment.payment_status === "waiting"
                    ? "No payment on NOWPayments yet — complete the invoice checkout or wait for the customer to pay. Use Invoice ID until then."
                    : "No matching payment found on NOWPayments. Check invoice/order id or API key (live vs sandbox).",
        };
    }

    const paymentId = remote.payment_id ?? remote.paymentId;
    const fields: Record<string, unknown> = {
        nowpayments_id: paymentId != null ? String(paymentId) : payment.nowpayments_id,
        payment_status: remote.payment_status ?? payment.payment_status,
        pay_amount: remote.pay_amount,
        pay_currency: remote.pay_currency,
        pay_address: remote.pay_address,
        actually_paid: remote.actually_paid,
        outcome_amount: remote.outcome_amount,
    };

    if (remote.invoice_id != null && !payment.invoice_id) {
        fields.invoice_id = String(remote.invoice_id);
    }

    await applyPaymentUpdate(admin, payment.id, fields);

    return { synced: true, remote, fields };
}
