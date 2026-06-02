"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
    CheckCircle2,
    Clock3,
    CreditCard,
    ExternalLink,
    RefreshCw,
    ShieldAlert,
    Wallet,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";

type TransactionRow = {
    id: string;
    user_id: string;
    username: string | null;
    email: string | null;
    nowpayments_id: string | number | null;
    invoice_id: string | null;
    order_id: string | null;
    invoice_url: string | null;
    payment_status: string | null;
    price_amount: number;
    price_currency: string | null;
    pay_currency: string | null;
    pay_amount: number | null;
    actually_paid: number | null;
    bundle_diamonds: number;
    bundle_forges_coins: number;
    credited: boolean;
    created_at: string;
    updated_at: string | null;
};

type Stats = {
    total: number;
    completed: number;
    credited: number;
    needs_credit: number;
    volume_usd: number;
    pending: number;
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

function statusBadge(status: string | null, credited: boolean) {
    const s = (status || "waiting").toLowerCase();
    if (credited) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-green-400">
                <CheckCircle2 size={12} /> Credited
            </span>
        );
    }
    if (s === "finished" || s === "confirmed") {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-1 text-amber-400">
                <Clock3 size={12} /> Paid — not credited
            </span>
        );
    }
    if (["failed", "expired", "refunded"].includes(s)) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-1 text-red-400">
                <XCircle size={12} /> {s}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/20 px-2 py-1 text-slate-300">
            <Clock3 size={12} /> {s}
        </span>
    );
}

export default function AdminTransactionsContent() {
    const supabase = createClient();
    const [rows, setRows] = useState<TransactionRow[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [limit, setLimit] = useState(100);
    const [statusFilter, setStatusFilter] = useState("all");
    const [creditedFilter, setCreditedFilter] = useState("all");
    const [creditingId, setCreditingId] = useState<string | null>(null);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [syncingAll, setSyncingAll] = useState(false);

    const fetchRows = async (options?: { syncNowPayments?: boolean }) => {
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

        const params = new URLSearchParams({ limit: String(limit) });
        if (options?.syncNowPayments) {
            params.set("sync", "true");
            params.set("maxSync", "10");
        }
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (creditedFilter !== "all") params.set("credited", creditedFilter);

        let res: Response;
        let payload: { rows?: TransactionRow[]; stats?: Stats; syncedFromApi?: number; error?: string };
        try {
            res = await fetch(`/api/admin/transactions?${params}`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            payload = await res.json();
        } catch {
            toast.error("Request failed — try again");
            setRows([]);
            setStats(null);
            setLoading(false);
            return;
        }
        if (!res.ok) {
            toast.error(payload.error || "Failed to load transactions");
            setRows([]);
            setStats(null);
            setLoading(false);
            return;
        }

        setRows(payload.rows || []);
        setStats(payload.stats || null);
        if ((payload.syncedFromApi ?? 0) > 0) {
            toast.success(`Synced ${payload.syncedFromApi} payment(s) from NOWPayments`);
        }
        setLoading(false);
    };

    const syncFromNowPayments = async (rowId: string) => {
        setSyncingId(rowId);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setSyncingId(null);
            return;
        }

        const res = await fetch("/api/admin/transactions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ action: "sync", paymentId: rowId }),
        });
        const payload = await res.json();
        if (!res.ok) {
            toast.error(payload.error || payload.message || "NOWPayments sync failed");
        } else if (payload.success === false) {
            toast.info(payload.message || "No NOWPayments payment yet", { duration: 8000 });
        } else {
            toast.success(`Payment ID: ${payload.nowpayments_id || "updated"}`);
            await fetchRows();
        }
        setSyncingId(null);
    };

    useEffect(() => {
        fetchRows();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [limit, statusFilter, creditedFilter]);

    const creditPayment = async (paymentId: string) => {
        setCreditingId(paymentId);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setCreditingId(null);
            return;
        }

        const res = await fetch("/api/admin/transactions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ paymentId, payment_status: "finished" }),
        });
        const payload = await res.json();
        if (!res.ok) {
            toast.error(payload.error || "Failed to credit payment");
        } else {
            toast.success(payload.message || "Payment credited");
            await fetchRows();
        }
        setCreditingId(null);
    };

    const canManualCredit = (row: TransactionRow) => {
        const s = (row.payment_status || "").toLowerCase();
        return !row.credited && (s === "finished" || s === "confirmed");
    };

    const filteredCount = useMemo(() => rows.length, [rows]);

    if (loading) {
        return <div className="p-10 text-slate-400">Loading purchase transactions...</div>;
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
                    <h1 className="text-2xl font-black text-white">Purchases & Deposits</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Deposits from NOWPayments — use Sync from NOWPayments or Sync NP per row for payment IDs.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => fetchRows()}
                        disabled={loading || syncingAll}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f212e] px-3 py-2 text-sm text-white hover:bg-[#1a2c38] disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button
                        type="button"
                        disabled={loading || syncingAll}
                        onClick={async () => {
                            setSyncingAll(true);
                            await fetchRows({ syncNowPayments: true });
                            setSyncingAll(false);
                        }}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#00b9f0]/30 bg-[#00b9f0]/10 px-3 py-2 text-sm font-bold text-[#00b9f0] hover:bg-[#00b9f0]/20 disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={syncingAll ? "animate-spin" : ""} />
                        Sync from NOWPayments
                    </button>
                </div>
            </div>

            {stats && (
                <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <CreditCard size={16} className="text-[#00b9f0]" />
                            <span className="text-xs font-bold uppercase tracking-wider">Shown</span>
                        </div>
                        <p className="mt-2 text-2xl font-black text-white">{filteredCount}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Wallet size={16} className="text-green-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">Completed USD</span>
                        </div>
                        <p className="mt-2 text-2xl font-black text-white">${stats.volume_usd.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed</span>
                        <p className="mt-2 text-2xl font-black text-white">{stats.completed}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Needs credit</span>
                        <p className="mt-2 text-2xl font-black text-amber-400">{stats.needs_credit}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending</span>
                        <p className="mt-2 text-2xl font-black text-white">{stats.pending}</p>
                    </div>
                </div>
            )}

            <div className="mb-4 flex flex-wrap gap-2">
                <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                    className="rounded-lg border border-white/10 bg-[#0f212e] px-3 py-2 text-sm text-white"
                >
                    <option value={50}>Last 50</option>
                    <option value={100}>Last 100</option>
                    <option value={200}>Last 200</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0f212e] px-3 py-2 text-sm text-white"
                >
                    <option value="all">All statuses</option>
                    <option value="waiting">waiting</option>
                    <option value="confirming">confirming</option>
                    <option value="confirmed">confirmed</option>
                    <option value="finished">finished</option>
                    <option value="failed">failed</option>
                    <option value="expired">expired</option>
                </select>
                <select
                    value={creditedFilter}
                    onChange={(e) => setCreditedFilter(e.target.value)}
                    className="rounded-lg border border-white/10 bg-[#0f212e] px-3 py-2 text-sm text-white"
                >
                    <option value="all">All credit states</option>
                    <option value="true">Credited only</option>
                    <option value="false">Not credited</option>
                </select>
            </div>

            <div className="space-y-3">
                {rows.map((row) => (
                    <div key={row.id} className="rounded-xl border border-white/10 bg-[#0f212e] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="font-bold text-white">
                                    ${row.price_amount.toFixed(2)} {row.price_currency?.toUpperCase() || "USD"}
                                    <span className="ml-2 text-sm font-normal text-slate-400">
                                        via {row.pay_currency?.toUpperCase() || "—"}
                                    </span>
                                </p>
                                {row.username && (
                                    <p className="text-sm font-medium text-slate-300">@{row.username}</p>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {statusBadge(row.payment_status, row.credited)}
                                <button
                                    type="button"
                                    disabled={syncingId === row.id}
                                    onClick={() => syncFromNowPayments(row.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-50"
                                >
                                    <RefreshCw size={12} className={syncingId === row.id ? "animate-spin" : ""} />
                                    Sync NP
                                </button>
                                {row.invoice_url && (
                                    <a
                                        href={row.invoice_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-xs text-[#00b9f0] hover:bg-white/5"
                                    >
                                        Invoice <ExternalLink size={12} />
                                    </a>
                                )}
                                {canManualCredit(row) && (
                                    <button
                                        type="button"
                                        disabled={creditingId === row.id}
                                        onClick={() => creditPayment(row.id)}
                                        className="rounded-lg bg-green-600/90 px-3 py-1 text-xs font-bold text-white hover:bg-green-500 disabled:opacity-50"
                                    >
                                        {creditingId === row.id ? "Crediting…" : "Credit user"}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-300">
                            <span className="inline-flex items-center gap-1">
                                <DiamondIcon className="h-4 w-4" />
                                {row.bundle_diamonds.toLocaleString()}
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <ForgesCoinIcon className="h-4 w-4" />
                                {row.bundle_forges_coins} FC
                            </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-3 lg:grid-cols-4">
                            <div className="md:col-span-2">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">User email</p>
                                <p className="break-all">{row.email || "—"}</p>
                            </div>
                            <div className="md:col-span-2 lg:col-span-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">User ID</p>
                                <p className="font-mono text-[11px] break-all text-slate-400">{row.user_id}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Created</p>
                                <p>{formatDate(row.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Updated</p>
                                <p>{formatDate(row.updated_at)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">NOWPayments payment ID</p>
                                <p className="font-mono text-xs break-all text-[#00b9f0]">
                                    {row.nowpayments_id != null && row.nowpayments_id !== ""
                                        ? String(row.nowpayments_id)
                                        : row.payment_status === "waiting"
                                          ? "— after customer pays"
                                          : "— (Sync NP when paid)"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Invoice ID</p>
                                <p className="font-mono text-xs break-all">{row.invoice_id ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">NP status</p>
                                <p className="capitalize">{row.payment_status ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Paid (crypto)</p>
                                <p>
                                    {row.actually_paid != null
                                        ? `${row.actually_paid} ${row.pay_currency?.toUpperCase() || ""}`
                                        : row.pay_amount != null
                                          ? `~${row.pay_amount} ${row.pay_currency?.toUpperCase() || ""}`
                                          : "—"}
                                </p>
                            </div>
                            <div className="md:col-span-2 lg:col-span-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Order ID</p>
                                <p className="font-mono text-[11px] break-all text-slate-500">{row.order_id ?? "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment row ID</p>
                                <p className="font-mono text-[11px] break-all text-slate-600">{row.id}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {rows.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-[#0f212e] p-6 text-center text-slate-400">
                        No transactions match your filters.
                    </div>
                )}
            </div>
        </div>
    );
}
