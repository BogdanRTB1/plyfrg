import { NextResponse } from "next/server";
import { createClient, User } from "@supabase/supabase-js";

export const getSupabaseAdmin = () =>
    createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

export async function requireAdmin(req: Request): Promise<
    | { error: NextResponse }
    | { user: User; admin: ReturnType<typeof getSupabaseAdmin> }
> {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const token = authHeader.replace("Bearer ", "");
    const admin = getSupabaseAdmin();
    const { data: { user }, error: authError } = await admin.auth.getUser(token);
    if (authError || !user) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }

    const { data: profile } = await admin
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

    const isAdmin = !!profile?.is_admin || !!user.app_metadata?.is_admin;
    if (!isAdmin) {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { user, admin };
}
