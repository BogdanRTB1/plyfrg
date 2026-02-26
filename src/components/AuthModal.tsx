"use client";
/* eslint-disable */
// @ts-nocheck
import { toast } from "sonner";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'signup';
}

// Google Logo component
const GoogleLogo = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// Discord Logo component
const DiscordLogo = () => (
    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.942 5.556a16.3 16.3 0 0 0-4.126-1.3 12.04 12.04 0 0 0-.378.084 15.68 15.68 0 0 0-4.876 0 12.01 12.01 0 0 0-.378-.084 16.3 16.3 0 0 0-4.126 1.3 2.16 2.16 0 0 0-.749.333C1.944 9.317 1 13.978 1 18.067c0 .034 0 .07.003.102a16.5 16.5 0 0 0 5.05 2.583 2.37 2.37 0 0 0 .807-.066c.394-.131.776-.291 1.144-.478a2.38 2.38 0 0 0 1.05-.883 11.23 11.23 0 0 1-1.78-.85 1.95 1.95 0 0 1 .527-.406c3.279 1.503 6.84 1.503 10.12 0a1.94 1.94 0 0 1 .526.406 11.26 11.26 0 0 1-1.779.851 2.38 2.38 0 0 0 1.05.883c.368.187.75.347 1.143.477a2.37 2.37 0 0 0 .808.066 16.5 16.5 0 0 0 5.05-2.583c.003-.034.003-.068.003-.102 0-4.089-.944-8.75-3.336-12.178a2.15 2.15 0 0 0-.746-.333zM9.5 14.5c-.883 0-1.6-.806-1.6-1.8s.717-1.8 1.6-1.8 1.6.806 1.6 1.8-.717 1.8-1.6 1.8zm5 0c-.883 0-1.6-.806-1.6-1.8s.717-1.8 1.6-1.8 1.6.806 1.6 1.8-.717 1.8-1.6 1.8z" fill="#5865F2" />
    </svg>
);

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
    const router = useRouter();
    const supabase = createClient();
    const [isLogin, setIsLogin] = useState(initialMode === 'login');
    const [isClosing, setIsClosing] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [show, setShow] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

    // ... form states remain same ...
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [username, setUsername] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // MFA state
    const [requiresMFA, setRequiresMFA] = useState(false);
    const [mfaCode, setMfaCode] = useState("");

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
            setRequiresMFA(false);
            setMfaCode("");
            // Trigger animation frame
            requestAnimationFrame(() => {
                setShow(true);
            });

            // Set mode based on prop when opening
            setIsLogin(initialMode === 'login');

            // Reset form
            setShowPassword(false);
            setShowConfirmPassword(false);
            setError(null);
            setEmail("");
            setPassword("");
            setUsername("");
            setConfirmPassword("");
            setIsForgotPassword(false);
        } else {
            setShow(false);
        }
    }, [isOpen, initialMode]);

    const handleClose = () => {
        setIsClosing(true);
        setShow(false);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
            setShouldRender(false);
        }, 300); // Match animation duration
    };

    // ... handleEmailAuth and handleSocialLogin remain same ...

    const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!email) {
                throw new Error("Please enter your email address.");
            }
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;

            toast.success("Password reset link sent to your email!");
            setIsForgotPassword(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        // ... previous implementation ...
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                if (requiresMFA) {
                    const { error: factorError, data: listData } = await supabase.auth.mfa.listFactors();
                    if (factorError) throw factorError;

                    // listFactors() returns { all: Factor[] } inside data
                    const totpFactor = listData?.all?.find(factor => factor.factor_type === 'totp' && factor.status === 'verified');

                    if (!totpFactor) {
                        throw new Error("No verified MFA factor found.");
                    }

                    const { error: challengeError, data: challengeData } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
                    if (challengeError) throw challengeError;

                    const { error: verifyError } = await supabase.auth.mfa.verify({
                        factorId: totpFactor.id,
                        challengeId: challengeData.id,
                        code: mfaCode
                    });

                    if (verifyError) throw verifyError;

                    toast.success("Successfully authenticated");
                    handleClose();
                    router.refresh();
                    return;
                }

                const res = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (res.error) {
                    throw res.error;
                }
                const { data } = res;

                // Check for MFA AAL upgrade requirement by querying the current assurance level
                const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

                if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
                    setRequiresMFA(true);
                    setError(null);
                    return;
                }

                // Check for soft-deletion
                if (data.user?.user_metadata?.deletion_scheduled_at) {
                    const { error: restoreError } = await supabase.auth.updateUser({
                        data: { deletion_scheduled_at: null }
                    });

                    if (!restoreError) {
                        toast.success("Welcome back! Your account deletion has been cancelled.");
                    }
                } else {
                    toast.success("Logged in successfully");
                }

                handleClose();
                router.refresh();
            } else {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: username,
                        },
                    },
                });
                if (error) throw error;
                handleClose();
                toast.success("Account created successfully!");
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = async (provider: 'google' | 'discord') => {
        // ... previous implementation ...
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    if (!isOpen && !shouldRender) return null;

    if (typeof document === "undefined") return null;

    return createPortal(
        <>
            {/* Extended Background Overlay to block overscroll bounce, separated for perfect fade animation */}
            <div className={`fixed inset-[-50vh] z-[50] bg-[#050505] md:bg-black/80 md:backdrop-blur-md pointer-events-none transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`} />

            {/* Interactive Scrollable Container */}
            <div className={`fixed inset-0 z-[60] overflow-y-auto overscroll-contain transition-all duration-300 ${show ? "opacity-100 visible" : "opacity-0 invisible"}`}>
                <div className="min-h-full flex items-center justify-center p-4 relative z-10 w-full">
                    <div
                        className={`bg-[#0f212e]/90 backdrop-blur-xl rounded-2xl w-full max-w-md p-8 relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 transform transition-all duration-300 ${show ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4"}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button onClick={handleClose} type="button" className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors hover:rotate-90 duration-300 z-50">
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center mb-6">
                            <div className="relative mb-4 group">
                                <div className="absolute inset-0 bg-[#00b9f0] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                                <Image
                                    src="/logo_transparent.png"
                                    width={60}
                                    height={60}
                                    alt="Logo"
                                    className="relative z-10 drop-shadow-[0_0_15px_rgba(0,185,240,0.3)]"
                                    priority
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                                {requiresMFA ? "Two-Factor Auth" : isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Join PlayForges"}
                            </h2>
                            <p className="text-slate-400 text-sm text-center font-medium">
                                {requiresMFA
                                    ? "Enter your authenticator code"
                                    : isForgotPassword
                                        ? "Enter your email to receive a reset link"
                                        : isLogin
                                            ? "Login to access your account"
                                            : "Create an account to start playing"}
                            </p>
                        </div>

                        {/* Content Container */}
                        <div className="relative">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={requiresMFA ? "mfa" : isForgotPassword ? "forgot" : isLogin ? "login" : "register"}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -15 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="space-y-4"
                                >
                                    <form className="space-y-4" onSubmit={isForgotPassword ? handleForgotPasswordSubmit : handleEmailAuth}>
                                        {error && (
                                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-pulse">
                                                {error}
                                            </div>
                                        )}

                                        {!isLogin && !isForgotPassword && (
                                            <div className="relative group">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00b9f0] transition-colors" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Username"
                                                    className="w-full bg-[#0a161f]/80 border border-white/10 rounded-xl h-12 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all"
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    disabled={loading}
                                                    required={!isLogin}
                                                />
                                            </div>
                                        )}

                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00b9f0] transition-colors" size={18} />
                                            <input
                                                type="email"
                                                placeholder="Email address"
                                                className="w-full bg-[#0a161f]/80 border border-white/10 rounded-xl h-12 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                disabled={loading}
                                                required
                                            />
                                        </div>

                                        {!isForgotPassword && (
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00b9f0] transition-colors" size={18} />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="Password"
                                                    className="w-full bg-[#0a161f]/80 border border-white/10 rounded-xl h-12 pl-10 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    disabled={loading}
                                                    required={!isForgotPassword}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    disabled={loading}
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        )}

                                        {requiresMFA && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Authenticator Code</label>
                                                <input
                                                    type="text"
                                                    placeholder="000000"
                                                    className="w-full bg-[#0a161f]/80 border border-white/10 rounded-xl h-12 px-4 text-white placeholder-slate-500 text-center tracking-[0.5em] focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all font-mono font-bold text-lg"
                                                    value={mfaCode}
                                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                                                    disabled={loading}
                                                    required
                                                    autoComplete="off"
                                                />
                                            </div>
                                        )}

                                        {!isLogin && !isForgotPassword && (
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#00b9f0] transition-colors" size={18} />
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="Confirm Password"
                                                    className="w-full bg-[#0a161f]/80 border border-white/10 rounded-xl h-12 pl-10 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    disabled={loading}
                                                    required={!isLogin && !isForgotPassword}
                                                />
                                                <button
                                                    type="button"
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    disabled={loading}
                                                >
                                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        )}

                                        {requiresMFA ? (
                                            <div className="flex justify-start">
                                                <button type="button" onClick={() => setRequiresMFA(false)} className="text-xs font-bold text-slate-400 hover:text-white transition-colors hover:underline" disabled={loading}>&larr; Back to login</button>
                                            </div>
                                        ) : isForgotPassword ? (
                                            <div className="flex justify-start">
                                                <button type="button" onClick={() => setIsForgotPassword(false)} className="text-xs font-bold text-slate-400 hover:text-white transition-colors hover:underline" disabled={loading}>&larr; Back to login</button>
                                            </div>
                                        ) : isLogin ? (
                                            <div className="flex justify-end">
                                                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs font-bold text-[#00b9f0] hover:text-[#38bdf8] transition-colors hover:underline" disabled={loading}>Forgot password?</button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 text-center">
                                                By joining, you agree to our <a href="#" className="text-[#00b9f0] hover:underline transition-colors">Terms of Service</a> and <a href="#" className="text-[#00b9f0] hover:underline transition-colors">Privacy Policy</a>.
                                            </p>
                                        )}

                                        <button
                                            type="submit"
                                            className="w-full h-12 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_25px_rgba(0,185,240,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2 active:scale-95 duration-200"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="animate-spin" size={20} />
                                                    Processing...
                                                </>
                                            ) : (
                                                requiresMFA ? "Verify Code" : isForgotPassword ? "Send Reset Link" : isLogin ? "Log In" : "Create Account"
                                            )}
                                        </button>
                                    </form>

                                    {!isForgotPassword && !requiresMFA && (
                                        <>
                                            <div className="relative flex items-center justify-center my-6">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-white/10"></div>
                                                </div>
                                                <span className="relative bg-transparent px-4 text-xs text-slate-500 uppercase tracking-widest font-bold bg-[#0f212e]/50 backdrop-blur-sm rounded">Or continue with</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <button
                                                    type="button"
                                                    className="flex items-center justify-center h-12 bg-[#0a161f] hover:bg-[#1a2c38] border border-white/10 rounded-xl transition-all hover:border-white/20 text-white font-bold text-sm hover:-translate-y-0.5"
                                                    onClick={() => handleSocialLogin('google')}
                                                    disabled={loading}
                                                >
                                                    <GoogleLogo /> <span>Google</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex items-center justify-center h-12 bg-[#0a161f] hover:bg-[#1a2c38] border border-white/10 rounded-xl transition-all hover:border-white/20 text-white font-bold text-sm hover:-translate-y-0.5"
                                                    onClick={() => handleSocialLogin('discord')}
                                                    disabled={loading}
                                                >
                                                    <DiscordLogo /> <span>Discord</span>
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {!isForgotPassword && !requiresMFA && (
                            <div className="mt-6 pt-6 border-t border-white/10 text-center text-sm text-slate-400">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="font-bold text-white hover:text-[#00b9f0] transition-all hover:underline active:scale-90 inline-block"
                                >
                                    {isLogin ? "Sign up" : "Log in"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
