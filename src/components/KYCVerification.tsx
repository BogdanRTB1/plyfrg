"use client";

import { useState, useRef } from "react";
import { Camera, AlertCircle, UploadCloud } from "lucide-react";

interface KYCVerificationProps {
    onSuccess: () => void;
    onCancel: () => void;
    onUnderage?: () => void;
}

export default function KYCVerification({ onSuccess, onCancel, onUnderage }: KYCVerificationProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'failed' | 'rejected'>('idle');

    // Downscale the image to prevent 413 Payload Too Large errors on Serverless/Vercel
    const processImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 1400; // Perfect for Gemini vision, small enough to pass 4MB limits easily
                    
                    if (width > height && width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    } else if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('processing');

        try {
            const base64Image = await processImage(file);

            const response = await fetch('/api/verify-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Image }),
            });

            if (!response.ok) throw new Error("API Limit or Failure");

            const result = await response.json();
            
            if (result.isOver21) {
                // Instantly pass verification
                onSuccess();
            } else {
                // Instantly reject and delete account basically
                setStatus('rejected');
                if (onUnderage) setTimeout(() => onUnderage(), 2000); // Give user a moment to cry
            }
        } catch (err) {
            console.error("Verification error:", err);
            setStatus('failed');
        }
    };

    if (status === 'rejected') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 rounded-xl border border-red-500/20 text-center w-full">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                <span className="text-red-500 font-bold text-2xl mb-2">You are underage!</span>
                <span className="text-white/80 font-medium">Account scheduled for deletion.</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center w-full space-y-6">
            <div className="text-center w-full">
                <h3 className="text-2xl font-bold text-white mb-2">Verify Age (21+)</h3>
                <p className="text-sm text-slate-400">
                    Upload a clear picture of your ID.
                </p>
            </div>

            <button 
               onClick={() => fileInputRef.current?.click()}
               disabled={status === 'processing'}
               className="w-full flex items-center justify-center gap-3 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold h-16 rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_30px_rgba(0,185,240,0.5)] disabled:opacity-50 disabled:cursor-wait active:scale-95"
            >
                {status === 'processing' ? (
                    <span className="animate-pulse">Checking Date of Birth...</span>
                ) : (
                    <>
                        <Camera size={24} /> 
                        Take Photo
                    </>
                )}
            </button>

            <input 
                type="file" 
                accept="image/*" 
                capture="environment" 
                ref={fileInputRef} 
                onChange={handleFileSelect}
                className="hidden" 
            />

            {status === 'failed' && (
                <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <p className="text-red-400 text-sm font-medium">Could not read ID. Please ensure the date of birth is clearly visible in the photo.</p>
                </div>
            )}
            
            {(status === 'failed' || status === 'idle') && (
                <button
                    onClick={onCancel}
                    className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors uppercase tracking-wider"
                >
                    Return
                </button>
            )}
        </div>
    );
}
