import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    extractIpnFields,
    finalizePaymentFromNowPayments,
    isTrustedNowPaymentsPayload,
} from "@/utils/finalizePayment";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Record<string, unknown>;
        const signature = req.headers.get("x-nowpayments-sig");

        const trusted = await isTrustedNowPaymentsPayload(body, signature);
        if (!trusted) {
            console.error("IPN: Untrusted payload", {
                hasSig: !!signature,
                payment_id: body.payment_id,
                invoice_id: body.invoice_id,
            });
            return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
        }

        const fields = extractIpnFields(body);
        console.log(
            `IPN: payment_id=${fields.payment_id}, invoice_id=${fields.invoice_id}, order_id=${fields.order_id}, status=${fields.payment_status}`
        );

        const admin = getSupabaseAdmin();
        const result = await finalizePaymentFromNowPayments(admin, body);

        if (!result.found) {
            console.error("IPN: Payment record not found", fields);
        } else if (result.credited) {
            console.log(`IPN: Credited payment row ${result.paymentRowId}`);
        }

        if (["failed", "expired", "refunded"].includes(fields.payment_status) && result.found) {
            const payment = await admin
                .from("crypto_payments")
                .select("user_id, price_amount")
                .eq("id", result.paymentRowId!)
                .single();
            if (payment.data) {
                await admin.from("notifications").insert({
                    user_id: payment.data.user_id,
                    title: "❌ Crypto Payment " + fields.payment_status,
                    message: `Your crypto payment of $${payment.data.price_amount} has ${fields.payment_status}. Please try again or contact support.`,
                    is_read: false,
                });
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("IPN handler error:", err);
        return NextResponse.json({ ok: true });
    }
}
