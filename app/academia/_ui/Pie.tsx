import Link from "next/link"
import Redes from "@/components/Redes"
import { YT_URL } from "@/lib/youtube"

/**
 * Pie de ACADEMIA DEVISEBIT: misma línea que el de www.devisebit.com (marca + lema + redes + botón,
 * columnas verticales, franja de contacto con las dos oficinas y renglón legal), con los links de la Academia.
 */
const WA = "https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20vengo%20de%20la%20Academia"

type L = { href: string; label: string }
const COLUMNAS: { title: string; links: L[] }[] = [
  {
    title: "Aprender",
    links: [
      { href: "/cursos", label: "Cursos con certificado" },
      { href: "/guias", label: "Guías gratis" },
      { href: "/videos", label: "Videos" },
      { href: "https://www.devisebit.com/diagnostico", label: "Autodiagnóstico digital" },
      { href: "/#suscribirme", label: "Newsletter" },
    ],
  },
  {
    title: "Programas",
    links: [
      { href: "/programas", label: "Programas ejecutivos" },
      { href: "/programas#ia-conversacional", label: "IA conversacional" },
      { href: "/programas#transformacion-digital-ia", label: "Transformación digital e IA" },
      { href: "/programas#salud-digital", label: "Salud digital" },
    ],
  },
  {
    title: "La Academia",
    links: [
      { href: "/descargas", label: "Descargas" },
      { href: "/mi-cuenta", label: "Mi cuenta" },
      { href: "/equipo", label: "Equipo" },
      { href: YT_URL, label: "Canal de YouTube" },
      { href: "https://www.devisebit.com", label: "devisebit.com" },
    ],
  },
]

const link = "hover:text-white transition-colors"
const Icono = ({ d }: { d: string }) => <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d={d} /></svg>
const IC = {
  wa: "M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.5 8.5 0 1 1 21 11.5z",
  mail: "M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm17 2-9 7-9-7",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-13v4l3 2",
}

export default function Pie() {
  const externo = (h: string) => h.startsWith("http")
  return (
    <footer className="ficha-head acad-pie bg-[#0B0D12] text-[#C3C8D1] border-t border-white/10 text-[15px]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="max-w-6xl mx-auto px-4 pt-14 pb-8 flex flex-col gap-10">
        <div className="grid gap-10 grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <span className="font-extrabold text-white text-2xl tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span> <span className="text-base font-semibold tracking-[0.18em] text-white/70">ACADEMIA</span></span>
            <span className="text-sm leading-relaxed max-w-[320px]">Software e IA. Desde 2009 · IA y tecnología aplicada, explicada simple, por quienes la ponen en producción en salud, gobierno, universidades, gremios y empresas.</span>
            <Redes oscuro />
            <Link href="/cursos" className="self-start inline-flex items-center rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 min-h-[48px] font-bold text-white transition-colors no-underline">Empezá un curso</Link>
          </div>
          {COLUMNAS.map((c) => (
            <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3">
              <span className="text-white font-semibold">{c.title}</span>
              <ul className="m-0 p-0 list-none flex flex-col gap-0.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    {externo(l.href)
                      ? <a href={l.href} target="_blank" rel="noopener noreferrer" className={`pie-link ${link}`}>{l.label}</a>
                      : <Link href={l.href} className={`pie-link ${link}`}>{l.label}</Link>}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-between border-t border-white/10 pt-6 text-sm">
          <a href={WA} target="_blank" rel="noopener noreferrer" className={`pie-link gap-2 ${link}`}><Icono d={IC.wa} /> +54 9 11 7346-6490</a>
          <a href="mailto:info@devisebit.com" className={`pie-link gap-2 ${link}`}><Icono d={IC.mail} /> info@devisebit.com</a>
          <span className="pie-link gap-2"><Icono d={IC.pin} /> Luna 24, Parque Patricios, CABA</span>
          <span className="pie-link gap-2"><Icono d={IC.pin} /> Av. de los Lagos 7008, Nordelta</span>
          <span className="pie-link gap-2"><Icono d={IC.reloj} /> Lunes a viernes de 8 a 18 h</span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between text-xs text-[#9AA1AC]">
          <span>© {new Date().getFullYear()} DEVISEBIT SRL · Hecho en Argentina</span>
          <a href="https://www.devisebit.com/privacidad" className={`pie-link ${link}`}>Política de privacidad</a>
        </div>
      </div>
    </footer>
  )
}
