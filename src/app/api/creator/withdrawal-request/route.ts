import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

const FC_TO_USD_RATE = 0.8;

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        const supabase = getSupabaseAdmin();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { amountFc, email, address, currency = "btc" } = body || {};
        const fcAmount = Number(amountFc);
        const normalizedEmail = String(email || "").trim().toLowerCase();
        const payoutAddress = String(address || "").trim();

        if (!fcAmount || fcAmount < 10) {
            return NextResponse.json({ error: "Minimum creator withdrawal is 10 FC" }, { status: 400 });
        }
        if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
        }
        if (!payoutAddress) {
            return NextResponse.json({ error: "BTC wallet address is required" }, { status: 400 });
        }

        const { data: creator, error: creatorError } = await supabase
            .from("creators")
            .select("id, display_name")
            .eq("id", user.id)
            .maybeSingle();

        if (creatorError || !creator) {
            return NextResponse.json({ error: "Only creators can submit this withdrawal request" }, { status: 403 });
        }

        const usdAmount = Number((fcAmount * FC_TO_USD_RATE).toFixed(2));

        const { data: row, error: insertError } = await supabase
            .from("crypto_payouts")
            .insert({
                user_id: user.id,
                payout_status: "pending",
                forges_coins_amount: fcAmount,
                usd_amount: usdAmount,
                pay_currency: currency,
                pay_address: payoutAddress,
                requester_email: normalizedEmail,
                completed: "no",
                admin_notes: `Creator Studio withdrawal request from ${creator.display_name || user.id}`,
            })
            .select("id")
            .single();

        if (insertError) {
            console.error("Creator withdrawal insert error:", insertError);
            return NextResponse.json({ error: "Failed to create creator withdrawal request" }, { status: 500 });
        }

        await supabase.from("notifications").insert({
            user_id: user.id,
            title: "Withdrawal Request Submitted",
            message: `Your creator withdrawal request of ${fcAmount} FC ($${usdAmount.toFixed(2)}) was received and will be verified soon.`,
        });

        return NextResponse.json({ success: true, requestId: row.id });
    } catch (err) {
        console.error("Creator withdrawal request error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
