"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { DEPOSIT_BUNDLES, type DepositBundle } from "@/constants/depositBundles";
import { Gift, Loader2, Search, ShieldAlert, User } from "lucide-react";
import { toast } from "sonner";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";

type SearchUser = {
    id: string;
    email: string | null;
    username: string | null;
    diamonds: number;
    forges_coins: number;
};

export default function AdminGrantBundleContent() {
    const supabase = createClient();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [users, setUsers] = useState<SearchUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
    const [selectedBundleId, setSelectedBundleId] = useState<number | null>(null);
    const [note, setNote] = useState("");
    const [granting, setGranting] = useState(false);

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

    const runSearch = async () => {
        const q = searchQuery.trim();
        if (q.length < 2) {
            toast.error("Enter at least 2 characters (email, username, or user ID)");
            return;
        }

        setSearching(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setSearching(false);
            return;
        }

        const res = await fetch(`/api/admin/grant-bundle?q=${encodeURIComponent(q)}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = await res.json();
        setSearching(false);

        if (!res.ok) {
            toast.error(payload.error || "Search failed");
            return;
        }

        setUsers(payload.users || []);
        if ((payload.users || []).length === 0) {
            toast.info("No users found");
        }
    };

    const grantBundle = async () => {
        if (!selectedUser || selectedBundleId == null) {
            toast.error("Select a user and a bundle");
            return;
        }

        const bundle = DEPOSIT_BUNDLES.find((b) => b.id === selectedBundleId);
        if (!bundle) return;

        const label = selectedUser.username || selectedUser.email || selectedUser.id;
        if (
            !window.confirm(
                `Grant $${bundle.price} bundle to ${label}?\n\n${bundle.diamonds.toLocaleString()} Diamonds + ${bundle.forgesCoins} Forges Coins`
            )
        ) {
            return;
        }

        setGranting(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setGranting(false);
            return;
        }

        const res = await fetch("/api/admin/grant-bundle", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: selectedUser.id,
                bundleId: selectedBundleId,
                note: note.trim() || undefined,
            }),
        });
        const payload = await res.json();
        setGranting(false);

        if (!res.ok) {
            toast.error(payload.error || "Grant failed");
            return;
        }

        toast.success(payload.message || "Bundle granted");
        setSelectedUser({
            ...selectedUser,
            diamonds: payload.newBalance?.diamonds ?? selectedUser.diamonds,
            forges_coins: payload.newBalance?.forges_coins ?? selectedUser.forges_coins,
        });
        setUsers((prev) =>
            prev.map((u) =>
                u.id === selectedUser.id
                    ? {
                          ...u,
                          diamonds: payload.newBalance?.diamonds ?? u.diamonds,
                          forges_coins: payload.newBalance?.forges_coins ?? u.forges_coins,
                      }
                    : u
            )
        );
        setNote("");
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
                <h1 className="text-2xl font-black text-white">Grant Store Bundle</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Give any user a deposit package (Diamonds + Forges Coins) without payment.
                </p>
            </div>

            <div className="mb-8 space-y-3 rounded-xl border border-white/10 bg-[#0f212e] p-4 sm:p-5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Find user
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && void runSearch()}
                        placeholder="Email, username, or user ID"
                        className="flex-1 rounded-lg border border-white/10 bg-[#0a161f] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[#00b9f0] focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={() => void runSearch()}
                        disabled={searching}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00b9f0] px-4 py-2.5 text-sm font-bold text-[#0f212e] hover:bg-[#38bdf8] disabled:opacity-50"
                    >
                        {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        Search
                    </button>
                </div>

                {users.length > 0 && (
                    <div className="space-y-2 pt-2">
                        {users.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => setSelectedUser(user)}
                                className={`flex w-full items-start justify-between gap-3 rounded-lg border p-3 text-left transition-colors ${
                                    selectedUser?.id === user.id
                                        ? "border-[#00b9f0] bg-[#00b9f0]/10"
                                        : "border-white/10 bg-[#0a161f] hover:border-white/20"
                                }`}
                            >
                                <div className="min-w-0">
                                    <p className="font-bold text-white">
                                        {user.username ? `@${user.username}` : user.email || "User"}
                                    </p>
                                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                                    <p className="mt-1 font-mono text-[10px] text-slate-600">{user.id}</p>
                                </div>
                                <div className="shrink-0 text-right text-xs text-slate-300">
                                    <p className="flex items-center justify-end gap-1">
                                        <DiamondIcon className="h-3.5 w-3.5" />
                                        {user.diamonds.toLocaleString()}
                                    </p>
                                    <p className="mt-1 flex items-center justify-end gap-1">
                                        <ForgesCoinIcon className="h-3.5 w-3.5" />
                                        {user.forges_coins.toFixed(2)}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {selectedUser && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-400">
                    <User size={16} />
                    Selected: {selectedUser.username || selectedUser.email || selectedUser.id}
                </div>
            )}

            <div className="mb-6">
                <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Choose bundle
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {DEPOSIT_BUNDLES.map((bundle: DepositBundle) => (
                        <button
                            key={bundle.id}
                            type="button"
                            onClick={() => setSelectedBundleId(bundle.id)}
                            className={`flex flex-col items-center rounded-xl border p-3 transition-all ${
                                selectedBundleId === bundle.id
                                    ? "border-[#00b9f0] bg-[#00b9f0]/12 ring-1 ring-[#00b9f0]/40"
                                    : "border-white/10 bg-[#0f212e] hover:border-white/25"
                            }`}
                        >
                            <p className="text-lg font-black text-white">${bundle.price}</p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-blue-400">
                                <DiamondIcon className="h-3 w-3" />
                                {bundle.diamonds.toLocaleString()}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                <ForgesCoinIcon className="h-3 w-3" />+{bundle.forgesCoins} FC
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mb-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Note to user (optional)
                </label>
                <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Compensation for payment issue"
                    className="w-full rounded-lg border border-white/10 bg-[#0a161f] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-[#00b9f0] focus:outline-none"
                />
            </div>

            <button
                type="button"
                onClick={() => void grantBundle()}
                disabled={granting || !selectedUser || selectedBundleId == null}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
            >
                {granting ? <Loader2 size={18} className="animate-spin" /> : <Gift size={18} />}
                {granting ? "Granting..." : "Grant bundle to user"}
            </button>
        </div>
    );
}
