import { BRAND } from './src/theme.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Brand colours as classes, e.g. bg-eeze-purple, text-eeze-dark-blue/70
      colors: { eeze: BRAND },
    },
  },
  plugins: [],
};
