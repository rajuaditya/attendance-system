/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Manrope"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4f46e5',
          600: '#4338ca',
          700: '#3730a3',
          800: '#312e81',
          900: '#251f5c',
        },
        status: {
          present: '#0d9488',
          late: '#d97706',
          halfday: '#7c3aed',
          absent: '#dc2626',
          leave: '#2563eb',
          holiday: '#64748b',
        },
        surface: {
          light: '#f8f9fc',
          dark: '#0f1220',
          cardDark: '#171b2e',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 18, 32, 0.06), 0 1px 3px 0 rgba(15, 18, 32, 0.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
