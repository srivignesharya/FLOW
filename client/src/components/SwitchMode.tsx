import React, { useEffect, useState, type FC } from 'react';
import { motion } from 'framer-motion';
import { IoMoon, IoMoonOutline, IoSunny, IoSunnyOutline } from 'react-icons/io5';
import { useTheme } from '../context/ThemeContext';

/* --- Props --- */
export interface SwitchModeProps {
  width?: number;
  height?: number;
  darkColor?: string;
  lightColor?: string;
  knobDarkColor?: string;
  knobLightColor?: string;
  borderDarkColor?: string;
  borderLightColor?: string;
  className?: string;
}

export const SwitchMode: FC<SwitchModeProps> = ({
  width = 68,
  height = 34,
  darkColor = '#0f131c',
  lightColor = '#FFFFFF',
  knobDarkColor = '#1e2638',
  knobLightColor = '#fff7ed',
  borderDarkColor = '#334155',
  borderLightColor = '#fed7aa',
  className = ''
}) => {
  const [mounted, setMounted] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  if (!mounted) {
    return <div style={{ width, height }} className="rounded-full border-2 border-transparent" />;
  }

  const iconSize = height * 0.45;

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileTap={{ scale: 0.96 }}
      className={`relative flex items-center rounded-full border-2 transition-colors overflow-hidden select-none shrink-0 ${className}`}
      style={{
        width,
        height,
        borderColor: isDark ? borderDarkColor : borderLightColor
      }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* TRACK */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ backgroundColor: isDark ? darkColor : lightColor }}
        transition={{ duration: 0.4 }}
      />

      {/* SLIDING KNOB */}
      <motion.div
        layout
        layoutId="switch-knob"
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="absolute rounded-full border-2 z-20 shadow-sm"
        style={{
          width: height - 4,
          height: height - 4,
          right: isDark ? 0 : undefined,
          left: isDark ? undefined : 0,
          backgroundColor: isDark ? knobDarkColor : knobLightColor,
          borderColor: isDark ? borderDarkColor : borderLightColor
        }}
      />

      {/* SUN */}
      <motion.div
        className="relative z-30 flex items-center justify-center flex-1"
        style={{ height }}
        animate={{ rotate: isDark ? 45 : 0 }}
        transition={{ stiffness: 20 }}
      >
        {isDark ? (
          <IoSunnyOutline
            color="#8A8A8F"
            style={{ width: iconSize, height: iconSize }}
            className="transition-colors duration-200"
          />
        ) : (
          <IoSunny
            color="#ea580c"
            style={{ width: iconSize, height: iconSize }}
            className="transition-colors duration-200"
          />
        )}
      </motion.div>

      {/* MOON */}
      <motion.div
        className="relative z-30 flex items-center justify-center flex-1"
        style={{ height }}
        animate={{ rotate: isDark ? 0 : 15 }}
        transition={{ stiffness: 20, damping: 14 }}
      >
        {isDark ? (
          <IoMoon
            color="#fb923c"
            style={{ width: iconSize, height: iconSize }}
            className="transition-colors duration-200"
          />
        ) : (
          <IoMoonOutline
            color="#ABABB4"
            style={{ width: iconSize, height: iconSize }}
            className="transition-colors duration-200"
          />
        )}
      </motion.div>
    </motion.button>
  );
};

export default SwitchMode;
