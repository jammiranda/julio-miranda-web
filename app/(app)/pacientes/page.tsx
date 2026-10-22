import Link from "next/link"
import { requerir, puede } from "@/lib/auth"
import { q } from "@/lib/db"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"
const EST: Record<string, string> = { activo: "bg-[#E3F2E8] text-[#0B5E31]", alta: "bg-slate-100 text-slate-600", fallecido: "bg-slate-200 text-slate-700", suspendido: "bg-amber-50 text-amber-700" }

export default async function Pacientes({ searchParams }: { searchParams: { b?: string; e?: string } }) {
  const u = await requerir()
  const b = (searchParams.b ?? "").trim()
  const e = searchParams.e ?? "activo"
  const rows = await q<any>(
    `select p.id, p.apellido_nombre, p.dni, p.nro_afiliado, p.localidad, p.estado,
       o.modulo, o.fecha_vencimiento, (select max(fecha) from visitas v where v.paciente_id=p.id and v.estado='realizada') ultima
     from pacientes p
     left join lateral (select modulo, fecha_vencimiento from ordenes where paciente_id=p.id and estado='vigente' order by fecha_inicio desc limit 1) o on true
     where ($1='' or p.apellido_nombre ilike '%'||$1||'%' or p.dni ilike '%'||$1||'%' or p.nro_afiliado ilike '%'||$1||'%')
       and ($2='todos' or p.estado=$2)
     order by p.apellido_nombre limit 500`,
    [b, e],
  )
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="m-0">Pacientes</h1>
        {puede.editar(u) && <Link href="/pacientes/nuevo" className="btn-p">+ Nuevo paciente</Link>}
      </div>
      <form className="card flex flex-wrap gap-3 items-end">
        <label className="lbl flex-1 min-w-[200px]">Buscar<input name="b" defaultValue={b} placeholder="Nombre, DNI o N.º de afiliado" className="inp" /></label>
        <label className="lbl">Estado
          <select name="e" defaultValue={e} className="inp">
            <option value="activo">Activos</option><option value="suspendido">Suspendidos</option><option value="alta">Alta</option><option value="fallecido">Fallecidos</option><option value="todos">Todos</option>
          </select>
        </label>
        <button className="btn-s">Filtrar</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="tbl">
          <thead><tr><th>Paciente</th><th>DNI</th><th>Afiliado</th><th>Localidad</th><th>Módulo</th><th>Vence OP</th><th>Última visita</th><th>Estado</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/pacientes/${r.id}`} className="font-semibold text-[#0B5E31] hover:underline">{r.apellido_nombre}</Link></td>
                <td>{r.dni ?? "—"}</td><td>{r.nro_afiliado ?? "—"}</td><td>{r.localidad ?? "—"}</td>
                <td>{r.modulo ?? "—"}</td><td>{fecha(r.fecha_vencimiento)}</td><td>{fecha(r.ultima)}</td>
                <td><span className={`chip ${EST[r.estado] ?? ""}`}>{r.estado}</span></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={8} className="text-center text-[#4F5C69] py-8">No hay pacientes con ese filtro.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#4F5C69] m-0">{rows.length} paciente(s).</p>
    </div>
  )
}
