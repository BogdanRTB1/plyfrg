import { createClient } from "@/utils/supabase/client";

export type UserBalance = {
    diamonds: number;
    forges_coins: number;
};

export const BALANCE_REFRESH_EVENT = "balance_refreshed";

export function applyBalanceToStorage(balance: UserBalance) {
    localStorage.setItem("user_diamonds", String(Math.floor(balance.diamonds)));
    localStorage.setItem("user_forges_coins", String(Number(balance.forges_coins.toFixed(2))));
}

export function broadcastBalanceRefresh(balance: UserBalance) {
    applyBalanceToStorage(balance);
    window.dispatchEvent(
        new CustomEvent(BALANCE_REFRESH_EVENT, { detail: balance })
    );
    window.dispatchEvent(new Event("balance_updated"));
}

/** Load authoritative balance from Supabase and notify Header / games / wallet. */
export async function refreshBalanceFromServer(): Promise<UserBalance | null> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    const { data, error } = await supabase
        .from("user_balances")
        .select("diamonds, forges_coins")
        .eq("id", session.user.id)
        .maybeSingle();

    if (error) {
        console.error("refreshBalanceFromServer:", error);
        return null;
    }

    const balance: UserBalance = {
        diamonds: Math.floor(Number(data?.diamonds ?? 0)),
        forges_coins: Number(Number(data?.forges_coins ?? 0).toFixed(2)),
    };

    broadcastBalanceRefresh(balance);
    return balance;
}
