import { redirect } from "next/navigation"
import { requerir, puede } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { LOCALIDADES, s } from "@/lib/util"

export const dynamic = "force-dynamic"

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const tog = fd.get("toggle")
  if (tog) {
    await q("update profesionales set activo = not activo where id=$1", [Number(tog)])
    await audit(u, "estado_profesional", "profesional", String(tog))
  } else {
    await q("insert into profesionales(nombre,especialidad,matricula,telefono,localidad) values ($1,$2,$3,$4,$5)", [s(fd.get("nombre")), s(fd.get("especialidad")), s(fd.get("matricula")), s(fd.get("telefono")), s(fd.get("localidad"))])
    await audit(u, "alta_profesional", "profesional", String(fd.get("nombre")))
  }
  redirect("/profesionales")
}

export default async function Profesionales() {
  const u = await requerir(["gerente", "coordinacion"])
  const rows = await q<any>(
    `select pr.*, (select count(*) from visitas v where v.profesional_id=pr.id and v.estado='realizada' and v.fecha >= date_trunc('month', now()))::int mes
     from profesionales pr order by activo desc, nombre`,
  )
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0">Profesionales</h1>
      <div className="card p-0 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Nombre</th><th>Especialidad</th><th>Matrícula</th><th>Teléfono</th><th>Localidad</th><th>Visitas del mes</th><th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.activo ? "" : "opacity-50"}>
                <td className="font-semibold">{r.nombre}</td><td>{r.especialidad}</td><td>{r.matricula ?? "—"}</td><td>{r.telefono ?? "—"}</td><td>{r.localidad ?? "—"}</td><td>{r.mes}</td>
                <td>{puede.editar(u) && <form action={guardar}><input type="hidden" name="toggle" value={r.id} /><button className="btn-s py-1">{r.activo ? "Dar de baja" : "Reactivar"}</button></form>}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="text-center text-[#4F5C69] py-6">Todavía no hay profesionales cargados.</td></tr>}
          </tbody>
        </table>
      </div>
      <form action={guardar} className="card grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <h2 className="m-0 col-span-full text-base">Agregar profesional</h2>
        <label className="lbl">Nombre *<input name="nombre" required className="inp" /></label>
        <label className="lbl">Especialidad *<select name="especialidad" className="inp"><option>Enfermería</option><option>Kinesiología</option><option>Médico</option><option>Fonoaudiología</option><option>Cuidador</option></select></label>
        <label className="lbl">Matrícula<input name="matricula" className="inp" /></label>
        <label className="lbl">Teléfono<input name="telefono" className="inp" /></label>
        <label className="lbl">Localidad<input name="localidad" list="locs" className="inp" /><datalist id="locs">{LOCALIDADES.map((l) => <option key={l} value={l} />)}</datalist></label>
        <button className="btn-p">Agregar</button>
      </form>
    </div>
  )
}
