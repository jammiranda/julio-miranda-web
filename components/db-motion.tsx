"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/* Animaciones globales: aparición al hacer scroll, contadores y brillo que sigue al mouse en las tarjetas */
export default function DbMotion() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === "undefined") return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let io: IntersectionObserver | null = null
    let cio: IntersectionObserver | null = null

    const t = window.setTimeout(() => {
      const root = document.querySelector("main") || document.body
      const targets = Array.from(
        root.querySelectorAll<HTMLElement>("section h2, section h3, .db-card, [data-reveal], section img, section li, section p"),
      ).filter((el) => !el.closest("header") && !el.closest(".db-rise") && !el.classList.contains("db-anim"))

      if (!reduce) {
        io = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                const el = e.target as HTMLElement
                el.classList.add("db-in")
                io?.unobserve(el)
                window.setTimeout(() => { el.classList.remove("db-anim", "db-in"); el.style.transitionDelay = "" }, 1400)
              }
            })
          },
          { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
        )
        targets.forEach((el) => {
          const sibs = el.parentElement ? Array.from(el.parentElement.children) : []
          const i = Math.max(0, sibs.indexOf(el))
          el.style.transitionDelay = `${Math.min(i, 7) * 70}ms`
          el.classList.add("db-anim")
          io!.observe(el)
        })
      }

      const counters = Array.from(root.querySelectorAll<HTMLElement>("[data-count]"))
      cio = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          cio?.unobserve(el)
          const n = Number(el.dataset.count || 0)
          const pre = el.dataset.prefix || ""
          const suf = el.dataset.suffix || ""
          if (reduce || !n) return
          const t0 = performance.now()
          const tick = (now: number) => {
            const p = Math.min(1, (now - t0) / 1600)
            el.textContent = pre + Math.round(n * (1 - Math.pow(1 - p, 3))) + suf
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
      }, { threshold: 0.4 })
      counters.forEach((c) => cio!.observe(c))
    }, 60)

    const onMove = (e: MouseEvent) => {
      const card = (e.target as HTMLElement | null)?.closest?.(".db-card") as HTMLElement | null
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty("--mx", `${e.clientX - r.left}px`)
      card.style.setProperty("--my", `${e.clientY - r.top}px`)
    }
    document.addEventListener("mousemove", onMove, { passive: true })

    return () => {
      window.clearTimeout(t)
      io?.disconnect()
      cio?.disconnect()
      document.removeEventListener("mousemove", onMove)
    }
  }, [pathname])

  return null
}
