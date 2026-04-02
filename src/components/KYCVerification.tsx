"use client";

import { useState, useRef, useEffect, useCallback } from "react";

import { Camera, RefreshCw, Loader2, CheckCircle2, AlertCircle, Zap, ZapOff } from "lucide-react";

interface KYCVerificationProps {
    onSuccess: () => void;
    onCancel: () => void;
    onUnderage?: () => void;
}

export default function KYCVerification({ onSuccess, onCancel, onUnderage }: KYCVerificationProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<'idle' | 'capturing' | 'processing' | 'success' | 'failed' | 'rejected'>('idle');
    const [errorMsg, setErrorMsg] = useState("");
    const [progress, setProgress] = useState(0);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [hasTorch, setHasTorch] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } } // Prefer back camera, but allow any
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            // Check if device has torch
            const track = mediaStream.getVideoTracks()[0];
            if (track) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const capabilities = track.getCapabilities?.() as any;
                if (capabilities && capabilities.torch) {
                    setHasTorch(true);
                } else {
                    setHasTorch(false);
                }
            }
            setIsTorchOn(false);

            setStatus('capturing');
            setErrorMsg("");
        } catch (err) {
            console.error("Error accessing camera:", err);
            setStatus('failed');
            setErrorMsg("Camera access denied or unavailable. Please allow access to verify your identity.");
        }
    };

    const toggleTorch = async () => {
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        if (track) {
            try {
                const newTorchState = !isTorchOn;
                await track.applyConstraints({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    advanced: [{ torch: newTorchState }] as any
                });
                setIsTorchOn(newTorchState);
            } catch (err) {
                console.error("Error toggling torch:", err);
            }
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    // Initial load, start camera automatically
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const captureAndVerify = async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas to video dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Apply image filters to improve clarity on low-quality/blurry images before sending to AI
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(110%)';

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Turn off the flashlight immediately after we have the image frame stored
        if (isTorchOn) {
            toggleTorch();
        }

        // Get image data URL
        const imageUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageUrl);
        setStatus('processing');
        setProgress(0);
        setErrorMsg("");

        try {
            // Simulate progress since API call doesn't have real-time progress
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 90) return 90;
                    return prev + 10;
                });
            }, 500);

            const response = await fetch('/api/verify-id', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: imageUrl }),
            });

            clearInterval(progressInterval);
            setProgress(100);

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
                setErrorMsg("We could not find a clear date of birth on the document provided. Please ensure it is clearly visible and try again.");
            }
        } catch (err) {
            console.error("Verification Error:", err);
            setStatus('failed');
            setErrorMsg("Failed to analyze the document. Please ensure good lighting and a clear view, then try again.");
            setProgress(0);
        }
    };

    const handleRetry = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleSkip = () => {
        stopCamera();
        onSuccess();
    };

    const handleCancel = () => {
        stopCamera();
        onCancel();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full space-y-6">
            <div className="text-center w-full">
                <h3 className="text-xl font-bold text-white mb-2">Age Verification Required</h3>
                <p className="text-sm text-slate-400">
                    To start playing, please take a clear photo of your ID Card, Driver&apos;s License, or Passport to verify you are 21+.
                </p>
            </div>

            <div className="relative w-full aspect-video bg-[#0a161f] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${status === 'capturing' ? 'block' : 'hidden'}`}
                />

                {capturedImage && (
                    <img src={capturedImage} alt="Captured ID" className={`w-full h-full object-cover ${status === 'processing' ? 'opacity-50 blur-sm' : ''}`} />
                )}

                {status === 'processing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 backdrop-blur-sm">
                        <Loader2 className="w-10 h-10 text-[#00b9f0] animate-spin mb-4" />
                        <span className="text-white font-bold text-sm">Analyzing Document...</span>
                        <div className="w-48 h-1 bg-white/20 mt-4 rounded-full overflow-hidden">
                            <div className="h-full bg-[#00b9f0] transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
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

                {/* Focus Guides */}
                {(status === 'capturing' || status === 'idle') && (
                    <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00b9f0] -mt-0.5 -ml-0.5 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00b9f0] -mt-0.5 -mr-0.5 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00b9f0] -mb-0.5 -ml-0.5 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00b9f0] -mb-0.5 -mr-0.5 rounded-br-lg"></div>
                    </div>
                )}

                {/* Torch Toggle Button */}
                {status === 'capturing' && hasTorch && (
                    <button
                        onClick={toggleTorch}
                        className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 backdrop-blur border border-white/20 p-3 rounded-full text-white transition-all active:scale-95"
                        aria-label="Toggle Flashlight"
                    >
                        {isTorchOn ? <Zap className="text-yellow-400" size={24} /> : <ZapOff size={24} />}
                    </button>
                )}

                {/* Hidden canvas for taking snapshot */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {errorMsg && (
                <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                    <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                </div>
            )}

            <div className="flex gap-3 w-full">
                {status === 'capturing' ? (
                    <button
                        onClick={captureAndVerify}
                        className="flex-1 h-12 bg-[#00b9f0] hover:bg-[#38bdf8] text-[#0f212e] font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,185,240,0.2)] hover:shadow-[0_0_25px_rgba(0,185,240,0.4)] flex items-center justify-center gap-2 active:scale-95"
                    >
                        <Camera size={20} /> Capture ID
                    </button>
                ) : (status === 'failed' || errorMsg !== "") && status !== 'rejected' ? (
                    <button
                        onClick={handleRetry}
                        className="flex-1 h-12 bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RefreshCw size={20} /> Try Again
                    </button>
                ) : null}
            </div>

            <div className="flex flex-col items-center gap-4 mt-2">
                <button
                    onClick={handleCancel}
                    disabled={status === 'processing' || status === 'success' || status === 'rejected'}
                    className="text-xs font-bold text-slate-400 hover:text-white transition-colors underline-offset-2 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Cancel verification
                </button>

                {/* DEV ONLY SKIP BUTTON */}
                <button
                    onClick={handleSkip}
                    disabled={status === 'processing' || status === 'success' || status === 'rejected'}
                    className="text-xs font-bold text-yellow-500 hover:text-yellow-400 transition-colors border border-yellow-500/30 bg-yellow-500/10 px-4 py-1.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2"
                >
                    Skip Verification (Test Only)
                </button>
            </div>
        </div>
    );
}
