import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const NOWPAYMENTS_BASE = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";

const getSupabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ForgesCoins to USD conversion rate for redeem (1 FC = $0.80 USD)
const FC_TO_USD_RATE = 0.8;
const MIN_WITHDRAWAL = 10; // Minimum 10 FC to withdraw

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await getSupabaseAdmin().auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { amount, address, email, currency = "btc" } = body;

        // Validations
        if (!amount || !address || !email) {
            return NextResponse.json({ error: "Amount, address and email are required" }, { status: 400 });
        }
        const normalizedEmail = String(email).trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
        }

        const fcAmount = Number(amount);
        if (isNaN(fcAmount) || fcAmount < MIN_WITHDRAWAL) {
            return NextResponse.json(
                { error: `Minimum withdrawal is ${MIN_WITHDRAWAL} Forges Coins` },
                { status: 400 }
            );
        }

        // Check user balance from user_balances table (source of truth)
        const { data: balanceRow, error: balanceError } = await getSupabaseAdmin()
            .from("user_balances")
            .select("forges_coins")
            .eq("id", user.id)
            .single();

        if (balanceError || !balanceRow) {
            console.error("Balance fetch error:", balanceError);
            return NextResponse.json({ error: "Failed to verify your balance" }, { status: 500 });
        }

        const currentForgesCoins = Number(balanceRow.forges_coins || 0);

        if (fcAmount > currentForgesCoins) {
            return NextResponse.json({ error: "Insufficient Forges Coins balance" }, { status: 400 });
        }

        const usdAmount = fcAmount * FC_TO_USD_RATE;

        // First, get estimated payout amount
        const estimateRes = await fetch(
            `${NOWPAYMENTS_BASE}/estimate?amount=${usdAmount}&currency_from=usd&currency_to=${currency}`,
            {
                headers: { "x-api-key": NOWPAYMENTS_API_KEY },
            }
        );

        let estimatedCryptoAmount = 0;
        if (estimateRes.ok) {
            const estimate = await estimateRes.json();
            estimatedCryptoAmount = estimate.estimated_amount;
        }

        // Deduct balance immediately (optimistic — will be restored if payout fails)
        const newForgesCoins = Number((currentForgesCoins - fcAmount).toFixed(2));
        const { error: deductError } = await getSupabaseAdmin()
            .from("user_balances")
            .update({
                forges_coins: newForgesCoins,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (deductError) {
            console.error("Balance deduct error:", deductError);
            return NextResponse.json({ error: "Failed to reserve your balance for payout" }, { status: 500 });
        }

        // Store payout request in database
        const { data: payoutRecord, error: dbError } = await getSupabaseAdmin()
            .from("crypto_payouts")
            .insert({
                user_id: user.id,
                payout_status: "pending",
                forges_coins_amount: fcAmount,
                usd_amount: usdAmount,
                pay_currency: currency,
                pay_address: address,
                pay_amount: estimatedCryptoAmount,
                requester_email: normalizedEmail,
                completed: "no",
            })
            .select()
            .single();

        if (dbError) {
            // Restore balance on failure
            await getSupabaseAdmin()
                .from("user_balances")
                .update({
                    forges_coins: currentForgesCoins,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", user.id);
            console.error("DB error storing payout:", dbError);
            return NextResponse.json({ error: "Failed to create payout request" }, { status: 500 });
        }

        // Keep payout as pending for manual admin verification.
        // Admin can review email, wallet and amount, then set completed=yes when finalized.

        // Create notification
        await getSupabaseAdmin().from("notifications").insert({
            user_id: user.id,
            title: "Withdrawal Request Submitted",
            message: `Your withdrawal request of ${fcAmount} Forges Coins ($${usdAmount.toFixed(2)}) was received and will be verified soon.`,
        });

        return NextResponse.json({
            success: true,
            payoutId: payoutRecord.id,
            status: "pending",
            estimatedAmount: estimatedCryptoAmount,
            currency: currency,
            newBalance: newForgesCoins,
        });
    } catch (err) {
        console.error("Create payout error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
