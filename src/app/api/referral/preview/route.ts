import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { REFERRED_DIAMONDS_REWARD } from "@/constants/referrals";
import { normalizeReferralCode } from "@/utils/referralServer";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

/** Public lookup: who invited via this referral code? */
export async function GET(req: NextRequest) {
    try {
        const code = normalizeReferralCode(req.nextUrl.searchParams.get("code"));
        if (!code) {
            return NextResponse.json({ valid: false, error: "Invalid code" }, { status: 400 });
        }

        const admin = getSupabaseAdmin();
        const { data: profile, error } = await admin
            .from("profiles")
            .select("id, username, avatar_url")
            .ilike("referral_code", code)
            .maybeSingle();

        if (error || !profile?.id) {
            return NextResponse.json({ valid: false, error: "Referrer not found" }, { status: 404 });
        }

        let inviterName = profile.username?.trim() || null;
        let avatarUrl = profile.avatar_url || null;

        if (inviterName) {
            const { data: creator } = await admin
                .from("creators")
                .select("display_name, profile_picture")
                .eq("display_name", inviterName)
                .maybeSingle();

            if (creator?.display_name) inviterName = creator.display_name;
            if (creator?.profile_picture) avatarUrl = creator.profile_picture;
        }

        if (!inviterName) {
            const { data: authData } = await admin.auth.admin.getUserById(profile.id);
            const meta = authData?.user?.user_metadata || {};
            inviterName =
                (typeof meta.full_name === "string" && meta.full_name) ||
                (typeof meta.name === "string" && meta.name) ||
                authData?.user?.email?.split("@")[0] ||
                "A friend";
        }

        return NextResponse.json({
            valid: true,
            inviterName,
            avatarUrl,
            referralCode: code,
            referredDiamonds: REFERRED_DIAMONDS_REWARD,
        });
    } catch (err) {
        console.error("referral preview error:", err);
        return NextResponse.json({ valid: false, error: "Internal server error" }, { status: 500 });
    }
}
