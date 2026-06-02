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
          bg: '#09090b',
          panel: '#18181b',
          panelBorder: '#27272a',
          card: '#18181b',
          glowIndigo: '#2563eb',
          glowViolet: '#2563eb',
          glowTeal: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
