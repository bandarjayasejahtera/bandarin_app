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
        // 1. Amber Honey (Accents, Buttons, Highlights)
        honey: {
          50: "#fdf7e8",
          100: "#fbefd0",
          200: "#f6dea2",
          300: "#f2ce73",
          400: "#eebe44",
          500: "#e9ad16", // Primary Gold (Dark Mode)
          600: "#bb8b11", // Primary Gold (Light Mode - for contrast)
          700: "#8c680d",
          800: "#5d4509",
          900: "#2f2304",
          950: "#211803",
        },
        // 2. Blue Slate (Secondary/Muted Text)
        "blue-slate": {
          50: "#eff3f6",
          100: "#dfe6ec",
          200: "#becdda",
          300: "#9eb5c7",
          400: "#7d9cb5",
          500: "#5d83a2",
          600: "#4a6982",
          700: "#384f61",
          800: "#253441",
          900: "#131a20",
          950: "#0d1217",
        },
        // 3. Deep Space Blue (Primary Brand, Dark Mode BG, Headings)
        deep: {
          50: "#e5f4ff",
          100: "#cce9ff",
          200: "#99d3ff",
          300: "#66bdff",
          400: "#33a7ff",
          500: "#0091ff", // Brand Blue
          600: "#0074cc",
          700: "#005799",
          800: "#003a66",
          900: "#001d33", // Light Mode Headings (Navies)
          950: "#001424", // Dark Mode Background (Deep Space)
        },
        // 4. Slate Grey (Neutral Backgrounds & Body Text)
        grey: {
          50: "#f0f2f4", // Light Mode Background
          100: "#e2e6e9",
          200: "#c5cdd3",
          300: "#a8b4bd",
          400: "#8b9aa7",
          500: "#6e8191",
          600: "#586774", // Light Mode Secondary Text
          700: "#424e57",
          800: "#2c343a",
          900: "#161a1d", // Light Mode Primary Text
          950: "#0f1214",
        },
      },
    },
  },
  plugins: [],
};

export default config;
