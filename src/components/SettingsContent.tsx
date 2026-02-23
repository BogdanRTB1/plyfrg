"use client";
/* eslint-disable */
// @ts-nocheck

import { useRef, useEffect, useState } from "react";
import { User, Shield, Bell, Lock, Camera, Trash2, Save, Loader2, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import ConfirmModal from "./ConfirmModal";
import { useRouter } from "next/navigation";

export default function SettingsContent() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'privacy'>('profile');
    const [saveLoading, setSaveLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Modal states
    const [showAvatarConfirm, setShowAvatarConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form inputs
    const [displayName, setDisplayName] = useState("");
    const [bio, setBio] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    // Privacy state
    const [profileVisibility, setProfileVisibility] = useState<'public' | 'friends' | 'private'>('public');
    const [showEmail, setShowEmail] = useState(false);
    const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

    // 2FA state
    const [mfaStatus, setMfaStatus] = useState<'disabled' | 'enrolling' | 'enabled'>('disabled');
    const [qrCodeData, setQrCodeData] = useState<any>(null);
    const [verifyCode, setVerifyCode] = useState("");
    const [isProcessingMfa, setIsProcessingMfa] = useState(false);
    const [isDisablingMfa, setIsDisablingMfa] = useState(false);
    const [disableMfaCode, setDisableMfaCode] = useState("");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser({
                    id: user.id,
                    displayName: user.user_metadata?.full_name || user.email?.split('@')[0],
                    bio: user.user_metadata?.bio || "",
                    avatar: user.user_metadata?.avatar_url || null,
                    email: user.email
                });
                setDisplayName(user.user_metadata?.full_name || user.email?.split('@')[0]);
                setBio(user.user_metadata?.bio || "");
                setProfileVisibility(user.user_metadata?.profile_visibility || 'public');
                setShowEmail(user.user_metadata?.show_email || false);

                // Fetch MFA status
                const { data: mfaData, error: mfaError } = await supabase.auth.mfa.listFactors();
                if (!mfaError && mfaData && mfaData.totp) {
                    const verifiedFactor = mfaData.totp.find((f: any) => f.status === 'verified');
                    if (verifiedFactor) setMfaStatus('enabled');
                }
            }
            setLoading(false);
        };
        getUser();
    }, []);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            if (updateError) throw updateError;

            setUser({ ...user, avatar: publicUrl });
            toast.success("Avatar updated successfully!");
        } catch (error: any) {
            toast.error(error.message || "Error uploading avatar");
        } finally {
            setUploading(false);
        }
    };

    const handleAvatarRemove = async () => {
        try {
            setUploading(true);
            const { error } = await supabase.auth.updateUser({
                data: { avatar_url: null }
            });

            if (error) throw error;

            setUser({ ...user, avatar: null });
            setShowAvatarConfirm(false);
            toast.success("Avatar removed successfully!");
        } catch (error: any) {
            toast.error(error.message || "Error removing avatar");
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: displayName,
                    bio: bio
                }
            });

            if (error) throw error;

            setUser({ ...user, displayName, bio });
            toast.success("Profile updated successfully");
        } catch (error: any) {
            toast.error(error.message || "Error updating profile");
        } finally {
            setSaveLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            // Update user metadata to schedule deletion
            const { error } = await supabase.auth.updateUser({
                data: {
                    deletion_scheduled_at: new Date().toISOString()
                }
            });

            if (error) throw error;

            // Sign out the user
            await supabase.auth.signOut();
            toast.success("Account scheduled for deletion in 60 days.");
            router.push('/');

        } catch (error: any) {
            toast.error(error.message || "Error scheduling account deletion");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!currentPassword) {
            toast.error("Please enter your current password.");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        setIsUpdatingPassword(true);
        try {
            // Because Supabase requires a current password to securely change the password
            // without a reset email, signInWithPassword acts as a re-verification step.
            const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();
            if (sessionError) throw sessionError;

            // Re-authenticate to ensure current password is valid
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: currentUser!.email!,
                password: currentPassword
            });

            if (signInError) {
                throw new Error("Invalid current password");
            }

            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) throw error;
            toast.success("Password updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (err: any) {
            toast.error(err.message || "Error modifying password.");
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSavePrivacy = async () => {
        setIsUpdatingPrivacy(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    profile_visibility: profileVisibility,
                    show_email: showEmail
                }
            });

            if (error) throw error;
            toast.success("Privacy settings updated successfully.");
        } catch (err: any) {
            toast.error(err.message || "Error saving privacy settings.");
        } finally {
            setIsUpdatingPrivacy(false);
        }
    };

    const handleEnableMFA = async () => {
        setIsProcessingMfa(true);
        try {
            const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
            if (error) throw error;

            setQrCodeData({
                svg: data.totp.qr_code,
                secret: data.totp.secret,
                factorId: data.id
            });
            setMfaStatus('enrolling');
        } catch (err: any) {
            toast.error(err.message || "Error starting 2FA enrollment.");
        } finally {
            setIsProcessingMfa(false);
        }
    };

    const handleVerifyMFA = async () => {
        if (!verifyCode || !qrCodeData?.factorId) return;
        setIsProcessingMfa(true);
        try {
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: qrCodeData.factorId });
            if (challengeError) throw challengeError;

            const { error } = await supabase.auth.mfa.verify({
                factorId: qrCodeData.factorId,
                challengeId: challengeData.id,
                code: verifyCode
            });

            if (error) throw error;

            setMfaStatus('enabled');
            toast.success("Two-Factor Authentication successfully enabled!");
            setVerifyCode("");
            setQrCodeData(null);
        } catch (err: any) {
            toast.error(err.message || "Invalid verifying code. Please try again.");
        } finally {
            setIsProcessingMfa(false);
        }
    };

    const handleDisableMFA = () => {
        setIsDisablingMfa(true);
    };

    const confirmDisableMFA = async () => {
        if (!disableMfaCode) return;
        setIsProcessingMfa(true);
        try {
            const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
            if (listError) throw listError;

            const verifiedFactor = factors?.totp.find((f: any) => f.status === 'verified');
            if (verifiedFactor) {
                // Ensure AAL2 by verifying current factor
                const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });
                if (challengeError) throw challengeError;

                const { error: verifyError } = await supabase.auth.mfa.verify({
                    factorId: verifiedFactor.id,
                    challengeId: challengeData.id,
                    code: disableMfaCode
                });

                if (verifyError) throw verifyError;

                // Unenroll securely
                const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactor.id });
                if (unenrollError) throw unenrollError;

                setMfaStatus('disabled');
                setIsDisablingMfa(false);
                setDisableMfaCode("");
                toast.success("2FA has been disabled.");
            }
        } catch (err: any) {
            toast.error(err.message || "Invalid verifying code or error disabling 2FA.");
        } finally {
            setIsProcessingMfa(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User, desc: 'Public profile & bio' },
        { id: 'security', label: 'Security', icon: Shield, desc: 'Password & 2FA' },
        { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email & Push' },
        { id: 'privacy', label: 'Privacy', icon: Lock, desc: 'Data control' },
    ] as const;

    if (loading) {
        return (
            <div className="flex-1 h-full flex items-center justify-center bg-[#050505]">
                <Loader2 className="animate-spin text-[#00b9f0]" size={48} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#050505] p-6 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-500 shadow-xl border border-white/10">
                    <Lock size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-8">
                    You must be logged in to access your account settings. Please log in or return to the lobby.
                </p>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2.5 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#050505] rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_30px_rgba(0,185,240,0.4)] hover:-translate-y-0.5"
                    >
                        Go to Lobby
                    </button>
                    {/* Optionally add a login button here if you want to trigger the auth modal */}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full overflow-y-scroll overflow-x-hidden bg-[#050505] relative custom-scrollbar">
            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] mix-blend-screen"></div>
            </div>

            <div className="max-w-6xl mx-auto p-6 md:p-12 relative z-10">

                {/* Page Header */}
                <div className="mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-black text-white tracking-tight mb-2"
                    >
                        Settings
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400"
                    >
                        Manage your account preferences and security configuration.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 min-h-[800px]">

                    {/* Navigation Sidebar */}
                    <div className="lg:col-span-3">
                        <nav className="space-y-2 sticky top-6">
                            {tabs.map((tab, idx) => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <motion.button
                                        key={tab.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 + 0.2 }}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`w-full text-left p-4 rounded-xl flex items-center justify-between group transition-all duration-300 border relative overflow-hidden ${isActive
                                            ? 'bg-[#00b9f0]/10 border-[#00b9f0]/20 text-white shadow-[0_0_15px_rgba(0,185,240,0.1)]'
                                            : 'bg-[#0f212e] border-white/5 text-slate-400 hover:bg-[#1a2c38] hover:text-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-[#00b9f0]/20 text-[#00b9f0]' : 'bg-[#1a2c38] text-slate-500 group-hover:text-slate-300'}`}>
                                                <tab.icon size={18} />
                                            </div>
                                            <div>
                                                <span className="block font-bold text-sm">{tab.label}</span>
                                                <span className="block text-[10px] opacity-60 font-medium uppercase tracking-wider">{tab.desc}</span>
                                            </div>
                                        </div>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeTabIndicator"
                                                className="absolute left-0 top-0 bottom-0 w-1 bg-[#00b9f0]"
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* PROFILE TAB */}
                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        {/* Avatar Section */}
                                        <div className="bg-[#0f212e] border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleAvatarUpload}
                                                className="hidden"
                                                accept="image/*"
                                            />

                                            <div className="relative group">
                                                <div className="w-28 h-28 rounded-full bg-[#1a2c38] flex items-center justify-center text-3xl font-bold text-[#00b9f0] border-4 border-[#1a2c38] shadow-2xl relative z-10 overflow-hidden">
                                                    {user?.avatar ? (
                                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="bg-gradient-to-br from-[#00b9f0] to-blue-600 bg-clip-text text-transparent">
                                                            {user?.displayName?.[0]?.toUpperCase() || 'U'}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="absolute bottom-1 right-1 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#050505] p-2 rounded-full shadow-lg transition-transform hover:scale-110 z-20 border-4 border-[#0f212e]"
                                                >
                                                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                                                </button>
                                            </div>

                                            <div className="text-center md:text-left space-y-2 relative z-10">
                                                <h2 className="text-xl font-bold text-white">Profile Photo</h2>
                                                <p className="text-slate-400 text-sm max-w-sm">
                                                    Upload a new avatar. Larger images will be resized automatically. Max size 2MB.
                                                </p>
                                                <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={uploading}
                                                        className="px-4 py-2 bg-[#1a2c38] hover:bg-[#2f4553] text-white text-xs font-bold rounded-lg border border-white/5 transition-colors"
                                                    >
                                                        {uploading ? 'Uploading...' : 'Upload New'}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowAvatarConfirm(true)}
                                                        disabled={uploading || !user?.avatar}
                                                        className="px-4 py-2 text-red-400 hover:text-red-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-red-500/5 hover:bg-red-500/10 border border-red-500/10"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Section */}
                                        <div className="bg-[#0f212e] border border-white/5 rounded-2xl p-8 space-y-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email</label>
                                                    <div className="relative">
                                                        <input
                                                            type="email"
                                                            value={user?.email || ''}
                                                            readOnly
                                                            className="w-full bg-[#1a2c38] border border-white/5 rounded-xl h-11 px-4 text-slate-400 font-medium cursor-not-allowed focus:outline-none"
                                                        />
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600">
                                                            <Lock size={14} />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Display Name</label>
                                                    <input
                                                        type="text"
                                                        value={displayName}
                                                        onChange={(e) => setDisplayName(e.target.value)}
                                                        className="w-full bg-[#1a2c38] border border-white/5 rounded-xl h-11 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Bio</label>
                                                    <textarea
                                                        value={bio}
                                                        onChange={(e) => setBio(e.target.value)}
                                                        rows={4}
                                                        className="w-full bg-[#1a2c38] border border-white/5 rounded-xl p-4 text-white placeholder-slate-600 focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-all font-medium resize-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end pt-6 border-t border-white/5">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saveLoading}
                                                    className="flex items-center gap-2 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_30px_rgba(0,185,240,0.4)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                                                >
                                                    {saveLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                    <span>Save Changes</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Danger Zone */}
                                        <div className="border border-red-500/30 bg-[#0f212e] rounded-2xl p-6 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors duration-300"></div>
                                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                                                <div>
                                                    <h3 className="font-bold text-red-500 flex items-center gap-2 mb-1 text-lg">
                                                        <Trash2 size={18} className="text-red-500" /> Danger Zone
                                                    </h3>
                                                    <p className="text-slate-300 text-sm font-medium">
                                                        This will permanently delete your account and all your data.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] hover:-translate-y-0.5 whitespace-nowrap"
                                                >
                                                    Delete Account
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* SECURITY TAB */}
                                {activeTab === 'security' && (
                                    <div className="space-y-6">
                                        <div className="bg-[#0f212e] border border-white/5 rounded-2xl p-8">
                                            <div className="mb-8 border-b border-white/5 pb-6">
                                                <h2 className="text-xl font-bold text-white mb-2">Password Change</h2>
                                                <p className="text-slate-400 text-sm">Update your password to keep your account secure.</p>
                                            </div>

                                            <div className="space-y-6 max-w-lg">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Current Password</label>
                                                    <input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={currentPassword}
                                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                                        className="w-full bg-[#1a2c38] border border-white/5 rounded-xl h-11 px-4 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">New Password</label>
                                                    <input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        className="w-full bg-[#1a2c38] border border-white/5 rounded-xl h-11 px-4 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirm New Password</label>
                                                    <input
                                                        type="password"
                                                        placeholder="••••••••"
                                                        value={confirmNewPassword}
                                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                        className="w-full bg-[#1a2c38] border border-white/5 rounded-xl h-11 px-4 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] font-medium"
                                                    />
                                                </div>
                                                <div className="pt-2">
                                                    <button
                                                        onClick={handlePasswordChange}
                                                        disabled={isUpdatingPassword}
                                                        className="bg-[#1a2c38] hover:bg-[#2f4553] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors border border-white/5 disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {isUpdatingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
                                                        Update Password
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-[#0f212e] border border-white/5 rounded-2xl p-8">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div>
                                                    <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                                                        Two-Factor Authentication
                                                        {mfaStatus === 'enabled' && (
                                                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-black">Enabled</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-slate-400 text-sm">Add an extra layer of security to your account using an authenticator app.</p>
                                                </div>
                                                {mfaStatus === 'disabled' && (
                                                    <button
                                                        onClick={handleEnableMFA}
                                                        disabled={isProcessingMfa}
                                                        className="px-6 py-2.5 bg-[#00b9f0]/10 text-[#00b9f0] hover:bg-[#00b9f0]/20 border border-[#00b9f0]/20 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                                                    >
                                                        {isProcessingMfa ? 'Processing...' : 'Enable 2FA'}
                                                    </button>
                                                )}
                                                {mfaStatus === 'enabled' && !isDisablingMfa && (
                                                    <button
                                                        onClick={handleDisableMFA}
                                                        disabled={isProcessingMfa}
                                                        className="px-6 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                                                    >
                                                        {isProcessingMfa ? 'Processing...' : 'Disable 2FA'}
                                                    </button>
                                                )}
                                            </div>

                                            {isDisablingMfa && (
                                                <div className="mt-8 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <h4 className="font-bold text-white mb-2 text-red-400">Disable Two-Factor Authentication</h4>
                                                    <p className="text-slate-400 text-sm mb-4">Please enter your authenticator code to confirm disabling 2FA.</p>
                                                    <div className="flex flex-col sm:flex-row gap-3">
                                                        <input
                                                            type="text"
                                                            placeholder="000000"
                                                            maxLength={6}
                                                            value={disableMfaCode}
                                                            onChange={(e) => setDisableMfaCode(e.target.value.replace(/\D/g, ''))}
                                                            className="w-full max-w-[200px] bg-[#1a2c38] border border-red-500/20 rounded-xl h-12 px-4 text-white text-center tracking-[0.5em] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors font-mono font-bold"
                                                        />
                                                        <button
                                                            onClick={confirmDisableMFA}
                                                            disabled={isProcessingMfa || disableMfaCode.length < 6}
                                                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                                                        >
                                                            {isProcessingMfa ? <Loader2 size={16} className="animate-spin" /> : 'Confirm Disable'}
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setIsDisablingMfa(false);
                                                                setDisableMfaCode("");
                                                            }}
                                                            disabled={isProcessingMfa}
                                                            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {mfaStatus === 'enrolling' && qrCodeData && (
                                                <div className="mt-8 border-t border-white/5 pt-6 animate-in fade-in slide-in-from-top-4 duration-300">
                                                    <h4 className="font-bold text-white mb-4">Complete 2FA Setup</h4>
                                                    <div className="flex flex-col md:flex-row gap-8">
                                                        <div className="bg-white p-4 rounded-xl inline-block" dangerouslySetInnerHTML={{ __html: qrCodeData.svg }} />
                                                        <div className="space-y-4 max-w-sm">
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-300 mb-1">1. Scan the QR code</p>
                                                                <p className="text-xs text-slate-500">Scan this image with your authenticator app (e.g. Google Authenticator).</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-300 mb-1">2. Enter the verification code</p>
                                                                <input
                                                                    type="text"
                                                                    placeholder="000 000"
                                                                    value={verifyCode}
                                                                    onChange={(e) => setVerifyCode(e.target.value)}
                                                                    className="w-full bg-[#1a2c38] border border-white/5 rounded-xl h-11 px-4 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] font-medium tracking-widest text-center text-lg mt-2"
                                                                />
                                                            </div>
                                                            <div className="flex gap-3 pt-2">
                                                                <button
                                                                    onClick={() => { setMfaStatus('disabled'); setQrCodeData(null); }}
                                                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-bold text-sm transition-colors border border-white/5"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button
                                                                    onClick={handleVerifyMFA}
                                                                    disabled={isProcessingMfa || verifyCode.length < 6}
                                                                    className="flex-1 py-2.5 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] rounded-xl font-bold text-sm transition-all shadow-[0_0_15px_rgba(0,185,240,0.3)] disabled:opacity-50"
                                                                >
                                                                    {isProcessingMfa ? 'Verifying...' : 'Verify'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* NOTIFICATIONS TAB */}
                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <div className="bg-[#0f212e] border border-white/5 rounded-2xl p-8">
                                            <div className="mb-8 border-b border-white/5 pb-6">
                                                <h2 className="text-xl font-bold text-white mb-2">Email Notifications</h2>
                                                <p className="text-slate-400 text-sm">Choose what emails you want to receive.</p>
                                            </div>
                                            <div className="space-y-4">
                                                {['Product updates and announcements', 'Security alerts', 'New features and tips'].map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-[#1a2c38] rounded-xl border border-white/5">
                                                        <span className="text-sm font-medium text-slate-300">{item}</span>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer" defaultChecked={idx === 1} />
                                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0f212e] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b9f0]"></div>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* PRIVACY TAB */}
                                {activeTab === 'privacy' && (
                                    <div className="space-y-6">
                                        <div className="bg-[#0f212e] border border-white/5 rounded-2xl p-8">
                                            <div className="mb-8 border-b border-white/5 pb-6">
                                                <h2 className="text-xl font-bold text-white mb-2">Privacy Settings</h2>
                                                <p className="text-slate-400 text-sm">Control who can see your profile and data.</p>
                                            </div>
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm">Profile Visibility</h3>
                                                        <p className="text-slate-500 text-xs mt-1">Control who can see your profile page</p>
                                                    </div>
                                                    <select
                                                        className="bg-[#1a2c38] border border-white/5 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-[#00b9f0]"
                                                        value={profileVisibility}
                                                        onChange={(e) => setProfileVisibility(e.target.value as any)}
                                                    >
                                                        <option value="public">Public</option>
                                                        <option value="friends">Friends Only</option>
                                                        <option value="private">Private</option>
                                                    </select>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-bold text-white text-sm">Show Email Address</h3>
                                                        <p className="text-slate-500 text-xs mt-1">Display your email on your public profile</p>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={showEmail}
                                                            onChange={(e) => setShowEmail(e.target.checked)}
                                                        />
                                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0f212e] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00b9f0]"></div>
                                                    </label>
                                                </div>

                                                <div className="pt-4 border-t border-white/5">
                                                    <button
                                                        onClick={handleSavePrivacy}
                                                        disabled={isUpdatingPrivacy}
                                                        className="bg-[#1a2c38] hover:bg-[#2f4553] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-colors border border-white/5 disabled:opacity-50 flex items-center gap-2"
                                                    >
                                                        {isUpdatingPrivacy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                                        Save Privacy Settings
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Confirmation Modals */}
                <ConfirmModal
                    isOpen={showAvatarConfirm}
                    onClose={() => setShowAvatarConfirm(false)}
                    onConfirm={handleAvatarRemove}
                    title="Remove Avatar?"
                    description="Are you sure you want to remove your profile picture? This action cannot be undone."
                    confirmText="Yes, Remove"
                    isDanger={true}
                />

                <ConfirmModal
                    isOpen={showDeleteConfirm}
                    onClose={() => setShowDeleteConfirm(false)}
                    onConfirm={handleDeleteAccount}
                    title="Delete Account?"
                    description="Are you sure you want to delete your account? This action is permanent and cannot be undone."
                    confirmText={isDeleting ? "Deleting..." : "Delete Account"}
                    isDanger={true}
                />
            </div>
        </div>
    );
}
