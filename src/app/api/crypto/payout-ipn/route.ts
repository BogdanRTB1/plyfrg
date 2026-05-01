import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!;

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifySignature(payload: Record<string, unknown>, receivedSig: string): boolean {
    const hmac = crypto.createHmac("sha512", IPN_SECRET);
    hmac.update(JSON.stringify(payload, Object.keys(payload).sort()));
    const signature = hmac.digest("hex");
    return signature === receivedSig;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const signature = req.headers.get("x-nowpayments-sig");

        if (!signature || !verifySignature(body, signature)) {
            console.error("Payout IPN: Invalid or missing signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        const { id: batchId, status, withdrawals } = body;

        console.log(`Payout IPN: batch=${batchId}, status=${status}`);

        if (!batchId) {
            return NextResponse.json({ ok: true });
        }

        // Find the payout record
        const { data: payouts, error: fetchError } = await supabaseAdmin
            .from("crypto_payouts")
            .select("*")
            .eq("nowpayments_id", String(batchId));

        if (fetchError || !payouts || payouts.length === 0) {
            console.error("Payout IPN: Record not found for batch:", batchId);
            return NextResponse.json({ ok: true });
        }

        const payout = payouts[0];

        // Map NOWPayments status to our status
        let mappedStatus = "processing";
        if (status === "FINISHED") mappedStatus = "completed";
        else if (status === "FAILED" || status === "REJECTED") mappedStatus = "failed";
        else if (status === "SENDING") mappedStatus = "processing";

        // Get transaction hash if available
        let txHash = null;
        if (withdrawals && withdrawals.length > 0 && withdrawals[0].hash) {
            txHash = withdrawals[0].hash;
        }

        // Update payout record
        await supabaseAdmin
            .from("crypto_payouts")
            .update({
                payout_status: mappedStatus,
                tx_hash: txHash,
                updated_at: new Date().toISOString(),
            })
            .eq("id", payout.id);

        // If failed, refund the user's ForgesCoins
        if (mappedStatus === "failed") {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(payout.user_id);
            if (userData?.user) {
                const meta = userData.user.user_metadata || {};
                const currentFC = Number(meta.forges_coins || 0);
                await supabaseAdmin.auth.admin.updateUserById(payout.user_id, {
                    user_metadata: {
                        ...meta,
                        forges_coins: Number((currentFC + Number(payout.forges_coins_amount)).toFixed(2)),
                    }
                });
            }

            await supabaseAdmin.from("notifications").insert({
                user_id: payout.user_id,
                title: "❌ Withdrawal Failed",
                message: `Your withdrawal of ${payout.forges_coins_amount} Forges Coins has failed. The amount has been refunded to your account.`,
            });
        }

        // If completed, notify user
        if (mappedStatus === "completed") {
            await supabaseAdmin.from("notifications").insert({
                user_id: payout.user_id,
                title: "✅ Withdrawal Completed!",
                message: `Your withdrawal of ${payout.forges_coins_amount} Forges Coins ($${payout.usd_amount}) has been sent to your wallet.${txHash ? ` TX: ${txHash}` : ""}`,
            });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("Payout IPN error:", err);
        return NextResponse.json({ ok: true });
    }
}
