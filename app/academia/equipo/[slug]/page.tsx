import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { EQUIPO, perfil, fotoDe } from "@/lib/equipo"
import Foto from "../_ui/Foto"

export const generateStaticParams = () => EQUIPO.map((p) => ({ slug: p.slug }))

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = perfil(params.slug)
  if (!p) return {}
  // Quien pidió su foto solo en las páginas de equipo (Julio) no la lleva en los metadatos: al compartir el link sale la imagen de la Academia.
  return { title: `${p.nombre} · ${p.rol}`, description: p.resumen, openGraph: p.fotoSoloEnEquipo ? undefined : { images: [{ url: fotoDe(p.slug) }] } }
}

const fecha = (d: string) => new Date(d + "T12:00:00").toLocaleDateString("es-AR", { month: "long", year: "numeric" })

export default function PerfilEquipo({ params }: { params: { slug: string } }) {
  const p = perfil(params.slug)
  if (!p) notFound()
  return (
    <main>
      <header className="ficha-head bg-[#0E1116] text-white"><div className="max-w-5xl mx-auto px-4 pt-6 pb-10 sm:pt-8 sm:pb-12">
        <Link href="/equipo" className="inline-flex items-center min-h-[44px] text-sm text-white/70 hover:text-white no-underline">← Equipo académico</Link>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-[136px_1fr] md:grid-cols-[152px_1fr] gap-6 items-center">
          <Foto p={p} className="w-[112px] h-[112px] sm:w-[136px] sm:h-[136px] md:w-[152px] md:h-[152px] rounded-full border border-white/15" />
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#FF6A63]">{p.rol}</span>
            <h1 className="m-0 text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight">{p.nombre}</h1>
            <p className="m-0 text-base sm:text-lg text-white/80">{p.titular}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="btn bg-white/10 text-white hover:bg-white/20 min-h-[44px] no-underline">{l.t} ↗</a>)}
            </div>
          </div>
        </div>
      </div></header>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 flex flex-col gap-8">
        <section aria-label="Perfil" className="card flex flex-col gap-3">
          {p.bio.map((t, i) => <p key={i} className="m-0 text-[16px] leading-relaxed">{t}</p>)}
          {p.frase && <blockquote className="m-0 mt-1 border-l-4 border-[#C8231F] pl-4 italic text-[#262C37]">“{p.frase}”</blockquote>}
        </section>

        {p.cifras && (
          <ul className={`m-0 p-0 list-none grid grid-cols-2 ${p.cifras.length > 3 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3`} aria-label="En números">
            {p.cifras.map(([n, t]) => <li key={t} className="card !p-4 flex flex-col gap-1"><strong className="text-3xl sm:text-4xl font-extrabold text-[#C8231F] leading-none">{n}</strong><span className="text-sm text-[#4A515C]">{t}</span></li>)}
          </ul>
        )}

        {p.trayectoria && (
          <section aria-labelledby="t-tray" className="flex flex-col gap-4">
            <h2 id="t-tray" className="m-0 text-2xl">Trayectoria</h2>
            <ol className="m-0 p-0 list-none flex flex-col gap-3">
              {p.trayectoria.map((x) => (
                <li key={x.t} className="card !p-4 grid grid-cols-1 sm:grid-cols-[130px_1fr] gap-1 sm:gap-4">
                  <span className="text-sm font-bold text-[#C8231F]">{x.a}</span>
                  <div><strong className="block">{x.t}</strong>{x.d && <span className="text-sm text-[#4A515C]">{x.d}</span>}</div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(p.formacion || p.extra) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {p.formacion && (
              <section aria-labelledby="t-form" className="card flex flex-col gap-3">
                <h2 id="t-form" className="m-0 text-xl">Formación</h2>
                <ul className="m-0 p-0 list-none flex flex-col gap-2.5">
                  {p.formacion.map(([t, d]) => <li key={t}><strong className="block text-[15px]">{t}</strong><span className="text-sm text-[#4A515C]">{d}</span></li>)}
                </ul>
              </section>
            )}
            {p.extra?.map((e) => (
              <section key={e.t} className="card flex flex-col gap-3">
                <h2 className="m-0 text-xl">{e.t}</h2>
                <ul className="m-0 pl-5 flex flex-col gap-1.5 text-[15px]">{e.items.map((t) => <li key={t}>{t}</li>)}</ul>
              </section>
            ))}
          </div>
        )}

        <section aria-labelledby="t-areas" className="flex flex-col gap-3">
          <h2 id="t-areas" className="m-0 text-xl">Áreas de trabajo</h2>
          <ul className="m-0 p-0 list-none flex flex-wrap gap-2 text-sm">
            {p.areas.map((t) => <li key={t} className="rounded-full border border-[#C3C8D1] bg-white px-3 py-1.5 font-semibold">{t}</li>)}
          </ul>
        </section>

        {p.enLaAcademia && (
          <section aria-labelledby="t-acad" className="card bg-[#F5F6F8] flex flex-col gap-2">
            <h2 id="t-acad" className="m-0 text-xl">{p.enLaAcademia.t}</h2>
            {p.enLaAcademia.texto && <p className="m-0">{p.enLaAcademia.texto}</p>}
            {p.enLaAcademia.items && <ul className="m-0 pl-5 flex flex-col gap-1.5 text-[15px]">{p.enLaAcademia.items.map((t) => <li key={t}>{t}</li>)}</ul>}
          </section>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#4A515C]">
          <Link href="/equipo" className="btn-s no-underline">← Ver todo el equipo</Link>
          <span>Perfil actualizado en {fecha(p.actualizado)}</span>
        </div>
      </div>
    </main>
  )
}
