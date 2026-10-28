import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { s } from "@/lib/util"
import Importar from "@/components/Importar"

export const dynamic = "force-dynamic"

const num = (v: string | null) => (v ? Number(v.replace(/\./g, "").replace(",", ".")) || null : null)

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = s(fd.get("id"))
  const nombre = s(fd.get("nombre"))
  if (!nombre) return
  const mon = ["USD", "ARS"].includes(String(fd.get("moneda"))) ? String(fd.get("moneda")) : "USD"
  const v = [nombre, s(fd.get("categoria")), s(fd.get("descripcion")), num(s(fd.get("precio_desde"))), num(s(fd.get("precio_hasta"))), mon, s(fd.get("plazo")), s(fd.get("link"))]
  if (id) await q("update db_servicios set nombre=$1,categoria=$2,descripcion=$3,precio_desde=$4,precio_hasta=$5,moneda=$6,plazo=$7,link=$8,activo=$9 where id=$10", [...v, fd.get("activo") === "on", Number(id)])
  else await q("insert into db_servicios(nombre,categoria,descripcion,precio_desde,precio_hasta,moneda,plazo,link) values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (nombre) do nothing", v)
  await audit(u, id ? "edita_servicio_db" : "crea_servicio_db", "db_servicio", id ?? nombre)
  revalidatePath("/servicios")
}

function Campos({ x }: { x?: any }) {
  return (
    <>
      <label className="lbl md:col-span-3">Servicio<input name="nombre" defaultValue={x?.nombre ?? ""} required className="inp py-1.5" /></label>
      <label className="lbl md:col-span-2">Categoría<input name="categoria" defaultValue={x?.categoria ?? ""} placeholder="A medida / Producto" className="inp py-1.5" /></label>
      <label className="lbl md:col-span-7">Descripción<input name="descripcion" defaultValue={x?.descripcion ?? ""} className="inp py-1.5" /></label>
      <label className="lbl md:col-span-1">Moneda<select name="moneda" defaultValue={x?.moneda ?? "USD"} className="inp py-1.5 pl-2 pr-5 text-sm"><option>USD</option><option>ARS</option></select></label>
      <label className="lbl md:col-span-2">Desde<input name="precio_desde" inputMode="decimal" defaultValue={x?.precio_desde ?? ""} className="inp py-1.5" /></label>
      <label className="lbl md:col-span-2">Hasta<input name="precio_hasta" inputMode="decimal" defaultValue={x?.precio_hasta ?? ""} className="inp py-1.5" /></label>
      <label className="lbl md:col-span-2">Plazo típico<input name="plazo" defaultValue={x?.plazo ?? ""} placeholder="3 a 6 semanas" className="inp py-1.5" /></label>
      <label className="lbl md:col-span-3">Link (caso, PDF, página)<input name="link" type="url" defaultValue={x?.link ?? ""} placeholder="https://www.devisebit.com/…" className="inp py-1.5" /></label>
    </>
  )
}

export default async function Servicios() {
  const rows = await q<any>(`select s.*, (select count(*)::int from db_proyectos p where p.servicio_id=s.id) usos from db_servicios s order by s.activo desc, s.categoria nulls last, s.nombre`)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="m-0">Servicios</h1><p className="m-0 text-sm text-[#4A515C]">Lo que vende DEVISEBIT. El bot usa estos rangos de referencia, plazos y links para orientar al cliente y cerrar la venta (si un servicio no tiene rango, no da números). No se publican en la web ni en redes.</p></div><Importar ent="servicios" /></div>
      <div className="flex flex-col gap-2">
        {rows.map((x) => (
          <form key={x.id} action={guardar} className={`card py-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-end ${x.activo ? "" : "opacity-60"}`}>
            <input type="hidden" name="id" value={x.id} />
            <Campos x={x} />
            <label className="md:col-span-1 flex items-center gap-1.5 text-sm pb-2"><input type="checkbox" name="activo" defaultChecked={x.activo} /> Activo</label>
            <div className="md:col-span-1 flex flex-col items-start gap-0.5"><button className="btn-s py-1.5 px-3 text-xs">Guardar</button><span className="text-[11px] text-[#4A515C]">{x.usos} proy.</span></div>
          </form>
        ))}
      </div>
      <form action={guardar} className="card grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-dashed">
        <Campos />
        <div className="md:col-span-2"><button className="btn-p py-1.5 px-3 text-sm">Agregar</button></div>
      </form>
    </div>
  )
}
