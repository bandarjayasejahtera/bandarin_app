// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
    // ... config lainnya
    theme: {
    extend: {
      colors: {
        "tuscan-sun": {
          50: "var(--color-tuscan-sun-50)",
          500: "var(--color-tuscan-sun-500)",
          600: "var(--color-tuscan-sun-600)",
        },
        "deep-space-blue": {
          50: "var(--color-deep-space-blue-50)",
          500: "var(--color-deep-space-blue-500)",
          600: "var(--color-deep-space-blue-600)",
          900: "var(--color-deep-space-blue-900)",
          950: "var(--color-deep-space-blue-950)",
        },
        "cool-steel": {
          50: "var(--color-cool-steel-50)",
          500: "var(--color-cool-steel-500)",
          900: "var(--color-cool-steel-900)",
        },
      },
    },
  },
  // ... plugins
};
export default config;