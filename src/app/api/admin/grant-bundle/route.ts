import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/requireAdmin";
import { DEPOSIT_BUNDLES, getDepositBundle } from "@/constants/depositBundles";
import { grantDepositBundleToUser } from "@/utils/grantDepositBundle";

/** List store bundles (for admin UI). */
export async function GET(req: NextRequest) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const { admin } = guard;
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";

    if (!q) {
        return NextResponse.json({ success: true, bundles: DEPOSIT_BUNDLES, users: [] });
    }

    const users: Array<{
        id: string;
        email: string | null;
        username: string | null;
        diamonds: number;
        forges_coins: number;
    }> = [];

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);

    if (isUuid) {
        const { data: authData } = await admin.auth.admin.getUserById(q);
        if (authData?.user) {
            const { data: profile } = await admin
                .from("profiles")
                .select("username, email")
                .eq("id", q)
                .maybeSingle();
            const { data: balance } = await admin
                .from("user_balances")
                .select("diamonds, forges_coins")
                .eq("id", q)
                .maybeSingle();
            users.push({
                id: q,
                email: authData.user.email || profile?.email || null,
                username: profile?.username || null,
                diamonds: Math.floor(Number(balance?.diamonds ?? 0)),
                forges_coins: Number(Number(balance?.forges_coins ?? 0).toFixed(2)),
            });
        }
    } else if (q.includes("@")) {
        const { data: authList } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const match = (authList?.users || []).find(
            (u) => u.email?.toLowerCase() === q.toLowerCase()
        );
        if (match) {
            const { data: profile } = await admin
                .from("profiles")
                .select("username, email")
                .eq("id", match.id)
                .maybeSingle();
            const { data: balance } = await admin
                .from("user_balances")
                .select("diamonds, forges_coins")
                .eq("id", match.id)
                .maybeSingle();
            users.push({
                id: match.id,
                email: match.email || null,
                username: profile?.username || null,
                diamonds: Math.floor(Number(balance?.diamonds ?? 0)),
                forges_coins: Number(Number(balance?.forges_coins ?? 0).toFixed(2)),
            });
        }
    } else {
        const { data: profiles } = await admin
            .from("profiles")
            .select("id, username, email")
            .ilike("username", `%${q}%`)
            .limit(10);

        for (const profile of profiles || []) {
            const { data: authData } = await admin.auth.admin.getUserById(profile.id);
            const { data: balance } = await admin
                .from("user_balances")
                .select("diamonds, forges_coins")
                .eq("id", profile.id)
                .maybeSingle();
            users.push({
                id: profile.id,
                email: authData?.user?.email || profile.email || null,
                username: profile.username,
                diamonds: Math.floor(Number(balance?.diamonds ?? 0)),
                forges_coins: Number(Number(balance?.forges_coins ?? 0).toFixed(2)),
            });
        }
    }

    return NextResponse.json({ success: true, bundles: DEPOSIT_BUNDLES, users });
}

/** Grant a store bundle to a user (no payment required). */
export async function POST(req: NextRequest) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const { user: adminUser, admin } = guard;
    const body = await req.json();
    const userId = String(body?.userId || "").trim();
    const bundleId = Number(body?.bundleId);
    const note = typeof body?.note === "string" ? body.note : undefined;

    if (!userId) {
        return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (!getDepositBundle(bundleId)) {
        return NextResponse.json({ error: "Invalid bundleId" }, { status: 400 });
    }

    const result = await grantDepositBundleToUser(admin, {
        userId,
        bundleId,
        grantedByAdminId: adminUser.id,
        note,
    });

    if (!result.ok) {
        const messages: Record<string, string> = {
            user_not_found: "User not found",
            invalid_bundle: "Invalid bundle",
            balance_fetch_failed: "Could not read user balance",
            balance_upsert_failed: "Could not update user balance",
        };
        return NextResponse.json(
            { error: messages[result.reason || ""] || "Grant failed" },
            { status: 400 }
        );
    }

    return NextResponse.json({
        success: true,
        message: `Granted ${result.diamondsAdded?.toLocaleString()} Diamonds and ${result.forgesAdded} Forges Coins`,
        diamondsAdded: result.diamondsAdded,
        forgesAdded: result.forgesAdded,
        newBalance: result.newBalance,
        paymentRowId: result.paymentRowId,
    });
}
