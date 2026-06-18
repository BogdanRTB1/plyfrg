import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyReferralForUser } from "@/utils/referralServer";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

export async function POST(req: NextRequest) {
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

        let body: { referralCode?: string } = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const referralCode = String(body.referralCode || "").trim();
        if (!referralCode) {
            return NextResponse.json({ error: "referralCode is required" }, { status: 400 });
        }

        const result = await applyReferralForUser(admin, user.id, referralCode);

        if (!result.applied) {
            const status =
                result.reason === "already_referred" ||
                result.reason === "account_too_old" ||
                result.reason === "self_referral" ||
                result.reason === "referrer_not_found" ||
                result.reason === "invalid_code"
                    ? 400
                    : 500;

            return NextResponse.json(
                {
                    applied: false,
                    reason: result.reason,
                    error: result.reason,
                },
                { status }
            );
        }

        return NextResponse.json({
            applied: true,
            referrerFcAdded: result.referrerFcAdded,
            referredDiamondsAdded: result.referredDiamondsAdded,
        });
    } catch (err) {
        console.error("referral apply error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
