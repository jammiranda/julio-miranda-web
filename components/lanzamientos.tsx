/**
 * Lo que DEVISEBIT lanzó en los últimos meses: productos propios, en producción.
 * Se usa en el inicio (versión compacta) y en Casos de éxito.
 * Para sumar un lanzamiento, agregá un objeto a LANZAMIENTOS (el más nuevo primero).
 */
export const LANZAMIENTOS = [
  { tag: "Familia Mate · gratis", title: "MateBot", text: "Asistente personal por audio: turnos, recordatorios y listas. En Telegram y WhatsApp.", href: "https://matebot.devisebit.com", cta: "Probalo gratis" },
  { tag: "Familia Mate · gratis", title: "MateCuentas", text: "Los gastos de la casa, la familia o la pareja: se cargan por audio, foto del ticket o MateBot, con cuotas, dólares y presupuesto.", href: "https://matecuentas.devisebit.com", cta: "Usarla gratis" },
  { tag: "Producto 100% automático", title: "Web por Suscripción", text: "11 modelos por rubro, cobro con Mercado Pago y la web publicada en 48 horas, sin intervención manual.", href: "https://tuweb.devisebit.com/?utm_source=devisebit&utm_medium=web&utm_campaign=lanzamientos", cta: "Ver los modelos" },
  { tag: "Sistema propio", title: "Sistema de gestión DEVISEBIT", text: "CRM, conversaciones de WhatsApp e Instagram con asistente de IA, agenda, finanzas, documentos y email marketing.", href: "/contacto?tema=Demo%3A%20Sistema%20de%20gesti%C3%B3n#formulario", cta: "Pedir una demo" },
  { tag: "Plataforma", title: "Portal de clientes", text: "Cada cliente ve su proyecto, sus horas de asesoría, pagos y documentos, con ingreso por link mágico.", href: "/asesoria", cta: "Cómo funciona" },
  { tag: "Educación", title: "ACADEMIA DEVISEBIT", text: "Cursos con certificado verificable, guías gratis y autodiagnóstico de madurez digital en 3 niveles.", href: "https://academia.devisebit.com", cta: "Entrar" },
] as const

export default function Lanzamientos({ oscuro = false, max }: { oscuro?: boolean; max?: number }) {
  const items = max ? LANZAMIENTOS.slice(0, max) : LANZAMIENTOS
  return (
    <ul className="m-0 p-0 list-none grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((l) => {
        const ext = l.href.startsWith("http")
        return (
          <li key={l.title}>
            <a
              href={l.href}
              {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`db-card group h-full rounded-2xl border p-6 flex flex-col gap-2 transition-colors ${oscuro ? "border-[#262C37] bg-[#161A22] text-white hover:border-[#FF6A63]" : "border-[#E2E5EA] bg-white text-[#0E1116] hover:border-[#C8231F]"}`}
            >
              <span className={`text-xs font-bold uppercase tracking-widest ${oscuro ? "text-[#FF6A63]" : "text-[#C8231F]"}`}>{l.tag}</span>
              <strong className="font-tight text-xl">{l.title}</strong>
              <span className={`text-[15px] leading-relaxed ${oscuro ? "text-[#C3C8D1]" : "text-[#4A515C]"}`}>{l.text}</span>
              <span className={`mt-auto pt-2 font-bold ${oscuro ? "text-[#FF6A63]" : "text-[#C8231F]"}`}>{l.cta} →</span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
