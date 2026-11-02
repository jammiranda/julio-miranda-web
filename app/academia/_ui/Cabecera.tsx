"use client"
import { useEffect, useState } from "react"

/** Header de la Academia: barra oscura arriba de todo y, al bajar, la píldora flota sola (solo escritorio). */
export default function Cabecera({ children }: { children: React.ReactNode }) {
  const [arriba, setArriba] = useState(true)
  useEffect(() => {
    const f = () => setArriba(window.scrollY < 64)
    f(); window.addEventListener("scroll", f, { passive: true })
    return () => window.removeEventListener("scroll", f)
  }, [])
  return (
    <header className={"ficha-head text-white sticky top-0 z-40 lg:pointer-events-none lg:transition-colors " + (arriba ? "bg-[#0E1116]" : "bg-[#0E1116] lg:bg-transparent")} style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {children}
    </header>
  )
}
