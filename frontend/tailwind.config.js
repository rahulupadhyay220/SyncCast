/** @type {import('tailwindcss').Config} */
export default {
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#dc2626',
          500: '#b30000',
          600: '#990000', // Pure Blood Red
          700: '#880808', // Deep Blood Red
          800: '#730000', // Rich Blood Red
          900: '#5a0000', // Intense Blood Red
          950: '#380000',
        },
        blood: {
          light: '#b31b1b',
          DEFAULT: '#880808',
          deep: '#660000',
          dark: '#4d0000',
        },
      },
      boxShadow: {
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 20px 35px -10px rgba(0, 0, 0, 0.08), 0 8px 12px -6px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 28px -4px rgba(136, 8, 8, 0.45)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        floatUp: {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(-120px) scale(1.4)' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        floatUp: 'floatUp 2.5s ease-out forwards',
        pulseSlow: 'pulseSlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
