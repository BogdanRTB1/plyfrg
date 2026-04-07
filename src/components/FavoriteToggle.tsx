"use client";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";

interface FavoriteToggleProps {
    gameName: string;
}

export default function FavoriteToggle({ gameName }: FavoriteToggleProps) {
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('playforges_favorites');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setIsFavorite(parsed.some((f: any) => f.label === gameName));
            } catch(e) {}
        }
    }, [gameName]);

    const handleFavoriteClick = () => {
        let newIsFavorite = !isFavorite;
        
        let stored = localStorage.getItem('playforges_favorites');
        let parsed = [];
        try {
            if (stored) parsed = JSON.parse(stored);
        } catch(e) {}
        
        if (newIsFavorite) {
            if (parsed.length >= 5) {
                toast.error("You can only have up to 5 favorite games.");
                return; // Prevent saving
            }
            const colors = ['#f87171', '#3b82f6', '#fbbf24', '#00b9f0', '#a855f7', '#10b981'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            parsed.push({ label: gameName, color: randomColor });
            setIsFavorite(true);
        } else {
            parsed = parsed.filter((f: any) => f.label !== gameName);
            setIsFavorite(false);
        }
        
        localStorage.setItem('playforges_favorites', JSON.stringify(parsed));
        window.dispatchEvent(new Event('favorites_updated'));
    };

    return (
        <button 
            onClick={handleFavoriteClick}
            className={`p-1.5 ml-1 rounded-full transition-all group border ${isFavorite ? 'bg-pink-500/10 border-pink-500/30 shadow-[0_0_8px_rgba(236,72,153,0.3)]' : 'bg-transparent border-transparent hover:bg-white/5'}`}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
        >
            <Heart size={16} className={`transition-all duration-300 ${isFavorite ? "text-pink-500 fill-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]" : "text-white/40 group-hover:text-pink-400 group-hover:scale-110"}`} />
        </button>
    );
}
