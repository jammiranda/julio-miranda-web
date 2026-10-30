"use client"
import { useEffect } from "react"

/**
 * Entrada suave al hacer scroll para los elementos con data-revelar (una sola vez por elemento).
 * Si el navegador pide reducir el movimiento o no hay IntersectionObserver, todo queda visible desde el principio.
 */
export default function Revelar() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const els = Array.from(document.querySelectorAll<HTMLElement>(".acad [data-revelar]"))
    // Lo que ya está en pantalla al cargar no se anima (evita el parpadeo arriba de todo)
    const alto = window.innerHeight
    els.forEach((el) => { if (el.getBoundingClientRect().top < alto) el.classList.add("visto") })
    document.documentElement.classList.add("acad-rev")
    const io = new IntersectionObserver((xs) => xs.forEach((x) => { if (x.isIntersecting) { x.target.classList.add("visto"); io.unobserve(x.target) } }), { rootMargin: "0px 0px -8% 0px" })
    els.forEach((el) => { if (!el.classList.contains("visto")) io.observe(el) })
    return () => { io.disconnect(); document.documentElement.classList.remove("acad-rev") }
  }, [])
  return null
}
