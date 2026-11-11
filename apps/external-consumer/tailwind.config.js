/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#070910",
        panel: "#101522",
        "vx-cyan": "#39f3ff",
        "vx-magenta": "#ff2bd6",
      },
      fontFamily: {
        sans: ["Outfit", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};
