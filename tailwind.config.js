/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0F1623',
          50: '#f0f3f9',
          100: '#d8e0ef',
          200: '#b0c0de',
          300: '#7d96c4',
          400: '#4e6ea6',
          500: '#334f85',
          600: '#243969',
          700: '#192a52',
          800: '#111d3a',
          900: '#0F1623',
          950: '#080d14',
        },
        slate: {
          750: '#2a3654',
          850: '#1a2440',
        },
        teal: {
          DEFAULT: '#2DD4BF',
          dark: '#0f9b8a',
        }
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
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
