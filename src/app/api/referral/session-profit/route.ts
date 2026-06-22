import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { creditReferrerSessionProfit } from "@/utils/referralServer";

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

        let body: {
            wagered?: number;
            payout?: number;
            currency?: string;
            gameName?: string;
        } = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const wagered = Number(body.wagered);
        const payout = Number(body.payout);
        const currency = body.currency === "GC" ? "GC" : "FC";

        if (!Number.isFinite(wagered) || !Number.isFinite(payout) || wagered < 0 || payout < 0) {
            return NextResponse.json({ error: "Invalid session amounts" }, { status: 400 });
        }

        const result = await creditReferrerSessionProfit(admin, user.id, {
            wagered,
            payout,
            currency,
            gameName: typeof body.gameName === "string" ? body.gameName : undefined,
        });

        return NextResponse.json({
            credited: result.credited,
            share: result.share ?? 0,
            currency: result.currency ?? currency,
        });
    } catch (err) {
        console.error("referral session-profit error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
