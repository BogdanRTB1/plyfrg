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

function npHeaders(): HeadersInit {
    return { "x-api-key": NOWPAYMENTS_API_KEY };
}

/** Single row from NOWPayments **Payments** tab (`GET /payment/:id`). */
export async function fetchNowPaymentById(paymentId: string | number) {
    if (!NOWPAYMENTS_API_KEY || paymentId == null) return null;
    try {
        const res = await fetch(`${NOWPAYMENTS_BASE}/payment/${paymentId}`, {
            headers: npHeaders(),
            cache: "no-store",
        });
        if (!res.ok) {
            console.error("NOWPayments GET /payment/:id failed:", res.status, await res.text());
            return null;
        }
        return res.json();
    } catch (err) {
        console.error("NOWPayments get payment error:", err);
        return null;
    }
}

function normalizePaymentsList(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (data && typeof data === "object") {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.data)) return obj.data as Record<string, unknown>[];
        if (Array.isArray(obj.payments)) return obj.payments as Record<string, unknown>[];
        if (Array.isArray(obj.result)) return obj.result as Record<string, unknown>[];
    }
    return [];
}

function paymentRowId(p: Record<string, unknown>): string {
    return String(p.payment_id ?? p.paymentId ?? p.id ?? "");
}

function paymentMatchesInvoice(p: Record<string, unknown>, invoiceId: string): boolean {
    const inv = String(p.invoice_id ?? p.invoiceId ?? p.iid ?? "");
    return inv === invoiceId;
}

function paymentMatchesOrder(p: Record<string, unknown>, orderId: string): boolean {
    return String(p.order_id ?? p.orderId ?? "") === orderId;
}

function paymentOrderId(p: Record<string, unknown>): string {
    return String(p.order_id ?? p.orderId ?? "").trim();
}

function paymentInvoiceId(p: Record<string, unknown>): string {
    return String(p.invoice_id ?? p.invoiceId ?? p.iid ?? "").trim();
}

function shouldReplacePayment(
    current: Record<string, unknown>,
    candidate: Record<string, unknown>
): boolean {
    const currentDone = isCompletedPaymentStatus(String(current.payment_status ?? ""));
    const candidateDone = isCompletedPaymentStatus(String(candidate.payment_status ?? ""));
    if (candidateDone && !currentDone) return true;
    if (currentDone && !candidateDone) return false;
    return true;
}

export type FindNowPaymentCriteria = {
    paymentId?: string | number | null;
    orderId?: string | null;
    invoiceId?: string | null;
};

export type NowPaymentLookup = {
    byPaymentId: Map<string, Record<string, unknown>>;
    byOrderId: Map<string, Record<string, unknown>>;
    byInvoiceId: Map<string, Record<string, unknown>>;
    all: Record<string, unknown>[];
};

function putInLookupMap(
    map: Map<string, Record<string, unknown>>,
    key: string,
    payment: Record<string, unknown>
) {
    if (!key) return;
    const existing = map.get(key);
    if (!existing || shouldReplacePayment(existing, payment)) {
        map.set(key, payment);
    }
}

/** Index Payments list for fast in-memory matching (order_id, invoice_id, payment_id). */
export function buildNowPaymentLookup(payments: Record<string, unknown>[]): NowPaymentLookup {
    const byPaymentId = new Map<string, Record<string, unknown>>();
    const byOrderId = new Map<string, Record<string, unknown>>();
    const byInvoiceId = new Map<string, Record<string, unknown>>();

    for (const payment of payments) {
        putInLookupMap(byPaymentId, paymentRowId(payment), payment);
        putInLookupMap(byOrderId, paymentOrderId(payment), payment);
        putInLookupMap(byInvoiceId, paymentInvoiceId(payment), payment);
    }

    return { byPaymentId, byOrderId, byInvoiceId, all: payments };
}

export function lookupNowPaymentInIndex(
    criteria: FindNowPaymentCriteria,
    index: NowPaymentLookup
): Record<string, unknown> | null {
    if (criteria.paymentId != null) {
        const byId = index.byPaymentId.get(String(criteria.paymentId));
        if (byId) return byId;
    }

    const orderId = criteria.orderId?.trim();
    if (orderId) {
        const byOrder = index.byOrderId.get(orderId);
        if (byOrder) return byOrder;
    }

    const invoiceId = criteria.invoiceId != null ? String(criteria.invoiceId) : "";
    if (invoiceId) {
        const byInvoice = index.byInvoiceId.get(invoiceId);
        if (byInvoice) return byInvoice;
    }

    return null;
}

function mergePaymentLists(...lists: Record<string, unknown>[][]): Record<string, unknown>[] {
    const seen = new Set<string>();
    const merged: Record<string, unknown>[] = [];
    for (const list of lists) {
        for (const p of list) {
            const id = paymentRowId(p);
            if (id && seen.has(id)) continue;
            if (id) seen.add(id);
            merged.push(p);
        }
    }
    return merged;
}

/**
 * List from NOWPayments **Payments** API (`GET /v1/payment/`).
 * Dashboard "Payments" page — not "Invoices".
 */
async function fetchPaymentsPage(
    query: Record<string, string>,
    page = 0
): Promise<Record<string, unknown>[]> {
    if (!NOWPAYMENTS_API_KEY) return [];

    const url = new URL(`${NOWPAYMENTS_BASE}/payment/`);
    for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
    }
    if (!query.limit) url.searchParams.set("limit", "100");
    url.searchParams.set("page", String(page));
    url.searchParams.set("sortBy", "created_at");
    url.searchParams.set("orderBy", "desc");

    try {
        const res = await fetch(url.toString(), { headers: npHeaders(), cache: "no-store" });
        if (!res.ok) {
            console.error("NOWPayments GET /payment/ failed:", res.status, await res.text());
            return [];
        }
        return normalizePaymentsList(await res.json());
    } catch (err) {
        console.error("NOWPayments list payments error:", err);
        return [];
    }
}

/** Recent rows from Payments list (paginated). */
export async function fetchRecentNowPayments(maxPages = 3): Promise<Record<string, unknown>[]> {
    return fetchAllNowPaymentsPages(maxPages);
}

/** Fetch multiple pages from GET /payment/ (dashboard Payments tab). */
export async function fetchAllNowPaymentsPages(maxPages = 10): Promise<Record<string, unknown>[]> {
    const merged: Record<string, unknown>[][] = [];
    for (let page = 0; page < maxPages; page += 1) {
        const batch = await fetchPaymentsPage({}, page);
        if (!batch.length) break;
        merged.push(batch);
    }
    return mergePaymentLists(...merged);
}

type FetchPaymentsOptions = { skipScan?: boolean; maxPages?: number };

async function queryPaymentsApi(
    queryVariants: Record<string, string>[],
    options?: FetchPaymentsOptions
): Promise<Record<string, unknown>[]> {
    const fromFilters: Record<string, unknown>[][] = [];
    for (const q of queryVariants) {
        fromFilters.push(await fetchPaymentsPage(q, 0));
    }
    return mergePaymentLists(...fromFilters);
}

/** Find payment rows on NOWPayments **Payments** by merchant order_id. */
export async function fetchNowPaymentsByOrderId(orderId: string, options?: FetchPaymentsOptions) {
    if (!orderId) return [];
    const list = await queryPaymentsApi([{ orderId }, { order_id: orderId }], options);
    const matched = list.filter((p) => paymentMatchesOrder(p, orderId));
    if (matched.length) return matched;

    if (options?.skipScan) return [];
    const recent = await fetchRecentNowPayments(options?.maxPages ?? 5);
    return recent.filter((p) => paymentMatchesOrder(p, orderId));
}

/** Find payment rows linked to an invoice (Payments API, not Invoices API). */
export async function fetchNowPaymentsByInvoiceId(invoiceId: string, options?: FetchPaymentsOptions) {
    if (!invoiceId) return [];
    const list = await queryPaymentsApi(
        [{ invoiceid: invoiceId }, { invoiceId }, { invoice_id: invoiceId }],
        options
    );
    const matched = list.filter((p) => paymentMatchesInvoice(p, invoiceId));
    if (matched.length) return matched;

    if (options?.skipScan) return [];
    const recent = await fetchRecentNowPayments(options?.maxPages ?? 5);
    return recent.filter((p) => paymentMatchesInvoice(p, invoiceId));
}

function pickBestPayment(list: Record<string, unknown>[]): Record<string, unknown> | null {
    if (!list.length) return null;
    const completed = list.find((p) =>
        isCompletedPaymentStatus(String(p.payment_status ?? ""))
    );
    return completed || list[0];
}

/**
 * Resolve a payment from NOWPayments **Payments** (completed transactions).
 * Order: payment_id → order_id → invoice_id → scan recent Payments list.
 */
export async function findNowPaymentOnPaymentsApi(
    criteria: FindNowPaymentCriteria,
    options?: FetchPaymentsOptions & { lookup?: NowPaymentLookup }
): Promise<Record<string, unknown> | null> {
    if (options?.lookup) {
        return lookupNowPaymentInIndex(criteria, options.lookup);
    }

    if (criteria.paymentId != null) {
        const byId = await fetchNowPaymentById(criteria.paymentId);
        if (byId) return byId as Record<string, unknown>;
    }

    const orderId = criteria.orderId?.trim();
    if (orderId) {
        const byOrder = await fetchNowPaymentsByOrderId(orderId, options);
        const best = pickBestPayment(byOrder);
        if (best) return best;
    }

    const invoiceId = criteria.invoiceId != null ? String(criteria.invoiceId) : "";
    if (invoiceId) {
        const byInvoice = await fetchNowPaymentsByInvoiceId(invoiceId, options);
        const best = pickBestPayment(byInvoice);
        if (best) return best;
    }

    if (!options?.skipScan && (orderId || invoiceId)) {
        const recent = await fetchRecentNowPayments(options?.maxPages ?? 10);
        const match = recent.find(
            (p) =>
                (orderId && paymentMatchesOrder(p, orderId)) ||
                (invoiceId && paymentMatchesInvoice(p, invoiceId))
        );
        if (match) return match;
    }

    return null;
}
