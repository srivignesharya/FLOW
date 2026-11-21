import React from 'react';

export interface FlowWingProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
}

export const FlowWingIcon: React.FC<FlowWingProps> = ({ className = '', size = 'md' }) => {
  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56
  };

  const dim = typeof size === 'number' ? size : pixelSizes[size] || 40;

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-xl bg-[#101114] border border-[#27272A] shadow-md shadow-[#FF8A00]/10 overflow-hidden ${className}`}
      style={{ width: dim, height: dim }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full p-1"
      >
        <defs>
          {/* Upper Wing Gradient: Fiery Bright Orange to Golden Amber */}
          <linearGradient id="flowWingUpper" x1="24" y1="44" x2="88" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF4500" />
            <stop offset="40%" stopColor="#FF8A00" />
            <stop offset="100%" stopColor="#FFC837" />
          </linearGradient>

          {/* Lower Wing Orange Gradient */}
          <linearGradient id="flowWingLowerOrange" x1="20" y1="84" x2="76" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF8A00" />
            <stop offset="50%" stopColor="#FF9D24" />
            <stop offset="100%" stopColor="#FFC837" />
          </linearGradient>

          {/* Lower Wing White/Silver Spine */}
          <linearGradient id="flowWingLowerWhite" x1="22" y1="80" x2="52" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.8" />
            <stop offset="35%" stopColor="#FFFFFF" />
            <stop offset="85%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0.2" />
          </linearGradient>

          {/* Core Ambient Glow */}
          <radialGradient id="flowWingGlow" cx="50" cy="50" r="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#101114" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Glow Behind Wings */}
        <circle cx="50" cy="50" r="40" fill="url(#flowWingGlow)" />

        {/* Upper Wing (Organic sweeping curve with directional forward tip) */}
        <path
          d="M 28 56 C 26 44 32 32 46 27 C 62 21 78 26 86 19 C 84 27 75 35 60 38 C 45 41 33 46 28 56 Z"
          fill="url(#flowWingUpper)"
        />

        {/* Lower Wing (Flowing body & orange lower facet) */}
        <path
          d="M 22 82 C 26 70 34 58 48 52 C 60 47 70 48 76 43 C 74 49 67 56 55 58 C 43 60 36 67 22 82 Z"
          fill="url(#flowWingLowerOrange)"
        />

        {/* Lower Wing White / Silver Leading Edge Facet */}
        <path
          d="M 22 82 C 25 72 31 62 44 54 C 52 50 60 49 68 47 C 56 50 44 55 36 64 C 28 72 23 79 22 82 Z"
          fill="url(#flowWingLowerWhite)"
        />
      </svg>
    </div>
  );
};

export default FlowWingIcon;
