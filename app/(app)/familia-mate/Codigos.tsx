"use client"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { crearCodigos, editarCodigo, borrarCodigo } from "./_acciones"

/** Códigos de regalo de la familia Mate: crear, ver quién los usó, copiar o mandar por WhatsApp, editar y borrar. */
type Codigo = { code: string; producto: string; dias: number; usos_max: number; usos: number; nota: string | null; created_at: string; canjes: { producto: string; quien: string | null; cuando: string }[] }
const DUR: [number, string][] = [[30, "1 mes"], [90, "3 meses"], [180, "6 meses"], [365, "1 año"], [3650, "Sin límite"]]
const durTxt = (d: number) => (d >= 3650 ? "Sin límite" : DUR.find(([n]) => n === d)?.[1] ?? `${d} días`)
const f = (d?: string | null) => (d ? new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "short", year: "numeric" }) : "—")
const link = (c: string) => `https://matebot.devisebit.com/codigo?c=${c}`
const msj = (c: string, prod: string) => `¡Hola! Te regalo ${prod}. Entrá acá y se activa solo: ${link(c)} (tu código es ${c})`
const COLOR: Record<string, string> = { todos: "#0E1116", matebot: "#C8231F", cuentas: "#1F7A4D", turnos: "#0B5D6B", eventos: "#6D28D9" }
const estado = (c: Codigo) => (c.usos >= c.usos_max ? ["Usado", "#F1F2F4", "#4A515C"] : c.usos ? ["En uso", "#FEF3C7", "#92400E"] : ["Libre", "#DCFCE7", "#166534"])

export default function Codigos({ productos, codigos }: { productos: Record<string, string>; codigos: Codigo[] }) {
  const router = useRouter()
  const [pend, start] = useTransition()
  const [nuevo, setNuevo] = useState({ producto: "todos", dias: 365, cantidad: 1, usos: 1, nota: "" })
  const [creados, setCreados] = useState<string[]>([])
  const [err, setErr] = useState("")
  const [filtro, setFiltro] = useState({ q: "", estado: "", producto: "" })
  const [edit, setEdit] = useState<{ code: string; nota: string; dias: number; usos: number } | null>(null)
  const [copiado, setCopiado] = useState("")
  const nombre = (p: string) => productos[p] ?? p

  const L = useMemo(() => codigos.filter((c) => {
    const e = estado(c)[0]
    const txt = `${c.code} ${c.nota ?? ""} ${c.canjes.map((k) => k.quien).join(" ")}`.toLowerCase()
    return (!filtro.estado || e === filtro.estado) && (!filtro.producto || c.producto === filtro.producto) && (!filtro.q || txt.includes(filtro.q.toLowerCase()))
  }), [codigos, filtro])
  const cuenta = (e: string) => codigos.filter((c) => estado(c)[0] === e).length
  const copiar = (t: string, k: string) => { navigator.clipboard?.writeText(t).catch(() => {}); setCopiado(k); setTimeout(() => setCopiado(""), 1500) }
  const run = (fn: () => Promise<any>, ok?: (j: any) => void) => start(async () => { setErr(""); const j = await fn(); if (j?.error) setErr(j.error); else { ok?.(j); router.refresh() } })

  return (
    <div className="flex flex-col gap-4">
      {/* Crear */}
      <div className="rounded-2xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--borde)", background: "var(--sup-2)" }}>
        <strong className="text-[15px]">Crear códigos nuevos</strong>
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
          <label className="text-sm flex flex-col gap-1 font-semibold" style={{ gridColumn: "span 2" }}>¿Qué regala?
            <select className="inp" value={nuevo.producto} onChange={(e) => setNuevo({ ...nuevo, producto: e.target.value })}>{Object.entries(productos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="text-sm flex flex-col gap-1 font-semibold">¿Por cuánto tiempo?
            <select className="inp" value={nuevo.dias} onChange={(e) => setNuevo({ ...nuevo, dias: Number(e.target.value) })}>{DUR.map(([n, t]) => <option key={n} value={n}>{t}</option>)}</select></label>
          <label className="text-sm flex flex-col gap-1 font-semibold">¿Cuántos códigos?
            <input className="inp" type="number" min={1} max={200} value={nuevo.cantidad} onChange={(e) => setNuevo({ ...nuevo, cantidad: Number(e.target.value) })} /></label>
          <label className="text-sm flex flex-col gap-1 font-semibold">Personas por código
            <input className="inp" type="number" min={1} max={10000} value={nuevo.usos} onChange={(e) => setNuevo({ ...nuevo, usos: Number(e.target.value) })} /></label>
          <label className="text-sm flex flex-col gap-1 font-semibold" style={{ gridColumn: "span 2" }}>¿Para quién? (nota)
            <input className="inp" placeholder="Ej: Georgina, amigos del club" value={nuevo.nota} onChange={(e) => setNuevo({ ...nuevo, nota: e.target.value })} /></label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-p" disabled={pend} onClick={() => run(() => crearCodigos(nuevo), (j) => { setCreados(j.codigos ?? []); setNuevo({ ...nuevo, nota: "" }) })}>{pend ? "Creando…" : `Crear ${nuevo.cantidad > 1 ? `${nuevo.cantidad} códigos` : "código"}`}</button>
          <span className="text-xs text-[#4A515C]">1 persona por código es lo normal: cuando alguien lo usa, queda gastado. "Toda la familia Mate" activa los cuatro productos para esa persona.</span>
        </div>
        {creados.length > 0 && (
          <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "#DCFCE7" }}>
            <b className="text-sm text-[#166534]">Listo, {creados.length === 1 ? "este es el código" : `estos son los ${creados.length} códigos`}:</b>
            {creados.map((c) => (
              <div key={c} className="flex flex-wrap items-center gap-2">
                <code className="text-lg font-bold tracking-widest bg-white rounded-lg px-3 py-1">{c}</code>
                <button className="btn-s" onClick={() => copiar(msj(c, nombre(nuevo.producto)), c)}>{copiado === c ? "¡Copiado!" : "Copiar mensaje"}</button>
                <a className="btn-s" href={`https://wa.me/?text=${encodeURIComponent(msj(c, nombre(nuevo.producto)))}`} target="_blank" rel="noreferrer">Mandar por WhatsApp</a>
              </div>))}
          </div>)}
        {err && <p className="m-0 text-sm" style={{ color: "var(--ac)" }}>{err}</p>}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        {[["", `Todos (${codigos.length})`], ["Libre", `Libres (${cuenta("Libre")})`], ["En uso", `En uso (${cuenta("En uso")})`], ["Usado", `Usados (${cuenta("Usado")})`]].map(([k, t]) => (
          <button key={k} onClick={() => setFiltro({ ...filtro, estado: k })} className="btn" style={{ border: "1px solid var(--borde-fuerte)", background: filtro.estado === k ? "var(--tinta)" : "#fff", color: filtro.estado === k ? "#fff" : "var(--tinta)" }}>{t}</button>))}
        <select className="inp" style={{ width: "auto" }} value={filtro.producto} onChange={(e) => setFiltro({ ...filtro, producto: e.target.value })}><option value="">Todos los productos</option>{Object.entries(productos).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <input className="inp" style={{ width: 240 }} placeholder="Buscar código, nota o persona" value={filtro.q} onChange={(e) => setFiltro({ ...filtro, q: e.target.value })} />
      </div>

      {/* Lista */}
      {!L.length ? <p className="m-0 text-sm text-[#4A515C]">{codigos.length ? "Ningún código con ese filtro." : "Todavía no hay códigos."}</p> : (
        <div className="flex flex-col gap-2">
          {L.map((c) => {
            const [e, bg, fg] = estado(c)
            const editando = edit?.code === c.code
            return (
              <div key={c.code} className="rounded-2xl border bg-white p-4 grid gap-3 items-center" style={{ borderColor: "var(--borde)", gridTemplateColumns: "minmax(150px,auto) 1fr auto" }}>
                <div className="flex flex-col gap-1">
                  <code className="text-[17px] font-bold tracking-widest">{c.code}</code>
                  <span className="text-xs text-[#4A515C]">Creado {f(c.created_at)}</span>
                </div>
                {editando ? (
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))" }}>
                    <label className="text-xs font-semibold flex flex-col gap-1">Nota<input className="inp" value={edit.nota} onChange={(x) => setEdit({ ...edit, nota: x.target.value })} /></label>
                    <label className="text-xs font-semibold flex flex-col gap-1">Tiempo<select className="inp" value={edit.dias} onChange={(x) => setEdit({ ...edit, dias: Number(x.target.value) })}>{[...DUR, ...(DUR.some(([n]) => n === edit.dias) ? [] : [[edit.dias, `${edit.dias} días`] as [number, string]])].map(([n, t]) => <option key={n} value={n}>{t}</option>)}</select></label>
                    <label className="text-xs font-semibold flex flex-col gap-1">Personas<input className="inp" type="number" min={Math.max(1, c.usos)} value={edit.usos} onChange={(x) => setEdit({ ...edit, usos: Number(x.target.value) })} /></label>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ background: COLOR[c.producto] ?? "#0E1116" }}>{nombre(c.producto)}</span>
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: bg, color: fg }}>{e} · {c.usos} de {c.usos_max}</span>
                      <span className="text-sm text-[#4A515C]">{durTxt(c.dias)}</span>
                    </div>
                    <span className="text-sm"><b>{c.nota || <span className="text-[#4A515C] font-normal">Sin nota</span>}</b></span>
                    {c.canjes.length > 0 && <span className="text-sm text-[#4A515C]">Lo usó: {c.canjes.map((k) => `${k.quien || "alguien"} en ${nombre(k.producto)} (${f(k.cuando)})`).join(" · ")}</span>}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 justify-end">
                  {editando ? (<>
                    <button className="btn-p" disabled={pend} onClick={() => run(() => editarCodigo(edit), () => setEdit(null))}>Guardar</button>
                    <button className="btn-s" onClick={() => setEdit(null)}>Cancelar</button>
                  </>) : (<>
                    {e !== "Usado" && <button className="btn-s" onClick={() => copiar(msj(c.code, nombre(c.producto)), c.code)}>{copiado === c.code ? "¡Copiado!" : "Copiar"}</button>}
                    {e !== "Usado" && <a className="btn-s" href={`https://wa.me/?text=${encodeURIComponent(msj(c.code, nombre(c.producto)))}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                    <button className="btn-s" onClick={() => setEdit({ code: c.code, nota: c.nota ?? "", dias: c.dias, usos: c.usos_max })}>Editar</button>
                    <button className="btn-s" aria-label={`Borrar ${c.code}`} onClick={() => confirm(`¿Borrar el código ${c.code}?${c.usos ? " Quien ya lo usó conserva su regalo." : ""}`) && run(() => borrarCodigo(c.code))}>Borrar</button>
                  </>)}
                </div>
              </div>)
          })}
        </div>)}
    </div>
  )
}
