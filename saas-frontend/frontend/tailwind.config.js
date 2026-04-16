/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        principal: '#EC4899',
        acento: '#D8B4FE',
        secundario: '#4B5563',
      }
    }
  },
  plugins: [],
}

