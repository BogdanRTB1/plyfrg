import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/requireAdmin";
import { creditDepositIfEligible } from "@/utils/creditDeposit";
import { isCompletedPaymentStatus } from "@/utils/nowpayments";
import { syncNowPaymentRecord } from "@/utils/syncNowPaymentRecord";

export async function GET(req: NextRequest) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const { admin } = guard;
    const limitParam = Number(req.nextUrl.searchParams.get("limit") || 100);
    const limit = Math.min(Math.max(limitParam || 100, 1), 200);
    const statusFilter = req.nextUrl.searchParams.get("status");
    const creditedFilter = req.nextUrl.searchParams.get("credited");

    let query = admin
        .from("crypto_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (statusFilter && statusFilter !== "all") {
        query = query.eq("payment_status", statusFilter);
    }
    if (creditedFilter === "true") {
        query = query.eq("credited", true);
    } else if (creditedFilter === "false") {
        query = query.eq("credited", false);
    }

    const { data: payments, error } = await query;
    if (error) {
        console.error("Admin transactions list error:", error);
        return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
    }

    const syncFromNp = req.nextUrl.searchParams.get("sync") !== "false";
    let syncedFromApi = 0;
    const paymentRows = [...(payments || [])];

    if (syncFromNp && process.env.NOWPAYMENTS_API_KEY) {
        for (const payment of paymentRows) {
            const needsSync =
                !payment.nowpayments_id ||
                payment.payment_status === "waiting" ||
                payment.payment_status === "confirming";
            if (!needsSync) continue;

            const result = await syncNowPaymentRecord(admin, payment);
            if (result.synced && result.fields) {
                Object.assign(payment, result.fields);
                syncedFromApi += 1;
            }
        }
    }

    const userIds = [...new Set(paymentRows.map((p) => p.user_id))];
    const { data: profiles } = userIds.length
        ? await admin.from("profiles").select("id, username, email").in("id", userIds)
        : { data: [] };

    const profilesById = new Map((profiles || []).map((p) => [p.id, p]));

    const authEmailByUserId = new Map<string, string>();
    const needsAuthEmail = userIds.filter((id) => !profilesById.get(id)?.email);
    await Promise.all(
        needsAuthEmail.map(async (userId) => {
            try {
                const { data } = await admin.auth.admin.getUserById(userId);
                if (data?.user?.email) authEmailByUserId.set(userId, data.user.email);
            } catch {
                /* ignore per-user lookup failures */
            }
        })
    );

    const rows = paymentRows.map((payment) => {
        const profile = profilesById.get(payment.user_id);
        const email = profile?.email || authEmailByUserId.get(payment.user_id) || null;
        return {
            id: payment.id,
            user_id: payment.user_id,
            username: profile?.username || null,
            email,
            nowpayments_id: payment.nowpayments_id,
            invoice_id: payment.invoice_id,
            order_id: payment.order_id,
            invoice_url: payment.invoice_url,
            payment_status: payment.payment_status,
            price_amount: Number(payment.price_amount || 0),
            price_currency: payment.price_currency,
            pay_currency: payment.pay_currency,
            pay_amount: payment.pay_amount,
            actually_paid: payment.actually_paid,
            bundle_diamonds: Number(payment.bundle_diamonds || 0),
            bundle_forges_coins: Number(payment.bundle_forges_coins || 0),
            credited: !!payment.credited,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
        };
    });

    const completed = rows.filter((r) => isCompletedPaymentStatus(r.payment_status));
    const stats = {
        total: rows.length,
        completed: completed.length,
        credited: rows.filter((r) => r.credited).length,
        needs_credit: completed.filter((r) => !r.credited).length,
        volume_usd: completed.reduce((sum, r) => sum + r.price_amount, 0),
        pending: rows.filter((r) => !isCompletedPaymentStatus(r.payment_status) && !["failed", "expired", "refunded"].includes(r.payment_status || "")).length,
    };

    return NextResponse.json({ success: true, rows, stats, syncedFromApi });
}

/** Credit user and/or sync one row from NOWPayments API. */
export async function POST(req: NextRequest) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const { admin } = guard;
    const body = await req.json();
    const paymentId = body?.paymentId as string | undefined;
    const action = body?.action as string | undefined;

    if (action === "sync") {
        if (!paymentId) {
            return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
        }
        const { data: payment, error: fetchError } = await admin
            .from("crypto_payments")
            .select("*")
            .eq("id", paymentId)
            .single();
        if (fetchError || !payment) {
            return NextResponse.json({ error: "Payment not found" }, { status: 404 });
        }
        const result = await syncNowPaymentRecord(admin, payment);
        if (!result.synced) {
            return NextResponse.json({
                success: false,
                pendingInvoice: !!result.pendingInvoice,
                message:
                    result.message ||
                    "No matching payment found on NOWPayments (check invoice/order id)",
                invoice_id: payment.invoice_id,
            });
        }
        return NextResponse.json({
            success: true,
            message: "Synced from NOWPayments",
            nowpayments_id: result.fields?.nowpayments_id,
            payment_status: result.fields?.payment_status,
        });
    }

    if (!paymentId) {
        return NextResponse.json({ error: "paymentId is required" }, { status: 400 });
    }

    const { data: payment, error: fetchError } = await admin
        .from("crypto_payments")
        .select("*")
        .eq("id", paymentId)
        .single();

    if (fetchError || !payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const status = String(body?.payment_status || payment.payment_status || "finished");
    if (!isCompletedPaymentStatus(status)) {
        return NextResponse.json(
            { error: "Payment is not in a completed status. Set status to finished/confirmed first." },
            { status: 400 }
        );
    }

    if (!payment.credited) {
        await admin
            .from("crypto_payments")
            .update({ payment_status: status, updated_at: new Date().toISOString() })
            .eq("id", paymentId);
    }

    const result = await creditDepositIfEligible(admin, payment, status);
    if (!result.credited && result.reason === "already_credited") {
        return NextResponse.json({ success: true, message: "Already credited" });
    }
    if (!result.credited) {
        return NextResponse.json({ error: `Could not credit: ${result.reason}` }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: "User balance credited",
        diamonds: payment.bundle_diamonds,
        forges_coins: payment.bundle_forges_coins,
    });
}
