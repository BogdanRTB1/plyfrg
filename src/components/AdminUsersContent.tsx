"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle2, Clock3, RefreshCw, ShieldAlert, ShieldCheck, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";

type AdminUserRow = {
    id: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    provider: string;
    created_at: string;
    last_sign_in_at: string | null;
    confirmed_at: string | null;
    is_kyc_verified: boolean;
    is_admin: boolean;
    diamonds: number;
    forges_coins: number;
};

const formatDate = (value: string | null) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function AdminUsersContent() {
    const supabase = createClient();
    const [rows, setRows] = useState<AdminUserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [limit, setLimit] = useState(50);

    const fetchRows = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setRows([]);
            setLoading(false);
            return;
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .single();

        const adminFlag = !!profile?.is_admin || !!session.user.app_metadata?.is_admin;
        setIsAdmin(adminFlag);
        if (!adminFlag) {
            setRows([]);
            setLoading(false);
            return;
        }

        const res = await fetch(`/api/admin/users?limit=${limit}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = await res.json();
        if (!res.ok) {
            toast.error(payload.error || "Failed to load users");
            setRows([]);
            setLoading(false);
            return;
        }

        setRows(payload.rows || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRows();
    }, [limit]);

    const newLast24h = useMemo(() => {
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        return rows.filter((row) => new Date(row.created_at).getTime() >= cutoff).length;
    }, [rows]);

    if (loading) {
        return <div className="p-10 text-slate-400">Loading newly registered users...</div>;
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
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-black text-white">New Users</h1>
                    <p className="mt-1 text-sm text-slate-500">Latest registered accounts from Supabase Auth.</p>
                </div>
                <div className="flex items-center gap-2">
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="rounded-lg border border-white/10 bg-[#0f212e] px-3 py-2 text-sm text-white"
                    >
                        <option value={25}>Last 25</option>
                        <option value={50}>Last 50</option>
                        <option value={100}>Last 100</option>
                    </select>
                    <button
                        type="button"
                        onClick={fetchRows}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#0f212e] px-3 py-2 text-sm text-white border border-white/10 hover:bg-[#1a2c38]"
                    >
                        <RefreshCw size={14} /> Refresh
                    </button>
                </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                    <div className="flex items-center gap-3 text-slate-400">
                        <Users size={18} className="text-[#00b9f0]" />
                        <span className="text-xs font-bold uppercase tracking-wider">Loaded Users</span>
                    </div>
                    <p className="mt-2 text-2xl font-black text-white">{rows.length}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                    <div className="flex items-center gap-3 text-slate-400">
                        <UserPlus size={18} className="text-green-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">New Last 24h</span>
                    </div>
                    <p className="mt-2 text-2xl font-black text-white">{newLast24h}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                    <div className="flex items-center gap-3 text-slate-400">
                        <ShieldCheck size={18} className="text-amber-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">KYC Verified</span>
                    </div>
                    <p className="mt-2 text-2xl font-black text-white">{rows.filter((row) => row.is_kyc_verified).length}</p>
                </div>
            </div>

            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={row.id} className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1a2c38] text-sm font-black text-[#00b9f0]">
                                    {row.avatar_url ? (
                                        <img src={row.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        (row.username || row.email || "U")[0]?.toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="truncate font-bold text-white">{row.username || row.email || "Unknown user"}</p>
                                    <p className="truncate text-sm text-slate-400">{row.email || "No email"}</p>
                                    <p className="mt-1 font-mono text-[11px] text-slate-600">{row.id}</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${row.is_kyc_verified ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                                    {row.is_kyc_verified ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
                                    {row.is_kyc_verified ? "KYC verified" : "KYC pending"}
                                </span>
                                {row.is_admin && (
                                    <span className="rounded-full bg-blue-500/20 px-2 py-1 text-blue-300">Admin</span>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered</p>
                                <p>{formatDate(row.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Sign In</p>
                                <p>{formatDate(row.last_sign_in_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Provider</p>
                                <p>{row.provider || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Balance</p>
                                <p className="flex flex-wrap items-center gap-3">
                                    <span className="inline-flex items-center gap-1">
                                        <DiamondIcon className="h-4 w-4" /> {Math.floor(row.diamonds).toLocaleString()}
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                        <ForgesCoinIcon className="h-4 w-4" /> {row.forges_coins.toFixed(2)}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {rows.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-[#0f212e] p-6 text-center text-slate-400">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
}
