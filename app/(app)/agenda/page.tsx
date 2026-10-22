import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir, puede } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { TIPO_NOMBRE, fecha, hoyISO } from "@/lib/util"

import BarraDatos from "@/components/BarraDatos"

export const dynamic = "force-dynamic"

async function marcar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion", "profesional"])
  const id = Number(fd.get("v")), est = String(fd.get("estado")), d = String(fd.get("d"))
  if (!["realizada", "no_realizada", "programada"].includes(est)) return
  await q("update visitas set estado=$1, app_pami=$2 where id=$3", [est, fd.get("app") === "on", id])
  await audit(u, "estado_visita", "visita", id, est)
  redirect(`/agenda?d=${d}`)
}

function sumar(d: string, n: number) {
  const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10)
}

export default async function Agenda({ searchParams }: { searchParams: { d?: string } }) {
  const u = await requerir()
  const d = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d ?? "") ? searchParams.d! : hoyISO()
  const vis = await q<any>(
    `select v.*, p.apellido_nombre, p.localidad, p.domicilio, pr.nombre prof
     from visitas v join pacientes p on p.id=v.paciente_id left join profesionales pr on pr.id=v.profesional_id
     where v.fecha=$1 order by p.localidad nulls last, p.apellido_nombre`,
    [d],
  )
  const ed = puede.registrarVisita(u)
  const tot = { prog: vis.filter((v) => v.estado === "programada").length, real: vis.filter((v) => v.estado === "realizada").length, sinApp: vis.filter((v) => v.estado === "realizada" && !v.app_pami).length }
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">Agenda y visitas</h1>
          <p className="m-0 text-sm text-[#4F5C69]">{new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-start">{puede.editar(u) && <BarraDatos ent="visitas" />}{ed && <Link href={`/agenda/nueva?fecha=${d}`} className="btn-p">+ Programar o registrar visita</Link>}</div>
      </div>
      <form className="flex flex-wrap gap-2 items-center">
        <Link href={`/agenda?d=${sumar(d, -1)}`} className="btn-s">← Día anterior</Link>
        <input type="date" name="d" defaultValue={d} className="inp w-auto" />
        <button className="btn-s">Ir</button>
        <Link href={`/agenda?d=${hoyISO()}`} className="btn-s">Hoy</Link>
        <Link href={`/agenda?d=${sumar(d, 1)}`} className="btn-s">Día siguiente →</Link>
      </form>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="chip bg-[#E3F2E8] text-[#0B5E31]">Realizadas: {tot.real}</span>
        <span className="chip bg-amber-50 text-amber-700">Programadas: {tot.prog}</span>
        {tot.sinApp > 0 && <span className="chip bg-red-50 text-rojo">Sin registrar en APP PAMI: {tot.sinApp}</span>}
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Paciente</th><th>Localidad</th><th>Tipo</th><th>Profesional</th><th>Estado</th></tr></thead>
          <tbody>
            {vis.map((v) => (
              <tr key={v.id}>
                <td><Link href={`/pacientes/${v.paciente_id}`} className="font-semibold text-[#0B5E31] hover:underline">{v.apellido_nombre}</Link><div className="text-xs text-[#4F5C69]">{v.domicilio ?? ""}</div></td>
                <td>{v.localidad ?? "—"}</td><td>{TIPO_NOMBRE[v.tipo]}</td><td>{v.prof ?? "—"}</td>
                <td>
                  {ed ? (
                    <form action={marcar} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="v" value={v.id} /><input type="hidden" name="d" value={d} />
                      <select name="estado" defaultValue={v.estado} className="inp py-1 w-auto"><option value="programada">Programada</option><option value="realizada">Realizada</option><option value="no_realizada">No realizada</option></select>
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="app" defaultChecked={v.app_pami} /> APP PAMI</label>
                      <button className="btn-s py-1">OK</button>
                    </form>
                  ) : v.estado}
                </td>
              </tr>
            ))}
            {!vis.length && <tr><td colSpan={5} className="text-center text-[#4F5C69] py-8">No hay visitas para este día.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#4F5C69] m-0">Recordatorio: cada visita realizada debe quedar registrada en la APP PAMI Prestadores; lo no registrado no se paga.</p>
      <p className="text-xs text-[#4F5C69] m-0">Fecha mostrada: {fecha(d)}</p>
    </div>
  )
}
