"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Search, ShieldAlert, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

type CreatorRow = {
    id: string;
    displayName: string;
    profilePicture: string | null;
    organicFollowers: number;
    fakeFollowers: number;
    displayFollowers: number;
};

export default function AdminCreatorFollowersContent() {
    const supabase = createClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [creators, setCreators] = useState<CreatorRow[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [setFakeValue, setSetFakeValue] = useState("");
    const [addFakeValue, setAddFakeValue] = useState("");
    const [saving, setSaving] = useState(false);

    const selected = creators.find((c) => c.id === selectedId) || null;

    useEffect(() => {
        void (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }
            const { data: profile } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("id", session.user.id)
                .single();
            setIsAdmin(!!profile?.is_admin || !!session.user.app_metadata?.is_admin);
            setLoading(false);
        })();
    }, [supabase]);

    const loadCreators = useCallback(async (q?: string) => {
        setSearching(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setSearching(false);
            return;
        }

        const params = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
        const res = await fetch(`/api/admin/creator-followers${params}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = await res.json();
        setSearching(false);

        if (!res.ok) {
            toast.error(payload.error || "Failed to load creators");
            return;
        }

        const rows: CreatorRow[] = payload.creators || [];
        setCreators(rows);
        if (rows.length === 0) {
            toast.info("No creators found");
        }
    }, [supabase]);

    useEffect(() => {
        if (isAdmin) {
            void loadCreators();
        }
    }, [isAdmin, loadCreators]);

    useEffect(() => {
        if (selected) {
            setSetFakeValue(String(selected.fakeFollowers));
            setAddFakeValue("");
        }
    }, [selected]);

    const saveFakeFollowers = async (mode: "set" | "add") => {
        if (!selected) {
            toast.error("Select a creator first");
            return;
        }

        const amount =
            mode === "set" ? Number(setFakeValue) : Number(addFakeValue);

        if (!Number.isFinite(amount) || amount < 0) {
            toast.error("Enter a valid non-negative number");
            return;
        }

        const body =
            mode === "set"
                ? { creatorId: selected.id, fakeFollowers: amount }
                : { creatorId: selected.id, addFakeFollowers: amount };

        if (
            !window.confirm(
                mode === "set"
                    ? `Set fake followers for ${selected.displayName} to ${Math.floor(amount)}?`
                    : `Add ${Math.floor(amount)} fake followers to ${selected.displayName}?`
            )
        ) {
            return;
        }

        setSaving(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setSaving(false);
            return;
        }

        const res = await fetch("/api/admin/creator-followers", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const payload = await res.json();
        setSaving(false);

        if (!res.ok) {
            toast.error(payload.error || "Update failed");
            return;
        }

        const updated: CreatorRow = payload.creator;
        setCreators((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        setSetFakeValue(String(updated.fakeFollowers));
        setAddFakeValue("");
        toast.success(payload.message || "Fake followers updated");
        window.dispatchEvent(new CustomEvent("creator_stats_updated"));
    };

    if (loading) {
        return <div className="p-10 text-slate-400">Loading...</div>;
    }

    if (!isAdmin) {
        return (
            <div className="p-10 text-center text-slate-400">
                <ShieldAlert className="mx-auto mb-3 text-amber-400" size={28} />
                You do not have admin access for this page.
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-auto bg-[#050505] p-4 sm:p-6 md:p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                    <UserPlus className="text-[#00b9f0]" size={24} />
                    Creator Fake Followers
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Boost displayed follower counts without affecting real follows. Total shown = organic + fake.
                </p>
            </div>

            <div className="mb-6 space-y-3 rounded-xl border border-white/10 bg-[#0f212e] p-4 sm:p-5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Search creators
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void loadCreators(searchQuery)}
                        placeholder="Creator display name"
                        className="flex-1 rounded-lg border border-white/10 bg-[#0a161f] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[#00b9f0] focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => void loadCreators(searchQuery)}
                        disabled={searching}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00b9f0] px-4 py-2.5 text-sm font-bold text-[#0f212e] hover:bg-[#38bdf8] disabled:opacity-50"
                    >
                        {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery("");
                            void loadCreators();
                        }}
                        disabled={searching}
                        className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50"
                    >
                        Show all
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Creators</p>
                    {creators.map((creator) => (
                        <button
                            key={creator.id}
                            type="button"
                            onClick={() => setSelectedId(creator.id)}
                            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                                selectedId === creator.id
                                    ? "border-[#00b9f0] bg-[#00b9f0]/10"
                                    : "border-white/10 bg-[#0f212e] hover:border-white/20"
                            }`}
                        >
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[#1a2c38]">
                                {creator.profilePicture ? (
                                    <img src={creator.profilePicture} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-500">
                                        <Users size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-white">{creator.displayName}</p>
                                <p className="text-xs text-slate-400">
                                    Display: <span className="text-white font-bold">{creator.displayFollowers.toLocaleString()}</span>
                                    {" · "}Organic: {creator.organicFollowers.toLocaleString()}
                                    {" · "}Fake: <span className="text-amber-400">{creator.fakeFollowers.toLocaleString()}</span>
                                </p>
                            </div>
                        </button>
                    ))}
                    {creators.length === 0 && !searching && (
                        <p className="text-sm text-slate-500 py-8 text-center">No creators loaded.</p>
                    )}
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4 sm:p-5 h-fit">
                    {selected ? (
                        <div className="space-y-5">
                            <div>
                                <p className="text-lg font-black text-white">{selected.displayName}</p>
                                <p className="mt-1 text-sm text-slate-400 font-mono">{selected.id}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-lg bg-[#0a161f] p-3 border border-white/5">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Display</p>
                                    <p className="text-lg font-black text-white">{selected.displayFollowers.toLocaleString()}</p>
                                </div>
                                <div className="rounded-lg bg-[#0a161f] p-3 border border-white/5">
                                    <p className="text-[10px] uppercase font-bold text-slate-500">Organic</p>
                                    <p className="text-lg font-black text-slate-300">{selected.organicFollowers.toLocaleString()}</p>
                                </div>
                                <div className="rounded-lg bg-[#0a161f] p-3 border border-amber-500/20">
                                    <p className="text-[10px] uppercase font-bold text-amber-500/80">Fake</p>
                                    <p className="text-lg font-black text-amber-400">{selected.fakeFollowers.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Set fake followers (absolute)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        value={setFakeValue}
                                        onChange={(e) => setSetFakeValue(e.target.value)}
                                        className="flex-1 rounded-lg border border-white/10 bg-[#0a161f] px-4 py-2.5 text-sm text-white focus:border-[#00b9f0] focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void saveFakeFollowers("set")}
                                        disabled={saving}
                                        className="rounded-lg bg-[#00b9f0] px-4 py-2.5 text-sm font-bold text-[#0f212e] hover:bg-[#38bdf8] disabled:opacity-50"
                                    >
                                        Set
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Add fake followers (quick boost)
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {[100, 500, 1000, 5000, 10000].map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setAddFakeValue(String(n))}
                                            className="rounded-lg border border-white/10 bg-[#0a161f] px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-amber-500/40 hover:text-amber-300"
                                        >
                                            +{n.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        value={addFakeValue}
                                        onChange={(e) => setAddFakeValue(e.target.value)}
                                        placeholder="Amount to add"
                                        className="flex-1 rounded-lg border border-white/10 bg-[#0a161f] px-4 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void saveFakeFollowers("add")}
                                        disabled={saving}
                                        className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-[#0f212e] hover:bg-amber-400 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : "Add"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 py-12 text-center">Select a creator to edit fake followers.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
