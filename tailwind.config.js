/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — tweak these to match the shop.
        ink: '#0e0e10',       // near-black
        charcoal: '#1a1a1d',
        gold: '#c8a04e',      // accent
        goldsoft: '#d8b86a',
        cream: '#f6f1e7',     // light background
        sand: '#e7ddc9',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Oswald', 'Impact', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1.25rem',
        screens: { '2xl': '1200px' },
      },
    },
  },
  plugins: [],
};
