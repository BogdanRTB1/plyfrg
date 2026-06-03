/** Statuses that mean the customer paid and we should credit the bundle. */
export const COMPLETED_PAYMENT_STATUSES = new Set([
    // NOWPayments
    "finished",
    "confirmed",
    // Cryptomus
    "paid",
    "paid_over",
]);

export const FAILED_PAYMENT_STATUSES = new Set([
    "failed",
    "expired",
    "refunded",
    "fail",
    "cancel",
    "wrong_amount",
    "system_fail",
    "refund_paid",
]);

export function isCompletedPaymentStatus(status: string | null | undefined): boolean {
    if (!status) return false;
    return COMPLETED_PAYMENT_STATUSES.has(String(status).toLowerCase());
}

export function isFailedPaymentStatus(status: string | null | undefined): boolean {
    if (!status) return false;
    return FAILED_PAYMENT_STATUSES.has(String(status).toLowerCase());
}
