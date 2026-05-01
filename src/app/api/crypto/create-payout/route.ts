import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const NOWPAYMENTS_BASE = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";

const getSupabaseAdmin = () => createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ForgesCoins to USD conversion rate (1 FC = $1 USD)
const FC_TO_USD_RATE = 1.0;
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
        const { amount, address, currency = "btc" } = body;

        // Validations
        if (!amount || !address) {
            return NextResponse.json({ error: "Amount and address are required" }, { status: 400 });
        }

        const fcAmount = Number(amount);
        if (isNaN(fcAmount) || fcAmount < MIN_WITHDRAWAL) {
            return NextResponse.json(
                { error: `Minimum withdrawal is ${MIN_WITHDRAWAL} Forges Coins` },
                { status: 400 }
            );
        }

        // Check user balance (from user metadata)
        const currentMeta = user.user_metadata || {};
        const currentForgesCoins = Number(currentMeta.forges_coins || 0);

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
        await getSupabaseAdmin().auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...currentMeta,
                forges_coins: newForgesCoins,
            }
        });

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
            })
            .select()
            .single();

        if (dbError) {
            // Restore balance on failure
            await getSupabaseAdmin().auth.admin.updateUserById(user.id, {
                user_metadata: { ...currentMeta, forges_coins: currentForgesCoins }
            });
            console.error("DB error storing payout:", dbError);
            return NextResponse.json({ error: "Failed to create payout request" }, { status: 500 });
        }

        // Attempt to create payout via NOWPayments
        // NOTE: NOWPayments payouts require email-based 2FA verification. 
        // In production, you may need to handle this async via admin dashboard
        // or use their batch payout API with pre-approved settings.
        try {
            const payoutRes = await fetch(`${NOWPAYMENTS_BASE}/payout`, {
                method: "POST",
                headers: {
                    "x-api-key": NOWPAYMENTS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    withdrawals: [
                        {
                            address: address,
                            currency: currency,
                            amount: estimatedCryptoAmount,
                            ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://playforges.com"}/api/crypto/payout-ipn`,
                        },
                    ],
                }),
            });

            if (payoutRes.ok) {
                const payoutData = await payoutRes.json();
                await getSupabaseAdmin()
                    .from("crypto_payouts")
                    .update({
                        nowpayments_id: payoutData.id,
                        payout_status: "processing",
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", payoutRecord.id);
            } else {
                // Payout API failed — keep as pending for manual review
                const errText = await payoutRes.text();
                console.error("NOWPayments payout API error:", errText);
                // Status stays "pending" for admin to manually process
            }
        } catch (payoutApiErr) {
            console.error("Payout API call failed:", payoutApiErr);
            // Keep as pending for manual processing
        }

        // Create notification
        await getSupabaseAdmin().from("notifications").insert({
            user_id: user.id,
            title: "🏦 Withdrawal Request Submitted",
            message: `Your withdrawal of ${fcAmount} Forges Coins ($${usdAmount.toFixed(2)}) to ${address.slice(0, 8)}...${address.slice(-6)} is being processed.`,
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
