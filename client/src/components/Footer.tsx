import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`w-full border-t border-slate-200 dark:border-slate-800/80 py-4 px-6 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-500 transition-colors ${className}`}>
      © 2026 FLOW • Built by IMV
    </footer>
  );
};

export default Footer;
