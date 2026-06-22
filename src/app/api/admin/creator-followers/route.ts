import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/utils/requireAdmin";
import { getCreatorDisplayFollowers, isMissingFakeFollowersColumn } from "@/utils/creatorFollowers";

type CreatorRow = {
    id: string;
    display_name: string | null;
    profile_picture: string | null;
    followers_count: number | null;
    fake_followers: number | null;
};

function mapCreator(row: CreatorRow) {
    const organic = Number(row.followers_count || 0);
    const fake = Number(row.fake_followers || 0);
    return {
        id: row.id,
        displayName: row.display_name || "Creator",
        profilePicture: row.profile_picture,
        organicFollowers: organic,
        fakeFollowers: fake,
        displayFollowers: getCreatorDisplayFollowers(organic, fake),
    };
}

export async function GET(req: NextRequest) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const { admin } = guard;
    const q = req.nextUrl.searchParams.get("q")?.trim() || "";

    let query = admin
        .from("creators")
        .select("id, display_name, profile_picture, followers_count, fake_followers")
        .order("followers_count", { ascending: false })
        .limit(50);

    if (q.length >= 1) {
        query = query.ilike("display_name", `%${q}%`);
    }

    const { data, error } = await query;
    if (error) {
        console.error("admin creator-followers list:", error);
        if (isMissingFakeFollowersColumn(error)) {
            return NextResponse.json(
                {
                    error: "Run supabase_creator_fake_followers_migration.sql in Supabase SQL Editor first.",
                    migrationRequired: true,
                },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: "Failed to load creators" }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        creators: (data || []).map((row) => mapCreator(row as CreatorRow)),
    });
}

export async function POST(req: NextRequest) {
    const guard = await requireAdmin(req);
    if ("error" in guard) return guard.error;

    const { admin } = guard;

    let body: {
        creatorId?: string;
        fakeFollowers?: number;
        addFakeFollowers?: number;
    } = {};
    try {
        body = await req.json();
    } catch {
        body = {};
    }

    const creatorId = String(body.creatorId || "").trim();
    if (!creatorId) {
        return NextResponse.json({ error: "creatorId is required" }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await admin
        .from("creators")
        .select("id, display_name, profile_picture, followers_count, fake_followers")
        .eq("id", creatorId)
        .maybeSingle();

    if (fetchError || !existing) {
        if (fetchError && isMissingFakeFollowersColumn(fetchError)) {
            return NextResponse.json(
                {
                    error: "Run supabase_creator_fake_followers_migration.sql in Supabase SQL Editor first.",
                    migrationRequired: true,
                },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const currentFake = Number(existing.fake_followers || 0);
    let nextFake = currentFake;

    if (typeof body.fakeFollowers === "number" && Number.isFinite(body.fakeFollowers)) {
        nextFake = Math.max(0, Math.floor(body.fakeFollowers));
    } else if (typeof body.addFakeFollowers === "number" && Number.isFinite(body.addFakeFollowers)) {
        nextFake = Math.max(0, currentFake + Math.floor(body.addFakeFollowers));
    } else {
        return NextResponse.json(
            { error: "Provide fakeFollowers (set) or addFakeFollowers (delta)" },
            { status: 400 }
        );
    }

    const { data: updated, error: updateError } = await admin
        .from("creators")
        .update({ fake_followers: nextFake })
        .eq("id", creatorId)
        .select("id, display_name, profile_picture, followers_count, fake_followers")
        .single();

    if (updateError || !updated) {
        console.error("admin creator-followers update:", updateError);
        if (updateError && isMissingFakeFollowersColumn(updateError)) {
            return NextResponse.json(
                {
                    error: "Run supabase_creator_fake_followers_migration.sql in Supabase SQL Editor first.",
                    migrationRequired: true,
                },
                { status: 503 }
            );
        }
        return NextResponse.json({ error: "Failed to update fake followers" }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        creator: mapCreator(updated as CreatorRow),
        message: `Fake followers updated for ${updated.display_name || "creator"}.`,
    });
}
