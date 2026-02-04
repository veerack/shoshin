/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.{html,js,css,ts,jsx,tsx}", 
    "./node_modules/flowbite/**/*.js",
    "./static/**/*.{html,js,css,ts,jsx,tsx}"
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        'off-white': '#FAF9F6',
        'night-dark': "#36454F",
        'night-dark-alt': "#253037"
      },
      keyframes: {
        slideInFromLeft: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutToLeft: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutToRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        slideInFromLeft: 'slideInFromLeft 0.3s ease-in-out forwards',
        slideOutToLeft: 'slideOutToLeft 0.3s ease-in-out forwards',
        slideInFromRight: 'slideInFromRight 0.3s ease-in-out forwards',
        slideOutToRight: 'slideOutToRight 0.3s ease-in-out forwards',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}