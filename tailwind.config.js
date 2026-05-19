/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ors: {
          black: "#0A0A0F",
          ink: "#11121A",
          coal: "#1A1B26",
          red: "#E4002B",
          redDark: "#9F0021",
          redGlow: "#FF1F4B",
          gold: "#FFD24A",
          goldDeep: "#C9961B",
          cream: "#FFF6E0",
          pitch: "#0F1A12",
          line: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "stadium-grid":
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 80px)",
        "pitch-stripes":
          "repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 30px, rgba(255,255,255,0.05) 30px, rgba(255,255,255,0.05) 60px)",
        "gold-shine":
          "linear-gradient(135deg, #FFD24A 0%, #FFEFA8 35%, #C9961B 70%, #FFD24A 100%)",
        "red-shine":
          "linear-gradient(135deg, #E4002B 0%, #FF1F4B 50%, #9F0021 100%)",
      },
      boxShadow: {
        glow: "0 0 40px rgba(228, 0, 43, 0.45)",
        "glow-gold": "0 0 50px rgba(255, 210, 74, 0.35)",
        glass:
          "inset 0 1px 0 0 rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.5)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 12s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 9s ease-in-out infinite",
        confetti: "confetti 8s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        "score-pop": "scorePop 0.4s ease-out",
        "stadium-flicker": "stadiumFlicker 4s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-12px) rotate(2deg)" },
        },
        confetti: {
          "0%": { transform: "translateY(-10vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(720deg)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        scorePop: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        stadiumFlicker: {
          "0%, 100%": { opacity: "0.85" },
          "50%": { opacity: "1" },
          "55%": { opacity: "0.7" },
          "60%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
