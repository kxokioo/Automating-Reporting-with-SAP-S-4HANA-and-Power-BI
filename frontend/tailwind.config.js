/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkspace: {
          bg: '#03001C',
          panel: 'rgba(15, 12, 41, 0.65)',
          panelBorder: 'rgba(255, 255, 255, 0.08)',
          card: '#0c072b',
          glowIndigo: '#3f5efb',
          glowViolet: '#7f00ff',
          glowTeal: '#00f2fe'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', filter: 'brightness(1)' },
          '50%': { opacity: '0.8', filter: 'brightness(1.3)' },
        }
      }
    },
  },
  plugins: [],
}
