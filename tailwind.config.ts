import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    "bg-sector-federal",
    "bg-sector-preservation",
    "bg-sector-platform",
    "bg-sector-academia",
    "bg-nyce-accentSoft",
    "bg-nyce-yellowSoft",
    "bg-nyce-aquaSoft",
    "text-nyce-accent",
    "text-nyce-slate",
    "text-[#7C5F00]",
    "text-[#2A5E68]",
    "bg-[#E3E7EB]",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // NYCE brand palette — sourced from nyclimateexchange.org design tokens
        nyce: {
          // core
          ink: "#0A1117",           // deep ink — darker than slate for text
          slate: "#283B4A",         // --darkAccent
          accent: "#15506C",        // --accent (primary brand blue-teal)
          aqua: "#67AAB5",          // --white (their "white" token — light aqua)
          yellow: "#FFCA00",        // --lightAccent
          // surfaces
          paper: "#F7F8F9",         // off-white background
          surface: "#FFFFFF",       // card
          line: "#E2E6EA",          // border
          muted: "#5B6A74",         // secondary text
          // deeper tints
          accentDark: "#0E3A52",
          accentSoft: "#D9E7ED",
          aquaSoft: "#E1EEF1",
          yellowSoft: "#FFF3B8",
        },
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at 1px 1px, rgba(10,17,23,0.05) 1px, transparent 0)",
        "sector-federal": "linear-gradient(135deg, #0E3A52 0%, #15506C 100%)",
        "sector-preservation": "linear-gradient(135deg, #E0A500 0%, #FFCA00 100%)",
        "sector-platform": "linear-gradient(135deg, #3E8896 0%, #67AAB5 100%)",
        "sector-academia": "linear-gradient(135deg, #1E2E3A 0%, #283B4A 100%)",
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
