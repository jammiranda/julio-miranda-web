import Link from "next/link"
import type { Metadata } from "next"
import { EQUIPO } from "@/lib/equipo"
import Foto from "./_ui/Foto"

export const metadata: Metadata = { title: "Equipo académico", description: "Quiénes enseñan en la ACADEMIA DEVISEBIT: la dirección académica y los especialistas invitados." }

const GRUPO = { academica: "Dirección académica", direccion: "Dirección", especialista: "Especialista" } as const
const ORDEN = { academica: 0, direccion: 1, especialista: 2 } as const

/** Equipo de la ACADEMIA DEVISEBIT: una tarjeta por persona, con su perfil completo al entrar. */
export default function EquipoAcademico() {
  return (
    <main>
      <header className="ficha-head bg-[#0E1116] text-white"><div className="max-w-6xl mx-auto px-4 py-12 sm:py-14">
        <span className="chip bg-[#C8231F] text-white">Equipo académico</span>
        <h1 className="m-0 mt-4 text-3xl sm:text-5xl font-extrabold text-white leading-tight">Quiénes enseñan en la Academia</h1>
        <p className="m-0 mt-4 text-base sm:text-lg text-white/80 max-w-2xl">Una dirección académica con experiencia en educación y transformación digital, la dirección de DEVISEBIT y especialistas que suman su mirada en cursos, talleres y sesiones. Tocá cada tarjeta para ver el perfil completo.</p>
      </div></header>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 ">
        <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Equipo">
          {[...EQUIPO].sort((x, y) => ORDEN[x.grupo] - ORDEN[y.grupo]).map((p) => (
            <li key={p.slug}>
              <Link href={`/equipo/${p.slug}`} className="group card !p-0 overflow-hidden h-full flex flex-col no-underline text-[#0E1116] hover:border-[#C8231F] hover:shadow-[0_10px_30px_rgba(14,17,22,.10)] transition-shadow">
                <div className="px-5 pt-5 flex items-center gap-4">
                  <Foto p={p} className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-full ring-4 ring-[#F5F6F8] group-hover:ring-[#FDECEB] transition-shadow" />
                  <span className={`chip !text-xs ${p.grupo !== "especialista" ? "bg-[#C8231F] text-white" : "bg-[#F5F6F8] text-[#0E1116]"}`}>{p.invitado ? "Especialista invitado" : GRUPO[p.grupo]}</span>
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#C8231F]">{p.rol}</span>
                  <strong className="text-xl leading-snug">{p.nombre}</strong>
                  <span className="text-[15px] leading-snug text-[#4A515C]">{p.resumen}</span>
                  <ul className="m-0 mt-1 p-0 list-none flex flex-wrap gap-1.5">
                    {p.areas.slice(0, 3).map((a) => <li key={a} className="rounded-full bg-[#F5F6F8] px-2.5 py-1 text-xs font-semibold text-[#262C37]">{a}</li>)}
                  </ul>
                  <span className="mt-auto pt-2 text-sm font-bold text-[#C8231F] group-hover:underline">Ver perfil completo →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
