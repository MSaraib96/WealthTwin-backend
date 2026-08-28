import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f7f5",
        ink: "#1f2933",
        muted: "#667085",
        line: "#d9ded8",
        surface: "#ffffff",
        teal: {
          50: "#e8f5f1",
          100: "#cce9e1",
          500: "#24836f",
          600: "#1d6d60",
          700: "#16574f"
        },
        amber: {
          50: "#fff6e5",
          100: "#ffe8b8",
          500: "#b7791f",
          600: "#966018"
        },
        red: {
          50: "#fff0f0",
          100: "#ffdada",
          500: "#c2413a",
          600: "#a8322d"
        },
        blue: {
          50: "#edf5ff",
          100: "#dbeafe",
          500: "#356fbe",
          600: "#285999"
        },
        plum: {
          50: "#f6eff8",
          100: "#ead9ef",
          500: "#7e4b8b",
          600: "#683c72"
        }
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.06), 0 12px 28px rgba(16, 24, 40, 0.05)"
      }
    }
  },
  plugins: []
};

export default config;
