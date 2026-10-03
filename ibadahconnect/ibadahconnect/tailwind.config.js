/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1B5E20', // Dark Islamic Green
        accent: '#D4AF37',  // Gold
        light: '#F9FAFB',   // Light background (White/Off-white)
        dark: '#111111',    // Text color ke liye use hoga
        card: '#FFFFFF',    // Pure white cards ke liye
      },
      fontFamily: {
        amiri: ['Amiri', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}