/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        wine: {
          DEFAULT: "#7f1d1d",
          dark: "#5c1515",
        },
        cream: {
          DEFAULT: "#fef3c7",
          soft: "#faf6e8",
          deep: "#f5e6c8",
        },
        olive: {
          DEFAULT: "#365314",
          light: "#4d7c0f",
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "Georgia", "serif"],
        sans: ['"Lora"', "Georgia", "serif"],
      },
      boxShadow: {
        menu:
          "0 2px 0 rgba(127, 29, 29, 0.12), 0 12px 28px rgba(60, 30, 20, 0.14)",
        tag: "inset 0 1px 0 rgba(255,255,255,0.6), 0 2px 6px rgba(54, 83, 20, 0.12)",
        lift: "0 4px 14px rgba(60, 30, 20, 0.1)",
      },
      borderRadius: {
        menu: "3px",
      },
    },
  },
  plugins: [],
};
