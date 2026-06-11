export type DepositBundle = {
    id: number;
    price: number;
    diamonds: number;
    forgesCoins: number;
};

/** Store bundles — same packages shown in Wallet deposit. */
export const DEPOSIT_BUNDLES: DepositBundle[] = [
    { id: 1, price: 35, diamonds: 35000, forgesCoins: 38 },
    { id: 2, price: 50, diamonds: 50000, forgesCoins: 55 },
    { id: 3, price: 70, diamonds: 70000, forgesCoins: 78 },
    { id: 4, price: 80, diamonds: 80000, forgesCoins: 90 },
    { id: 5, price: 100, diamonds: 100000, forgesCoins: 115 },
    { id: 6, price: 150, diamonds: 150000, forgesCoins: 175 },
    { id: 7, price: 250, diamonds: 250000, forgesCoins: 290 },
    { id: 8, price: 500, diamonds: 500000, forgesCoins: 600 },
];

export const DEPOSIT_BUNDLES_BY_ID: Record<number, DepositBundle> = Object.fromEntries(
    DEPOSIT_BUNDLES.map((b) => [b.id, b])
) as Record<number, DepositBundle>;

export function getDepositBundle(bundleId: number): DepositBundle | undefined {
    return DEPOSIT_BUNDLES_BY_ID[bundleId];
}
