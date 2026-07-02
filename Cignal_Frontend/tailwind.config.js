/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cignalRed: "#D30000",
      },

      boxShadow: {
        cignal: "0 4px 14px rgba(211,0,0,0.25)",
      },

      animation: {
        fadeIn: "fadeIn 0.35s ease-out",
        fadeInSlow: "fadeIn 0.65s ease-out",
        slideUp: "slideUp 0.35s ease-out",
        slideDown: "slideDown 0.35s ease-out",
        slideLeft: "slideLeft 0.25s ease-out",
        slideRight: "slideRight 0.25s ease-out",
        bubblePop: "bubblePop 0.25s ease-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },

        slideUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },

        slideDown: {
          "0%": { opacity: 0, transform: "translateY(-10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },

        slideLeft: {
          "0%": { opacity: 0, transform: "translateX(12px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },

        slideRight: {
          "0%": { opacity: 0, transform: "translateX(-12px)" },
          "100%": { opacity: 1, transform: "translateX(0)" },
        },

        bubblePop: {
          "0%": { transform: "scale(0.85)", opacity: 0 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
      },

      screens: {
        xs: "420px",
      },
    },
  },
  plugins: [],
};
