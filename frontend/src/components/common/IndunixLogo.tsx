import React from 'react';

interface IndunixLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textSize?: string;
}

export const IndunixLogo: React.FC<IndunixLogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  textSize = 'text-lg',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Sovereign Hexagonal Neural Mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="indunix-grad-hex" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="indunix-grad-core" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id="indunix-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Hexagonal Shield */}
        <path
          d="M20 3L35 11.66V28.34L20 37L5 28.34V11.66L20 3Z"
          fill="#0B0F19"
          stroke="url(#indunix-grad-hex)"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Ambient Neural Core Glow */}
        <circle cx="20" cy="20" r="7" fill="url(#indunix-grad-core)" opacity="0.18" filter="url(#indunix-glow)" />

        {/* Central Sovereign Nexus Lines (The Indunix Neural 'X' & Gateway) */}
        <path
          d="M13 13L27 27M27 13L13 27"
          stroke="url(#indunix-grad-hex)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Central Core Node */}
        <circle cx="20" cy="20" r="3.2" fill="#FFFFFF" />
        <circle cx="20" cy="20" r="1.8" fill="#10B981" />

        {/* Vertex Neural Satellites */}
        <circle cx="20" cy="8" r="1.5" fill="#34D399" />
        <circle cx="30" cy="14" r="1.5" fill="#06B6D4" />
        <circle cx="30" cy="26" r="1.5" fill="#3B82F6" />
        <circle cx="20" cy="32" r="1.5" fill="#10B981" />
        <circle cx="10" cy="26" r="1.5" fill="#06B6D4" />
        <circle cx="10" cy="14" r="1.5" fill="#34D399" />
      </svg>

      {showText && (
        <span className={`font-sans font-extrabold tracking-tight text-white ${textSize}`}>
          INDUNIX<span className="text-emerald-400 font-medium">.AI</span>
        </span>
      )}
    </div>
  );
};
