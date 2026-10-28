import { Instagram, Linkedin, Youtube, Newspaper } from "lucide-react"
import { REDES } from "@/lib/marca"

const ICONO = { instagram: Instagram, linkedin: Linkedin, youtube: Youtube, blog: Newspaper } as const

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
