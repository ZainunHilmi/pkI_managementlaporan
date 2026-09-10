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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.18)",
        lift: "0 2px 4px rgba(15,23,42,0.06), 0 20px 44px -16px rgba(15,23,42,0.25)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.55s cubic-bezier(0.21,0.9,0.35,1) both",
        "fade-in": "fade-in 0.4s ease both",
        "pop-in": "pop-in 0.35s cubic-bezier(0.21,0.9,0.35,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
