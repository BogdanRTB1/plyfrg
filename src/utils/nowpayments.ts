import crypto from "crypto";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const NOWPAYMENTS_BASE = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!;

/** Statuses that mean the customer paid and we should credit the bundle. */
export const COMPLETED_PAYMENT_STATUSES = new Set([
    "finished",
    "confirmed",
]);

export function isCompletedPaymentStatus(status: string | null | undefined): boolean {
    if (!status) return false;
    return COMPLETED_PAYMENT_STATUSES.has(String(status).toLowerCase());
}

/** Recursively sort object keys (required for NOWPayments IPN signature). */
export function sortPayloadKeys(value: unknown): unknown {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
        return value;
    }
    const obj = value as Record<string, unknown>;
    return Object.keys(obj)
        .sort()
        .reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = sortPayloadKeys(obj[key]);
            return acc;
        }, {});
}

export function verifyNowpaymentsSignature(
    payload: Record<string, unknown>,
    receivedSig: string | null
): boolean {
    if (!IPN_SECRET || !receivedSig) return false;
    const sorted = sortPayloadKeys(payload) as Record<string, unknown>;
    const hmac = crypto.createHmac("sha512", IPN_SECRET);
    hmac.update(JSON.stringify(sorted));
    return hmac.digest("hex") === receivedSig;
}

export async function fetchNowPaymentById(paymentId: string | number) {
    if (!NOWPAYMENTS_API_KEY || !paymentId) return null;
    try {
        const res = await fetch(`${NOWPAYMENTS_BASE}/payment/${paymentId}`, {
            headers: { "x-api-key": NOWPAYMENTS_API_KEY },
            cache: "no-store",
        });
        if (!res.ok) {
            console.error("NOWPayments get payment failed:", res.status, await res.text());
            return null;
        }
        return res.json();
    } catch (err) {
        console.error("NOWPayments get payment error:", err);
        return null;
    }
}

/** List payments filtered by merchant order_id (invoice flow). */
export async function fetchNowPaymentsByOrderId(orderId: string) {
    if (!NOWPAYMENTS_API_KEY || !orderId) return [];
    try {
        const url = new URL(`${NOWPAYMENTS_BASE}/payments`);
        url.searchParams.set("orderId", orderId);
        url.searchParams.set("limit", "10");
        const res = await fetch(url.toString(), {
            headers: { "x-api-key": NOWPAYMENTS_API_KEY },
            cache: "no-store",
        });
        if (!res.ok) {
            console.error("NOWPayments list payments failed:", res.status, await res.text());
            return [];
        }
        const data = await res.json();
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        return [];
    } catch (err) {
        console.error("NOWPayments list payments error:", err);
        return [];
    }
}
