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
        // Modern Linear / Apple Orange Brand Palette
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6b00', // Signature Flow Vibrant Warm Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407'
        },
        slate: {
          950: '#07090e',
          900: '#0f131c',
          850: '#151b28',
          800: '#1e2638',
          700: '#334155'
        }
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif']
      },
      boxShadow: {
        'glow-orange': '0 0 25px -5px rgba(255, 107, 0, 0.25)',
        'glow-orange-lg': '0 0 50px -10px rgba(255, 107, 0, 0.35)',
        'glow-subtle': '0 0 30px -10px rgba(255, 255, 255, 0.08)',
        'glass-inset': 'inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        'glass-strong': '4px 4px 20px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
        'apple-card': '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'linear-modal': '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)'
      },
      backgroundImage: {
        'orange-gradient': 'linear-gradient(135deg, #ff6b00 0%, #ff8800 50%, #e65100 100%)',
        'dark-glass': 'linear-gradient(180deg, rgba(15, 19, 28, 0.85) 0%, rgba(7, 9, 14, 0.95) 100%)'
      }
    }
  },
  plugins: []
};
