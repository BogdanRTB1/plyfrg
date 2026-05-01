import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const NOWPAYMENTS_BASE = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://playforges.com";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Bundle definitions (same as frontend)
const BUNDLES: Record<number, { price: number; diamonds: number; forgesCoins: number }> = {
    1: { price: 5, diamonds: 5000, forgesCoins: 5 },
    2: { price: 10, diamonds: 10000, forgesCoins: 10 },
    3: { price: 20, diamonds: 20000, forgesCoins: 21 },
    4: { price: 50, diamonds: 50000, forgesCoins: 55 },
    5: { price: 100, diamonds: 100000, forgesCoins: 115 },
    6: { price: 250, diamonds: 250000, forgesCoins: 290 },
};

export async function POST(req: NextRequest) {
    try {
        // Get auth token from header
        const authHeader = req.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { bundleId, payCurrency = "btc" } = body;

        const bundle = BUNDLES[bundleId];
        if (!bundle) {
            return NextResponse.json({ error: "Invalid bundle" }, { status: 400 });
        }

        // Create invoice via NOWPayments API
        const invoiceResponse = await fetch(`${NOWPAYMENTS_BASE}/invoice`, {
            method: "POST",
            headers: {
                "x-api-key": NOWPAYMENTS_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                price_amount: bundle.price,
                price_currency: "usd",
                pay_currency: payCurrency,
                ipn_callback_url: `${APP_URL}/api/crypto/ipn`,
                order_id: `${user.id}_bundle_${bundleId}_${Date.now()}`,
                order_description: `Playforges Bundle: ${bundle.diamonds.toLocaleString()} Diamonds + ${bundle.forgesCoins} Forges Coins`,
                success_url: `${APP_URL}?deposit=success`,
                cancel_url: `${APP_URL}?deposit=cancel`,
            }),
        });

        if (!invoiceResponse.ok) {
            const errText = await invoiceResponse.text();
            console.error("NOWPayments invoice error:", errText);
            return NextResponse.json(
                { error: "Failed to create payment invoice" },
                { status: 500 }
            );
        }

        const invoiceData = await invoiceResponse.json();

        // Store in database
        const { error: dbError } = await supabaseAdmin.from("crypto_payments").insert({
            user_id: user.id,
            invoice_id: invoiceData.id,
            invoice_url: invoiceData.invoice_url,
            payment_status: "waiting",
            price_amount: bundle.price,
            price_currency: "usd",
            pay_currency: payCurrency,
            bundle_diamonds: bundle.diamonds,
            bundle_forges_coins: bundle.forgesCoins,
        });

        if (dbError) {
            console.error("DB error storing payment:", dbError);
            return NextResponse.json(
                { error: "Failed to store payment record" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            invoiceUrl: invoiceData.invoice_url,
            invoiceId: invoiceData.id,
        });
    } catch (err) {
        console.error("Create payment error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
