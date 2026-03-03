"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import KYCVerification from "./KYCVerification";
import { LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export default function KYCEnforcer() {
    const [needsKYC, setNeedsKYC] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Check if KYC is verified
                const isVerified = user.user_metadata?.is_kyc_verified === true;
                setNeedsKYC(!isVerified);
            } else {
                setNeedsKYC(false);
            }
            setLoading(false);
        };

        checkUser();

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const isVerified = session.user.user_metadata?.is_kyc_verified === true;
                setNeedsKYC(!isVerified);
            } else {
                setNeedsKYC(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, pathname]);

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        setNeedsKYC(false);
        setLoading(false);
        router.refresh();
    };

    const handleVerifySuccess = async () => {
        // Trigger the fade-out of the entire modal
        setIsClosing(true);

        // Wait for the fade-out animation to complete before updating state and unmounting
        setTimeout(async () => {
            // Update user metadata to set KYC as verified
            const { error } = await supabase.auth.updateUser({
                data: { is_kyc_verified: true }
            });

            if (error) {
                setIsClosing(false); // revert fade if error
                toast.error("Failed to update status. Please try again.");
                return;
            }

            toast.success("Age verified successfully!");
            setNeedsKYC(false);
            setIsVerifying(false);
            router.refresh();
        }, 500);
    };

    if (loading || !needsKYC) return null;

    return (
        <div className={`transition-opacity duration-500 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
            {/* Extended Background Overlay to block overscroll bounce */}
            <div className="fixed inset-[-50vh] z-[90] bg-[#050505] md:bg-black/95 md:backdrop-blur-md pointer-events-none" />

            {/* Interactive Scrollable Container */}
            <div className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain flex items-center justify-center p-4">
                <div className="min-h-full flex items-center justify-center relative w-full">
                    <div className="bg-[#0f212e] border border-white/10 rounded-2xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden">
                        {!isVerifying ? (
                            <div className="flex flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 bg-[#00b9f0]/10 rounded-full flex items-center justify-center text-[#00b9f0] mb-2">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                </div>

                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Verification Required</h2>
                                    <p className="text-slate-400 text-sm">
                                        You cannot use your account until you verify your age to confirm you are 21 or older.
                                    </p>
                                </div>

                                <div className="w-full space-y-3 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => setIsVerifying(true)}
                                        className="w-full h-12 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_25px_rgba(0,185,240,0.4)]"
                                    >
                                        Verify Now
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="w-full h-12 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={18} />
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <KYCVerification
                                onSuccess={handleVerifySuccess}
                                onCancel={() => setIsVerifying(false)}
                                onUnderage={async () => {
                                    // Schedule deletion for 3 days from now
                                    const deletionDate = new Date();
                                    deletionDate.setDate(deletionDate.getDate() + 3);

                                    await supabase.auth.updateUser({
                                        data: { deletion_scheduled_at: deletionDate.toISOString() }
                                    });

                                    toast.error("You are under 21. Your account will be deleted in 3 days.");

                                    setTimeout(async () => {
                                        await supabase.auth.signOut();
                                        setNeedsKYC(false);
                                        router.refresh();
                                    }, 4000);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
