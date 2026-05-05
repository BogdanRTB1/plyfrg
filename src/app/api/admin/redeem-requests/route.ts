import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

const requireAdmin = async (req: NextRequest) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

    const token = authHeader.replace("Bearer ", "");
    const admin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

    const { data: profile } = await admin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    const isAdminFromProfile = !!profile?.is_admin;
    const isAdminFromAuthMeta = !!user.app_metadata?.is_admin;

    if (!isAdminFromProfile && !isAdminFromAuthMeta) {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { user };
};

export async function GET(req: NextRequest) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const admin = getSupabaseAdmin();
    const { data, error } = await admin
        .from("crypto_payouts")
        .select("id,user_id,requester_email,forges_coins_amount,usd_amount,pay_currency,pay_address,payout_status,completed,admin_notes,created_at,updated_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Admin redeem list error:", error);
        return NextResponse.json({ error: "Failed to load redeem requests" }, { status: 500 });
    }

    return NextResponse.json({ success: true, rows: data || [] });
}

export async function PATCH(req: NextRequest) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const body = await req.json();
    const { id, completed, payout_status, admin_notes } = body || {};

    if (!id) {
        return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    if (completed && !["yes", "no"].includes(completed)) {
        return NextResponse.json({ error: "completed must be yes/no" }, { status: 400 });
    }

    const patch: Record<string, any> = {
        updated_at: new Date().toISOString(),
    };
    if (typeof completed === "string") patch.completed = completed;
    if (typeof payout_status === "string") patch.payout_status = payout_status;
    if (typeof admin_notes === "string") patch.admin_notes = admin_notes;

    const admin = getSupabaseAdmin();
    const { error } = await admin
        .from("crypto_payouts")
        .update(patch)
        .eq("id", id);

    if (error) {
        console.error("Admin redeem update error:", error);
        return NextResponse.json({ error: "Failed to update redeem request" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
