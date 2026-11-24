import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
          hover: "var(--primary-hover)",
          content: "var(--primary-content)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
          hover: "var(--accent-hover)",
        },
        surface: {
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        subtle: {
          foreground: "var(--text-muted)",
        },
        border: "var(--border)",
        ring: "var(--ring)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Outfit", "sans-serif"],
        display: ["var(--font-display)", "Plus Jakarta Sans", "Outfit", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
        space: ["'Space Grotesk'", "sans-serif"],
        sora: ["Sora", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "var(--radius)",
      },
      boxShadow: {
        "lavender-glow": "var(--shadow-lavender-glow)",
        "orange-glow": "var(--shadow-orange-glow)",
      },
    },
  },
  plugins: [],
};

export default config;

