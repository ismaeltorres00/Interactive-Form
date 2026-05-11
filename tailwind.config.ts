import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'kb-black':      '#0a0a0a',
        'kb-accent':     '#e8c840',
        'kb-accent-dark':'#c9a800',
        'kb-gray-100':   '#f5f5f5',
        'kb-gray-200':   '#e8e8e8',
        'kb-gray-600':   '#666666',
        'kb-gray-800':   '#222222',
      },
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
