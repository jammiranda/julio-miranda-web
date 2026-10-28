import Link from "next/link"
import { Mail, MapPin, MessageCircle } from "lucide-react"
import Redes from "@/components/redes"
import { WHATSAPP } from "@/lib/marca"

const GRUPOS = [
  {
    title: "Soluciones",
    links: [
      { href: "/webs", label: "Páginas web" },
      { href: "/whatsapp", label: "WhatsApp con IA" },
      { href: "/redes", label: "Redes y anuncios" },
      { href: "/sistemas", label: "Sistemas" },
      { href: "/comunidad", label: "Comunidades" },
      { href: "/transformacion-digital", label: "Transformación digital" },
      { href: "/servicios", label: "Servicios" },
      { href: "/productos", label: "Productos" },
      { href: "/precios", label: "Precios" },
    ],
  },
  {
    title: "DEVISEBIT",
    links: [
      { href: "/nosotros", label: "Quiénes somos" },
      { href: "/casos-de-exito", label: "Casos de éxito" },
      { href: "/novedades", label: "Blog" },
      { href: "/alianzas-estrategicas", label: "Alianzas" },
      { href: "/trabaja-con-nosotros", label: "Trabajá con nosotros" },
      { href: "https://academia.devisebit.com", label: "Academia" },
      { href: "https://portal.devisebit.com", label: "Mi cuenta" },
    ],
  },
]

const link = "hover:text-white transition-colors"

export default function Footer() {
  return (
    <footer className="bg-[#0B0D12] text-[#C3C8D1] border-t border-white/10 text-[15px]">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-10 pb-6 flex flex-col gap-7">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-col gap-1">
            <span className="font-tight font-extrabold text-white text-xl tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span> SRL</span>
            <span className="text-sm">Software e IA. Desde 2009 · sistemas en producción</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Redes />
            <Link href="/contacto" className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">Contanos tu proyecto</Link>
          </div>
        </div>

        <nav aria-label="Pie" className="grid md:grid-cols-2 gap-5 border-y border-white/10 py-6">
          {GRUPOS.map((g) => (
            <div key={g.title} className="flex flex-col gap-2">
              <h3 className="m-0 text-xs font-bold uppercase tracking-[0.14em] text-white">{g.title}</h3>
              <ul className="m-0 p-0 list-none flex flex-wrap gap-x-5 gap-y-1.5">
                {g.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith("http") ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={link}>{l.label}</a>
                    ) : (
                      <Link href={l.href} className={link}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 ${link}`}><MessageCircle size={15} aria-hidden="true" /> +54 9 11 7346-6490</a>
          <a href="mailto:info@devisebit.com" className={`flex items-center gap-1.5 ${link}`}><Mail size={15} aria-hidden="true" /> info@devisebit.com</a>
          <span className="flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" /> Luna 24, Parque Patricios, CABA</span>
          <span className="flex items-center gap-1.5"><MapPin size={15} aria-hidden="true" /> Av. de los Lagos 7008, Nordelta</span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-between text-xs text-[#8A919C]">
          <span>© 2026 DEVISEBIT SRL · Hecho en Argentina</span>
          <Link href="/privacidad" className={link}>Política de privacidad</Link>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
