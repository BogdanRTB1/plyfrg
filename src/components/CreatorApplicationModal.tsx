"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, ArrowRight, ArrowLeft, Upload, Check,
    Youtube, Twitch, Twitter, Instagram, HelpCircle,
    FileText, User, Building2, Globe, Image as ImageIcon,
    MessageSquare, ChevronDown
} from 'lucide-react';
import { createClient } from "@/utils/supabase/client";

interface CreatorApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// Custom Select Component for a premium look
const CustomSelect = ({
    options,
    value,
    onChange,
    placeholder,
    icon: Icon
}: {
    options: { label: string, value: string }[],
    value: string,
    onChange: (val: string) => void,
    placeholder: string,
    icon?: any
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full bg-[#0f212e]/80 border ${isOpen ? 'border-[#00b9f0]' : 'border-white/10'} rounded-xl px-4 py-3 text-white cursor-pointer transition-colors hover:border-white/30`}
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon size={18} className="text-[#00b9f0]" />}
                    <span className={selectedOption ? "text-white" : "text-slate-500"}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={18} className="text-slate-400" />
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-[9999] left-0 mt-2 min-w-[200px] w-full bg-[#152a3a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {options.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`px-4 py-3 cursor-pointer transition-colors text-sm ${value === option.value ? 'bg-[#00b9f0]/20 text-white font-bold border-l-2 border-[#00b9f0]' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {option.label}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function CreatorApplicationModal({ isOpen, onClose }: CreatorApplicationModalProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const totalSteps = 4;

    const [formData, setFormData] = useState({
        // Step 1
        contentType: '',
        audienceSize: '',
        motivation: '',
        // Step 2
        youtubeUrl: '',
        twitchUrl: '',
        twitterUrl: '',
        kickUrl: '',
        // Step 3
        taxType: 'individual',
        legalName: '',
        companyName: '',
        taxId: '',
        state: '',
        // Step 4
        displayName: '',
        bio: '',
        profilePicture: null as string | null,
        bannerImage: null as string | null,

        // Consent checkboxes
        agreeToTerms: false,
        agreeToFinancialDisclosure: false,
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSelectChange = (name: string) => (value: string) => {
        setFormData({ ...formData, [name]: value });
    };

    const nextStep = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        if (!formData.agreeToTerms || !formData.agreeToFinancialDisclosure) {
            alert("You must agree to the terms and financial disclosure.");
            return;
        }

        setIsSubmitting(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Save to local storage to demonstrate dynamically adding creators
        const newCreator = {
            id: user?.id || Date.now().toString(),
            name: formData.displayName || formData.legalName || 'New Creator',
            role: "Content Creator",
            email: user?.email || "creator@playforges.com",
            followers: formData.audienceSize === 'partner' ? '100K' : formData.audienceSize === 'established' ? '10K' : '1K',
            description: formData.bio || formData.motivation || "A brand new creator on Playforges.",
            skills: [formData.contentType || 'Gaming', 'Community'],
            games: 0,
            profilePicture: formData.profilePicture,
            bannerImage: formData.bannerImage,
            twitchUrl: formData.twitchUrl,
            youtubeUrl: formData.youtubeUrl
        };

        const existingCreators = JSON.parse(localStorage.getItem('added_creators') || '[]');
        localStorage.setItem('added_creators', JSON.stringify([newCreator, ...existingCreators]));

        onClose();
        setTimeout(() => setStep(1), 500);

        // Optionally redirect or show success toast
        window.location.href = '/creators'; // Redirect to the View Creators page
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, [field]: reader.result as string });
            };
            reader.readAsDataURL(file); // Encode as base64 to save in localStorage for mockup
        }
    };

    // Render Steps
    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="text-center mb-4">
                            <div className="mx-auto w-12 h-12 bg-[#00b9f0]/20 rounded-full flex items-center justify-center mb-4 border border-[#00b9f0]/30 shadow-[0_0_15px_rgba(0,185,240,0.3)]">
                                <HelpCircle className="text-[#00b9f0]" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-white drop-shadow-md tracking-tight">Tell us about yourself</h3>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Help us understand the kind of creator you are.</p>
                        </div>

                        <div className="flex flex-col gap-2 relative z-20">
                            <label className="text-sm font-bold text-slate-300">What type of content do you create?</label>
                            <CustomSelect
                                value={formData.contentType}
                                onChange={handleSelectChange('contentType')}
                                placeholder="Select content type"
                                options={[
                                    { label: "Gaming & Esports", value: "gaming" },
                                    { label: "Casino & Slots", value: "casino" },
                                    { label: "Just Chatting / IRL", value: "just_chatting" },
                                    { label: "Podcasts", value: "podcasts" },
                                    { label: "Other", value: "other" }
                                ]}
                            />
                        </div>

                        <div className="flex flex-col gap-2 relative z-10">
                            <label className="text-sm font-bold text-slate-300">Average Concurrent Viewers / Reach</label>
                            <CustomSelect
                                value={formData.audienceSize}
                                onChange={handleSelectChange('audienceSize')}
                                placeholder="Select your reach"
                                options={[
                                    { label: "< 100 on average", value: "newbie" },
                                    { label: "100 - 500 on average", value: "growing" },
                                    { label: "500 - 2,000 on average", value: "established" },
                                    { label: "2,000+ on average", value: "partner" }
                                ]}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-slate-300">Why do you want to join Playforges?</label>
                            <textarea
                                name="motivation"
                                value={formData.motivation}
                                onChange={handleChange}
                                placeholder="Share your vision and goals with us..."
                                rows={4}
                                className="bg-[#0f212e]/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-colors resize-none placeholder-slate-600"
                            />
                        </div>
                    </motion.div>
                );
            case 2:
                // ... (rest of step 2 remains mostly the same, ensuring same styling)
                return (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="text-center mb-4">
                            <div className="mx-auto w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                <Globe className="text-purple-400" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-white drop-shadow-md tracking-tight">Link your Socials</h3>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Where can the community find your streams and content?</p>
                        </div>

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Twitch className="text-[#9146FF]" size={20} />
                                </div>
                                <input
                                    type="text"
                                    name="twitchUrl"
                                    value={formData.twitchUrl}
                                    onChange={handleChange}
                                    placeholder="Twitch Username or URL"
                                    className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#9146FF] focus:ring-1 focus:ring-[#9146FF] transition-colors placeholder-slate-600"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Youtube className="text-[#FF0000]" size={20} />
                                </div>
                                <input
                                    type="text"
                                    name="youtubeUrl"
                                    value={formData.youtubeUrl}
                                    onChange={handleChange}
                                    placeholder="YouTube Channel URL"
                                    className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] transition-colors placeholder-slate-600"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Twitter className="text-[#1DA1F2]" size={20} />
                                </div>
                                <input
                                    type="text"
                                    name="twitterUrl"
                                    value={formData.twitterUrl}
                                    onChange={handleChange}
                                    placeholder="X (Twitter) Handle"
                                    className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] transition-colors placeholder-slate-600"
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <MessageSquare className="text-[#53FC18]" size={20} />
                                </div>
                                <input
                                    type="text"
                                    name="kickUrl"
                                    value={formData.kickUrl}
                                    onChange={handleChange}
                                    placeholder="Kick Username or URL"
                                    className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#53FC18] focus:ring-1 focus:ring-[#53FC18] transition-colors placeholder-slate-600"
                                />
                            </div>
                        </div>
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="text-center mb-4">
                            <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <FileText className="text-emerald-400" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-white drop-shadow-md tracking-tight">Tax & Compliance</h3>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Select your entity type and provide tax information.</p>
                        </div>

                        <div className="flex gap-4 mb-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, taxType: 'individual' })}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${formData.taxType === 'individual' ? 'bg-blue-500/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-[#0f212e]/80 border-white/10 text-slate-400 hover:border-white/30'} transition-all`}
                            >
                                <User size={24} className={formData.taxType === 'individual' ? 'text-blue-400' : ''} />
                                <span className="font-bold">Individual</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, taxType: 'business' })}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 ${formData.taxType === 'business' ? 'bg-amber-500/20 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-[#0f212e]/80 border-white/10 text-slate-400 hover:border-white/30'} transition-all`}
                            >
                                <Building2 size={24} className={formData.taxType === 'business' ? 'text-amber-400' : ''} />
                                <span className="font-bold">Business</span>
                            </button>
                        </div>

                        {formData.taxType === 'business' ? (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-300">Company Legal Name</label>
                                <input
                                    type="text"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    placeholder="Playforges LLC"
                                    className="bg-[#0f212e]/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-300">Full Legal Name</label>
                                <input
                                    type="text"
                                    name="legalName"
                                    value={formData.legalName}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="bg-[#0f212e]/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-300">{formData.taxType === 'business' ? 'Business Tax ID (VAT)' : 'Personal ID (SSN/CNP)'}</label>
                                <input
                                    type="text"
                                    name="taxId"
                                    value={formData.taxId}
                                    onChange={handleChange}
                                    placeholder="..."
                                    className="bg-[#0f212e]/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00b9f0] transition-colors"
                                />
                            </div>

                            <div className="flex flex-col gap-2 relative z-50">
                                <label className="text-sm font-bold text-slate-300">State of Residence</label>
                                <CustomSelect
                                    value={formData.state}
                                    onChange={handleSelectChange('state')}
                                    placeholder="Select State"
                                    options={[
                                        { label: "California", value: "CA" },
                                        { label: "New York", value: "NY" },
                                        { label: "Texas", value: "TX" },
                                        { label: "Florida", value: "FL" },
                                        { label: "Nevada", value: "NV" },
                                        { label: "Other", value: "OTHER" }
                                    ]}
                                />
                            </div>
                        </div>

                    </motion.div>
                );
            case 4:
                return (
                    <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="text-center mb-2">
                            <div className="mx-auto w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mb-4 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.3)]">
                                <ImageIcon className="text-pink-400" size={24} />
                            </div>
                            <h3 className="text-2xl font-black text-white drop-shadow-md tracking-tight">Public Profile</h3>
                            <p className="text-slate-400 text-sm mt-2 font-medium">Customize how you'll appear to the Playforges community.</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Profile Pictures section */}
                            <div className="flex gap-4 items-end">
                                <div className="flex-shrink-0">
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Avatar</label>
                                    <div className="relative w-24 h-24 rounded-2xl bg-[#0f212e]/80 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-[#00b9f0] hover:bg-[#00b9f0]/5 transition-all cursor-pointer group shadow-inner">
                                        {formData.profilePicture ? (
                                            <img src={formData.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload size={24} className="text-slate-400 group-hover:text-[#00b9f0] transition-colors" />
                                        )}
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'profilePicture')} />
                                    </div>
                                </div>

                                <div className="flex-grow">
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Profile Banner</label>
                                    <div className="relative w-full h-24 rounded-2xl bg-[#0f212e]/80 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-[#00b9f0] hover:bg-[#00b9f0]/5 transition-all cursor-pointer group shadow-inner">
                                        {formData.bannerImage ? (
                                            <img src={formData.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                                        ) : (
                                            <>
                                                <Upload size={24} className="text-slate-400 group-hover:text-[#00b9f0] mb-2 transition-colors" />
                                                <span className="text-xs text-slate-500 font-medium">1200x400 Recommended</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'bannerImage')} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-300">Creator Display Name</label>
                                <input
                                    type="text"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    placeholder="Your alias on the platform"
                                    className="bg-[#0f212e]/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-300">Public Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Tell your fans a bit about yourself..."
                                    rows={3}
                                    className="bg-[#0f212e]/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors resize-none placeholder-slate-600"
                                />
                            </div>
                        </div>

                        {/* Terms and conditions Checkboxes */}
                        <div className="mt-4 flex flex-col gap-3 bg-white/[0.03] p-4 rounded-xl border border-white/5">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        name="agreeToTerms"
                                        checked={formData.agreeToTerms}
                                        onChange={handleChange}
                                        className="appearance-none w-5 h-5 border-2 border-white/20 rounded transition-colors group-hover:border-[#00b9f0] checked:bg-[#00b9f0] checked:border-[#00b9f0]"
                                    />
                                    {formData.agreeToTerms && <Check size={14} className="absolute inset-0 m-auto text-white pointer-events-none" />}
                                </div>
                                <span className="text-xs text-slate-300 leading-tight">
                                    I agree to the <span className="text-[#00b9f0] hover:underline">Terms & Conditions</span> and Playforges' Creator Agreement.
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        name="agreeToFinancialDisclosure"
                                        checked={formData.agreeToFinancialDisclosure}
                                        onChange={handleChange}
                                        className="appearance-none w-5 h-5 border-2 border-white/20 rounded transition-colors group-hover:border-amber-500 checked:bg-amber-500 checked:border-amber-500"
                                    />
                                    {formData.agreeToFinancialDisclosure && <Check size={14} className="absolute inset-0 m-auto text-white pointer-events-none" />}
                                </div>
                                <span className="text-xs text-slate-300 leading-tight">
                                    I agree that my financial and tax data can be disclosed to local tax authorities as required by international AML & KYC laws.
                                </span>
                            </label>
                        </div>
                    </motion.div>
                );
            default:
                return null;
        }
    };

    const isNextDisabled = () => {
        if (step === 4) {
            return !formData.agreeToTerms || !formData.agreeToFinancialDisclosure;
        }
        return false;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#050B14]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
                    >
                        {/* Modal Container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0b1622] border border-white/10 rounded-[32px] w-full max-w-lg shadow-[0_0_80px_rgba(0,185,240,0.15)] relative flex flex-col my-8"
                        >
                            {/* Decorative background glows */}
                            <div className="absolute top-0 left-[-20%] w-[140%] h-[2px] bg-gradient-to-r from-transparent via-[#00b9f0] to-transparent"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b9f0]/10 rounded-full blur-[80px] pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                            {/* Header */}
                            <div className="relative z-10 p-6 pb-2 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                                        <span className="text-white font-bold text-sm">{step}</span>
                                        <span className="text-slate-500 text-xs mx-0.5">/</span>
                                        <span className="text-slate-500 text-xs">{totalSteps}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-lg leading-tight tracking-tight">Apply as Creator</span>
                                    </div>
                                </div>
                                {!isSubmitting && (
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-[3px] bg-white/5 relative z-10">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#00b9f0] via-blue-500 to-purple-500"
                                    initial={{ width: `${((step - 1) / totalSteps) * 100}%` }}
                                    animate={{ width: `${(step / totalSteps) * 100}%` }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                />
                            </div>

                            {/* Body */}
                            <div className="relative z-[60] p-6 sm:p-8 flex-grow">
                                <AnimatePresence mode="wait">
                                    {renderStepContent()}
                                </AnimatePresence>
                            </div>

                            {/* Full Overlay Loader */}
                            <AnimatePresence>
                                {isSubmitting && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 z-[100] bg-[#0b1622] rounded-[32px] flex flex-col items-center justify-center p-8 border border-[#00b9f0]/20"
                                    >
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b9f0]/10 rounded-full blur-[80px] pointer-events-none"></div>
                                        <div className="w-24 h-24 mb-6 relative">
                                            <div className="absolute inset-0 border-4 border-[#152a3a] rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-[#00b9f0] rounded-full border-t-transparent animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center text-[#00b9f0]">
                                                <ImageIcon size={32} className="animate-pulse" />
                                            </div>
                                        </div>
                                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Creating Profile...</h2>
                                        <p className="text-slate-400 text-center text-sm font-medium">Assembling your public profile, registering tax details, and setting up dashboard.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Footer */}
                            <div className="relative z-10 p-6 border-t border-white/5 flex gap-4 bg-[#0a141f]">
                                {step > 1 && !isSubmitting && (
                                    <button
                                        onClick={prevStep}
                                        className="py-4 px-6 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all flex items-center gap-2"
                                    >
                                        <ArrowLeft size={20} />
                                        Back
                                    </button>
                                )}

                                {step < totalSteps && !isSubmitting && (
                                    <button
                                        onClick={nextStep}
                                        className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-[#00b9f0] to-blue-600 text-white font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,185,240,0.3)] hover:shadow-[0_0_30px_rgba(0,185,240,0.5)] flex items-center justify-center gap-2"
                                    >
                                        Next Step
                                        <ArrowRight size={20} />
                                    </button>
                                )}

                                {step === totalSteps && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isNextDisabled() || isSubmitting}
                                        className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group ${isNextDisabled() || isSubmitting ? 'bg-white/10 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:brightness-110 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]'}`}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                                                Creating Profile...
                                            </>
                                        ) : (
                                            <>
                                                Complete Submission
                                                <Check size={20} className="group-hover:scale-110 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
