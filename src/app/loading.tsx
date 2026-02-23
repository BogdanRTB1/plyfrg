import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex-1 h-full flex flex-col items-center justify-center min-h-[50vh]">
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-[#00b9f0] rounded-full blur-2xl opacity-20 animate-pulse"></div>

                {/* Spinner */}
                <Loader2 size={48} className="text-[#00b9f0] animate-spin relative z-10" />
            </div>
            <p className="mt-4 text-slate-400 text-sm font-medium animate-pulse">
                Loading...
            </p>
        </div>
    );
}
