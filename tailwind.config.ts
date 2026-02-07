import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Warna Jenama (Brand Colors) - Diambil dari Login Page
        "deep-space-blue": {
          50: "#f0f4fd",
          100: "#e4ebfb",
          200: "#cfdcf7",
          300: "#aec5f2",
          400: "#86a4ea",
          500: "#6081e0",
          600: "#4462d2",
          700: "#3850be",
          800: "#32429a",
          900: "#2d3a7b",
          950: "#1e244d", // Warna sidebar gelap
        },
        "tuscan-sun": {
          50: "#fffbeb",
          100: "#fff5c6",
          200: "#ffea88",
          300: "#ffdb4a",
          400: "#ffc80f",
          500: "#f9aa00", // Warna highlight/button
          600: "#dd8500",
          700: "#b05a02",
          800: "#8e450a",
          900: "#75390e",
          950: "#431c02",
        },
        "cool-steel": {
          50: "#f4f6f8",
          100: "#e3e8ee",
          200: "#c7d1dc",
          300: "#9fb0c3",
          400: "#768da6",
          500: "#5a708a",
          600: "#465971",
          700: "#39485b",
          800: "#323d4c",
          900: "#2c3440",
          950: "#1d232b",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;