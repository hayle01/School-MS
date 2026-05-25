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
        primary: {
          50: '#E8F0F7',
          100: '#C5D9EB',
          200: '#9EBFDD',
          300: '#77A5CF',
          400: '#5A91C4',
          500: '#1B4F72',
          600: '#174566',
          700: '#133B59',
          800: '#0F2D44',
          900: '#0A1F30',
        },
        secondary: {
          50: '#EAFAF1',
          100: '#D5F5E3',
          200: '#ABEBC6',
          300: '#82E0AA',
          400: '#58D68D',
          500: '#2ECC71',
          600: '#27AE60',
          700: '#1E8449',
          800: '#196F3D',
          900: '#145A32',
        },
        accent: {
          50: '#FEF5E7',
          100: '#FDEBD0',
          200: '#FAD7A0',
          300: '#F8C471',
          400: '#F5B041',
          500: '#F39C12',
          600: '#D68910',
          700: '#B9770E',
          800: '#9C640C',
          900: '#7E5109',
        },
        background: '#F8FAFC',
        'text-primary': '#1E293B',
        'text-secondary': '#64748B',
        error: {
          50: '#FEF2F2',
          500: '#DC2626',
          600: '#B91C1C',
        },
        success: {
          50: '#F0FDF4',
          500: '#16A34A',
          600: '#15803D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Naskh Arabic', 'sans-serif'],
        arabic: ['Noto Naskh Arabic', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05)',
        'sidebar': '4px 0 15px rgba(0, 0, 0, 0.1)',
        'modal': '0 25px 50px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
}
