"use client"
import { useState } from "react"
import AutoGuardar from "@/components/AutoGuardar"

export type FilaPrecio = {
  id: number; linea: string; producto: string; precio: number | null; abono: number | null
  condicion: string | null; incluye: string | null; mercado_desde: number | null; mercado_hasta: number | null
  fuente: string | null; argumento: string | null; activo: boolean; pos: { t: string; c: string }
}
const ars = (n: number | null) => (n == null ? "—" : "$ " + Number(n).toLocaleString("es-AR"))

/** Lista de precios por línea con edición al costado: se elige la fila y se escribe; guarda solo y deja el cambio en el historial. */
export default function ListaPrecios({ filas, guardar, editar }: { filas: FilaPrecio[]; guardar: (fd: FormData) => Promise<void>; editar: boolean }) {
  const [sel, setSel] = useState<number | null>(filas[0]?.id ?? null)
  const [b, setB] = useState("")
  const t = b.trim().toLowerCase()
  const visibles = t ? filas.filter((p) => `${p.producto} ${p.linea} ${p.condicion ?? ""}`.toLowerCase().includes(t)) : filas
  const lineas = Array.from(new Set(visibles.map((p) => p.linea)))
  const p = filas.find((f) => f.id === sel)
  return (
    <div className="lp">
      <div className="flex flex-col gap-3 min-w-0">
        <label className="sr-only" htmlFor="b-precio">Buscar producto</label>
        <input id="b-precio" type="search" value={b} onChange={(e) => setB(e.target.value)} placeholder="Buscar producto o línea" className="inp" />
        {lineas.map((l) => (
          <section key={l} className="card p-0 overflow-hidden">
            <h2 className="m-0 px-4 py-2.5 text-sm border-b border-[var(--borde)]">{l}</h2>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Producto</th><th className="text-right">Proyecto</th><th className="text-right">Por mes</th><th>Posición</th></tr></thead>
                <tbody>
                  {visibles.filter((x) => x.linea === l).map((x) => (
                    <tr key={x.id} aria-selected={sel === x.id} className={x.activo ? "" : "opacity-55"}>
                      <td className="!p-0"><button type="button" onClick={() => setSel(x.id)} className="lp-fila"><span className="font-semibold block">{x.producto}</span><span className="text-xs text-[var(--gris)]">{x.condicion}{x.activo ? "" : " · oculto"}</span></button></td>
                      <td className="text-right whitespace-nowrap font-semibold tabular-nums">{ars(x.precio)}</td>
                      <td className="text-right whitespace-nowrap tabular-nums">{ars(x.abono)}</td>
                      <td><span className={`chip whitespace-nowrap ${x.pos.c}`}>{x.pos.t}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {!visibles.length && <p className="m-0 text-sm text-[var(--gris)]">Ningún producto coincide con la búsqueda.</p>}
      </div>
      <aside className="lp-panel card flex flex-col gap-3" aria-label="Detalle del precio">
        {!p && <p className="m-0 text-sm text-[var(--gris)]">Elegí un producto de la lista.</p>}
        {p && (
          <>
            <div><div className="eyebrow">{p.linea}</div><h2 className="m-0 text-lg">{p.producto}</h2></div>
            <div className="rounded-lg bg-[var(--sup-2)] p-3 text-sm flex flex-col gap-1">
              <div className="flex justify-between gap-2"><span className="text-[var(--gris)]">Mercado</span><span className="font-semibold tabular-nums">{p.mercado_desde != null ? `${ars(p.mercado_desde)} a ${ars(p.mercado_hasta)}` : "—"}</span></div>
              <div className="flex justify-between gap-2 items-center"><span className="text-[var(--gris)]">Tu posición</span><span className={`chip ${p.pos.c}`}>{p.pos.t}</span></div>
              {p.fuente && <div className="text-xs text-[var(--gris)]">{p.fuente}</div>}
            </div>
            {editar ? (
              <AutoGuardar key={p.id} accion={guardar} className="flex flex-col gap-3">
                <input type="hidden" name="id" value={p.id} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="lbl">Proyecto ($)<input name="precio" defaultValue={p.precio ?? ""} inputMode="numeric" className="inp text-base font-bold" /></label>
                  <label className="lbl">Por mes ($)<input name="abono" defaultValue={p.abono ?? ""} inputMode="numeric" className="inp text-base font-bold" /></label>
                </div>
                <label className="lbl">Condición<input name="condicion" defaultValue={p.condicion ?? ""} className="inp" /></label>
                <label className="lbl">Qué incluye<textarea name="incluye" defaultValue={p.incluye ?? ""} rows={3} className="inp" /></label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="lbl">Mercado desde ($)<input name="mercado_desde" defaultValue={p.mercado_desde ?? ""} inputMode="numeric" className="inp" /></label>
                  <label className="lbl">Mercado hasta ($)<input name="mercado_hasta" defaultValue={p.mercado_hasta ?? ""} inputMode="numeric" className="inp" /></label>
                </div>
                <label className="lbl">Cómo explicarlo al cliente<textarea name="argumento" defaultValue={p.argumento ?? ""} rows={3} className="inp" /></label>
                <label className="lbl">Motivo del cambio (queda en el historial)<input name="motivo" placeholder="Ej.: ajuste por inflación de noviembre" className="inp" /></label>
                <label className="flex items-center gap-2 text-sm min-h-[44px]"><input type="checkbox" name="activo" defaultChecked={p.activo} /> Visible en la lista y para el bot</label>
              </AutoGuardar>
            ) : (
              <div className="text-sm flex flex-col gap-2">
                <p className="m-0"><strong>Proyecto:</strong> {ars(p.precio)} · <strong>Por mes:</strong> {ars(p.abono)}</p>
                {p.incluye && <p className="m-0">{p.incluye}</p>}
                {p.argumento && <p className="m-0 text-[var(--gris)]">{p.argumento}</p>}
                <p className="m-0 text-xs text-[var(--gris)]">Solo Dirección puede cambiar precios.</p>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  )
}
