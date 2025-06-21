/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007bff',
          hover: '#0069d9',
          border: '#0062cc'
        },
        dark: '#343a40',
        light: '#f8f9fa',
        secondary: '#6c757d'
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif']
      }
    }
  },
  plugins: []
}