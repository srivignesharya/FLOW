/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // FLOW Official Orange + Black + White Palette Design Tokens
        flow: {
          orange: '#FF8A00',
          bright: '#FF9D24',
          dark: '#101114',
          deep: '#09090B',
          white: '#FFFFFF',
          muted: '#A1A1AA',
          border: '#27272A'
        },
        // Backward-compatible token mapping for existing components
        zenith: {
          bg: '#101114',
          surface: '#18191E',
          elevated: '#212228',
          blue: '#FF8A00',       // Remapped to Primary Orange
          cyan: '#FF9D24',       // Remapped to Bright Orange
          text: '#FFFFFF',
          muted: '#A1A1AA'
        },
        // Brand palette mapped directly to FLOW Official Orange (#FF8A00 & #FF9D24)
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#FF9D24', // Bright Orange
          500: '#FF8A00', // Primary Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#101114'  // Dark Background
        },
        slate: {
          950: '#09090B', // Deep Background
          900: '#101114', // Dark Background
          850: '#141519',
          800: '#18191E',
          700: '#27272A'  // Border Charcoal
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Poppins', 'system-ui', 'sans-serif'],
        poppins: ['"Plus Jakarta Sans"', 'Poppins', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif']
      },
      boxShadow: {
        'glow-orange': '0 0 25px -5px rgba(255, 138, 0, 0.4)',
        'glow-bright': '0 0 25px -5px rgba(255, 157, 36, 0.4)',
        'glow-blue': '0 0 25px -5px rgba(255, 138, 0, 0.35)', // Mapped to orange
        'glow-cyan': '0 0 25px -5px rgba(255, 157, 36, 0.3)', // Mapped to bright orange
        'glow-subtle': '0 0 30px -10px rgba(255, 255, 255, 0.08)',
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        'glass-strong': '4px 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
        'zenith-card': '0 10px 30px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'linear-modal': '0 25px 50px -12px rgba(0, 0, 0, 0.9), inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)'
      },
      backgroundImage: {
        'flow-gradient': 'linear-gradient(135deg, #FF8A00 0%, #FF9D24 50%, #FFB74D 100%)',
        'zenith-gradient': 'linear-gradient(135deg, #FF8A00 0%, #EA580C 50%, #FF9D24 100%)',
        'orange-gradient': 'linear-gradient(135deg, #FF8A00 0%, #FF9D24 100%)',
        'dark-glass': 'linear-gradient(180deg, rgba(16, 17, 20, 0.85) 0%, rgba(9, 9, 11, 0.95) 100%)'
      }
    }
  },
  plugins: []
};
