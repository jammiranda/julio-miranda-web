import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir, puede } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { precios, historial, posicion, ars, FUENTES_MERCADO, PAGO } from "@/lib/precios"
import { URL_SISTEMA } from "@/lib/brief"
import { fechaHora } from "@/lib/consultas"
import Copiar from "@/components/Copiar"

export const dynamic = "force-dynamic"

const num = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").replace(/[^\d]/g, "")
  return t ? Number(t) : null
}

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  const motivo = String(fd.get("motivo") ?? "").trim().slice(0, 300) || null
  const antes = await one<any>("select * from db_precios where id=$1", [id])
  if (!antes) redirect("/precios")
  const nuevo: Record<string, unknown> = {
    precio: num(fd.get("precio")), abono: num(fd.get("abono")),
    condicion: String(fd.get("condicion") ?? "").trim() || null, incluye: String(fd.get("incluye") ?? "").trim() || null,
    mercado_desde: num(fd.get("mercado_desde")), mercado_hasta: num(fd.get("mercado_hasta")),
    argumento: String(fd.get("argumento") ?? "").trim() || null, activo: fd.get("activo") === "on",
  }
  const cambios: string[] = []
  for (const [k, v] of Object.entries(nuevo)) {
    const a = antes![k] == null ? null : typeof v === "number" ? Number(antes![k]) : antes![k]
    if (String(a ?? "") !== String(v ?? "")) {
      cambios.push(k)
      await q("insert into db_precios_hist(precio_id,producto,campo,antes,despues,motivo,usuario) values ($1,$2,$3,$4,$5,$6,$7)", [id, antes!.producto, k, a == null ? null : String(a), v == null ? null : String(v), motivo, u.nombre])
    }
  }
  if (cambios.length) {
    await q("update db_precios set precio=$1, abono=$2, condicion=$3, incluye=$4, mercado_desde=$5, mercado_hasta=$6, argumento=$7, activo=$8, actualizado=now() where id=$9",
      [nuevo.precio, nuevo.abono, nuevo.condicion, nuevo.incluye, nuevo.mercado_desde, nuevo.mercado_hasta, nuevo.argumento, nuevo.activo, id])
    await audit(u, "edita_precio", "db_precio", id, cambios.join(","))
  }
  revalidatePath("/precios")
  redirect(`/precios?ok=${encodeURIComponent(cambios.length ? `${antes!.producto}: actualizado` : "Sin cambios")}#p${id}`)
}

export default async function Precios({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  const u = await requerir(["gerente", "coordinacion"])
  const [ps, hist] = await Promise.all([precios(false), historial(30)])
  const editar = puede.admin(u)
  const lineas = Array.from(new Set(ps.map((p) => p.linea)))
  const ult = ps.reduce((a, p) => (p.actualizado > a ? p.actualizado : a), "")
  const link = `${URL_SISTEMA}/lista-precios`
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">Precios</h1>
          <p className="m-0 text-sm text-[#4A515C]">Lista vigente de DEVISEBIT con la referencia de mercado de cada precio y cómo explicárselo al cliente. Última actualización: {ult ? fechaHora(ult) : "—"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/lista-precios" target="_blank" className="btn-s">Ver lista para clientes ↗</a>
          <Copiar texto={link} etiqueta="Copiar link" />
        </div>
      </div>
      {searchParams.ok && <p role="status" className="m-0 text-sm font-semibold text-[#C8231F]">{searchParams.ok}</p>}
      <section className="card text-sm flex flex-col gap-1">
        <strong>Link para compartir con clientes:</strong> <a href={link} target="_blank" className="underline break-all">{link}</a>
        <span className="text-[#4A515C]">Muestra los precios y qué incluye cada servicio, sin las referencias internas. El bot lo manda cuando piden precios. Se actualiza solo cuando cambiás un precio acá.</span>
        <span className="text-[#4A515C]">Formas de pago: {PAGO.texto} Alias: <strong>{PAGO.alias}</strong>.</span>
      </section>
      {lineas.map((l) => (
        <section key={l} className="card p-0 overflow-hidden">
          <h2 className="m-0 px-5 py-3 text-base border-b border-[#E2E5EA]">{l}</h2>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Producto</th><th className="text-right">Proyecto</th><th className="text-right">Por mes</th><th>Mercado</th><th>Posición</th><th>Cómo explicarlo</th>{editar && <th></th>}</tr></thead>
              <tbody>
                {ps.filter((p) => p.linea === l).map((p) => {
                  const pos = posicion(p)
                  return (
                    <tr key={p.id} id={`p${p.id}`} className={p.activo ? "" : "opacity-50"}>
                      <td className="font-semibold min-w-[180px]">{p.producto}<div className="text-xs font-normal text-[#4A515C]">{p.condicion}</div>{!p.activo && <span className="chip bg-slate-100 text-slate-600">oculto</span>}</td>
                      <td className="text-right whitespace-nowrap font-semibold">{ars(p.precio) || "—"}</td>
                      <td className="text-right whitespace-nowrap">{p.abono != null ? ars(p.abono) : "—"}</td>
                      <td className="text-xs min-w-[150px]"><span className="whitespace-nowrap">{p.mercado_desde != null ? `${ars(p.mercado_desde)} a ${ars(p.mercado_hasta)}` : "—"}</span>{p.fuente && <div className="text-[#4A515C]">{p.fuente}</div>}</td>
                      <td><span className={`chip whitespace-nowrap ${pos.c}`}>{pos.t}</span></td>
                      <td className="text-sm min-w-[260px]">{p.argumento}</td>
                      {editar && <td>
                        <details>
                          <summary className="btn-s py-1 px-3 text-xs cursor-pointer list-none">Editar</summary>
                          <form action={guardar} className="mt-2 grid grid-cols-2 gap-2 w-[min(80vw,520px)] p-3 card shadow-xl">
                            <input type="hidden" name="id" value={p.id} />
                            <label className="lbl">Proyecto ($)<input name="precio" defaultValue={p.precio ?? ""} inputMode="numeric" className="inp" /></label>
                            <label className="lbl">Por mes ($)<input name="abono" defaultValue={p.abono ?? ""} inputMode="numeric" className="inp" /></label>
                            <label className="lbl col-span-2">Condición<input name="condicion" defaultValue={p.condicion ?? ""} className="inp" /></label>
                            <label className="lbl col-span-2">Qué incluye<textarea name="incluye" defaultValue={p.incluye ?? ""} rows={2} className="inp" /></label>
                            <label className="lbl">Mercado desde ($)<input name="mercado_desde" defaultValue={p.mercado_desde ?? ""} inputMode="numeric" className="inp" /></label>
                            <label className="lbl">Mercado hasta ($)<input name="mercado_hasta" defaultValue={p.mercado_hasta ?? ""} inputMode="numeric" className="inp" /></label>
                            <label className="lbl col-span-2">Cómo explicarlo al cliente<textarea name="argumento" defaultValue={p.argumento ?? ""} rows={2} className="inp" /></label>
                            <label className="lbl col-span-2">Motivo del cambio<input name="motivo" placeholder="Ej.: ajuste por inflación de noviembre" className="inp" /></label>
                            <label className="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" name="activo" defaultChecked={p.activo} /> Visible en la lista y para el bot</label>
                            <button className="btn-p col-span-2">Guardar</button>
                          </form>
                        </details>
                      </td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card text-sm flex flex-col gap-2">
          <h2 className="m-0 text-base">De dónde salen las referencias</h2>
          <p className="m-0 text-[#4A515C]">Rangos publicados por agencias y tarifarios del mercado argentino en 2026. Revisarlos cada trimestre o ante una suba fuerte de precios.</p>
          <ul className="m-0 pl-5">{FUENTES_MERCADO.map((f) => <li key={f.u}><a href={f.u} target="_blank" rel="noopener noreferrer" className="underline">{f.n}</a></li>)}</ul>
        </div>
        <div className="card text-sm flex flex-col gap-2">
          <h2 className="m-0 text-base">Historial de cambios</h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-1 max-h-72 overflow-auto">
            {hist.map((h) => <li key={h.id} className="border-b border-[#EEF0F3] pb-1"><span className="text-xs text-[#4A515C]">{fechaHora(h.creado)} · {h.usuario}</span><div><strong>{h.producto}</strong>{h.campo !== "alta" && <> · {h.campo}: {h.antes ?? "—"} → {h.despues ?? "—"}</>}{h.motivo && <span className="text-[#4A515C]"> · {h.motivo}</span>}</div></li>)}
            {!hist.length && <li className="text-[#4A515C]">Sin cambios todavía.</li>}
          </ul>
        </div>
      </section>
      {!editar && <p className="m-0 text-xs text-[#4A515C]">Solo Dirección puede cambiar precios. <Link href="/ayuda" className="underline">Ayuda</Link></p>}
    </div>
  )
}
