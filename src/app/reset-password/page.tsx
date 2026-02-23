"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        // Check if there's a valid session, meaning the user clicked a magic link / password reset link
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Invalid or expired password reset link.");
                router.push("/");
            }
        };
        checkUser();
    }, [router, supabase.auth]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            toast.success("Password updated successfully!");
            router.push("/settings");
        } catch (error: any) {
            toast.error(error.message || "Error updating password.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00b9f0]/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md bg-[#0f212e]/90 backdrop-blur-xl rounded-2xl p-8 relative z-10 border border-white/5 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#00b9f0]/10 text-[#00b9f0] mb-4">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-slate-400 text-sm">Please enter your new password below to reset it.</p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#1a2c38] border border-white/5 rounded-xl h-12 px-4 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-colors"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#1a2c38] border border-white/5 rounded-xl h-12 px-4 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-colors"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 mt-6 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_25px_rgba(0,185,240,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : "Update Password"}
                    </button>

                    <div className="text-center mt-6">
                        <button type="button" onClick={() => router.push('/')} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Return to Home</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
