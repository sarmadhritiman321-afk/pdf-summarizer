/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a1814',
          50: '#effaf5',
          100: '#d3eee3',
          200: '#a9d6c3',
          300: '#7fbda6',
          400: '#5f9d86',
          500: '#3f7a66',
          600: '#2c5a4a',
          700: '#1f4034',
          800: '#142d25',
          900: '#0c1c17',
          950: '#06110d',
        },
        slate: {
          600: '#2f5a49',
          750: '#1d3a2f',
          850: '#0f261f',
        },
        // "teal" keeps its name so existing classes still work; values are now sea green
        teal: {
          DEFAULT: '#3dbe8b',
          dark: '#2e8b57',
        },
        sea: {
          DEFAULT: '#2e8b57',
          glow: '#5ff0b0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      lineHeight: {
        'reading': '1.75',
      },
      maxWidth: {
        'reading': '68ch',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        scan: 'scan 1.8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(250%)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
