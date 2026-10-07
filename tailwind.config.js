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
        zinc: {
          750: '#2e2e35',
          850: '#1a1a1f',
        },
        brand: {
          50: '#f5f7fa',
          100: '#e8edf3',
          200: '#d1dce7',
          500: '#5b84b1',
          600: '#4a6f96',
          700: '#3c5878',
        }
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
