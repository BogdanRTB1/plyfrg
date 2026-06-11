import { SupabaseClient } from "@supabase/supabase-js";
import { getDepositBundle } from "@/constants/depositBundles";

export type GrantBundleResult = {
    ok: boolean;
    reason?: string;
    diamondsAdded?: number;
    forgesAdded?: number;
    newBalance?: { diamonds: number; forges_coins: number };
    paymentRowId?: string;
};

export async function grantDepositBundleToUser(
    admin: SupabaseClient,
    options: {
        userId: string;
        bundleId: number;
        grantedByAdminId: string;
        note?: string;
    }
): Promise<GrantBundleResult> {
    const bundle = getDepositBundle(options.bundleId);
    if (!bundle) {
        return { ok: false, reason: "invalid_bundle" };
    }

    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(options.userId);
    if (authError || !authUser?.user) {
        return { ok: false, reason: "user_not_found" };
    }

    const diamondsToAdd = Math.floor(bundle.diamonds);
    const fcToAdd = Number(bundle.forgesCoins.toFixed(2));

    const { data: balance, error: balanceError } = await admin
        .from("user_balances")
        .select("diamonds, forges_coins")
        .eq("id", options.userId)
        .maybeSingle();

    if (balanceError) {
        console.error("grantBundle: balance fetch error", balanceError);
        return { ok: false, reason: "balance_fetch_failed" };
    }

    const currentDiamonds = Math.floor(Number(balance?.diamonds ?? 0));
    const currentFc = Number(Number(balance?.forges_coins ?? 0).toFixed(2));
    const newDiamonds = currentDiamonds + diamondsToAdd;
    const newFc = Number((currentFc + fcToAdd).toFixed(2));

    const { error: upsertError } = await admin.from("user_balances").upsert(
        {
            id: options.userId,
            diamonds: newDiamonds,
            forges_coins: newFc,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
    );

    if (upsertError) {
        console.error("grantBundle: upsert error", upsertError);
        return { ok: false, reason: "balance_upsert_failed" };
    }

    const orderId = `admin_grant_${options.grantedByAdminId}_${bundle.id}_${Date.now()}`;
    const insertPayload: Record<string, unknown> = {
        user_id: options.userId,
        order_id: orderId,
        payment_status: "admin_grant",
        price_amount: bundle.price,
        price_currency: "usd",
        bundle_diamonds: diamondsToAdd,
        bundle_forges_coins: fcToAdd,
        credited: true,
    };

    let paymentRowId: string | undefined;
    const { data: paymentRow, error: paymentError } = await admin
        .from("crypto_payments")
        .insert(insertPayload)
        .select("id")
        .single();

    if (paymentError?.message?.includes("order_id")) {
        const { order_id: _o, ...withoutOrder } = insertPayload;
        const retry = await admin.from("crypto_payments").insert(withoutOrder).select("id").single();
        if (!retry.error) paymentRowId = retry.data?.id;
    } else if (!paymentError) {
        paymentRowId = paymentRow?.id;
    }

    const noteText = options.note?.trim();
    await admin.from("notifications").insert({
        user_id: options.userId,
        title: "Gift package received",
        message: noteText
            ? `${noteText} You received ${diamondsToAdd.toLocaleString()} Diamonds and ${fcToAdd} Forges Coins.`
            : `An admin granted you ${diamondsToAdd.toLocaleString()} Diamonds and ${fcToAdd} Forges Coins ($${bundle.price} bundle).`,
        is_read: false,
    });

    return {
        ok: true,
        diamondsAdded: diamondsToAdd,
        forgesAdded: fcToAdd,
        newBalance: { diamonds: newDiamonds, forges_coins: newFc },
        paymentRowId,
    };
}
