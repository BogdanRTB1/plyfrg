import crypto from "crypto";
import { isCompletedPaymentStatus } from "@/utils/paymentStatus";

const CRYPTOMUS_BASE = process.env.CRYPTOMUS_API_URL || "https://api.cryptomus.com/v1";
const MERCHANT_ID = process.env.CRYPTOMUS_MERCHANT_ID!;
const PAYMENT_API_KEY = process.env.CRYPTOMUS_PAYMENT_API_KEY!;

export type CryptomusPayment = Record<string, unknown>;

function signBody(jsonBody: string): string {
    return crypto
        .createHash("md5")
        .update(Buffer.from(jsonBody).toString("base64") + PAYMENT_API_KEY)
        .digest("hex");
}

export function verifyCryptomusWebhook(body: Record<string, unknown>): boolean {
    if (!PAYMENT_API_KEY) return false;
    const received = String(body.sign ?? "");
    if (!received) return false;

    const payload = { ...body };
    delete payload.sign;
    return signBody(JSON.stringify(payload)) === received;
}

async function cryptomusPost<T = CryptomusPayment>(
    path: string,
    body: Record<string, unknown>
): Promise<T | null> {
    if (!MERCHANT_ID || !PAYMENT_API_KEY) {
        console.error("Cryptomus: CRYPTOMUS_MERCHANT_ID and CRYPTOMUS_PAYMENT_API_KEY required");
        return null;
    }

    const jsonBody = JSON.stringify(body);
    try {
        const res = await fetch(`${CRYPTOMUS_BASE}${path}`, {
            method: "POST",
            headers: {
                merchant: MERCHANT_ID,
                sign: signBody(jsonBody),
                "Content-Type": "application/json",
            },
            body: jsonBody,
            cache: "no-store",
        });

        const data = (await res.json()) as { state?: number; result?: T; message?: string };
        if (!res.ok || data.state !== 0 || !data.result) {
            console.error("Cryptomus API error:", path, res.status, data);
            return null;
        }
        return data.result;
    } catch (err) {
        console.error("Cryptomus request error:", path, err);
        return null;
    }
}

export type CreateCryptomusInvoiceParams = {
    amount: number;
    orderId: string;
    urlCallback: string;
    urlSuccess: string;
    urlReturn: string;
    toCurrency?: string;
    network?: string;
};

export async function createCryptomusInvoice(params: CreateCryptomusInvoiceParams) {
    const body: Record<string, unknown> = {
        amount: String(params.amount),
        currency: "USD",
        order_id: params.orderId,
        url_callback: params.urlCallback,
        url_success: params.urlSuccess,
        url_return: params.urlReturn,
        is_payment_multiple: false,
        lifetime: 3600,
    };

    if (params.toCurrency) {
        body.to_currency = params.toCurrency.toUpperCase();
    }
    if (params.network) {
        body.network = params.network;
    }

    return cryptomusPost<CryptomusPayment>("/payment", body);
}

export async function fetchCryptomusPaymentInfo(criteria: {
    uuid?: string | null;
    orderId?: string | null;
}): Promise<CryptomusPayment | null> {
    const body: Record<string, unknown> = {};
    if (criteria.uuid) body.uuid = criteria.uuid;
    if (criteria.orderId) body.order_id = criteria.orderId;
    if (!body.uuid && !body.order_id) return null;
    return cryptomusPost<CryptomusPayment>("/payment/info", body);
}

export function cryptomusStatus(payment: CryptomusPayment): string {
    return String(payment.payment_status ?? payment.status ?? "process");
}

export function cryptomusFieldsFromRemote(remote: CryptomusPayment) {
    const uuid = String(remote.uuid ?? "");
    const status = cryptomusStatus(remote);
    return {
        payment_id: uuid,
        invoice_id: uuid,
        order_id: String(remote.order_id ?? ""),
        payment_status: status,
        pay_amount: remote.payer_amount ?? remote.amount,
        pay_currency: remote.payer_currency ?? remote.currency,
        pay_address: remote.address,
        actually_paid: remote.payment_amount,
        outcome_amount: remote.merchant_amount ?? remote.payment_amount_usd,
        invoice_url: remote.url,
    };
}

export function isCryptomusWebhookPayload(body: Record<string, unknown>): boolean {
    return typeof body.sign === "string" && (body.uuid != null || body.order_id != null);
}

export { isCompletedPaymentStatus };
