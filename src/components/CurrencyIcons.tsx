export const DiamondIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="diamond-glow" x1="12" y1="0" x2="12" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60A5FA" />
                <stop offset="1" stopColor="#1E3A8A" />
            </linearGradient>
            <linearGradient id="diamond-face" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#93C5FD" />
                <stop offset="0.5" stopColor="#3B82F6" />
                <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
            <filter id="glow-effect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <g filter="url(#glow-effect)">
            {/* Base Diamond Shape */}
            <path d="M12 2L2 9L12 22L22 9L12 2Z" fill="url(#diamond-glow)" stroke="#BFDBFE" strokeWidth="1" strokeLinejoin="round" />
            {/* Top Facet */}
            <path d="M2 9H22L12 2Z" fill="url(#diamond-face)" opacity="0.8" />
            {/* Bottom Facets lines */}
            <path d="M12 22V9" stroke="#BFDBFE" strokeWidth="1" opacity="0.7" />
            <path d="M12 22L7 9" stroke="#93C5FD" strokeWidth="1" opacity="0.5" />
            <path d="M12 22L17 9" stroke="#93C5FD" strokeWidth="1" opacity="0.5" />
            {/* Top Facets lines */}
            <path d="M12 2L7 9" stroke="#BFDBFE" strokeWidth="1" opacity="0.6" />
            <path d="M12 2L17 9" stroke="#BFDBFE" strokeWidth="1" opacity="0.6" />
            {/* Highlights */}
            <path d="M12 2L8 9H12Z" fill="#EFF6FF" opacity="0.4" />
            <path d="M12 9V22L8 9H12Z" fill="#DBEAFE" opacity="0.2" />
        </g>
    </svg>
);

export const ForgesCoinIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
            <linearGradient id="fc-gold-base" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FDE047" />
                <stop offset="0.5" stopColor="#EAB308" />
                <stop offset="1" stopColor="#A16207" />
            </linearGradient>
            <linearGradient id="fc-gold-rim" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FEF08A" />
                <stop offset="0.3" stopColor="#CA8A04" />
                <stop offset="0.7" stopColor="#EAB308" />
                <stop offset="1" stopColor="#713F12" />
            </linearGradient>
            <filter id="coin-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <g filter="url(#coin-glow)">
            {/* Outer Rim */}
            <circle cx="12" cy="12" r="11" fill="url(#fc-gold-rim)" />
            {/* Inner Coin Base */}
            <circle cx="12" cy="12" r="9" fill="url(#fc-gold-base)" />
            {/* Inner Ring Detail */}
            <circle cx="12" cy="12" r="7.5" fill="none" stroke="#FDF08A" strokeWidth="0.5" strokeDasharray="1.5 1.5" opacity="0.8" />
            {/* Central 'F' */}
            <path d="M9.5 7.5H15V9H11.5V11H14V12.5H11.5V16.5H9.5V7.5Z" fill="#FEF9C3" filter="drop-shadow(0px 1px 1px rgba(113, 63, 18, 0.8))" />
            {/* Sparkle highlight */}
            <path d="M6 7L7 5L8 7L10 8L8 9L7 11L6 9L4 8L6 7Z" fill="#FCD34D" opacity="0.8" />
        </g>
    </svg>
);
