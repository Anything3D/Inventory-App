import React from 'react';

interface SpoolRingProps {
    color: string;
    percentage?: number; // 0-100
    size?: number;
    className?: string;
}

export const SpoolRing: React.FC<SpoolRingProps> = ({ color, percentage = 100, size = 64, className = "" }) => {
    // SVG parameters
    const strokeWidth = 12;
    const radius = size / 2 - strokeWidth;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            {/* Spool Sided View */}
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Ring (Spool Core) */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="#333"
                    strokeWidth={strokeWidth}
                />
                {/* Colored Filament Ring */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                />
            </svg>

            {/* Glossy Overlay for "Plastic" look */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_10px_rgba(255,255,255,0.2)] pointer-events-none"></div>
        </div>
    );
};
