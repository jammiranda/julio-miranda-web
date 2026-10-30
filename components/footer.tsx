import Link from "next/link"
import { Clock, Mail, MapPin, MessageCircle } from "lucide-react"
import Redes from "@/components/redes"
import { WHATSAPP } from "@/lib/marca"

/** Pie en columnas verticales: más aire y fácil de recorrer. */
const COLUMNAS = [
  {
    title: "Qué hacemos",
    links: [
      { href: "/transformacion-digital", label: "Transformación digital" },
      { href: "/asesoria", label: "Asesoría en tecnología e IA" },
      { href: "/webs", label: "Páginas web" },
      { href: "/whatsapp", label: "WhatsApp con IA" },
      { href: "/sistemas", label: "Sistemas a medida" },
      { href: "/redes", label: "Redes y anuncios" },
      { href: "/comunidad", label: "Comunidades" },
    ],
  },
  {
    title: "Explorá",
    links: [
      { href: "/servicios", label: "Servicios" },
      { href: "/productos", label: "Productos" },
      { href: "/demos", label: "Pedí una demo" },
      { href: "/casos-de-exito", label: "Casos de éxito" },
      { href: "https://sistema.devisebit.com/lista-precios", label: "Lista de precios" },
      { href: "https://academia.devisebit.com", label: "Academia" },
      { href: "/novedades", label: "Blog" },
    ],
  },
  {
    title: "La empresa",
    links: [
      { href: "/nosotros", label: "Quiénes somos" },
      { href: "/alianzas-estrategicas", label: "Alianzas" },
      { href: "/trabaja-con-nosotros", label: "Trabajá con nosotros" },
      { href: "https://portal.devisebit.com", label: "Mi cuenta" },
      { href: "/contacto", label: "Contacto" },
    ],
  },
]

const link = "hover:text-white transition-colors"

export default function Footer() {
  return (
    <footer className="bg-[#0B0D12] text-[#C3C8D1] border-t border-white/10 text-[15px]">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 pt-14 pb-8 flex flex-col gap-10">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-4">
            <span className="font-tight font-extrabold text-white text-2xl tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span> SRL</span>
            <span className="text-sm leading-relaxed max-w-[300px]">Software e IA. Desde 2009 · sistemas en producción para salud, gobierno, universidades, gremios y empresas.</span>
            <Redes />
            <Link href="/contacto" className="self-start rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">Contanos tu proyecto</Link>
          </div>
          {COLUMNAS.map((c) => (
            <nav key={c.title} aria-label={c.title} className="flex flex-col gap-3">
              <span className="text-white font-semibold">{c.title}</span>
              <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    {l.href.startsWith("http") ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className={link}>{l.label}</a>
                    ) : (
                      <Link href={l.href} className={link}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_auto_1fr_1fr_auto] lg:gap-x-8 border-t border-white/10 pt-6 text-sm">
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${link}`}><MessageCircle size={16} aria-hidden="true" /> +54 9 11 7346-6490</a>
          <a href="mailto:info@devisebit.com" className={`flex items-center gap-2 ${link}`}><Mail size={16} aria-hidden="true" /> info@devisebit.com</a>
          <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" /> Luna 24, Parque Patricios, CABA</span>
          <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" /> Av. de los Lagos 7008, Nordelta</span>
          <span className="flex items-center gap-2"><Clock size={16} aria-hidden="true" /> Lunes a viernes de 8 a 18 h</span>
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
