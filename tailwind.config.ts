import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fbfaf8",
          100: "#f5f2eb",
          200: "#ebe4d5",
          300: "#ddceb3",
          400: "#caaF8a",
          500: "#b38738", // Warm editorial gold
          600: "#996f27",
          700: "#7c551e",
          800: "#64441b",
          900: "#533718",
          ink: "#0c111d", // Deep obsidian
          navy: "#131a29",
          slate: "#344054",
          muted: "#667085",
          border: "#e4e7ec",
          parchment: "#faf9f6",
        },
        reader: {
          paper: "#fcfbf7",
          sepia: "#f4ede2",
          sepiatext: "#433422",
          dark: "#121418",
          darktext: "#e1e4ea",
        }
      },
      fontFamily: {
        serif: ["Newsreader", "Georgia", "Cambria", "Times New Roman", "serif"],
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Courier New", "monospace"],
      },
      boxShadow: {
        'book': '0 10px 25px -5px rgba(12, 17, 29, 0.15), 0 8px 10px -6px rgba(12, 17, 29, 0.1)',
        'book-lg': '0 20px 35px -8px rgba(12, 17, 29, 0.22), 0 10px 15px -5px rgba(12, 17, 29, 0.12)',
        'reader': '0 4px 20px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
};

export default config;
