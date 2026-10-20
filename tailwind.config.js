export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Casiopony red, matching the PWA theme colour (#DA0000)
        brand: {
          300: '#ff7a7a',
          400: '#ff4d4d',
          500: '#f01f1f',
          600: '#da0000',
          700: '#b30000',
          800: '#8a0000',
          900: '#5c0000',
        },
        dark: {
          900: '#0f0f0f',
          800: '#1a1a1a',
          700: '#2a2a2a',
          600: '#3a3a3a',
        }
      }
    },
  },
  plugins: [],
}
