"use client";
/* eslint-disable */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wallet, ArrowDownCircle, ArrowUpCircle, Gift, Bitcoin, Clock, Loader2, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { DiamondIcon, ForgesCoinIcon } from "./CurrencyIcons";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    diamonds: number;
    setDiamonds: React.Dispatch<React.SetStateAction<number>>;
    forgesCoins: number;
    setForgesCoins: React.Dispatch<React.SetStateAction<number>>;
}

type TabType = 'deposit' | 'redeem' | 'bonus' | 'history';
const REDEEM_USD_RATE = 0.8;

interface Transaction {
    id: string;
    type: 'purchase' | 'redeem' | 'bonus';
    amount: number;
    date: Date;
    status: 'completed' | 'pending';
    method?: string;
}

export default function WalletModal({ isOpen, onClose, diamonds, setDiamonds, forgesCoins, setForgesCoins }: WalletModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('deposit');
    const [show, setShow] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>(() => [
        { id: '1', type: 'purchase', amount: 50.00, date: new Date(Date.now() - 86400000), status: 'completed', method: 'Credit Card' },
        { id: '2', type: 'bonus', amount: 2.50, date: new Date(Date.now() - 172800000), status: 'completed' }
    ]);

    const supabase = createClient();

    // Deposit/Purchase state
    const [selectedBundle, setSelectedBundle] = useState<number | null>(null);

    const [pendingInvoiceUrl, setPendingInvoiceUrl] = useState<string | null>(null);

    // Redeem state
    const [redeemAmount, setRedeemAmount] = useState("");
    const [redeemAddress, setRedeemAddress] = useState("");
    const [redeemEmail, setRedeemEmail] = useState("");

    const bundles = [
        { id: 1, price: 35, diamonds: 35000, forgesCoins: 38 },
        { id: 2, price: 50, diamonds: 50000, forgesCoins: 55 },
        { id: 3, price: 70, diamonds: 70000, forgesCoins: 78 },
        { id: 4, price: 80, diamonds: 80000, forgesCoins: 90 },
        { id: 5, price: 100, diamonds: 100000, forgesCoins: 115 },
        { id: 6, price: 150, diamonds: 150000, forgesCoins: 175 },
        { id: 7, price: 250, diamonds: 250000, forgesCoins: 290 },
        { id: 8, price: 500, diamonds: 500000, forgesCoins: 600 },
    ];

    // Bonus state
    const [bonusClaimed, setBonusClaimed] = useState(false);
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            requestAnimationFrame(() => setShow(true));
        } else {
            setShow(false);
            const timer = setTimeout(() => setShouldRender(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const updateTimer = (lastDate: Date) => {
        const interval = setInterval(() => {
            const now = new Date();
            const nextClaim = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
            const diff = nextClaim.getTime() - now.getTime();

            if (diff <= 0) {
                setBonusClaimed(false);
                clearInterval(interval);
            } else {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${h}h ${m}m ${s}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    };

    // Check bonus status on mount
    useEffect(() => {
        const lastClaim = localStorage.getItem('lastDailyBonus');
        if (lastClaim) {
            const lastDate = new Date(parseInt(lastClaim));
            const now = new Date();
            const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

            if (diffHours < 24) {
                setBonusClaimed(true);
                updateTimer(lastDate);
            }
        }
    }, [isOpen]);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedBundle === null) return;

        const bundle = bundles.find(b => b.id === selectedBundle);
        if (!bundle) return;

        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Please log in to make a deposit');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/crypto/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    bundleId: selectedBundle,
                    payCurrency: 'btc',
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.error || 'Failed to create payment');
                setLoading(false);
                return;
            }

            // Open NOWPayments invoice in new tab
            setPendingInvoiceUrl(data.invoiceUrl);
            window.open(data.invoiceUrl, '_blank');

            const newTx: Transaction = {
                id: data.invoiceId || Math.random().toString(36).substr(2, 9),
                type: 'purchase',
                amount: bundle.price,
                date: new Date(),
                status: 'pending',
                method: 'Bitcoin (BTC)'
            };
            setTransactions(prev => [newTx, ...prev]);

            toast.success('Payment invoice created! Complete the payment in the new tab.', { duration: 6000 });
            setSelectedBundle(null);
        } catch (error) {
            console.error('Crypto deposit error:', error);
            toast.error('Failed to create crypto payment. Please try again.');
        }

        setLoading(false);
    };

    const handleRedeem = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const emailValue = redeemEmail.trim().toLowerCase();
        const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);

        if (Number(redeemAmount) > forgesCoins) {
            toast.error("Insufficient Forges Coins");
            setLoading(false);
            return;
        }
        if (Number(redeemAmount) < 10) {
            toast.error("Minimum withdrawal is 10 Forges Coins");
            setLoading(false);
            return;
        }
        if (!emailValid) {
            toast.error("Please enter a valid email address");
            setLoading(false);
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('Please log in to withdraw');
                setLoading(false);
                return;
            }

            const res = await fetch('/api/crypto/create-payout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    amount: Number(redeemAmount),
                    address: redeemAddress,
                    email: emailValue,
                    currency: 'btc',
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                toast.error(data.error || 'Failed to create withdrawal');
                setLoading(false);
                return;
            }

            // Update local balance
            setForgesCoins(data.newBalance);
            localStorage.setItem('user_forges_coins', data.newBalance.toString());
            window.dispatchEvent(new Event('balance_updated'));

            const newTx: Transaction = {
                id: data.payoutId || Math.random().toString(36).substr(2, 9),
                type: 'redeem',
                amount: Number(redeemAmount),
                date: new Date(),
                status: 'pending',
                method: 'Bitcoin (BTC)'
            };
            setTransactions(prev => [newTx, ...prev]);

            setRedeemAmount("");
            setRedeemAddress("");
            setRedeemEmail("");
            toast.success("Redeem request submitted. Your request will be verified soon.");
        } catch (error) {
            console.error('Withdraw error:', error);
            toast.error('Failed to submit withdrawal. Please try again.');
        }

        setLoading(false);
    };

    const claimBonus = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const bonusAmount = (Math.random() * 0.15 + 0.05).toFixed(2);
        setForgesCoins(prev => prev + Number(bonusAmount));

        // Add transaction
        const newTx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'bonus',
            amount: Number(bonusAmount),
            date: new Date(),
            status: 'completed'
        };
        setTransactions(prev => [newTx, ...prev]);

        localStorage.setItem('lastDailyBonus', Date.now().toString());
        setBonusClaimed(true);
        updateTimer(new Date());

        toast.success(`You claimed your daily bonus: ${bonusAmount} Forges Coins`);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('notifications').insert({
                    user_id: user.id,
                    title: 'Daily Bonus Claimed',
                    message: `You successfully claimed your daily bonus of ${bonusAmount} Forges Coins.`
                });
            }
        } catch (error) {
            console.error('Failed to add notification:', error);
        }

        setLoading(false);
    };

    if (!shouldRender) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div
            role="presentation"
            className={`fixed inset-0 z-[60] flex items-end justify-center bg-black/65 backdrop-blur-sm transition-opacity duration-300 md:items-center md:p-4 ${show ? "opacity-100" : "opacity-0"}`}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.98, opacity: 0, y: 24 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.98, opacity: 0, y: 24 }}
                transition={{ type: "spring", duration: 0.45, bounce: 0.22 }}
                className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0f212e]/98 shadow-[0_0_50px_rgba(0,185,240,0.12)] backdrop-blur-2xl md:max-h-[min(90vh,720px)] md:rounded-2xl md:shadow-[0_0_50px_rgba(0,185,240,0.15)]"
                style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/5 bg-[#0a161f]/50 p-4 sm:p-6">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="shrink-0 rounded-xl bg-[#00b9f0]/10 p-2.5 text-[#00b9f0]">
                            <Wallet size={22} />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-white sm:text-xl">Wallet</h2>
                            <p className="text-[11px] font-medium text-slate-400 sm:text-xs">Buy Forges Coins &amp; manage funds</p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <div className="rounded-lg border border-white/5 bg-[#0a161f] px-2.5 py-1.5 text-right sm:px-4 sm:py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Balances</p>
                            <div className="mt-0.5 flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                                <div className="flex items-center gap-1" title="Diamonds">
                                    <DiamondIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="text-xs font-bold text-white tabular-nums sm:text-sm">{diamonds.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-1" title="Forges Coins">
                                    <ForgesCoinIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="text-xs font-bold text-amber-100 tabular-nums sm:text-sm">{forgesCoins.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl p-2.5 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                            aria-label="Close wallet"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col md:flex-row md:h-[580px]">
                    {/* Tabs: horizontal chips on mobile, sidebar on desktop */}
                    <div className="flex shrink-0 gap-1 overflow-x-auto overscroll-x-contain border-b border-white/5 bg-[#0a161f]/40 px-3.5 py-2.5 md:w-48 md:flex-col md:gap-2 md:overflow-visible md:border-b-0 md:border-r md:p-4 md:py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        <button
                            type="button"
                            onClick={() => setActiveTab('deposit')}
                            className={`relative flex min-w-0 flex-1 shrink items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-bold leading-tight transition-all sm:gap-1.5 sm:px-2 sm:text-[11px] md:w-full md:flex-none md:justify-start md:gap-2 md:rounded-xl md:px-4 md:py-3 md:text-sm ${activeTab === 'deposit'
                                ? 'bg-[#00b9f0]/15 text-[#00b9f0] shadow-[0_0_12px_rgba(0,185,240,0.12)]'
                                : 'bg-[#1a2c38]/80 text-slate-400 active:bg-white/5'
                                }`}
                        >
                            {activeTab === 'deposit' && (
                                <motion.div
                                    layoutId="activeWalletTab"
                                    className="absolute inset-0 rounded-lg bg-[#00b9f0]/8 md:rounded-xl md:block"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                />
                            )}
                            <ArrowDownCircle className="relative z-10 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />
                            <span className="relative z-10">Deposit</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('redeem')}
                            className={`relative flex min-w-0 flex-1 shrink items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-bold leading-tight transition-all sm:gap-1.5 sm:px-2 sm:text-[11px] md:w-full md:flex-none md:justify-start md:gap-2 md:rounded-xl md:px-4 md:py-3 md:text-sm ${activeTab === 'redeem'
                                ? 'bg-[#00b9f0]/15 text-[#00b9f0] shadow-[0_0_12px_rgba(0,185,240,0.12)]'
                                : 'bg-[#1a2c38]/80 text-slate-400 active:bg-white/5'
                                }`}
                        >
                            <ArrowUpCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />
                            Redeem
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`relative flex min-w-0 flex-1 shrink items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-bold leading-tight transition-all sm:gap-1.5 sm:px-2 sm:text-[11px] md:w-full md:flex-none md:justify-start md:gap-2 md:rounded-xl md:px-4 md:py-3 md:text-sm ${activeTab === 'history'
                                ? 'bg-[#00b9f0]/15 text-[#00b9f0] shadow-[0_0_12px_rgba(0,185,240,0.12)]'
                                : 'bg-[#1a2c38]/80 text-slate-400 active:bg-white/5'
                                }`}
                        >
                            <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />
                            History
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('bonus')}
                            className={`relative flex min-w-0 flex-1 shrink items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-bold leading-tight transition-all sm:gap-1.5 sm:px-2 sm:text-[11px] md:w-full md:flex-none md:justify-start md:gap-2 md:rounded-xl md:px-4 md:py-3 md:text-sm ${activeTab === 'bonus'
                                ? 'bg-amber-500/15 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
                                : 'bg-[#1a2c38]/80 text-slate-400 active:bg-white/5'
                                }`}
                        >
                            <Gift className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />
                            Bonus
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {activeTab === 'deposit' && (
                                    <div className="space-y-4 pb-2 md:space-y-6 md:pb-4">
                                        <div className="flex items-center gap-3 rounded-xl border border-[#f7931a]/25 bg-gradient-to-r from-[#f7931a]/10 to-transparent p-3 sm:p-4">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7931a]/20">
                                                <Bitcoin size={22} className="text-[#f7931a]" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-white">Buy with Bitcoin</p>
                                                <p className="text-[11px] leading-snug text-slate-400">Diamonds + bonus Forges Coins · secure checkout</p>
                                            </div>
                                        </div>

                                        {pendingInvoiceUrl && (
                                            <div className="flex flex-col gap-3 rounded-xl border border-[#f7931a]/30 bg-[#f7931a]/10 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-[#f7931a]">Payment pending</p>
                                                    <p className="mt-0.5 text-[10px] text-[#f7931a]/70">Finish payment in the tab we opened.</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(pendingInvoiceUrl, '_blank')}
                                                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#f7931a] px-4 py-2.5 text-xs font-bold text-black transition-colors hover:bg-[#f7931a]/85 active:scale-[0.98]"
                                                >
                                                    <ExternalLink size={14} />
                                                    Open invoice
                                                </button>
                                            </div>
                                        )}

                                        <form onSubmit={handleDeposit} className="space-y-4 md:space-y-6">
                                            <div className="space-y-2 md:space-y-3">
                                                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Choose a bundle</label>
                                                <div className="max-h-[min(42vh,320px)] overflow-y-auto overscroll-contain pr-0.5 md:max-h-none md:overflow-visible">
                                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                                    {bundles.map(bundle => (
                                                        <button
                                                            key={bundle.id}
                                                            type="button"
                                                            onClick={() => setSelectedBundle(bundle.id)}
                                                            className={`flex min-h-[100px] flex-col items-center justify-center gap-1 rounded-xl border p-2.5 transition-all active:scale-[0.98] sm:p-3 ${selectedBundle === bundle.id
                                                                ? 'border-[#00b9f0] bg-[#00b9f0]/12 shadow-[0_0_18px_rgba(0,185,240,0.25)] ring-1 ring-[#00b9f0]/40'
                                                                : 'border-white/10 bg-[#0a161f] hover:border-white/25'
                                                                }`}
                                                        >
                                                            <div className="mb-0.5 flex w-full items-center justify-center gap-1 border-b border-white/5 pb-1 text-[11px] font-bold text-blue-400 sm:text-xs">
                                                                <DiamondIcon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" /> <span className="tabular-nums">{bundle.diamonds.toLocaleString()}</span>
                                                            </div>
                                                            <div className="mb-0.5 flex items-center gap-1 text-[10px] font-bold text-amber-500 sm:text-xs">
                                                                <ForgesCoinIcon className="h-3 w-3 shrink-0" />
                                                                +{bundle.forgesCoins} FC
                                                            </div>
                                                            <div className="pt-0.5 text-base font-black text-white sm:text-lg">
                                                                ${bundle.price.toFixed(2)}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading || selectedBundle === null}
                                                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#f7931a] text-sm font-bold text-black shadow-[0_0_20px_rgba(247,147,26,0.2)] transition-all hover:bg-[#f7931a]/85 hover:shadow-[0_0_28px_rgba(247,147,26,0.35)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 md:hover:-translate-y-0.5"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Bitcoin size={20} />}
                                                {loading ? 'Processing...' : 'Pay with Bitcoin'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {activeTab === 'redeem' && (
                                    <div className="space-y-6">
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                                            <p className="text-amber-500 text-xs font-bold text-center mb-1">
                                                Withdrawals are processed within 24 hours.
                                            </p>
                                            <p className="text-amber-500/70 text-[10px] text-center font-medium">
                                                Minimum withdrawal: 10 Forges Coins. Must be played through at least 3x.
                                            </p>
                                        </div>

                                        <form onSubmit={handleRedeem} className="space-y-6">
                                            <div className="flex items-center gap-3 p-4 bg-[#f7931a]/5 border border-[#f7931a]/20 rounded-xl">
                                                <Bitcoin size={24} className="text-[#f7931a]" />
                                                <div>
                                                    <p className="text-white font-bold text-sm">Bitcoin Withdrawal</p>
                                                    <p className="text-slate-400 text-xs">Withdraw to your Bitcoin wallet</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                                                    <span className="text-xs text-slate-400">Available: <span className="text-white font-bold">{forgesCoins.toFixed(2)}</span></span>
                                                </div>
                                                <div className="relative group">
                                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:brightness-110 transition-all">
                                                        <ForgesCoinIcon className="w-5 h-5 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={redeemAmount}
                                                        onChange={(e) => setRedeemAmount(e.target.value)}
                                                        placeholder="Min. 10 FC"
                                                        className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-bold"
                                                        min="10"
                                                        max={forgesCoins}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    Contact Email
                                                </label>
                                                <input
                                                    type="email"
                                                    value={redeemEmail}
                                                    onChange={(e) => setRedeemEmail(e.target.value)}
                                                    placeholder="Enter your email for redeem verification"
                                                    className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium text-sm"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                    BTC Wallet Address
                                                </label>
                                                <input
                                                    type="text"
                                                    value={redeemAddress}
                                                    onChange={(e) => setRedeemAddress(e.target.value)}
                                                    placeholder="Enter your BTC address"
                                                    className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium text-sm"
                                                    required
                                                />
                                            </div>

                                            {redeemAmount && Number(redeemAmount) >= 10 && (
                                                <div className="bg-[#0a161f] border border-white/5 rounded-xl p-3 text-center">
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">You will receive approximately</p>
                                                    <p className="text-lg font-black text-white mt-1">
                                                        ~${(Number(redeemAmount) * REDEEM_USD_RATE).toFixed(2)} USD
                                                        <span className="text-xs text-slate-400 font-medium ml-2">in BTC</span>
                                                    </p>
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={loading || !redeemAmount || !redeemAddress || !redeemEmail || Number(redeemAmount) < 10}
                                                className="w-full bg-white hover:bg-slate-200 text-[#0f212e] h-12 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpCircle size={20} />}
                                                {loading ? 'Processing...' : 'Withdraw to Bitcoin'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {activeTab === 'bonus' && (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-8 py-8">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-[#00b9f0] blur-[60px] opacity-20 animate-pulse"></div>
                                            <Gift size={80} className={`relative z-10 ${bonusClaimed ? 'text-slate-600' : 'text-[#00b9f0]'}`} />
                                        </div>

                                        <div className="space-y-2">
                                            <h2 className="text-2xl font-black text-white uppercase italic tracking-wide">Daily Reward</h2>
                                            <p className="text-sm max-w-xs mx-auto text-amber-500/80 font-bold border border-amber-500/20 bg-amber-500/10 py-2 px-4 rounded-xl mt-4">
                                                Come back every 24 hours to claim your free Forges Coins!
                                            </p>
                                        </div>

                                        {bonusClaimed ? (
                                            <div className="bg-[#0a161f] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Clock size={24} className="text-slate-500 mb-2" />
                                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Next Reward In</p>
                                                    <p className="text-3xl font-black text-white font-mono">{timeLeft}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={claimBonus}
                                                disabled={loading}
                                                className="px-12 py-4 bg-gradient-to-r from-[#00b9f0] to-blue-600 hover:from-[#38bdf8] hover:to-blue-500 text-white rounded-2xl font-black text-lg transition-all shadow-[0_0_30px_rgba(0,185,240,0.4)] hover:shadow-[0_0_50px_rgba(0,185,240,0.6)] hover:-translate-y-1 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
                                            >
                                                {loading ? <Loader2 className="animate-spin" /> : <Gift className="animate-bounce" />}
                                                <span>CLAIM BONUS</span>
                                            </button>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-white mb-4">Transaction History</h3>
                                        <div className="space-y-3">
                                            {transactions.length === 0 ? (
                                                <div className="text-center py-12 text-slate-500">
                                                    <Clock size={48} className="mx-auto mb-4 opacity-50" />
                                                    <p>No transactions yet</p>
                                                </div>
                                            ) : (
                                                transactions.map((tx) => (
                                                    <div key={tx.id} className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-[#0a161f]/50 p-4">
                                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                                            <div className={`p-2.5 rounded-lg ${tx.type === 'purchase' ? 'bg-green-500/10 text-green-500' :
                                                                tx.type === 'redeem' ? 'bg-amber-500/10 text-amber-500' :
                                                                    'bg-blue-500/10 text-blue-500'
                                                                }`}>
                                                                {tx.type === 'purchase' ? <ArrowDownCircle size={20} /> :
                                                                    tx.type === 'redeem' ? <ArrowUpCircle size={20} /> :
                                                                        <Gift size={20} />}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-bold capitalize text-white">{tx.type} {tx.method ? `• ${tx.method}` : ''}</p>
                                                                <p className="text-xs text-slate-500">{tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="shrink-0 text-right">
                                                            <p className={`font-bold tabular-nums ${tx.type === 'redeem' ? 'text-white' : 'text-green-500'
                                                                }`}>
                                                                {tx.type === 'redeem' ? '-' : '+'}
                                                                {tx.type === 'purchase' ? `$${tx.amount.toFixed(2)}` : tx.amount.toFixed(2)}
                                                            </p>
                                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${tx.status === 'completed' ? 'text-green-500' : 'text-amber-500'
                                                                }`}>
                                                                {tx.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
