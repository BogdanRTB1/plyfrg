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

    const limitParam = Number(req.nextUrl.searchParams.get("limit") || 50);
    const limit = Math.min(Math.max(limitParam || 50, 1), 100);
    const admin = getSupabaseAdmin();

    const { data: authData, error: usersError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: limit,
    });

    if (usersError) {
        console.error("Admin users list error:", usersError);
        return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
    }

    const users = [...(authData.users || [])].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
    const userIds = users.map((user) => user.id);

    const [{ data: profiles }, { data: balances }] = await Promise.all([
        admin
            .from("profiles")
            .select("id, username, email, avatar_url, created_at, is_admin")
            .in("id", userIds),
        admin
            .from("user_balances")
            .select("id, diamonds, forges_coins, updated_at")
            .in("id", userIds),
    ]);

    const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    const balancesById = new Map((balances || []).map((balance) => [balance.id, balance]));

    const rows = users.map((user) => {
        const profile = profilesById.get(user.id);
        const balance = balancesById.get(user.id);
        const userMeta = user.user_metadata || {};
        const appMeta = user.app_metadata || {};

        return {
            id: user.id,
            email: user.email || profile?.email || null,
            username: profile?.username || userMeta.full_name || userMeta.name || null,
            avatar_url: profile?.avatar_url || userMeta.avatar_url || null,
            provider: Array.isArray(appMeta.providers) ? appMeta.providers.join(", ") : appMeta.provider || "-",
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            confirmed_at: user.confirmed_at,
            is_kyc_verified: userMeta.is_kyc_verified === true,
            is_admin: !!profile?.is_admin || !!appMeta.is_admin,
            diamonds: Number(balance?.diamonds || 0),
            forges_coins: Number(balance?.forges_coins || 0),
            balance_updated_at: balance?.updated_at || null,
        };
    });

    return NextResponse.json({ success: true, rows });
}
