import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"

export const dynamic = "force-dynamic"
export default async function Auditoria() {
  await requerir(["gerente"])
  const rows = await q<any>("select * from auditoria order by ts desc limit 300")
  return (
    <div className="flex flex-col gap-4">
      <h1 className="m-0">Auditoría</h1>
      <p className="m-0 text-sm text-[#4F5C69]">Registro de quién ingresó, vio o modificó datos (últimos 300 movimientos).</p>
      <div className="card p-0 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td className="whitespace-nowrap">{new Date(r.ts).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</td><td>{r.usuario ?? "—"}</td><td>{r.accion}</td><td>{r.entidad ? `${r.entidad} ${r.entidad_id ?? ""}` : "—"}</td><td>{r.detalle ?? ""}</td></tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}
