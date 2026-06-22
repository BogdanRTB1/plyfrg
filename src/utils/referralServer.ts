import crypto from "crypto";
import { SupabaseClient } from "@supabase/supabase-js";
import {
    REFERRAL_NEW_ACCOUNT_MAX_AGE_MS,
    REFERRED_DIAMONDS_REWARD,
    REFERRER_FC_REWARD,
    REFERRER_PROFIT_SHARE,
} from "@/constants/referrals";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(): string {
    const bytes = crypto.randomBytes(8);
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
    }
    return code;
}

export function normalizeReferralCode(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const code = raw.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,16}$/.test(code)) return null;
    return code;
}

export async function ensureUserReferralCode(
    admin: SupabaseClient,
    userId: string
): Promise<{ code: string | null; error?: string }> {
    const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .maybeSingle();

    if (profileError) {
        console.error("ensureUserReferralCode: profile fetch", profileError);
        return { code: null, error: "profile_fetch_failed" };
    }

    if (profile?.referral_code) {
        return { code: String(profile.referral_code).toUpperCase() };
    }

    for (let attempt = 0; attempt < 8; attempt++) {
        const candidate = generateReferralCode();
        const { data: updated, error: updateError } = await admin
            .from("profiles")
            .update({ referral_code: candidate })
            .eq("id", userId)
            .is("referral_code", null)
            .select("referral_code")
            .maybeSingle();

        if (!updateError && updated?.referral_code) {
            return { code: String(updated.referral_code).toUpperCase() };
        }

        const { data: inserted, error: insertError } = await admin
            .from("profiles")
            .upsert({ id: userId, referral_code: candidate }, { onConflict: "id" })
            .select("referral_code")
            .maybeSingle();

        if (!insertError && inserted?.referral_code) {
            return { code: String(inserted.referral_code).toUpperCase() };
        }
    }

    return { code: null, error: "code_generation_failed" };
}

export type ApplyReferralResult = {
    applied: boolean;
    reason?: string;
    referrerFcAdded?: number;
    referredDiamondsAdded?: number;
};

async function creditBalance(
    admin: SupabaseClient,
    userId: string,
    diamondsDelta: number,
    fcDelta: number
): Promise<boolean> {
    const { data: balance, error: balanceError } = await admin
        .from("user_balances")
        .select("diamonds, forges_coins")
        .eq("id", userId)
        .maybeSingle();

    if (balanceError) {
        console.error("referral creditBalance fetch:", balanceError);
        return false;
    }

    const currentDiamonds = Math.floor(Number(balance?.diamonds ?? 0));
    const currentFc = Number(Number(balance?.forges_coins ?? 0).toFixed(2));

    const { error: upsertError } = await admin.from("user_balances").upsert(
        {
            id: userId,
            diamonds: currentDiamonds + Math.floor(diamondsDelta),
            forges_coins: Number((currentFc + fcDelta).toFixed(2)),
            updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
    );

    if (upsertError) {
        console.error("referral creditBalance upsert:", upsertError);
        return false;
    }

    return true;
}

export async function applyReferralForUser(
    admin: SupabaseClient,
    referredUserId: string,
    rawCode: string
): Promise<ApplyReferralResult> {
    const referralCode = normalizeReferralCode(rawCode);
    if (!referralCode) {
        return { applied: false, reason: "invalid_code" };
    }

    const { data: existingReferral } = await admin
        .from("referrals")
        .select("id")
        .eq("referred_id", referredUserId)
        .maybeSingle();

    if (existingReferral) {
        return { applied: false, reason: "already_referred" };
    }

    const { data: referredProfile } = await admin
        .from("profiles")
        .select("referred_by")
        .eq("id", referredUserId)
        .maybeSingle();

    if (referredProfile?.referred_by) {
        return { applied: false, reason: "already_referred" };
    }

    const { data: authData, error: authError } = await admin.auth.admin.getUserById(referredUserId);
    if (authError || !authData?.user) {
        return { applied: false, reason: "user_not_found" };
    }

    const createdAt = new Date(authData.user.created_at || 0).getTime();
    if (Date.now() - createdAt > REFERRAL_NEW_ACCOUNT_MAX_AGE_MS) {
        return { applied: false, reason: "account_too_old" };
    }

    const { data: referrerProfile, error: referrerError } = await admin
        .from("profiles")
        .select("id, referral_code")
        .ilike("referral_code", referralCode)
        .maybeSingle();

    if (referrerError || !referrerProfile?.id) {
        return { applied: false, reason: "referrer_not_found" };
    }

    const referrerId = referrerProfile.id;
    if (referrerId === referredUserId) {
        return { applied: false, reason: "self_referral" };
    }

    const referrerFc = Number(REFERRER_FC_REWARD);
    const referredDiamonds = Math.floor(REFERRED_DIAMONDS_REWARD);

    const referredCredited = await creditBalance(admin, referredUserId, referredDiamonds, 0);
    if (!referredCredited) {
        return { applied: false, reason: "balance_update_failed" };
    }

    const referrerCredited = await creditBalance(admin, referrerId, 0, referrerFc);
    if (!referrerCredited) {
        await creditBalance(admin, referredUserId, -referredDiamonds, 0);
        return { applied: false, reason: "balance_update_failed" };
    }

    const { error: referralInsertError } = await admin.from("referrals").insert({
        referrer_id: referrerId,
        referred_id: referredUserId,
        referral_code: referralCode,
        referrer_fc_reward: referrerFc,
        referred_diamonds_reward: referredDiamonds,
    });

    if (referralInsertError) {
        console.error("referral insert:", referralInsertError);
        await creditBalance(admin, referredUserId, -referredDiamonds, 0);
        await creditBalance(admin, referrerId, 0, -referrerFc);
        if (referralInsertError.code === "23505") {
            return { applied: false, reason: "already_referred" };
        }
        return { applied: false, reason: "record_failed" };
    }

    await admin
        .from("profiles")
        .upsert({ id: referredUserId, referred_by: referrerId }, { onConflict: "id" });

    await Promise.all([
        admin.from("notifications").insert({
            user_id: referredUserId,
            title: "Welcome bonus",
            message: `You received ${referredDiamonds.toLocaleString()} Diamonds from an invite link.`,
            is_read: false,
        }),
        admin.from("notifications").insert({
            user_id: referrerId,
            title: "Referral reward",
            message: `Someone joined with your invite link. You earned ${referrerFc} ForgeCoins. You'll also earn ${Math.round(REFERRER_PROFIT_SHARE * 100)}% of their play profit when they lose.`,
            is_read: false,
        }),
    ]);

    return {
        applied: true,
        referrerFcAdded: referrerFc,
        referredDiamondsAdded: referredDiamonds,
    };
}

export type ReferrerSessionProfitResult = {
    credited: boolean;
    referrerId?: string;
    share?: number;
    currency?: "GC" | "FC";
};

/** Credit referrer with 5% of house profit when a referred user loses a game session. */
export async function creditReferrerSessionProfit(
    admin: SupabaseClient,
    referredUserId: string,
    params: {
        wagered: number;
        payout: number;
        currency: "GC" | "FC";
        gameName?: string;
    }
): Promise<ReferrerSessionProfitResult> {
    const wagered = Number(params.wagered);
    const payout = Number(params.payout);
    if (!Number.isFinite(wagered) || !Number.isFinite(payout) || wagered <= payout) {
        return { credited: false };
    }

    const houseProfit = Number((wagered - payout).toFixed(2));
    if (houseProfit <= 0) {
        return { credited: false };
    }

    const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("referred_by")
        .eq("id", referredUserId)
        .maybeSingle();

    if (profileError) {
        console.error("referral session profit profile:", profileError);
        return { credited: false };
    }

    const referrerId = profile?.referred_by as string | undefined;
    if (!referrerId || referrerId === referredUserId) {
        return { credited: false };
    }

    const share = Number((houseProfit * REFERRER_PROFIT_SHARE).toFixed(2));
    if (share <= 0) {
        return { credited: false };
    }

    const fcDelta = params.currency === "FC" ? share : 0;
    const diamondsDelta = params.currency === "GC" ? Math.floor(share) : 0;
    if (fcDelta <= 0 && diamondsDelta <= 0) {
        return { credited: false };
    }

    const credited = await creditBalance(admin, referrerId, diamondsDelta, fcDelta);
    if (!credited) {
        return { credited: false };
    }

    const { error: earningsError } = await admin.from("referral_earnings").insert({
        referrer_id: referrerId,
        referred_id: referredUserId,
        game_name: params.gameName || null,
        wagered,
        payout,
        house_profit: houseProfit,
        referrer_share: share,
        currency: params.currency,
    });

    if (earningsError) {
        console.error("referral_earnings insert:", earningsError);
        await creditBalance(admin, referrerId, -diamondsDelta, -fcDelta);
        return { credited: false };
    }

    return { credited: true, referrerId, share, currency: params.currency };
}
