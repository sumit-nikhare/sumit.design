/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./work/**/*.html", "./src/**/*.{html,js}"],
  darkMode: "class",
  theme: {
    fontFamily: {
      'sans': ['Open Sans', 'sans-serif'],
      'heading': ['Merriweather', 'serif'],
    },
  },
  plugins: [],
}
