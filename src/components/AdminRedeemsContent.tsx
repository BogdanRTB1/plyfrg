"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { CheckCircle2, Clock3, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type RedeemRow = {
    id: string;
    user_id: string;
    requester_email: string | null;
    forges_coins_amount: number;
    usd_amount: number;
    pay_currency: string;
    pay_address: string;
    payout_status: string;
    completed: "yes" | "no";
    admin_notes: string | null;
    created_at: string;
};

export default function AdminRedeemsContent() {
    const supabase = createClient();
    const [rows, setRows] = useState<RedeemRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [notesById, setNotesById] = useState<Record<string, string>>({});
    const [savingId, setSavingId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "yes" | "no">("all");

    const fetchRows = async () => {
        setLoading(true);
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

        const adminFlag = !!profile?.is_admin || !!session.user.app_metadata?.is_admin;
        setIsAdmin(adminFlag);
        if (!adminFlag) {
            setLoading(false);
            return;
        }

        const res = await fetch("/api/admin/redeem-requests", {
            headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = await res.json();
        if (!res.ok) {
            toast.error(payload.error || "Failed to load redeem requests");
            setLoading(false);
            return;
        }

        setRows(payload.rows || []);
        const seedNotes: Record<string, string> = {};
        (payload.rows || []).forEach((row: RedeemRow) => {
            seedNotes[row.id] = row.admin_notes || "";
        });
        setNotesById(seedNotes);
        setLoading(false);
    };

    useEffect(() => {
        fetchRows();
    }, []);

    const visibleRows = useMemo(() => {
        if (statusFilter === "all") return rows;
        return rows.filter((r) => r.completed === statusFilter);
    }, [rows, statusFilter]);

    const saveRow = async (id: string, completed: "yes" | "no", payoutStatus?: string) => {
        setSavingId(id);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setSavingId(null);
            return;
        }

        const res = await fetch("/api/admin/redeem-requests", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
                id,
                completed,
                payout_status: payoutStatus,
                admin_notes: notesById[id] || "",
            }),
        });
        const payload = await res.json();
        if (!res.ok) {
            toast.error(payload.error || "Failed to update request");
            setSavingId(null);
            return;
        }

        setRows((prev) =>
            prev.map((row) =>
                row.id === id
                    ? {
                        ...row,
                        completed,
                        payout_status: payoutStatus || row.payout_status,
                        admin_notes: notesById[id] || "",
                    }
                    : row
            )
        );
        toast.success("Redeem request updated");
        setSavingId(null);
    };

    if (loading) {
        return <div className="p-10 text-slate-400">Loading admin redeem requests...</div>;
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
                <h1 className="text-2xl font-black text-white">Redeem Requests</h1>
                <div className="flex items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "all" | "yes" | "no")}
                        className="rounded-lg border border-white/10 bg-[#0f212e] px-3 py-2 text-sm text-white"
                    >
                        <option value="all">All</option>
                        <option value="no">Pending completed=no</option>
                        <option value="yes">Completed=yes</option>
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

            <div className="space-y-3">
                {visibleRows.map((row) => (
                    <div key={row.id} className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs text-slate-400">
                                <span className="font-bold text-white">#{row.id.slice(0, 8)}</span> • {new Date(row.created_at).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`rounded-full px-2 py-1 ${row.completed === "yes" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                                    completed={row.completed}
                                </span>
                                <span className="rounded-full bg-blue-500/20 text-blue-300 px-2 py-1">
                                    {row.payout_status}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-1 text-sm text-slate-300">
                            <p><span className="text-slate-500">Email:</span> {row.requester_email || "-"}</p>
                            <p><span className="text-slate-500">Amount:</span> {row.forges_coins_amount} FC (${Number(row.usd_amount).toFixed(2)})</p>
                            <p><span className="text-slate-500">Wallet:</span> {row.pay_address}</p>
                            <p><span className="text-slate-500">Currency:</span> {row.pay_currency.toUpperCase()}</p>
                        </div>

                        <textarea
                            value={notesById[row.id] || ""}
                            onChange={(e) => setNotesById((prev) => ({ ...prev, [row.id]: e.target.value }))}
                            placeholder="Admin notes..."
                            className="mt-3 w-full rounded-lg border border-white/10 bg-[#0a161f] p-3 text-sm text-white placeholder-slate-500"
                            rows={2}
                        />

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                disabled={savingId === row.id}
                                onClick={() => saveRow(row.id, "yes", "completed")}
                                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                            >
                                <CheckCircle2 size={14} /> Mark completed=yes
                            </button>
                            <button
                                type="button"
                                disabled={savingId === row.id}
                                onClick={() => saveRow(row.id, "no", "pending")}
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
                            >
                                <Clock3 size={14} /> Mark completed=no
                            </button>
                        </div>
                    </div>
                ))}
                {visibleRows.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-[#0f212e] p-6 text-center text-slate-400">
                        No redeem requests found for this filter.
                    </div>
                )}
            </div>
        </div>
    );
}
