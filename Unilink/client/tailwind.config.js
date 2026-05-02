export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "#FFFFFF",
        black: "#000000",
        ink: {
          950: "#F0F2F5",
          900: "#FFFFFF",
          800: "#E8EDF4",
        },
        crimson: {
          50: "#E8EDF4",
          100: "#DDE5F0",
          200: "#9AABB8",
          300: "#7A8FA0",
          400: "#2E4A7A",
          500: "#2E4A7A",
          600: "#243D6B",
          700: "#1B2B4B",
          800: "#162338",
          900: "#0F192D",
        },
        slate: {
          50: "#F7F7F8",
          100: "#E8EDF4",
          200: "#D0D4DC",
          300: "#6A7A8F",
          400: "#9AABB8",
          500: "#7A8FA0",
          600: "#1B2B4B",
          700: "#162338",
          800: "rgba(15, 25, 45, 0.55)",
          900: "rgba(27, 43, 75, 0.08)",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Space Grotesk", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

