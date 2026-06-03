import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
    CRYPTOMUS_TO_CURRENCY,
    DEFAULT_DEPOSIT_CURRENCY,
    DEPOSIT_CURRENCY_IDS,
    NOWPAYMENTS_PAY_CURRENCY,
    type DepositCurrencyId,
} from "@/constants/depositCurrencies";
import { createCryptomusInvoice } from "@/utils/cryptomus";
import { isCryptomusProvider } from "@/utils/paymentProvider";
import { DEFAULT_APP_ORIGIN } from "@/utils/siteUrl";

const NOWPAYMENTS_API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const NOWPAYMENTS_BASE = process.env.NOWPAYMENTS_API_URL || "https://api.nowpayments.io/v1";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_ORIGIN;

const getSupabaseAdmin = () =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BUNDLES: Record<number, { price: number; diamonds: number; forgesCoins: number }> = {
    1: { price: 35, diamonds: 35000, forgesCoins: 38 },
    2: { price: 50, diamonds: 50000, forgesCoins: 55 },
    3: { price: 70, diamonds: 70000, forgesCoins: 78 },
    4: { price: 80, diamonds: 80000, forgesCoins: 90 },
    5: { price: 100, diamonds: 100000, forgesCoins: 115 },
    6: { price: 150, diamonds: 150000, forgesCoins: 175 },
    7: { price: 250, diamonds: 250000, forgesCoins: 290 },
    8: { price: 500, diamonds: 500000, forgesCoins: 600 },
};

function resolvePayCurrency(raw: unknown): DepositCurrencyId {
    const id = String(raw ?? DEFAULT_DEPOSIT_CURRENCY).toLowerCase();
    if (DEPOSIT_CURRENCY_IDS.has(id as DepositCurrencyId)) {
        return id as DepositCurrencyId;
    }
    return DEFAULT_DEPOSIT_CURRENCY;
}

export async function POST(req: NextRequest) {
    try {
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
        const { bundleId } = body;
        const payCurrency = resolvePayCurrency(body.payCurrency);

        const bundle = BUNDLES[bundleId];
        if (!bundle) {
            return NextResponse.json({ error: "Invalid bundle" }, { status: 400 });
        }

        const orderId = `${user.id}_bundle_${bundleId}_${Date.now()}`;

        let invoiceId: string;
        let invoiceUrl: string;
        let initialStatus = "waiting";

        if (isCryptomusProvider()) {
            const cm = CRYPTOMUS_TO_CURRENCY[payCurrency];
            const invoice = await createCryptomusInvoice({
                amount: bundle.price,
                orderId,
                urlCallback: `${APP_URL}/api/crypto/ipn`,
                urlSuccess: `${APP_URL}?deposit=success`,
                urlReturn: `${APP_URL}?deposit=cancel`,
                toCurrency: cm.currency,
                network: cm.network,
            });

            if (!invoice) {
                return NextResponse.json({ error: "Failed to create payment invoice" }, { status: 500 });
            }

            invoiceId = String(invoice.uuid ?? "");
            invoiceUrl = String(invoice.url ?? "");
            initialStatus = String(invoice.payment_status ?? invoice.status ?? "process");
        } else {
            if (!NOWPAYMENTS_API_KEY) {
                return NextResponse.json({ error: "NOWPayments API key not configured" }, { status: 500 });
            }

            const npCurrency = NOWPAYMENTS_PAY_CURRENCY[payCurrency];
            const invoiceResponse = await fetch(`${NOWPAYMENTS_BASE}/invoice`, {
                method: "POST",
                headers: {
                    "x-api-key": NOWPAYMENTS_API_KEY,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    price_amount: bundle.price,
                    price_currency: "usd",
                    pay_currency: npCurrency,
                    ipn_callback_url: `${APP_URL}/api/crypto/ipn`,
                    order_id: orderId,
                    order_description: `Playforges Bundle: ${bundle.diamonds.toLocaleString()} Diamonds + ${bundle.forgesCoins} Forges Coins`,
                    success_url: `${APP_URL}?deposit=success`,
                    cancel_url: `${APP_URL}?deposit=cancel`,
                }),
            });

            if (!invoiceResponse.ok) {
                const errText = await invoiceResponse.text();
                console.error("NOWPayments invoice error:", errText);
                return NextResponse.json({ error: "Failed to create payment invoice" }, { status: 500 });
            }

            const invoiceData = await invoiceResponse.json();
            invoiceId = String(invoiceData.id);
            invoiceUrl = invoiceData.invoice_url;
        }

        const insertPayload: Record<string, unknown> = {
            user_id: user.id,
            invoice_id: invoiceId,
            invoice_url: invoiceUrl,
            order_id: orderId,
            payment_status: initialStatus,
            price_amount: bundle.price,
            price_currency: "usd",
            pay_currency: payCurrency,
            bundle_diamonds: bundle.diamonds,
            bundle_forges_coins: bundle.forgesCoins,
        };

        if (isCryptomusProvider()) {
            insertPayload.nowpayments_id = invoiceId;
        }

        let dbError: { message?: string } | null = null;
        let paymentRowId: string | null = null;

        const insertResult = await getSupabaseAdmin()
            .from("crypto_payments")
            .insert(insertPayload)
            .select("id")
            .single();

        dbError = insertResult.error;
        paymentRowId = insertResult.data?.id ?? null;

        if (dbError?.message?.includes("order_id")) {
            const { order_id: _removed, ...withoutOrderId } = insertPayload;
            const retry = await getSupabaseAdmin()
                .from("crypto_payments")
                .insert(withoutOrderId)
                .select("id")
                .single();
            dbError = retry.error;
            paymentRowId = retry.data?.id ?? null;
        }

        if (dbError) {
            console.error("DB error storing payment:", dbError);
            return NextResponse.json({ error: "Failed to store payment record" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            invoiceUrl,
            invoiceId,
            orderId,
            paymentRowId,
            payCurrency,
            provider: isCryptomusProvider() ? "cryptomus" : "nowpayments",
        });
    } catch (err) {
        console.error("Create payment error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
