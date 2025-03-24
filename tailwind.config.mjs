/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'casino-purple': '#350b2d',
        'casino-purple-light': '#4a1040',
        'casino-purple-dark': '#260820',
        'casino-gold': '#ffc107',
        'casino-gold-light': '#ffdb58',
        'casino-gold-dark': '#d4af37',
      },
      fontFamily: {
        'display': ['Racing Sans One', 'cursive'],
        'accent': ['Exo 2', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
    },
  },
  plugins: [],
} 