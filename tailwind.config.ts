import type { Config } from "tailwindcss"
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { verde: { DEFAULT: "#C8231F", oscuro: "#9E1A17", claro: "#FDECEB" }, rojo: "#E03A2F", tinta: "#0E1116" } } },
  plugins: [],
} satisfies Config
