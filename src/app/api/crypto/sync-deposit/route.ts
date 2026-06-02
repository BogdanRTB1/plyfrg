import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { CryptoPaymentRow } from "@/utils/creditDeposit";
import { syncAndFinalizePaymentRow } from "@/utils/finalizePayment";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

/** After NOWPayments redirect — sync from API, update DB, credit balance. */
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

        let body: { paymentRowId?: string; invoiceId?: string; orderId?: string } = {};
        try {
            body = await req.json();
        } catch {
            body = {};
        }

        const rowsToSync: CryptoPaymentRow[] = [];

        if (body.paymentRowId) {
            const { data } = await admin
                .from("crypto_payments")
                .select("*")
                .eq("id", body.paymentRowId)
                .eq("user_id", user.id)
                .maybeSingle();
            if (data) rowsToSync.push(data as CryptoPaymentRow);
        } else if (body.invoiceId) {
            const { data } = await admin
                .from("crypto_payments")
                .select("*")
                .eq("user_id", user.id)
                .eq("invoice_id", String(body.invoiceId))
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (data) rowsToSync.push(data as CryptoPaymentRow);
        } else if (body.orderId) {
            const { data } = await admin
                .from("crypto_payments")
                .select("*")
                .eq("user_id", user.id)
                .eq("order_id", body.orderId)
                .limit(1)
                .maybeSingle();
            if (data) rowsToSync.push(data as CryptoPaymentRow);
        }

        if (rowsToSync.length === 0) {
            const { data: pending } = await admin
                .from("crypto_payments")
                .select("*")
                .eq("user_id", user.id)
                .eq("credited", false)
                .order("created_at", { ascending: false })
                .limit(5);
            rowsToSync.push(...((pending || []) as CryptoPaymentRow[]));
        }

        let creditedCount = 0;
        let diamondsAdded = 0;
        let forgesAdded = 0;
        let updatedCount = 0;

        for (const row of rowsToSync) {
            const result = await syncAndFinalizePaymentRow(admin, row);
            if (result.found && result.paymentRowId) updatedCount += 1;
            if (result.credited) {
                creditedCount += 1;
                diamondsAdded += Math.floor(Number(row.bundle_diamonds || 0));
                forgesAdded += Number(row.bundle_forges_coins || 0);
            }
        }

        const { data: balance } = await admin
            .from("user_balances")
            .select("diamonds, forges_coins")
            .eq("id", user.id)
            .maybeSingle();

        return NextResponse.json({
            success: true,
            credited: creditedCount,
            updated: updatedCount,
            diamondsAdded,
            forgesAdded,
            balance: {
                diamonds: Math.floor(Number(balance?.diamonds || 0)),
                forges_coins: Number(Number(balance?.forges_coins || 0).toFixed(2)),
            },
        });
    } catch (err) {
        console.error("sync-deposit error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
