import { SupabaseClient } from "@supabase/supabase-js";
import {
    buildNowPaymentLookup,
    fetchAllNowPaymentsPages,
    findNowPaymentOnPaymentsApi,
    NowPaymentLookup,
} from "@/utils/nowpayments";
import { applyPaymentUpdate } from "@/utils/creditDeposit";

export type CryptoPaymentRecord = {
    id: string;
    nowpayments_id?: string | number | null;
    invoice_id?: string | null;
    order_id?: string | null;
    payment_status?: string | null;
    credited?: boolean | null;
};

type ResolveOptions = { quick?: boolean; lookup?: NowPaymentLookup; maxPages?: number };

function remoteToFields(
    payment: CryptoPaymentRecord,
    remote: Record<string, unknown>
): Record<string, unknown> {
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
    } else if (remote.iid != null && !payment.invoice_id) {
        fields.invoice_id = String(remote.iid);
    }

    const remoteOrderId = String(remote.order_id ?? remote.orderId ?? "").trim();
    if (remoteOrderId && !payment.order_id) {
        fields.order_id = remoteOrderId;
    }

    return fields;
}

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
        {
            lookup: options?.lookup,
            skipScan: options?.quick && !options?.lookup,
            maxPages: options?.maxPages ?? (options?.quick ? 3 : 10),
        }
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

    const fields = remoteToFields(payment, remote);
    await applyPaymentUpdate(admin, payment.id, fields);

    return { synced: true, remote, fields };
}

export type SyncNowPaymentResult = Awaited<ReturnType<typeof syncNowPaymentRecord>>;

export type ReconcileResult = {
    npPaymentsFetched: number;
    synced: number;
    notFound: number;
    syncedRemotes: Array<{ payment: CryptoPaymentRecord; remote: Record<string, unknown> }>;
};

/**
 * Bulk reconcile: fetch NOWPayments **Payments** list once, match all DB rows in memory.
 * Used by admin "Sync from NOWPayments" so finished payments are found reliably.
 */
export async function reconcileCryptoPaymentsFromNowPayments(
    admin: SupabaseClient,
    dbRows: CryptoPaymentRecord[],
    options?: { maxPages?: number }
): Promise<ReconcileResult> {
    const maxPages = options?.maxPages ?? 20;
    const npPayments = await fetchAllNowPaymentsPages(maxPages);
    const lookup = buildNowPaymentLookup(npPayments);

    let synced = 0;
    let notFound = 0;
    const syncedRemotes: ReconcileResult["syncedRemotes"] = [];

    for (const payment of dbRows) {
        if (payment.credited) continue;

        const result = await syncNowPaymentRecord(admin, payment, { lookup });
        if (!result.synced || !result.remote) {
            notFound += 1;
            continue;
        }

        synced += 1;
        Object.assign(payment, result.fields);
        syncedRemotes.push({ payment, remote: result.remote });
    }

    return {
        npPaymentsFetched: npPayments.length,
        synced,
        notFound,
        syncedRemotes,
    };
}

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
        {
            lookup: options?.lookup,
            skipScan: options?.quick,
            maxPages: options?.maxPages ?? 10,
        }
    );
}
