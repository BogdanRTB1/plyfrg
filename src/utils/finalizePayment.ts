import { SupabaseClient } from "@supabase/supabase-js";
import {
    applyPaymentUpdate,
    creditDepositIfEligible,
    CryptoPaymentRow,
    findCryptoPayment,
} from "@/utils/creditDeposit";
import {
    fetchNowPaymentById,
    isCompletedPaymentStatus,
    verifyNowpaymentsSignature,
} from "@/utils/nowpayments";
import { syncNowPaymentRecord } from "@/utils/syncNowPaymentRecord";

export type NowPaymentsIpnBody = Record<string, unknown>;

export function extractIpnFields(body: NowPaymentsIpnBody) {
    return {
        payment_id: body.payment_id ?? body.paymentId,
        invoice_id: body.invoice_id ?? body.iid ?? body.invoiceId,
        order_id: (body.order_id ?? body.orderId) as string | undefined,
        payment_status: String(body.payment_status ?? body.status ?? ""),
        pay_amount: body.pay_amount,
        pay_currency: body.pay_currency,
        pay_address: body.pay_address,
        actually_paid: body.actually_paid,
        outcome_amount: body.outcome_amount,
    };
}

/** Trust IPN HMAC or verify payment_id directly against NOWPayments API. */
export async function isTrustedNowPaymentsPayload(
    body: NowPaymentsIpnBody,
    signature: string | null
): Promise<boolean> {
    if (verifyNowpaymentsSignature(body, signature)) return true;

    const paymentId = body.payment_id ?? body.paymentId;
    if (paymentId == null) return false;

    const remote = await fetchNowPaymentById(paymentId as string | number);
    if (!remote) return false;

    return String((remote as { payment_id?: unknown }).payment_id) === String(paymentId);
}

export type FinalizePaymentResult = {
    ok: boolean;
    found: boolean;
    credited: boolean;
    paymentRowId?: string;
    reason?: string;
};

/** Update crypto_payments row and credit user — used by IPN and sync-deposit. */
export async function finalizePaymentFromNowPayments(
    admin: SupabaseClient,
    body: NowPaymentsIpnBody,
    options?: { skipCredit?: boolean }
): Promise<FinalizePaymentResult> {
    const fields = extractIpnFields(body);

    let payment = await findCryptoPayment(admin, {
        payment_id: fields.payment_id as string | number | null,
        invoice_id: fields.invoice_id as string | number | null,
        order_id: fields.order_id,
    });

    if (!payment && fields.payment_id) {
        const remote = (await fetchNowPaymentById(fields.payment_id)) as Record<string, unknown> | null;
        if (remote) {
            payment = await findCryptoPayment(admin, {
                payment_id: fields.payment_id as string | number,
                invoice_id: remote.invoice_id as string | number | null,
                order_id: String(remote.order_id ?? remote.orderId ?? ""),
            });
        }
    }

    if (!payment) {
        return { ok: true, found: false, credited: false, reason: "db_row_not_found" };
    }

    const npId = fields.payment_id != null ? String(fields.payment_id) : payment.nowpayments_id;
    const status = fields.payment_status || payment.payment_status || "waiting";

    let updateError = (
        await applyPaymentUpdate(admin, payment.id, {
            nowpayments_id: npId,
            payment_status: status,
            pay_amount: fields.pay_amount,
            pay_currency: fields.pay_currency,
            pay_address: fields.pay_address,
            actually_paid: fields.actually_paid,
            outcome_amount: fields.outcome_amount,
        })
    ).error;

    if (updateError?.message?.includes("nowpayments_id")) {
        updateError = (
            await applyPaymentUpdate(admin, payment.id, {
                payment_status: status,
                pay_amount: fields.pay_amount,
                pay_currency: fields.pay_currency,
                pay_address: fields.pay_address,
                actually_paid: fields.actually_paid,
                outcome_amount: fields.outcome_amount,
            })
        ).error;
    }

    if (updateError) {
        console.error("finalizePayment: update failed", updateError);
    }

    let credited = false;
    if (!options?.skipCredit && isCompletedPaymentStatus(status)) {
        const creditResult = await creditDepositIfEligible(admin, payment, status);
        credited = creditResult.credited;
    }

    return {
        ok: true,
        found: true,
        credited,
        paymentRowId: payment.id,
    };
}

/** Pull latest status from NOWPayments API and persist + credit if finished. */
export async function syncAndFinalizePaymentRow(
    admin: SupabaseClient,
    payment: CryptoPaymentRow
): Promise<FinalizePaymentResult> {
    const sync = await syncNowPaymentRecord(admin, payment);
    if (!sync.synced || !sync.remote) {
        return {
            ok: true,
            found: true,
            credited: false,
            paymentRowId: payment.id,
            reason: sync.message ?? "not_on_nowpayments",
        };
    }

    return finalizePaymentFromNowPayments(admin, sync.remote as NowPaymentsIpnBody);
}
