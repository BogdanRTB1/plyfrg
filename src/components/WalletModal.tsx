"use client";
/* eslint-disable */

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Wallet, ArrowDownCircle, ArrowUpCircle, Gift, CreditCard, Bitcoin, Clock, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance: number;
    setBalance: React.Dispatch<React.SetStateAction<number>>;
}

type TabType = 'deposit' | 'withdraw' | 'bonus' | 'history';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdraw' | 'bonus';
    amount: number;
    date: Date;
    status: 'completed' | 'pending';
    method?: string;
}

export default function WalletModal({ isOpen, onClose, balance, setBalance }: WalletModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('deposit');
    const [show, setShow] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<Transaction[]>(() => [
        { id: '1', type: 'deposit', amount: 50.00, date: new Date(Date.now() - 86400000), status: 'completed', method: 'Credit Card' },
        { id: '2', type: 'bonus', amount: 2.50, date: new Date(Date.now() - 172800000), status: 'completed' }
    ]);

    // Deposit state
    const [depositAmount, setDepositAmount] = useState("");
    const [depositMethod, setDepositMethod] = useState<'card' | 'crypto'>('card');

    // Withdraw state
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawAddress, setWithdrawAddress] = useState("");

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
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setBalance(prev => prev + Number(depositAmount));

        // Add transaction
        const newTx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'deposit',
            amount: Number(depositAmount),
            date: new Date(),
            status: 'completed',
            method: depositMethod === 'card' ? 'Credit Card' : 'Crypto'
        };
        setTransactions(prev => [newTx, ...prev]);

        setDepositAmount("");
        toast.success(`Successfully deposited $${depositAmount}`);
        setLoading(false);
    };

    const handleWithdraw = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (Number(withdrawAmount) > balance) {
            toast.error("Insufficient funds");
            setLoading(false);
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        setBalance(prev => prev - Number(withdrawAmount));

        // Add transaction
        const newTx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'withdraw',
            amount: Number(withdrawAmount),
            date: new Date(),
            status: 'pending',
            method: 'USDT'
        };
        setTransactions(prev => [newTx, ...prev]);

        setWithdrawAmount("");
        setWithdrawAddress("");
        toast.success(`Withdrawal request for $${withdrawAmount} submitted`);
        setLoading(false);
    };

    const claimBonus = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));

        const bonusAmount = (Math.random() * 5 + 1).toFixed(2);
        setBalance(prev => prev + Number(bonusAmount));

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

        toast.success(`You claimed your daily bonus: $${bonusAmount}`);
        setLoading(false);
    };

    if (!shouldRender) return null;
    if (typeof document === "undefined") return null;

    return createPortal(
        <div className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className="bg-[#0f212e]/95 backdrop-blur-2xl rounded-2xl w-full max-w-2xl p-0 relative shadow-[0_0_50px_rgba(0,185,240,0.15)] border border-white/10 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0a161f]/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-[#00b9f0]/10 rounded-xl text-[#00b9f0]">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Wallet</h2>
                            <p className="text-slate-400 text-xs font-medium">Manage your funds</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-[#0a161f] border border-white/5 px-4 py-2 rounded-lg text-right hidden sm:block">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Balance</p>
                            <p className="text-lg font-bold text-white">${balance.toFixed(2)}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row h-[500px]">
                    {/* Sidebar Tabs */}
                    <div className="w-full md:w-48 bg-[#0a161f]/30 border-b md:border-b-0 md:border-r border-white/5 p-4 space-y-2">
                        <button
                            onClick={() => setActiveTab('deposit')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all relative overflow-hidden ${activeTab === 'deposit'
                                ? 'bg-[#00b9f0]/10 text-[#00b9f0] shadow-[0_0_15px_rgba(0,185,240,0.1)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {activeTab === 'deposit' && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-[#00b9f0]/5"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <ArrowDownCircle size={18} className="relative z-10" />
                            <span className="relative z-10">Deposit</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('withdraw')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'withdraw'
                                ? 'bg-[#00b9f0]/10 text-[#00b9f0] shadow-[0_0_15px_rgba(0,185,240,0.1)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <ArrowUpCircle size={18} />
                            Withdraw
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'history'
                                ? 'bg-[#00b9f0]/10 text-[#00b9f0] shadow-[0_0_15px_rgba(0,185,240,0.1)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Clock size={18} />
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab('bonus')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'bonus'
                                ? 'bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Gift size={18} />
                            Daily Bonus
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
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
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setDepositMethod('card')}
                                                className={`p-4 border rounded-xl flex flex-col items-center gap-3 transition-all ${depositMethod === 'card'
                                                    ? 'bg-[#00b9f0]/10 border-[#00b9f0] text-white shadow-[0_0_15px_rgba(0,185,240,0.15)]'
                                                    : 'bg-[#0a161f]/50 border-white/5 text-slate-400 hover:border-white/20'
                                                    }`}
                                            >
                                                <CreditCard size={24} className={depositMethod === 'card' ? 'text-[#00b9f0]' : ''} />
                                                <span className="font-bold text-sm">Credit Card</span>
                                            </button>
                                            <button
                                                onClick={() => setDepositMethod('crypto')}
                                                className={`p-4 border rounded-xl flex flex-col items-center gap-3 transition-all ${depositMethod === 'crypto'
                                                    ? 'bg-[#00b9f0]/10 border-[#00b9f0] text-white shadow-[0_0_15px_rgba(0,185,240,0.15)]'
                                                    : 'bg-[#0a161f]/50 border-white/5 text-slate-400 hover:border-white/20'
                                                    }`}
                                            >
                                                <Bitcoin size={24} className={depositMethod === 'crypto' ? 'text-[#00b9f0]' : ''} />
                                                <span className="font-bold text-sm">Crypto</span>
                                            </button>
                                        </div>

                                        <form onSubmit={handleDeposit} className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00b9f0] transition-colors">$</span>
                                                    <input
                                                        type="number"
                                                        value={depositAmount}
                                                        onChange={(e) => setDepositAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] font-bold"
                                                        min="5"
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-2 flex-wrap">
                                                    {[25, 50, 100, 500].map(amt => (
                                                        <button
                                                            key={amt}
                                                            type="button"
                                                            onClick={() => setDepositAmount(amt.toString())}
                                                            className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                                        >
                                                            ${amt}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading || !depositAmount}
                                                className="w-full bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] h-12 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_30px_rgba(0,185,240,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                                {loading ? 'Processing...' : 'Deposit Funds'}
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {activeTab === 'withdraw' && (
                                    <div className="space-y-6">
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                                            <p className="text-amber-500 text-xs font-bold text-center">
                                                Withdrawals are processed within 24 hours.
                                            </p>
                                        </div>

                                        <form onSubmit={handleWithdraw} className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                                                    <span className="text-xs text-slate-400">Available: <span className="text-white font-bold">${balance.toFixed(2)}</span></span>
                                                </div>
                                                <div className="relative group">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00b9f0] transition-colors">$</span>
                                                    <input
                                                        type="number"
                                                        value={withdrawAmount}
                                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                                        placeholder="0.00"
                                                        className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] font-bold"
                                                        min="10"
                                                        max={balance}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Withdrawal Address (USDT)</label>
                                                <input
                                                    type="text"
                                                    value={withdrawAddress}
                                                    onChange={(e) => setWithdrawAddress(e.target.value)}
                                                    placeholder="Enter wallet address"
                                                    className="w-full bg-[#0a161f] border border-white/10 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] font-medium text-sm"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading || !withdrawAmount || !withdrawAddress}
                                                className="w-full bg-white hover:bg-slate-200 text-[#0f212e] h-12 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={20} /> : <ArrowUpCircle size={20} />}
                                                {loading ? 'Processing...' : 'Request Withdrawal'}
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
                                            <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                                Come back every 24 hours to claim your free bonus balance!
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
                                                    <div key={tx.id} className="bg-[#0a161f]/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2.5 rounded-lg ${tx.type === 'deposit' ? 'bg-green-500/10 text-green-500' :
                                                                tx.type === 'withdraw' ? 'bg-amber-500/10 text-amber-500' :
                                                                    'bg-blue-500/10 text-blue-500'
                                                                }`}>
                                                                {tx.type === 'deposit' ? <ArrowDownCircle size={20} /> :
                                                                    tx.type === 'withdraw' ? <ArrowUpCircle size={20} /> :
                                                                        <Gift size={20} />}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white capitalize">{tx.type} {tx.method ? `• ${tx.method}` : ''}</p>
                                                                <p className="text-xs text-slate-500">{tx.date.toLocaleDateString()} {tx.date.toLocaleTimeString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`font-bold ${tx.type === 'withdraw' ? 'text-white' : 'text-green-500'
                                                                }`}>
                                                                {tx.type === 'withdraw' ? '-' : '+'}${tx.amount.toFixed(2)}
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
