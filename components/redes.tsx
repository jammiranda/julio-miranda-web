import { Instagram, Linkedin, Youtube, Newspaper, Facebook } from "lucide-react"

/** TikTok no está en lucide: ícono propio, mismo tamaño y trazo que los demás. */
function TikTok({ size = 18 }: { size?: number; "aria-hidden"?: boolean | "true" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.6 3c.3 2.1 1.6 3.6 3.9 3.8v3.1c-1.4.1-2.7-.3-3.9-1v6.2c0 3.9-3.4 6.4-6.9 5.7-2.6-.5-4.4-2.8-4.2-5.5.2-3.2 3.1-5.4 6.3-4.9v3.2c-.4-.1-.8-.2-1.2-.2-1.3.1-2.2 1.1-2.1 2.3.1 1.2 1.1 2.1 2.4 2 1.2-.1 2.1-1 2.1-2.3V3h3.6z" />
    </svg>
  )
}
import { REDES } from "@/lib/marca"

const ICONO = { instagram: Instagram, facebook: Facebook, tiktok: TikTok, linkedin: Linkedin, youtube: Youtube, blog: Newspaper } as const

/** Íconos de las redes oficiales. `oscuro` para fondos negros (pie), claro para fondos blancos. */
export default function Redes({ oscuro = true, conTexto = false }: { oscuro?: boolean; conTexto?: boolean }) {
  return (
    <ul className="m-0 p-0 list-none flex flex-wrap gap-2.5" aria-label="Redes de DEVISEBIT">
      {REDES.map((r) => {
        const I = ICONO[r.id]
        const interno = r.id === "blog"
        return (
          <li key={r.id}>
            <a
              href={interno ? "/novedades" : r.href}
              {...(interno ? {} : { target: "_blank", rel: "noopener noreferrer" })}
              aria-label={`${r.nombre} de DEVISEBIT${interno ? "" : " (se abre en otra pestaña)"}`}
              title={`${r.nombre} · ${r.usuario}`}
              className={`${conTexto ? "px-3.5 gap-2" : "w-11 justify-center"} h-11 rounded-xl border flex items-center transition-colors ${oscuro ? "border-white/15 text-[#C3C8D1] hover:border-[#FF6A63] hover:text-white" : "border-[#C3C8D1] text-[#262C37] hover:border-[#C8231F] hover:text-[#C8231F] bg-white"}`}
            >
              <I size={18} aria-hidden="true" />
              {conTexto && <span className="text-sm font-semibold">{r.nombre}</span>}
            </a>
          </li>
        )
      })}
    </ul>
  )
}
