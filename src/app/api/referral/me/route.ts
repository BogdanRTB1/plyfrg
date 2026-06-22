import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { REFERRED_DIAMONDS_REWARD, REFERRER_FC_REWARD, REFERRER_PROFIT_SHARE_PERCENT } from "@/constants/referrals";
import { ensureUserReferralCode } from "@/utils/referralServer";
import { buildAppUrl } from "@/utils/siteUrl";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const admin = getSupabaseAdmin();
        const { data: { user }, error: authError } = await admin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { code, error } = await ensureUserReferralCode(admin, user.id);
        if (!code) {
            return NextResponse.json(
                { error: error || "Could not load referral code" },
                { status: 500 }
            );
        }

        const inviteLink = `${buildAppUrl("/", req)}?ref=${encodeURIComponent(code)}`;

        const [{ count: referralCount }, { data: profile }, earningsRes] = await Promise.all([
            admin
                .from("referrals")
                .select("id", { count: "exact", head: true })
                .eq("referrer_id", user.id),
            admin
                .from("profiles")
                .select("referred_by")
                .eq("id", user.id)
                .maybeSingle(),
            admin
                .from("referral_earnings")
                .select("referrer_share, currency")
                .eq("referrer_id", user.id),
        ]);

        let referralEarningsFc = 0;
        let referralEarningsDiamonds = 0;
        if (!earningsRes.error) {
            for (const row of earningsRes.data || []) {
            const share = Number(row.referrer_share || 0);
            if (row.currency === "GC") referralEarningsDiamonds += share;
            else referralEarningsFc += share;
            }
        }

        return NextResponse.json({
            referralCode: code,
            inviteLink,
            referralCount: referralCount ?? 0,
            wasReferred: !!profile?.referred_by,
            referralEarningsFc: Number(referralEarningsFc.toFixed(2)),
            referralEarningsDiamonds: Math.floor(referralEarningsDiamonds),
            rewards: {
                referrerForgesCoins: REFERRER_FC_REWARD,
                referredDiamonds: REFERRED_DIAMONDS_REWARD,
                referrerProfitSharePercent: REFERRER_PROFIT_SHARE_PERCENT,
            },
        });
    } catch (err) {
        console.error("referral me error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
