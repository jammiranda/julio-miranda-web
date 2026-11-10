import { revalidatePath } from "next/cache"
import { requerir, puede } from "@/lib/auth"
import { redirect } from "next/navigation"
import ListaServicios, { type Servicio } from "./Lista"
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

async function eliminar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  if (!id) return
  await q("update db_proyectos set servicio_id=null where servicio_id=$1", [id])
  await q("delete from db_servicios where id=$1", [id])
  await audit(u, "elimina_servicio_db", "db_servicio", id)
  revalidatePath("/servicios")
  redirect("/servicios")
}

export default async function Servicios() {
  const u = await requerir()
  const rows = await q<Servicio>(`select s.*, (select count(*)::int from db_proyectos p where p.servicio_id=s.id) usos from db_servicios s order by s.activo desc, s.categoria nulls last, s.nombre`)
  return (
    <div className="flex flex-col gap-4">
      <header className="pag-cab">
        <div><div className="eyebrow">Catálogo</div><h1 className="m-0">Servicios</h1><p>Lo que vende DEVISEBIT. El bot usa estos rangos, plazos y links para orientar al cliente (si un servicio no tiene rango, no da números). No se publican en la web ni en redes.</p></div>
        <div className="pag-acc"><Importar ent="servicios" /></div>
      </header>
      <ListaServicios filas={rows} guardar={guardar} eliminar={eliminar} edita={puede.editar(u)} admin={puede.admin(u)} />
    </div>
  )
}
