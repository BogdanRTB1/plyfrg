"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Check, Youtube, Twitch, Twitter, Image as ImageIcon, MessageSquare } from 'lucide-react';

interface EditCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    creatorData: any;
    onSave: (updatedData: any) => void;
}

export default function EditCreatorModal({ isOpen, onClose, creatorData, onSave }: EditCreatorModalProps) {
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (creatorData) {
            setFormData({
                name: creatorData.name || '',
                description: creatorData.description || '',
                profilePicture: creatorData.profilePicture || null,
                bannerImage: creatorData.bannerImage || null,
                twitchUrl: creatorData.twitchUrl || '',
                youtubeUrl: creatorData.youtubeUrl || '',
                twitterUrl: creatorData.twitterUrl || '',
                kickUrl: creatorData.kickUrl || '',
            });
        }
    }, [creatorData, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, [field]: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        setIsSaving(true);

        setTimeout(() => {
            const updatedCreator = {
                ...creatorData,
                name: formData.name,
                description: formData.description,
                profilePicture: formData.profilePicture,
                bannerImage: formData.bannerImage,
                twitchUrl: formData.twitchUrl,
                youtubeUrl: formData.youtubeUrl,
                twitterUrl: formData.twitterUrl,
                kickUrl: formData.kickUrl,
            };

            // Update local storage
            const existingCreators = JSON.parse(localStorage.getItem('added_creators') || '[]');
            const updatedList = existingCreators.map((c: any) => c.id === updatedCreator.id ? updatedCreator : c);
            localStorage.setItem('added_creators', JSON.stringify(updatedList));

            onSave(updatedCreator);
            setIsSaving(false);
            onClose();
        }, 1500);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-[#050B14]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-[#0b1622] border border-white/10 rounded-[32px] w-full max-w-xl shadow-[0_0_80px_rgba(0,185,240,0.15)] relative overflow-hidden flex flex-col my-8"
                    >
                        {/* Title Bar */}
                        <div className="relative z-10 p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Edit Profile</h2>
                                <p className="text-slate-400 text-sm">Update your public presence.</p>
                            </div>
                            {!isSaving && (
                                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            )}
                        </div>

                        {/* Form area */}
                        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar relative z-10 text-left">
                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                {/* Avatar */}
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

                                {/* Banner */}
                                <div className="flex-grow w-full">
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Profile Banner</label>
                                    <div className="relative w-full h-24 rounded-2xl bg-[#0f212e]/80 border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden hover:border-[#00b9f0] hover:bg-[#00b9f0]/5 transition-all cursor-pointer group shadow-inner">
                                        {formData.bannerImage ? (
                                            <img src={formData.bannerImage} alt="Banner" className="w-full h-full object-cover opacity-60" />
                                        ) : (
                                            <>
                                                <ImageIcon size={24} className="text-slate-400 group-hover:text-[#00b9f0] mb-1 transition-colors" />
                                                <span className="text-[10px] text-slate-500 font-medium">1200x400</span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'bannerImage')} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-300">Creator Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Your alias"
                                    className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-colors"
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-bold text-slate-300">Public Bio</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Tell your fans a bit about yourself..."
                                    rows={3}
                                    className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00b9f0] focus:ring-1 focus:ring-[#00b9f0] transition-colors resize-none placeholder-slate-600"
                                />
                            </div>

                            <hr className="border-white/5" />
                            <h3 className="font-bold text-white mb-2">Social Links</h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Twitch className="text-[#9146FF]" size={16} />
                                    </div>
                                    <input type="text" name="twitchUrl" value={formData.twitchUrl} onChange={handleChange} placeholder="Twitch URL" className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#9146FF] transition-colors placeholder-slate-600" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Youtube className="text-[#FF0000]" size={16} />
                                    </div>
                                    <input type="text" name="youtubeUrl" value={formData.youtubeUrl} onChange={handleChange} placeholder="YouTube URL" className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF0000] transition-colors placeholder-slate-600" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Twitter className="text-[#1DA1F2]" size={16} />
                                    </div>
                                    <input type="text" name="twitterUrl" value={formData.twitterUrl} onChange={handleChange} placeholder="X (Twitter) URL" className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#1DA1F2] transition-colors placeholder-slate-600" />
                                </div>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MessageSquare className="text-[#53FC18]" size={16} />
                                    </div>
                                    <input type="text" name="kickUrl" value={formData.kickUrl} onChange={handleChange} placeholder="Kick URL" className="w-full bg-[#0f212e]/80 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#53FC18] transition-colors placeholder-slate-600" />
                                </div>
                            </div>
                        </div>

                        {/* Footer logic */}
                        <div className="relative z-10 p-6 border-t border-white/5 bg-[#0a141f]">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`w-full py-4 px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group ${isSaving ? 'bg-white/10 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-[#00b9f0] to-blue-600 text-white hover:brightness-110 shadow-[0_0_20px_rgba(0,185,240,0.3)] hover:shadow-[0_0_30px_rgba(0,185,240,0.5)]'}`}
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                                        Saving Profile...
                                    </>
                                ) : (
                                    <>
                                        <Check size={20} className="group-hover:scale-110 transition-transform" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
