import type { Config } from "tailwindcss"
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: { colors: { verde: { DEFAULT: "#0B7A3B", oscuro: "#0B5E31", claro: "#E3F2E8" }, rojo: "#E03A2F", tinta: "#26323E" } } },
  plugins: [],
} satisfies Config
