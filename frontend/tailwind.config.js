/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36abf7',
          500: '#0c8fe9',
          600: '#0171c7',
          700: '#025aa1',
          800: '#064c85',
          900: '#0b406e',
          950: '#072849',
        },
        navy: {
          800: '#0b132b',
          900: '#070d1e',
          950: '#030712',
        },
        accent: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px rgba(14, 165, 233, 0.15)',
        'glow-md': '0 0 25px rgba(14, 165, 233, 0.25)',
        'glow-success': '0 0 25px rgba(16, 185, 129, 0.25)',
        'glow-danger': '0 0 25px rgba(244, 63, 94, 0.25)',
      }
    },
  },
  plugins: [],
}

