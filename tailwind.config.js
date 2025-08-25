module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      backgroundImage: {
        "back-stars": "url('src/assets/back-stars.png')",
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
