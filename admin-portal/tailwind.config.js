/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff2ff',
          100: '#dfe5ff',
          200: '#bdcaff',
          300: '#8ca1ff',
          400: '#546eff',
          500: '#2e51f5',
          600: '#1e38e6',
          700: '#1829b5',
          800: '#1a2592',
          900: '#1b2476',
          950: '#101446',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        }
      }
    },
  },
  plugins: [],
}
