"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Tesseract from "tesseract.js";
import { Camera, RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface KYCVerificationProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function KYCVerification({ onSuccess, onCancel }: KYCVerificationProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<'idle' | 'capturing' | 'processing' | 'success' | 'failed'>('idle');
    const [errorMsg, setErrorMsg] = useState("");
    const [progress, setProgress] = useState(0);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" } // Prefer back camera on mobile
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStatus('capturing');
            setErrorMsg("");
        } catch (err) {
            console.error("Error accessing camera:", err);
            setStatus('failed');
            setErrorMsg("Camera access denied or unavailable. Please allow access to verify your identity.");
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
        // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
        startCamera();
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            stopCamera();
        };
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

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data URL
        const imageUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageUrl);
        setStatus('processing');
        setProgress(0);
        setErrorMsg("");

        try {
            // Run Tesseract
            const result = await Tesseract.recognize(
                imageUrl,
                'eng+ron', // Assuming English and Romanian for a Playforges demo, can be just eng
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(Math.round(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            console.log("Extracted text:", text);

            // Parse text to find date of birth and check if 18+
            const is18Plus = verifyAge(text);

            if (is18Plus) {
                setStatus('success');
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                setStatus('failed');
                setErrorMsg("We could not verify that you are 18 or older based on the document provided. Please ensure the date of birth is clearly visible and try again.");
            }
        } catch (err) {
            console.error("OCR Error:", err);
            setStatus('failed');
            setErrorMsg("Failed to read the document. Please ensure good lighting and a clear view, then try again.");
        }
    };

    const verifyAge = (text: string): boolean => {
        // Look for common date formats:
        // DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
        // YYYY.MM.DD, YYYY/MM/DD, YYYY-MM-DD
        // YYMMDD (MRZ)

        const dateRegexes = [
            /\b(\d{2})[\.\/\-](\d{2})[\.\/\-](\d{4})\b/g, // DD.MM.YYYY
            /\b(\d{4})[\.\/\-](\d{2})[\.\/\-](\d{2})\b/g, // YYYY.MM.DD
        ];

        let foundValidDOB = false;

        const currentYear = new Date().getFullYear(); // 2026
        // To be 18 in 2026, you must be born in 2008 or earlier.
        // Even better, accurate calculation using exact dates, but OCR can be messy, 
        // so checking the year is a solid heuristic for MVP.
        const maxBirthYear = currentYear - 18;

        // Collect all possible years from matches
        const possibleYears: number[] = [];

        // Match formats DD.MM.YYYY or YYYY.MM.DD
        for (const regex of dateRegexes) {
            let match;
            while ((match = regex.exec(text)) !== null) {
                const parts = [...match].slice(1); // the capturing groups
                // One of these parts will be 4 digits (the year)
                const yearPart = parts.find(p => p.length === 4);
                if (yearPart) {
                    const year = parseInt(yearPart, 10);
                    possibleYears.push(year);
                }
            }
        }

        // Also look for MRZ DOB (YYMMDD) - usually on passport or ID back
        // Format of MRZ DOB: 6 digits followed by M or F, e.g., 900512M
        const mrzRegex = /\b(\d{2})(\d{2})(\d{2})[MF<]/gi;
        let mrzMatch;
        while ((mrzMatch = mrzRegex.exec(text)) !== null) {
            const yy = parseInt(mrzMatch[1], 10);
            // If yy is > 20 (e.g. 90), it's 1990. If yy < 20 (e.g. 05), it's 2005.
            const year = yy + (yy > (currentYear % 100) ? 1900 : 2000);
            possibleYears.push(year);
        }

        // Often OCR misses some punctuation, we can just look for freestanding 4-digit years between 1900 and 2008
        const yearRegex = /\b(19\d{2}|200[0-8])\b/g;
        let yearMatch;
        while ((yearMatch = yearRegex.exec(text)) !== null) {
            possibleYears.push(parseInt(yearMatch[1], 10));
        }

        console.log("Found possible years:", possibleYears);

        // Analyze found years
        for (const year of possibleYears) {
            // If we found a year that qualifies as a valid DOB (e.g. 1920-2008)
            if (year >= 1900 && year <= maxBirthYear) {
                foundValidDOB = true;
                break;
            }
        }

        return foundValidDOB;
    };

    const handleRetry = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full space-y-6">
            <div className="text-center w-full">
                <h3 className="text-xl font-bold text-white mb-2">Age Verification Required</h3>
                <p className="text-sm text-slate-400">
                    To start playing, please take a clear photo of your ID Card, Driver&apos;s License, or Passport to verify you are 18+.
                </p>
            </div>

            <div className="relative w-full aspect-video bg-[#0a161f] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                {status === 'capturing' && (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                )}

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

                {/* Focus Guides */}
                {(status === 'capturing' || status === 'idle') && (
                    <div className="absolute inset-4 border-2 border-white/20 rounded-lg pointer-events-none">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00b9f0] -mt-0.5 -ml-0.5 rounded-tl-lg"></div>
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00b9f0] -mt-0.5 -mr-0.5 rounded-tr-lg"></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00b9f0] -mb-0.5 -ml-0.5 rounded-bl-lg"></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00b9f0] -mb-0.5 -mr-0.5 rounded-br-lg"></div>
                    </div>
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
                ) : (status === 'failed' || errorMsg !== "") ? (
                    <button
                        onClick={handleRetry}
                        className="flex-1 h-12 bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <RefreshCw size={20} /> Try Again
                    </button>
                ) : null}
            </div>

            <button
                onClick={() => {
                    stopCamera();
                    onCancel();
                }}
                disabled={status === 'processing' || status === 'success'}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors underline-offset-2 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Cancel verification
            </button>
        </div>
    );
}
