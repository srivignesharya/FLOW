import React from 'react';
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
    xs: 'text-base',
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official FLOW Wing Logo Icon */}
      <FlowWingIcon size={size} />

      {/* Wordmark and Brand Details */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-tight text-white ${textSizes[size]}`}
            >
              FLOW
            </span>
            {showBadge && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FF8A00]/15 text-[#FF9D24] border border-[#FF8A00]/30">
                POWERED BY IMV
              </span>
            )}
          </div>
          {showTagline && (
            <span className="text-[11px] font-medium text-[#A1A1AA] tracking-wide -mt-0.5">
              Focus. Learn. Achieve.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ZenithLogo;
