import React, { useState } from 'react';
import { FlowWingIcon } from './FlowWingIcon';

interface FlowLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showTagline?: boolean;
  showBadge?: boolean;
  className?: string;
}

export const ZenithLogo: React.FC<FlowLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  showBadge = true,
  className = ''
}) => {
  const textSizes = {
    xs: 'text-sm sm:text-base',
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-xl',
    lg: 'text-xl sm:text-2xl',
    xl: 'text-2xl sm:text-3xl'
  };

  const [imgError, setImgError] = useState(false);

  return (
    <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
      {/* Official FLOW Wing Symbol Container */}
      {!imgError ? (
        <img
          src="/flow-wing-logo.jpg"
          alt="FLOW"
          className="rounded-xl object-contain border border-[#27272A] bg-[#101114] shadow-md shadow-[#FF8A00]/10 shrink-0"
          style={{
            width: size === 'xs' ? 28 : size === 'sm' ? 32 : size === 'md' ? 38 : size === 'lg' ? 46 : 54,
            height: size === 'xs' ? 28 : size === 'sm' ? 32 : size === 'md' ? 38 : size === 'lg' ? 46 : 54,
            minWidth: size === 'xs' ? 28 : size === 'sm' ? 32 : size === 'md' ? 38 : size === 'lg' ? 46 : 54
          }}
          onError={() => setImgError(true)}
        />
      ) : (
        <FlowWingIcon size={size} />
      )}

      {/* Wordmark and Brand Details */}
      {showWordmark && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-center gap-1.5 flex-nowrap">
            <span
              className={`font-black tracking-tight text-white ${textSizes[size]}`}
            >
              FLOW
            </span>
            {showBadge && (
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF8A00]/15 text-[#FF9D24] border border-[#FF8A00]/30 whitespace-nowrap">
                IMV
              </span>
            )}
          </div>
          {showTagline && (
            <span className="text-[10px] sm:text-[11px] font-medium text-[#A1A1AA] tracking-wide mt-0.5 whitespace-nowrap hidden sm:inline">
              Focus. Learn. Achieve.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ZenithLogo;
