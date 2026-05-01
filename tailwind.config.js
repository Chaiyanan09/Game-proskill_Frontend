/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ─── ย้ายจาก CSS variables เดิม ───
        bg: {
          0: "#0a0e1a",
          1: "#11172a",
          2: "#1a2238",
        },
        text: {
          0: "#e6ebf5",
          1: "#aeb8cc",
          2: "#6c7791",
        },
        border: "#243049",
        primary: {
          DEFAULT: "#5b8def",
          hover: "#7aa3ff",
        },
        accent: "#8be9fd",
        success: "#50fa7b",
        warn: "#f1fa8c",
        danger: "#ff5555",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          '"Noto Sans Thai"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          '"Cascadia Code"',
          '"Source Code Pro"',
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        elevated: "0 8px 24px rgba(0, 0, 0, 0.35)",
        "glow-accent": "0 0 18px rgba(139, 233, 253, 0.5)",
        "glow-primary": "0 0 24px rgba(91, 141, 239, 0.6)",
        "glow-success": "0 0 18px rgba(80, 250, 123, 0.6)",
        "glow-warn": "0 0 18px rgba(241, 250, 140, 0.6)",
      },
      backgroundImage: {
        "arena-pa":
          "radial-gradient(circle at center, #131a2e 0%, #0a0e1a 70%)",
        "arena-al":
          "radial-gradient(circle at center, #0d1224 0%, #06080f 70%)",
        "title-gradient": "linear-gradient(90deg, #5b8def, #8be9fd)",
      },
      keyframes: {
        "cue-in": {
          from: { transform: "scale(0.6)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "marker-in": {
          from: { transform: "translate(-50%, -50%) scale(0)", opacity: "0" },
          to: { transform: "translate(-50%, -50%) scale(1)", opacity: "1" },
        },
      },
      animation: {
        "cue-in": "cue-in 0.15s ease-out",
        "marker-in": "marker-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
