import type { Config } from "tailwindcss";

/**
 * Tether design system.
 * Colors and tokens lifted from the original HTML stylesheets so the
 * new React pages render identically to the legacy design.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          100: "#1A2F50",
          200: "#2A4A7A",
        },
        teal: {
          DEFAULT: "#00C9A7",
          dim: "#00A388",
          bg: "rgba(0,201,167,0.08)",
          bd: "rgba(0,201,167,0.2)",
        },
        warm: "#F5F2EC",
        muted: "#9AA5B4",
        border: "#1E3A5F",
        amber: "#E8A020",
        danger: "#E24B4A",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      letterSpacing: {
        "tether-tight": "-1px",
        "tether-tighter": "-2px",
      },
      borderRadius: {
        pill: "99px",
      },
      backdropBlur: {
        nav: "8px",
      },
      maxWidth: {
        prose: "720px",
      },
    },
  },
  plugins: [],
};

export default config;
