/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(139, 92, 246, 0.5), 0 0 25px rgba(139, 92, 246, 0.3)', // Neon purple glow
      },
    },
  },
  plugins: [],
};
