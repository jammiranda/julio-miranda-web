import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { one } from "@/lib/db"
import { fichaDe, FICHAS, PASOS } from "@/lib/fichas"
import Imprimir from "@/components/Imprimir"

export const dynamic = "force-dynamic"

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const f = fichaDe(params.slug)
  return { title: f ? `${f.servicio} · DEVISEBIT` : "DEVISEBIT", description: f?.bajada }
}

const fmt = (n: string | number, m: string) => `${m === "ARS" ? "$" : m + " "}${Number(n).toLocaleString("es-AR")}`

export default async function Ficha({ params }: { params: { slug: string } }) {
  const f = fichaDe(params.slug)
  if (!f) notFound()
  const s = await one<any>("select precio_desde, precio_hasta, moneda, plazo from db_servicios where nombre=$1 and activo", [f.servicio]).catch(() => null)
  const wa = `https://wa.me/5491173466490?text=${encodeURIComponent(`Hola DEVISEBIT, vi la ficha de ${f.servicio} y quiero avanzar`)}`
  const otras = FICHAS.filter((x) => x.slug !== f.slug).slice(0, 4)
  return (
    <main className="ficha min-h-screen bg-[#F5F6F8] print:bg-white">
      <header className="ficha-head bg-[#0E1116] text-white print:bg-[#0E1116]" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
        <div className="max-w-4xl mx-auto px-5 py-10">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xl font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></div>
            <span className="text-xs uppercase tracking-[0.2em] text-white/60">{f.servicio}</span>
          </div>
          <h1 className="m-0 mt-8 text-4xl sm:text-5xl leading-tight text-white">{f.titulo}</h1>
          <p className="m-0 mt-4 text-lg text-white/80 max-w-2xl">{f.bajada}</p>
          <div className="mt-6 flex flex-wrap gap-2 no-print">
            <a href={wa} className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17]">Quiero avanzar por WhatsApp</a>
            <Imprimir texto="Descargar PDF" />
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-5 py-8 flex flex-col gap-5">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card"><h2 className="m-0 text-base text-[#4A515C] uppercase tracking-wider">¿Te pasa esto?</h2><ul className="m-0 mt-3 pl-5 flex flex-col gap-2">{f.dolor.map((d) => <li key={d}>{d}</li>)}</ul></div>
          <div className="card"><h2 className="m-0 text-base text-[#4A515C] uppercase tracking-wider">Qué incluye</h2><ul className="m-0 mt-3 p-0 list-none flex flex-col gap-2">{f.incluye.map((d) => <li key={d} className="flex gap-2"><span className="text-[#C8231F] font-bold">✓</span>{d}</li>)}</ul></div>
        </section>
        <section className="card border-2 border-[#C8231F] bg-[#FDECEB]/40"><h2 className="m-0 text-base">✨ El plus DEVISEBIT</h2><p className="m-0 mt-2 text-[17px]">{f.plus}</p></section>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card md:col-span-2"><h2 className="m-0 text-base text-[#4A515C] uppercase tracking-wider">Por etapas</h2>
            <ol className="m-0 mt-3 pl-5 flex flex-col gap-2">{f.etapas.map((e) => <li key={e.n}><strong>{e.n}:</strong> {e.d}</li>)}</ol>
            <p className="m-0 mt-3 text-sm text-[#4A515C]">Ideal para: {f.ideal}</p></div>
          <div className="card flex flex-col gap-2"><h2 className="m-0 text-base text-[#4A515C] uppercase tracking-wider">Inversión de referencia</h2>
            {s?.precio_desde ? <p className="m-0 text-2xl font-extrabold">{fmt(s.precio_desde, s.moneda)}{s.precio_hasta ? <span className="block text-base font-semibold text-[#4A515C]">a {fmt(s.precio_hasta, s.moneda)}</span> : null}</p> : <p className="m-0 font-semibold">A medida</p>}
            {s?.plazo && <p className="m-0 text-sm">Plazo típico: <strong>{s.plazo}</strong></p>}
            <p className="m-0 text-xs text-[#4A515C]">Según alcance. La propuesta final es con precio fijo y por escrito.</p></div>
        </section>
        <section className="card"><h2 className="m-0 text-base text-[#4A515C] uppercase tracking-wider">Caso real</h2><p className="m-0 mt-2 text-lg font-bold">{f.caso.t}</p><p className="m-0 mt-1">{f.caso.d}</p></section>
        <section className="card"><h2 className="m-0 text-base text-[#4A515C] uppercase tracking-wider">Cómo trabajamos</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">{PASOS.map((p, i) => <div key={p.n}><span className="text-[#C8231F] font-extrabold">0{i + 1}</span><p className="m-0 font-bold">{p.n}</p><p className="m-0 text-sm text-[#4A515C]">{p.d}</p></div>)}</div></section>
        <section className="card bg-[#0E1116] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          <div><p className="m-0 text-xl font-extrabold">Hablemos 30 minutos, sin costo</p><p className="m-0 text-white/75">WhatsApp +54 9 11 7346-6490 · info@devisebit.com · www.devisebit.com</p></div>
          <a href={wa} className="btn bg-[#C8231F] text-white hover:bg-[#9E1A17] no-print">Escribinos</a>
        </section>
        <nav className="no-print flex flex-wrap gap-2 text-sm">{otras.map((o) => <a key={o.slug} href={`/fichas/${o.slug}`} className="chip border border-[#C3C8D1] bg-white px-3 py-1 hover:border-[#C8231F]">{o.servicio}</a>)}</nav>
        <p className="m-0 text-xs text-center text-[#4A515C]">DEVISEBIT SRL · Software e inteligencia artificial desde 2009 · Luna 24, Parque Patricios (Polo Tecnológico CABA) y Nordelta</p>
      </div>
    </main>
  )
}
