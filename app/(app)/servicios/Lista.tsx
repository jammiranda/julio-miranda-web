"use client"
import { useMemo, useRef, useState } from "react"
import AutoGuardar from "@/components/AutoGuardar"
import BotonConfirmar from "@/components/BotonConfirmar"

export type Servicio = { id: number; nombre: string; categoria: string | null; descripcion: string | null; precio_desde: string | number | null; precio_hasta: string | number | null; moneda: string | null; plazo: string | null; link: string | null; activo: boolean; usos: number }
type Accion = (fd: FormData) => Promise<void>

const monto = (v: string | number | null) => (v == null || v === "" ? null : Number(v).toLocaleString("es-AR"))
const rango = (x: Servicio) => {
  const [a, b] = [monto(x.precio_desde), monto(x.precio_hasta)]
  if (!a && !b) return "Sin rango"
  return `${x.moneda ?? "USD"} ${a ?? "—"}${b ? ` a ${b}` : ""}`
}

function Campos({ x }: { x?: Servicio }) {
  return (
    <>
      <label className="lbl">Servicio<input name="nombre" defaultValue={x?.nombre ?? ""} required className="inp" /></label>
      <label className="lbl">Categoría<input name="categoria" defaultValue={x?.categoria ?? ""} placeholder="A medida / Producto" className="inp" /></label>
      <label className="lbl">Descripción<textarea name="descripcion" defaultValue={x?.descripcion ?? ""} rows={3} className="inp" /></label>
      <div className="grid grid-cols-3 gap-2">
        <label className="lbl">Moneda<select name="moneda" defaultValue={x?.moneda ?? "USD"} className="inp"><option>USD</option><option>ARS</option></select></label>
        <label className="lbl">Desde<input name="precio_desde" inputMode="decimal" defaultValue={x?.precio_desde ?? ""} className="inp" /></label>
        <label className="lbl">Hasta<input name="precio_hasta" inputMode="decimal" defaultValue={x?.precio_hasta ?? ""} className="inp" /></label>
      </div>
      <label className="lbl">Plazo típico<input name="plazo" defaultValue={x?.plazo ?? ""} placeholder="3 a 6 semanas" className="inp" /></label>
      <label className="lbl">Link (caso, PDF, página)<input name="link" type="url" defaultValue={x?.link ?? ""} placeholder="https://www.devisebit.com/…" className="inp" /></label>
    </>
  )
}

/** Lista a la izquierda, edición a la derecha. Elegir una fila es instantáneo y los cambios se guardan solos. */
export default function ListaServicios({ filas, guardar, eliminar, edita, admin }: { filas: Servicio[]; guardar: Accion; eliminar: Accion; edita: boolean; admin: boolean }) {
  const [sel, setSel] = useState<number | "nuevo" | null>(filas[0]?.id ?? null)
  const [b, setB] = useState("")
  const panel = useRef<HTMLElement>(null)
  // En el celular el detalle queda debajo de la lista: al elegir una fila se baja solo hasta él
  const elegir = (v: typeof sel) => { setSel(v); if (window.innerWidth < 1100) requestAnimationFrame(() => panel.current?.scrollIntoView({ behavior: "smooth", block: "start" })) }
  const visibles = useMemo(() => { const t = b.trim().toLowerCase(); return t ? filas.filter((x) => `${x.nombre} ${x.categoria ?? ""} ${x.descripcion ?? ""}`.toLowerCase().includes(t)) : filas }, [filas, b])
  const x = typeof sel === "number" ? filas.find((f) => f.id === sel) : undefined
  return (
    <div className="lp">
      <div className="flex flex-col gap-3 min-w-0">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="sr-only" htmlFor="b-serv">Buscar servicio</label>
          <input id="b-serv" type="search" value={b} onChange={(e) => setB(e.target.value)} placeholder="Buscar servicio" className="inp !w-auto flex-1 min-w-[200px]" />
          {edita && <button type="button" onClick={() => elegir("nuevo")} className="btn-p">+ Servicio</button>}
        </div>
        <div className="card p-0 overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Servicio</th><th>Rango de referencia</th><th>Plazo</th><th className="text-right">Proyectos</th></tr></thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id} aria-selected={sel === f.id} className={f.activo ? "" : "opacity-55"}>
                  <td className="!p-0"><button type="button" onClick={() => elegir(f.id)} className="lp-fila"><span className="font-semibold block">{f.nombre}</span><span className="text-xs text-[var(--gris)]">{f.categoria ?? "Sin categoría"}{f.activo ? "" : " · inactivo"}</span></button></td>
                  <td className="whitespace-nowrap tabular-nums">{rango(f)}</td>
                  <td className="text-sm">{f.plazo ?? "—"}</td>
                  <td className="text-right tabular-nums">{f.usos}</td>
                </tr>
              ))}
              {!visibles.length && <tr><td colSpan={4} className="text-center text-[var(--gris)] py-6">{filas.length ? "Ningún servicio coincide con la búsqueda." : "Todavía no hay servicios. Agregá el primero con «+ Servicio»."}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <aside ref={panel} className="lp-panel card flex flex-col gap-3 scroll-mt-36" aria-label="Detalle del servicio">
        {sel === "nuevo" && edita && (
          <form action={async (fd) => { await guardar(fd); setSel(null) }} className="flex flex-col gap-3">
            <div><div className="eyebrow">Nuevo</div><h2 className="m-0 text-lg">Agregar servicio</h2></div>
            <Campos />
            <button className="btn-p">Agregar</button>
          </form>
        )}
        {x && edita && (
          <>
            <AutoGuardar key={x.id} accion={guardar} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={x.id} />
              <div><div className="eyebrow">{x.categoria ?? "Servicio"}</div><h2 className="m-0 text-lg">{x.nombre}</h2></div>
              <Campos x={x} />
              <label className="flex items-center gap-2 text-sm min-h-[44px]"><input type="checkbox" name="activo" defaultChecked={x.activo} /> Activo: el bot lo ofrece y da este rango</label>
            </AutoGuardar>
            {admin && <form className="pt-3 border-t border-[var(--borde)]"><input type="hidden" name="id" value={x.id} /><BotonConfirmar chico accion={eliminar} mensaje={`¿Eliminar el servicio "${x.nombre}"? Los proyectos que lo usan quedan sin servicio. No se puede deshacer.`}>Eliminar servicio</BotonConfirmar></form>}
          </>
        )}
        {x && !edita && (
          <div className="flex flex-col gap-2 text-sm">
            <div><div className="eyebrow">{x.categoria ?? "Servicio"}</div><h2 className="m-0 text-lg">{x.nombre}</h2></div>
            {x.descripcion && <p className="m-0">{x.descripcion}</p>}
            <p className="m-0"><strong>Rango:</strong> {rango(x)} · <strong>Plazo:</strong> {x.plazo ?? "—"}</p>
            {x.link && <a href={x.link} target="_blank" rel="noopener noreferrer" className="underline break-all">{x.link}</a>}
          </div>
        )}
        {!x && sel !== "nuevo" && <p className="m-0 text-sm text-[var(--gris)]">Elegí un servicio de la lista para ver y editar su detalle.</p>}
      </aside>
    </div>
  )
}
