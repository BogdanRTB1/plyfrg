import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    applyPaymentUpdate,
    creditDepositIfEligible,
    findCryptoPayment,
} from "@/utils/creditDeposit";
import { isCompletedPaymentStatus, verifyNowpaymentsSignature } from "@/utils/nowpayments";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Record<string, unknown>;
        const signature = req.headers.get("x-nowpayments-sig");

        if (!verifyNowpaymentsSignature(body, signature)) {
            console.error("IPN: Invalid or missing signature", {
                hasSig: !!signature,
                payment_id: body.payment_id,
                invoice_id: body.invoice_id,
            });
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        const payment_id = body.payment_id;
        const invoice_id = body.invoice_id;
        const order_id = body.order_id as string | undefined;
        const payment_status = String(body.payment_status || "");
        const pay_amount = body.pay_amount;
        const pay_currency = body.pay_currency;
        const pay_address = body.pay_address;
        const actually_paid = body.actually_paid;
        const outcome_amount = body.outcome_amount;

        console.log(
            `IPN: payment_id=${payment_id}, invoice_id=${invoice_id}, order_id=${order_id}, status=${payment_status}`
        );

        const admin = getSupabaseAdmin();
        const payment = await findCryptoPayment(admin, {
            payment_id: payment_id as string | number | null,
            invoice_id: invoice_id as string | number | null,
            order_id,
        });

        if (!payment) {
            console.error("IPN: Payment record not found", { invoice_id, order_id, payment_id });
            return NextResponse.json({ ok: true });
        }

        const npId = payment_id != null ? String(payment_id) : payment.nowpayments_id;

        const { error: updateError } = await applyPaymentUpdate(admin, payment.id, {
            nowpayments_id: npId,
            payment_status,
            pay_amount,
            pay_currency,
            pay_address,
            actually_paid,
            outcome_amount,
        });

        if (updateError) {
            console.error("IPN: Failed to update payment:", updateError);
        }

        if (isCompletedPaymentStatus(payment_status)) {
            const result = await creditDepositIfEligible(admin, payment, payment_status);
            if (result.credited) {
                console.log(
                    `IPN: Credited user ${payment.user_id} (+${payment.bundle_diamonds} GC, +${payment.bundle_forges_coins} FC)`
                );
            } else {
                console.log(`IPN: Credit skipped (${result.reason})`);
            }
        }

        if (["failed", "expired", "refunded"].includes(payment_status)) {
            await admin.from("notifications").insert({
                user_id: payment.user_id,
                title:
                    "❌ Crypto Payment " +
                    (payment_status === "expired"
                        ? "Expired"
                        : payment_status === "refunded"
                          ? "Refunded"
                          : "Failed"),
                message: `Your crypto payment of $${payment.price_amount} has ${payment_status}. Please try again or contact support.`,
                is_read: false,
            });
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("IPN handler error:", err);
        return NextResponse.json({ ok: true });
    }
}
