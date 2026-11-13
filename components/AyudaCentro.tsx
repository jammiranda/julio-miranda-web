"use client"
import Link from "next/link"
import { useMemo, useState } from "react"

export type GuiaAyuda = { id: string; t: string; pasos: string[]; tips?: string[]; link?: string; ir?: string }
export type Atajo = { t: string; d: string; href: string; icono: string }

const fmt = (t: string) => t.split(/(\*[^*]+\*)/).map((p, i) => (p.startsWith("*") ? <strong key={i}>{p.slice(1, -1)}</strong> : p))
const plano = (t: string) => t.replace(/\*/g, "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

/** Centro de ayuda: buscador que encuentra el paso exacto, accesos por tarea y guías que se abren de a una. */
export default function AyudaCentro({ guias, atajos }: { guias: GuiaAyuda[]; atajos: Atajo[] }) {
  const [b, setB] = useState("")
  const [abierta, setAbierta] = useState<string | null>(null)
  const t = plano(b.trim())
  const hallazgos = useMemo(() => {
    if (t.length < 2) return []
    const out: { g: GuiaAyuda; n: number; paso: string }[] = []
    for (const g of guias) g.pasos.forEach((p, n) => { if (plano(p).includes(t) || plano(g.t).includes(t)) out.push({ g, n, paso: p }) })
    return out.slice(0, 12)
  }, [t, guias])

  return (
    <div className="flex flex-col gap-6">
      <section className="ayuda-hero no-print">
        <h2 className="m-0 text-2xl">¿Qué necesitás hacer?</h2>
        <label htmlFor="ayuda-b" className="sr-only">Buscar en la ayuda</label>
        <input id="ayuda-b" type="search" value={b} onChange={(e) => setB(e.target.value)} placeholder="Escribí lo que buscás: cargar un gasto, mandar un email, sumar un usuario…" className="inp !py-3.5 !text-base" autoComplete="off" />
        {t.length >= 2 && (
          <div role="status" className="flex flex-col gap-2">
            <span className="text-sm text-[var(--gris)]">{hallazgos.length ? `${hallazgos.length} resultado${hallazgos.length === 1 ? "" : "s"}` : "No encontré nada con esas palabras. Probá con otra o mirá las guías de abajo."}</span>
            {hallazgos.map((h, i) => (
              <button key={i} type="button" onClick={() => { setAbierta(h.g.id); setB(""); setTimeout(() => document.getElementById(`guia-${h.g.id}`)?.scrollIntoView({ block: "start" }), 60) }} className="text-left card !p-3 hover:border-[var(--ac)] cursor-pointer">
                <span className="text-xs font-bold uppercase tracking-wide text-[var(--ac-texto)]">{h.g.t} · paso {h.n + 1}</span>
                <span className="block text-sm">{fmt(h.paso)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {t.length < 2 && atajos.length > 0 && (
        <section className="flex flex-col gap-3 no-print" aria-label="Lo más usado">
          <h2 className="m-0 text-lg">Lo más usado</h2>
          <ul className="m-0 p-0 list-none grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
            {atajos.map((a) => (
              <li key={a.href + a.t}><Link href={a.href} className="card !p-4 flex items-start gap-3 h-full hover:border-[var(--ac)] no-underline text-[var(--tinta)]">
                <span aria-hidden="true" className="text-2xl leading-none">{a.icono}</span>
                <span><b className="block">{a.t}</b><span className="text-sm text-[var(--gris)]">{a.d}</span></span>
                <span className="ml-auto font-bold text-[var(--ac-texto)]" aria-hidden="true">→</span>
              </Link></li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3" aria-label="Guías paso a paso">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-lg">Guías paso a paso</h2>
          <button type="button" onClick={() => setAbierta(abierta === "*" ? null : "*")} className="text-sm underline text-[var(--gris)] no-print">{abierta === "*" ? "Cerrar todas" : "Abrir todas"}</button>
        </div>
        <div className="grid gap-3 grid-cols-1 lg:grid-cols-2 items-start">
          {guias.map((g) => {
            const on = abierta === "*" || abierta === g.id
            return (
              <article key={g.id} id={`guia-${g.id}`} className={`card !p-0 overflow-hidden scroll-mt-32 ${on ? "lg:col-span-2 border-[var(--ac)]" : ""}`}>
                <button type="button" aria-expanded={on} onClick={() => setAbierta(on ? null : g.id)} className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 cursor-pointer">
                  <span><b className="block text-base">{g.t}</b><span className="text-sm text-[var(--gris)]">{g.pasos.length} pasos{g.tips?.length ? " · con consejo" : ""}</span></span>
                  <span aria-hidden="true" className="text-xl text-[var(--ac-texto)]">{on ? "−" : "+"}</span>
                </button>
                <div className={on ? "px-5 pb-5 flex flex-col gap-3" : "hidden print:flex print:flex-col print:gap-3 print:px-5 print:pb-5"}>
                  <ol className="m-0 p-0 list-none flex flex-col gap-2.5">
                    {g.pasos.map((p, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-relaxed"><span className="flex-none w-7 h-7 rounded-full bg-[var(--ac-suave)] text-[var(--ac-texto)] font-bold text-sm flex items-center justify-center">{i + 1}</span><span>{fmt(p)}</span></li>
                    ))}
                  </ol>
                  {g.tips?.map((x, i) => <p key={i} className="m-0 text-sm bg-emerald-50 text-emerald-800 rounded-xl px-3 py-2">💡 {fmt(x)}</p>)}
                  {g.link && <Link href={g.link} className="btn-p w-fit no-print">Ir a {g.ir ?? g.t} →</Link>}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
