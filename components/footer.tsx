import Link from "next/link"
import { Mail, MapPin, MessageCircle } from "lucide-react"
import Redes from "@/components/redes"

const COLS = [
  {
    title: "Soluciones",
    links: [
      { href: "/servicios", label: "Servicios" },
      { href: "/productos", label: "Productos" },
      { href: "/webs", label: "Páginas web" },
      { href: "/whatsapp", label: "Asistentes de WhatsApp con IA" },
      { href: "/redes", label: "Redes y anuncios" },
      { href: "/sistemas", label: "Sistemas a medida" },
      { href: "/comunidad", label: "Plataforma para comunidades" },
      { href: "/transformacion-digital", label: "Consultoría de Transformación Digital" },
      { href: "/precios", label: "Lista de precios" },
      { href: "https://academia.devisebit.com", label: "Academia DEVISEBIT" },
      { href: "https://portal.devisebit.com", label: "Mi cuenta (clientes y alumnos)" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/nosotros", label: "Quiénes somos" },
      { href: "/casos-de-exito", label: "Casos de éxito" },
      { href: "/novedades", label: "Blog y novedades" },
      { href: "/alianzas-estrategicas", label: "Alianzas estratégicas" },
      { href: "/trabaja-con-nosotros", label: "Trabajá con nosotros" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#0B0D12] text-[#C3C8D1] border-t border-white/10">
      <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-14 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="flex flex-col gap-4">
          <span className="font-tight font-extrabold text-white text-xl tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span> SRL</span>
          <p className="leading-relaxed max-w-xs">Software e inteligencia artificial para salud, gobierno, universidades, gremios y empresas. Desde 2009.</p>
          <Redes />
          <p className="m-0 text-sm">Seguinos en Instagram, LinkedIn y YouTube, y leé las novedades en el blog.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title} className="flex flex-col gap-3">
            <h3 className="text-white font-semibold">{c.title}</h3>
            {c.links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="hover:text-white transition-colors">{l.label}</Link>
            ))}
          </div>
        ))}
        <div className="flex flex-col gap-3">
          <h3 className="text-white font-semibold">Contacto</h3>
          <a href="https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20hacer%20una%20consulta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors"><MessageCircle size={16} aria-hidden="true" /> WhatsApp +54 9 11 7346-6490</a>
          <a href="mailto:info@devisebit.com" className="flex items-center gap-2 hover:text-white transition-colors"><Mail size={16} aria-hidden="true" /> info@devisebit.com</a>
          <span className="flex items-start gap-2"><MapPin size={16} className="mt-1 shrink-0" aria-hidden="true" /> Luna 24, 6.º piso, Parque Patricios, CABA</span>
          <span className="flex items-start gap-2"><MapPin size={16} className="mt-1 shrink-0" aria-hidden="true" /> Av. de los Lagos 7008, Nordelta, Tigre</span>
          <Link href="/contacto" className="mt-2 self-start rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] px-5 py-3 font-bold text-white transition-colors">Contanos tu proyecto</Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-[1240px] mx-auto px-4 md:px-8 py-6 text-sm flex flex-wrap gap-3 justify-between">
          <span>© 2026 DEVISEBIT SRL. Todos los derechos reservados.</span>
          <span className="flex gap-4"><Link href="/privacidad" className="hover:text-white transition-colors">Política de privacidad</Link><span>Hecho en Argentina</span></span>
        </div>
      </div>
    </footer>
  )
}

export { Footer }
