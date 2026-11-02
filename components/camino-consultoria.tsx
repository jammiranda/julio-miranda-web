"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

const NIVELES = [
  { n: "1", t: "Inicial", d: "Papel, planillas y chats sueltos. Cada área trabaja a su manera.", h: 28 },
  { n: "2", t: "En orden", d: "Procesos definidos, roles claros y un primer sistema que funciona.", h: 52 },
  { n: "3", t: "Integrado", d: "Los sistemas se hablan entre sí y los datos viven en un solo lugar.", h: 76 },
  { n: "4", t: "Optimizado", d: "Todo automatizado, con tableros e IA ayudando a decidir.", h: 100 },
]
const PASOS = ["Diagnóstico en 4 ejes", "Hoja de ruta con indicadores", "Pilotos en semanas", "Capacitación con certificado", "Gestión de financiamiento"]

/**
 * Consultoría de Transformación Digital contada como un recorrido: al bajar, la escalera se "sube" nivel por nivel
 * mientras el texto de la izquierda queda fijo. En pantallas chicas es un bloque normal, sin fijar nada.
 */
export default function CaminoConsultoria() {
  const ref = useRef<HTMLElement | null>(null)
  const [p, setP] = useState(0)
  const [quieto, setQuieto] = useState(false)

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setQuieto(q)
    let raf = 0
    const calc = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      setP(total > 0 ? Math.max(0, Math.min(1, -r.top / total)) : 1)
    }
    const on = () => { if (!raf) raf = requestAnimationFrame(calc) }
    calc()
    window.addEventListener("scroll", on, { passive: true })
    window.addEventListener("resize", on)
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf) }
  }, [])

  const nivel = quieto ? 3 : Math.min(3, Math.floor(p * 4.2))
  const actual = NIVELES[nivel]

  return (
    <section ref={ref} id="transformacion" className="relative bg-[#FFF4F2] lg:h-[300vh]">
      <div className="lg:sticky lg:top-0 lg:h-screen lg:flex lg:items-center overflow-hidden">
        <div aria-hidden="true" className="absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full bg-[#C8231F]/10 blur-3xl pointer-events-none" />
        <div className="relative w-full max-w-[1240px] mx-auto px-4 md:px-8 py-16 lg:py-0 lg:pt-16 grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center">
          <div className="flex flex-col gap-5">
            <p className="m-0 inline-flex self-start items-center gap-2 rounded-full bg-[#C8231F] px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-white">Consultoría de Transformación Digital</p>
            <h2 className="m-0 font-tight text-[36px] md:text-[54px] leading-[1.05] font-extrabold tracking-[-0.02em] text-[#0B0D12]">Tu organización, <span className="text-[#C8231F]">un nivel más arriba.</span></h2>
            <p className="m-0 text-lg leading-relaxed text-[#3B424D] max-w-[600px]">Medimos en qué nivel de madurez digital está tu organización, armamos la hoja de ruta por etapas y la ponemos en marcha con tu equipo, con capacitación y certificado. Y te ayudamos a conseguir financiamiento para hacerlo.</p>
            <ul className="m-0 p-0 list-none flex flex-wrap gap-2">
              {PASOS.map((x) => <li key={x} className="rounded-full border border-[#C8231F]/25 bg-white px-3.5 py-1.5 text-[14px] font-semibold text-[#7E1512]">{x}</li>)}
            </ul>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/transformacion-digital" className="rounded-xl bg-[#0B0D12] hover:bg-[#1B2029] px-6 py-4 font-bold text-[17px] text-white transition-colors">Conocé la consultoría →</Link>
              <Link href="/kit-digital" className="rounded-xl border-2 border-[#0B0D12] hover:bg-[#0B0D12] hover:text-white px-[22px] py-[14px] font-bold text-[17px] text-[#0B0D12] transition-colors">Kits DEVISEBIT + financiamiento</Link>
            </div>
            <p className="m-0 text-[16px] text-[#3B424D]">¿Preferís un equipo de tecnología por horas o por mes? <Link href="/asesoria" className="font-bold text-[#C8231F] underline underline-offset-4">Asesoría en tecnología e IA →</Link></p>
          </div>

          <div className="rounded-[28px] bg-white border border-[#F0C9C6] shadow-[0_30px_80px_-30px_rgba(200,35,31,.35)] p-6 md:p-8 flex flex-col gap-5">
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.16em] text-[#C8231F]">Escalera de madurez digital</p>
              <p className="m-0 text-xs font-bold text-[#6B7280]">Nivel {actual.n} de 4</p>
            </div>
            <div className="relative h-[230px] flex items-end gap-3" role="img" aria-label={`Escalera de madurez digital, nivel ${actual.n} de 4: ${actual.t}`}>
              {NIVELES.map((x, i) => {
                const lleno = i <= nivel
                return (
                  <div key={x.n} className="relative flex-1 h-full flex items-end">
                    <div className="w-full rounded-t-2xl p-3 flex flex-col justify-between text-white transition-all duration-700 ease-out" style={{ height: lleno ? `${x.h}%` : "14%", background: lleno ? (i === nivel ? "#C8231F" : "#E08A86") : "#F3D9D7", transitionDelay: lleno ? "0ms" : "0ms" }}>
                      <span className="text-xl font-extrabold leading-none">{x.n}</span>
                      <span className="text-[12px] font-bold leading-tight">{x.t}</span>
                    </div>
                    {i === nivel && <span aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 -top-1 w-3.5 h-3.5 rounded-full bg-[#C8231F] ring-4 ring-[#C8231F]/25 transition-all duration-700" style={{ bottom: `calc(${x.h}% + 6px)`, top: "auto" }} />}
                  </div>
                )
              })}
            </div>
            <div key={actual.n} className="rounded-2xl bg-[#F5F6F8] p-4 min-h-[88px] animate-[camino-in_.5s_ease-out]">
              <strong className="block text-[17px] text-[#0B0D12]">{actual.t}</strong>
              <span className="block mt-1 text-[15px] leading-snug text-[#4A515C]">{actual.d}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#F3D9D7] overflow-hidden" aria-hidden="true"><div className="h-full bg-[#C8231F] transition-[width] duration-300" style={{ width: `${(quieto ? 1 : p) * 100}%` }} /></div>
          </div>
        </div>
      </div>
    </section>
  )
}
