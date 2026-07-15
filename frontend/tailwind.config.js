/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#3860f0',
          600: '#2d4fd6',
          700: '#243fac',
        },
      },
    },
  },
  plugins: [],
};
