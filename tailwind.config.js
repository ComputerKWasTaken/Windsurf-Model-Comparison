/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mint palette
        mint: {
          100: '#e0f5ee',
          200: '#c1ebe0',
          300: '#a3e0d1',
          400: '#84d6c3',
          500: '#66ccb4',
          600: '#52a390',
          700: '#3d7a6c',
          800: '#295248',
          900: '#142924',
        },
        // Evergreen palette
        evergreen: {
          100: '#e3f1e9',
          200: '#c7e3d3',
          300: '#abd5bd',
          400: '#8fc7a7',
          500: '#73b991',
          600: '#5c9474',
          700: '#456f57',
          800: '#2e4a3a',
          900: '#17251d',
        },
        // Dark mode specific colors
        'dark-mint': {
          600: '#295248',
          700: '#1e3d36',
          800: '#142924',
          900: '#0a1512',
        },
        'dark-evergreen': {
          600: '#2e4a3a',
          700: '#22382b',
          800: '#17251d',
          900: '#0b120e',
        },
        // Accent colors
        accent: {
          mint: '#66ccb4',
          evergreen: '#5c9474',
          teal: '#4db6ac',
          sage: '#a8c6b4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
