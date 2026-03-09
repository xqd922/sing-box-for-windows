/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: "#f5f5f7",
          active: "#e8e8ed",
          hover: "#ececf0",
        },
        accent: {
          DEFAULT: "#007aff",
          hover: "#0066d6",
        },
      },
    },
  },
  plugins: [],
};
