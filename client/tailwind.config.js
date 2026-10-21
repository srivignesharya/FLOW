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
        // ZENITH v1.1 Astronomy Design System Tokens
        zenith: {
          bg: '#0B1020',
          surface: '#111827',
          elevated: '#1E293B',
          blue: '#2563FF',
          cyan: '#00D4FF',
          text: '#F8FAFC',
          muted: '#94A3B8'
        },
        // Brand palette mapped to primary blue & accent cyan
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#00D4FF', // Zenith Accent Cyan
          500: '#2563FF', // Zenith Primary Blue
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          950: '#0B1020'  // Zenith Background Deep Navy
        },
        slate: {
          950: '#0B1020', // Align darkest slate with Zenith Background
          900: '#111827', // Align with Zenith Surface
          850: '#161F36',
          800: '#1E293B',
          700: '#334155'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Poppins', 'system-ui', 'sans-serif'],
        poppins: ['"Plus Jakarta Sans"', 'Poppins', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif']
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(37, 99, 255, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(0, 212, 255, 0.3)',
        'glow-orange': '0 0 25px -5px rgba(37, 99, 255, 0.25)', // Backward compatibility
        'glow-subtle': '0 0 30px -10px rgba(255, 255, 255, 0.08)',
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        'glass-strong': '4px 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
        'zenith-card': '0 10px 30px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'linear-modal': '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)'
      },
      backgroundImage: {
        'zenith-gradient': 'linear-gradient(135deg, #2563FF 0%, #1D4ED8 50%, #00D4FF 100%)',
        'orange-gradient': 'linear-gradient(135deg, #2563FF 0%, #1D4ED8 50%, #00D4FF 100%)', // Backward compatibility
        'dark-glass': 'linear-gradient(180deg, rgba(17, 24, 39, 0.85) 0%, rgba(11, 16, 32, 0.95) 100%)'
      }
    }
  },
  plugins: []
};
