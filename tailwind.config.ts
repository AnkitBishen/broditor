import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.{css}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#16161c",
        panel: "#1d1d26",
        "panel-2": "#252632",
        line: "#343648",
        accent: "#f97316",
        info: "#5ca5ff",
        success: "#52d273",
        warn: "#f5b942",
        danger: "#ff6b81"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(6, 7, 13, 0.35)"
      },
      backgroundImage: {
        "dashboard-grid":
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)"
      }
    }
  },
  plugins: [forms]
};

export default config;
