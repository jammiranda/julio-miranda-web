import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { s } from "@/lib/util"

export const dynamic = "force-dynamic"

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = s(fd.get("id"))
  const nombre = s(fd.get("nombre"))
  if (!nombre) return
  const precio = s(fd.get("precio_ref"))
  const v = [nombre, s(fd.get("categoria")), s(fd.get("descripcion")), precio ? Number(precio.replace(/\./g, "").replace(",", ".")) || null : null, fd.get("activo") === "on"]
  if (id) await q("update db_servicios set nombre=$1,categoria=$2,descripcion=$3,precio_ref=$4,activo=$5 where id=$6", [...v, Number(id)])
  else await q("insert into db_servicios(nombre,categoria,descripcion,precio_ref,activo) values ($1,$2,$3,$4,true) on conflict (nombre) do nothing", v.slice(0, 4))
  await audit(u, id ? "edita_servicio_db" : "crea_servicio_db", "db_servicio", id ?? nombre)
  revalidatePath("/servicios")
}

export default async function Servicios() {
  const rows = await q<any>(`select s.*, (select count(*)::int from db_proyectos p where p.servicio_id=s.id) usos from db_servicios s order by s.activo desc, s.categoria nulls last, s.nombre`)
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="m-0">Servicios</h1><p className="m-0 text-sm text-[#4A515C]">Lo que vende DEVISEBIT. El precio de referencia es interno: no se muestra en el bot ni en la web.</p></div>
      <div className="flex flex-col gap-2">
        {rows.map((x) => (
          <form key={x.id} action={guardar} className={`card py-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end ${x.activo ? "" : "opacity-60"}`}>
            <input type="hidden" name="id" value={x.id} />
            <label className="lbl md:col-span-3">Servicio<input name="nombre" defaultValue={x.nombre} required className="inp py-1.5" /></label>
            <label className="lbl md:col-span-2">Categoría<input name="categoria" defaultValue={x.categoria ?? ""} className="inp py-1.5" /></label>
            <label className="lbl md:col-span-4">Descripción<input name="descripcion" defaultValue={x.descripcion ?? ""} className="inp py-1.5" /></label>
            <label className="lbl md:col-span-1">Precio ref.<input name="precio_ref" inputMode="decimal" defaultValue={x.precio_ref ?? ""} className="inp py-1.5" /></label>
            <label className="md:col-span-1 flex items-center gap-1.5 text-sm pb-2"><input type="checkbox" name="activo" defaultChecked={x.activo} /> Activo</label>
            <div className="md:col-span-1 flex flex-col items-start gap-0.5"><button className="btn-s py-1.5 px-3 text-xs">Guardar</button><span className="text-[11px] text-[#4A515C]">{x.usos} proy.</span></div>
          </form>
        ))}
      </div>
      <form action={guardar} className="card grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-dashed">
        <label className="lbl md:col-span-3">Nuevo servicio<input name="nombre" required className="inp py-1.5" /></label>
        <label className="lbl md:col-span-2">Categoría<input name="categoria" placeholder="A medida / Producto" className="inp py-1.5" /></label>
        <label className="lbl md:col-span-5">Descripción<input name="descripcion" className="inp py-1.5" /></label>
        <label className="lbl md:col-span-1">Precio ref.<input name="precio_ref" inputMode="decimal" className="inp py-1.5" /></label>
        <div className="md:col-span-1"><button className="btn-p py-1.5 px-3 text-sm">Agregar</button></div>
      </form>
    </div>
  )
}
