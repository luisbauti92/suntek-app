/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        suntek: {
          primary: '#002D9C',
          secondary: '#009DDF',
        },
      },
    },
  },
  plugins: [],
};
