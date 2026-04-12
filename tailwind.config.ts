import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dv: {
          navy: '#0c2340',
          'navy-deep': '#071526',
          sky: '#e6f2fb',
          'sky-deep': '#d4e8f7',
          red: '#c44545',
          'red-hover': '#a83838',
        },
      },
    },
  },
  plugins: [],
}
export default config

