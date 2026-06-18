export const DEMO_START_DIAMONDS = 99_999;
export const DEMO_START_FORGES = 99_999;

const DEMO_BALANCE_KEY = "playforges_demo_balance";
const DEMO_ACTIVE_KEY = "playforges_demo_active";
export const DEMO_WIN_MULTIPLIER = 1.65;

export type DemoBalance = {
    diamonds: number;
    forges_coins: number;
};

export function getDefaultDemoBalance(): DemoBalance {
    return { diamonds: DEMO_START_DIAMONDS, forges_coins: DEMO_START_FORGES };
}

export function loadDemoBalance(): DemoBalance {
    if (typeof window === "undefined") return getDefaultDemoBalance();
    try {
        const raw = sessionStorage.getItem(DEMO_BALANCE_KEY);
        if (!raw) return getDefaultDemoBalance();
        const parsed = JSON.parse(raw) as DemoBalance;
        return {
            diamonds: Math.floor(Number(parsed.diamonds ?? DEMO_START_DIAMONDS)),
            forges_coins: Number(Number(parsed.forges_coins ?? DEMO_START_FORGES).toFixed(2)),
        };
    } catch {
        return getDefaultDemoBalance();
    }
}

export function saveDemoBalance(balance: DemoBalance) {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(
        DEMO_BALANCE_KEY,
        JSON.stringify({
            diamonds: Math.floor(balance.diamonds),
            forges_coins: Number(balance.forges_coins.toFixed(2)),
        })
    );
}

export function resetDemoBalance() {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(DEMO_BALANCE_KEY);
}

export function setDemoSessionActive(active: boolean) {
    if (typeof window === "undefined") return;
    if (active) sessionStorage.setItem(DEMO_ACTIVE_KEY, "1");
    else sessionStorage.removeItem(DEMO_ACTIVE_KEY);
}

export function isDemoSessionActive(): boolean {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DEMO_ACTIVE_KEY) === "1";
}

export function scaleDemoWin(amount: number): number {
    if (amount <= 0 || !isDemoSessionActive()) return amount;
    return Number((amount * DEMO_WIN_MULTIPLIER).toFixed(2));
}
