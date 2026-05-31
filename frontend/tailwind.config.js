/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      colors: {
        calm: {
          bg: "#F4F7F6", // warm off-white page
          surface: "#FFFFFF",
          user: "#DCEBE8", // soft sage (user bubble)
          lisa: "#E6EEF5", // pale blue (Lisa bubble)
          accent: "#5B8C82", // muted teal (buttons)
          "accent-hover": "#4A7269",
          ink: "#2E3A36", // soft charcoal text
          muted: "#7A8783", // secondary text
          border: "#E2E8E5",
        },
        // Dark theme — deep green/black
        calmd: {
          bg: "#0D1410",
          surface: "#16201B",
          user: "#2A3D35", // dark sage
          lisa: "#243038", // dark blue-gray
          accent: "#6FB39E", // brighter teal for contrast on dark
          "accent-hover": "#82C4AF",
          ink: "#E4EBE8", // light text
          muted: "#8A998F", // secondary text
          border: "#2A3530",
        },
      },
      keyframes: {
        typing: {
          "0%, 60%, 100%": { opacity: "0.3", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-3px)" },
        },
      },
      animation: {
        typing: "typing 1.4s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};
