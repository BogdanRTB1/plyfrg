export type CryptoPaymentProvider = "cryptomus" | "nowpayments";

function cryptomusConfigured(): boolean {
    return !!(process.env.CRYPTOMUS_MERCHANT_ID && process.env.CRYPTOMUS_PAYMENT_API_KEY);
}

/** Default: NOWPayments. Cryptomus only when explicitly enabled and credentials are set. */
export function getCryptoPaymentProvider(): CryptoPaymentProvider {
    const raw = (process.env.CRYPTO_PAYMENT_PROVIDER || "nowpayments").toLowerCase();

    if ((raw === "cryptomus" || raw === "cm") && cryptomusConfigured()) {
        return "cryptomus";
    }

    return "nowpayments";
}

export function isCryptomusProvider(): boolean {
    return getCryptoPaymentProvider() === "cryptomus";
}

export function isNowPaymentsProvider(): boolean {
    return getCryptoPaymentProvider() === "nowpayments";
}
