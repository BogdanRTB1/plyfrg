"use client";

import { useState, useRef } from "react";
import { Camera, RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface KYCVerificationProps {
    onSuccess: () => void;
    onCancel: () => void;
    onUnderage?: () => void;
}

export default function KYCVerification({ onSuccess, onCancel, onUnderage }: KYCVerificationProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed' | 'rejected'>('idle');
    const [errorMsg, setErrorMsg] = useState("");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStatus('processing');
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64Image = event.target?.result as string;
            setCapturedImage(base64Image);
            verifyImage(base64Image);
        };
        reader.readAsDataURL(file);
    };

    const verifyImage = async (imageUrl: string) => {
        setErrorMsg("");

        try {
            const response = await fetch('/api/verify-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageUrl }),
            });

            if (!response.ok) {
                throw new Error("Failed to verify document via API");
            }

            const result = await response.json();
            console.log("Gemini Verification Result:", result);

            let ageStatus: 'verified' | 'underage' | 'not_found' = 'not_found';
            if (result.error === 'not_found') {
                ageStatus = 'not_found';
            } else if (result.isOver21) {
                ageStatus = 'verified';
            } else if (result.isOver21 === false) {
                ageStatus = 'underage';
            }

            if (ageStatus === 'verified') {
                setStatus('success');
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else if (ageStatus === 'underage') {
                setStatus('rejected');
                setErrorMsg("This document indicates you are under 21 years old.");
                if (onUnderage) {
                    onUnderage();
                }
            } else {
                setStatus('failed');
                setErrorMsg("We could not find a clear date of birth on the document provided. Please try again with a clearer photo.");
            }
        } catch (err) {
            console.error("Verification Error:", err);
            setStatus('failed');
            setErrorMsg("Failed to analyze the document. Please ensure good lighting and a clear view, then try again.");
        }
    };

    const handleRetry = () => {
        setCapturedImage(null);
        setStatus('idle');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full space-y-6">
            <div className="text-center w-full">
                <h3 className="text-xl font-bold text-white mb-2">Age Verification Required</h3>
                <p className="text-sm text-slate-400">
                    To start playing, please provide a clear photo of your ID Card, Driver&apos;s License, or Passport to verify you are 21+.
                </p>
            </div>

            <div className="relative w-full aspect-video bg-[#0a161f] rounded-xl overflow-hidden border border-white/10 flex flex-col items-center justify-center">
                
                {status === 'idle' && (
                    <div 
                        className="flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors w-full h-full p-6 text-center"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Camera className="w-12 h-12 text-[#00b9f0] mb-4" />
                        <span className="text-white font-semibold">Tap to Take a Photo</span>
                        <span className="text-slate-400 text-xs mt-2 max-w-[200px]">Uses your device native camera for best AI analysis</span>
                    </div>
                )}

                {/* Hide original file input */}
                <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect}
                    className="hidden" 
                />

                {capturedImage && status !== 'idle' && (
                    <img src={capturedImage} alt="Captured ID" className={`w-full h-full object-contain ${status === 'processing' ? 'opacity-50 blur-[2px]' : ''}`} />
                )}

                {status === 'processing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-[#00b9f0] animate-spin mb-4" />
                        <span className="text-white font-bold text-sm">AI is Analyzing Document...</span>
                    </div>
                )}

                {status === 'success' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/20 z-10 backdrop-blur-sm">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mb-2 drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]" />
                        <span className="text-white font-bold text-lg drop-shadow-md">Age Verified!</span>
                    </div>
                )}

                {status === 'rejected' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 z-10 backdrop-blur-sm p-4 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                        <span className="text-white font-bold text-lg drop-shadow-md">Underage Detected</span>
                        <span className="text-white/80 font-medium text-sm mt-1 drop-shadow-md">Account scheduled for deletion.</span>
                    </div>
                )}
            </div>

            {errorMsg && (
                <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                </div>
            )}

            <div className="flex gap-3 w-full">
                 {(status === 'failed' || errorMsg !== "") && status !== 'rejected' && (
                    <button
                        onClick={handleRetry}
                        className="flex-1 h-12 bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RefreshCw size={20} /> Try Another Photo
                    </button>
                )}
            </div>

            <div className="flex flex-col items-center gap-4 mt-2">
                <button
                    onClick={onCancel}
                    disabled={status === 'processing' || status === 'success' || status === 'rejected'}
                    className="text-xs font-bold text-slate-400 hover:text-white transition-colors underline-offset-2 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel verification
                </button>

                {/* DEV ONLY SKIP BUTTON */}
                <button
                    onClick={onSuccess}
                    disabled={status === 'processing' || status === 'success' || status === 'rejected'}
                    className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
                >
                    Skip Verification (Test Only)
                </button>
            </div>
        </div>
    );
}
