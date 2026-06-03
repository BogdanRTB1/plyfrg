/** Supported deposit coins — shown in wallet; mapped per payment provider on the server. */
export type DepositCurrencyId =
    | "sol"
    | "eth"
    | "btc"
    | "usdt"
    | "ltc"
    | "trx"
    | "bnb"
    | "doge";

export type DepositCurrencyOption = {
    id: DepositCurrencyId;
    label: string;
    symbol: string;
    /** Accent for selected chip in wallet UI */
    accent: string;
};

export const DEPOSIT_CURRENCY_OPTIONS: DepositCurrencyOption[] = [
    { id: "sol", label: "Solana", symbol: "SOL", accent: "#9945FF" },
    { id: "eth", label: "Ethereum", symbol: "ETH", accent: "#627EEA" },
    { id: "btc", label: "Bitcoin", symbol: "BTC", accent: "#F7931A" },
    { id: "usdt", label: "Tether", symbol: "USDT", accent: "#26A17B" },
    { id: "ltc", label: "Litecoin", symbol: "LTC", accent: "#345D9D" },
    { id: "trx", label: "Tron", symbol: "TRX", accent: "#EF0027" },
    { id: "bnb", label: "BNB", symbol: "BNB", accent: "#F3BA2F" },
    { id: "doge", label: "Dogecoin", symbol: "DOGE", accent: "#C2A633" },
];

export const DEFAULT_DEPOSIT_CURRENCY: DepositCurrencyId = "sol";

export const DEPOSIT_CURRENCY_IDS = new Set(
    DEPOSIT_CURRENCY_OPTIONS.map((c) => c.id)
);

export function getDepositCurrencyOption(id: DepositCurrencyId) {
    return DEPOSIT_CURRENCY_OPTIONS.find((c) => c.id === id);
}

/** NOWPayments `pay_currency` param */
export const NOWPAYMENTS_PAY_CURRENCY: Record<DepositCurrencyId, string> = {
    sol: "sol",
    eth: "eth",
    btc: "btc",
    usdt: "usdttrc20",
    ltc: "ltc",
    trx: "trx",
    bnb: "bnbbsc",
    doge: "doge",
};

/** Cryptomus `to_currency` (+ optional `network`) */
export const CRYPTOMUS_TO_CURRENCY: Record<
    DepositCurrencyId,
    { currency: string; network?: string }
> = {
    sol: { currency: "SOL" },
    eth: { currency: "ETH" },
    btc: { currency: "BTC" },
    usdt: { currency: "USDT", network: "tron" },
    ltc: { currency: "LTC" },
    trx: { currency: "TRX" },
    bnb: { currency: "BNB", network: "bsc" },
    doge: { currency: "DOGE" },
};
