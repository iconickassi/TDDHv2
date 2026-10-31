import React from 'react';
import { Heart } from 'lucide-react';

export const DeltaHeartLogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_10px_rgba(255,42,133,0.7)]"
      >
        <defs>
          <linearGradient id="heartGradient" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff2a85" />
            <stop offset="0.5" stopColor="#d946ef" />
            <stop offset="1" stopColor="#7e22ce" />
          </linearGradient>
          <linearGradient id="deltaGradient" x1="16" y1="9" x2="16" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="1" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
        {/* Glam Heart Body */}
        <path
          d="M16 28C16 28 3 20 3 10.5C3 6.35786 6.35786 3 10.5 3C12.8 3 14.85 4.05 16 5.7C17.15 4.05 19.2 3 21.5 3C25.6421 3 29 6.35786 29 10.5C29 20 16 28 16 28Z"
          fill="url(#heartGradient)"
          stroke="#fbcfe8"
          strokeWidth="1"
        />
        {/* Greek Delta Triangle Symbol in Gold */}
        <polygon
          points="16,9 22.5,21.5 9.5,21.5"
          fill="none"
          stroke="url(#deltaGradient)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        {/* Inner glow dot */}
        <circle cx="16" cy="17" r="1.5" fill="#fef08a" />
      </svg>
    </div>
  );
};

export const CheetahRosetteRibbon: React.FC<{ height?: number; className?: string }> = ({ height = 6, className = '' }) => {
  return (
    <div
      className={`w-full relative overflow-hidden ${className}`}
      style={{ height }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#ff2a85] via-[#c026d3] via-[#fbbf24] to-[#ff2a85]" />
      {/* Cheetah spot overlay */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, #000 2px, transparent 3px), radial-gradient(circle at 60% 30%, #000 2.5px, transparent 3.5px), radial-gradient(circle at 85% 70%, #000 2px, transparent 3px)`,
          backgroundSize: '24px 100%',
        }}
      />
    </div>
  );
};

export const SpicinessHearts: React.FC<{ rating: number; max?: number; size?: number }> = ({
  rating,
  max = 5,
  size = 14,
}) => {
  return (
    <div className="inline-flex items-center gap-1" title={`Spiciness Rating: ${rating}/${max} hearts`}>
      {Array.from({ length: max }).map((_, i) => {
        const isFilled = i < rating;
        return (
          <Heart
            key={i}
            size={size}
            className={`transition-colors duration-200 ${
              isFilled
                ? 'fill-[#ff2a85] text-[#ff2a85] drop-shadow-[0_0_6px_rgba(255,42,133,0.6)]'
                : 'text-neutral-600/50 fill-transparent'
            }`}
          />
        );
      })}
    </div>
  );
};
