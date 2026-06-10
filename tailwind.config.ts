import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec5ff',
          400: '#5aa3ff',
          500: '#3380ff',
          600: '#1e60f0',
          700: '#194bcd',
          800: '#1a3fa3',
          900: '#1c3a82',
          950: '#142457'
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;
