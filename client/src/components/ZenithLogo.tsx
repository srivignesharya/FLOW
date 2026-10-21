import React from 'react';

interface ZenithLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showTagline?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const ZenithLogo: React.FC<ZenithLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  showBadge = true,
  className = ''
}) => {
  const iconSizeClasses = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-11 w-11',
    xl: 'h-14 w-14'
  };

  const textSizes = {
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Zenith Peak + Star Geometric Icon */}
      <div
        className={`${iconSizeClasses[size]} relative shrink-0 flex items-center justify-center rounded-xl bg-[#0B1020] border border-[#2563FF]/30 shadow-md shadow-[#2563FF]/20`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5"
        >
          <defs>
            {/* Primary Zenith Deep Blue to Cyan Gradient */}
            <linearGradient id="zenithPeakLeft" x1="12" y1="38" x2="24" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#2563FF" />
            </linearGradient>
            <linearGradient id="zenithPeakRight" x1="36" y1="38" x2="24" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2563FF" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
            <radialGradient id="starGlow" cx="24" cy="11" r="12" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#2563FF" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Zenith Ambient Apex Corona */}
          <circle cx="24" cy="12" r="8" fill="url(#starGlow)" opacity="0.6" />

          {/* Sharp Zenith Peak — Left Facet */}
          <path
            d="M 24 13 L 9 39 L 24 33 Z"
            fill="url(#zenithPeakLeft)"
          />

          {/* Sharp Zenith Peak — Right Facet (Lighter / Cyan Sheen) */}
          <path
            d="M 24 13 L 39 39 L 24 33 Z"
            fill="url(#zenithPeakRight)"
          />

          {/* Center Ridge / Crest Spine */}
          <path
            d="M 24 13 L 24 33"
            stroke="#F8FAFC"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Base Inner Carve */}
          <path
            d="M 17 35.5 L 24 32.5 L 31 35.5"
            stroke="#0B1020"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Distinctive 8-Point Zenith Star at the Summit */}
          {/* Vertical & Horizontal Major Spikes */}
          <path
            d="M 24 5 L 25.5 10 L 30 11.5 L 25.5 13 L 24 18 L 22.5 13 L 18 11.5 L 22.5 10 Z"
            fill="#F8FAFC"
          />
          {/* Diagonal Minor Spikes */}
          <path
            d="M 24 7.5 L 27.5 11.5 L 24 15.5 L 20.5 11.5 Z"
            fill="#00D4FF"
          />
          {/* Star Core Jewel */}
          <circle cx="24" cy="11.5" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Wordmark and Brand Details */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-tight text-[#F8FAFC] ${textSizes[size]}`}
            >
              ZENITH
            </span>
            {showBadge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#2563FF]/15 text-[#00D4FF] border border-[#00D4FF]/30">
                by IMV
              </span>
            )}
          </div>
          {showTagline && (
            <span className="text-[11px] font-medium text-[#94A3B8] tracking-wide -mt-0.5">
              Reach Higher. Live Brighter.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ZenithLogo;
