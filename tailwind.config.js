// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // src 폴더 안의 모든 TSX, JSX 파일을 감시
  ],
  theme: {
    colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
         primary: {
        DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
        foreground: 'var(--primary-foreground)',
         },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
        foreground: 'var(--secondary-foreground)',
  },
},
},
  plugins: [],
}