/** @type {import('tailwindcss').Config} */
import { fontFamily } from 'tailwindcss/defaultTheme'

export default {
 content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0A2A66', // Azul Rey
          gold: '#C7A008', // Dorado
          tan: '#D2B48C',  // Extra opcional
        },
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans],
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(10,42,102,0.08)'
      },
    },
  },
  plugins: [],
}
