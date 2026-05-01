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

        if (!signature) {
            console.error("IPN: Missing signature");
            return NextResponse.json({ error: "Missing signature" }, { status: 400 });
        }

        // Verify HMAC signature
        if (!verifySignature(body, signature)) {
            console.error("IPN: Invalid signature");
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        const {
            payment_id,
            invoice_id,
            payment_status,
            pay_amount,
            pay_currency,
            pay_address,
            actually_paid,
            outcome_amount,
            order_id,
        } = body;

        console.log(`IPN received: payment_id=${payment_id}, status=${payment_status}, invoice=${invoice_id}`);

        // Find the payment record
        let query = supabaseAdmin.from("crypto_payments").select("*");
        
        if (invoice_id) {
            query = query.eq("invoice_id", String(invoice_id));
        } else if (order_id) {
            // Try to find by order_id pattern: userId_bundle_bundleId_timestamp
            const userId = order_id.split("_bundle_")[0];
            query = query.eq("user_id", userId).eq("payment_status", "waiting");
        }

        const { data: payments, error: fetchError } = await query;

        if (fetchError || !payments || payments.length === 0) {
            console.error("IPN: Payment record not found", { invoice_id, fetchError });
            // Still return 200 so NOWPayments doesn't retry unnecessarily
            return NextResponse.json({ ok: true });
        }

        const payment = payments[0];

        // Update payment record
        const { error: updateError } = await supabaseAdmin
            .from("crypto_payments")
            .update({
                nowpayments_id: payment_id,
                payment_status: payment_status,
                pay_amount: pay_amount,
                pay_currency: pay_currency,
                pay_address: pay_address,
                actually_paid: actually_paid,
                outcome_amount: outcome_amount,
                updated_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

        if (updateError) {
            console.error("IPN: Failed to update payment:", updateError);
        }

        // If payment is finished and not yet credited, credit the user
        if (payment_status === "finished" && !payment.credited) {
            // Credit diamonds and forges coins
            // First, get current balance from user metadata or a balance table
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(payment.user_id);
            
            if (!userError && userData?.user) {
                const currentMeta = userData.user.user_metadata || {};
                const currentDiamonds = Number(currentMeta.diamonds || 0);
                const currentForgesCoins = Number(currentMeta.forges_coins || 0);

                await supabaseAdmin.auth.admin.updateUserById(payment.user_id, {
                    user_metadata: {
                        ...currentMeta,
                        diamonds: currentDiamonds + payment.bundle_diamonds,
                        forges_coins: Number((currentForgesCoins + Number(payment.bundle_forges_coins)).toFixed(2)),
                    }
                });
            }

            // Mark as credited
            await supabaseAdmin
                .from("crypto_payments")
                .update({ credited: true, updated_at: new Date().toISOString() })
                .eq("id", payment.id);

            // Create notification
            await supabaseAdmin.from("notifications").insert({
                user_id: payment.user_id,
                title: "💎 Crypto Deposit Confirmed!",
                message: `Your crypto payment has been confirmed! ${payment.bundle_diamonds.toLocaleString()} Diamonds and ${payment.bundle_forges_coins} Forges Coins have been added to your account.`,
            });

            console.log(`IPN: Credited user ${payment.user_id} with ${payment.bundle_diamonds} diamonds and ${payment.bundle_forges_coins} FC`);
        }

        // If payment failed or expired, notify user
        if (["failed", "expired", "refunded"].includes(payment_status)) {
            await supabaseAdmin.from("notifications").insert({
                user_id: payment.user_id,
                title: "❌ Crypto Payment " + (payment_status === "expired" ? "Expired" : payment_status === "refunded" ? "Refunded" : "Failed"),
                message: `Your crypto payment of $${payment.price_amount} has ${payment_status}. Please try again or contact support.`,
            });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("IPN handler error:", err);
        return NextResponse.json({ ok: true }); // Return 200 to prevent retries
    }
}
