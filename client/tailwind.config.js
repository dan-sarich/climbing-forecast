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
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8BC34A', // Pale green as primary color
          hover: '#7CB342',
          border: '#689F38'
        },
        accent: {
          DEFAULT: '#8BC34A', // Pale green accent
          light: '#A4D070',
          dark: '#689F38'
        },
        dark: {
          DEFAULT: '#1E1E1E', // Dark background
          lighter: '#2D2D2D', // Slightly lighter dark for cards
          card: '#333333',    // Card background
          border: '#444444'   // Border color
        },
        light: '#f8f9fa',
        secondary: '#9E9E9E'  // Grey for secondary text
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif']
      },
      backgroundColor: {
        dark: '#1E1E1E',
        'dark-card': '#333333',
        'dark-lighter': '#2D2D2D'
      },
      textColor: {
        'dark-primary': '#E0E0E0',
        'dark-secondary': '#9E9E9E'
      }
    }
  },
  plugins: []
}
