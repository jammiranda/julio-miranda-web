import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir, puede } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { ESTADOS, CANAL, hace, fechaHora } from "@/lib/consultas"

export const dynamic = "force-dynamic"

async function actualizar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const est = String(fd.get("estado"))
  if (!ESTADOS.some((e) => e.v === est)) return
  await q("update consultas set estado=$1, asignado=$2, notas=$3, actualizado=now() where id=$4", [est, s(fd.get("asignado")), s(fd.get("notas")), id])
  await audit(u, "estado_consulta", "consulta", id, est)
  redirect(`/consultas/${id}?ok=1`)
}

async function aPaciente(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select * from consultas where id=$1", [id])
  if (!c) redirect("/consultas")
  const p = await one<{ id: number }>(
    "insert into pacientes(apellido_nombre,obra_social,nro_afiliado,localidad,contacto_familiar,tel_familiar,notas) values ($1,$2,$3,$4,$5,$6,$7) returning id",
    [String(c.paciente_nombre ?? c.nombre ?? "SIN NOMBRE").toUpperCase(), c.obra_social ?? "PAMI", c.nro_afiliado, c.localidad, c.nombre, c.telefono, `Ingresó por consulta #${id} (${CANAL[c.canal] ?? c.canal}). ${c.motivo ?? ""}`],
  )
  await q("update consultas set estado='ingreso', paciente_id=$1, actualizado=now() where id=$2", [p!.id, id])
  await audit(u, "consulta_a_paciente", "consulta", id, `paciente ${p!.id}`)
  redirect(`/pacientes/${p!.id}`)
}

export default async function Consulta({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; nueva?: string } }) {
  const u = await requerir()
  const id = Number(params.id)
  const c = await one<any>("select * from consultas where id=$1", [id])
  if (!c) notFound()
  const est = ESTADOS.find((e) => e.v === c.estado)!
  const ed = puede.editar(u)
  const tel = c.telefono ? String(c.telefono).replace(/\D/g, "") : null
  const otras = c.telefono ? await q<any>("select id, creado, estado, motivo from consultas where telefono=$1 and id<>$2 order by creado desc limit 10", [c.telefono, id]) : []
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/consultas" className="text-sm text-[#4F5C69]">← Consultas</Link>
          <h1 className="m-0">{c.nombre ?? "Sin nombre"}</h1>
          <p className="m-0 text-sm text-[#4F5C69]">Consulta #{c.id} · {CANAL[c.canal] ?? c.canal} · entró el {fechaHora(c.creado)} ({hace(c.creado)})</p>
        </div>
        <span className={`chip text-sm px-3 py-1 ${est.c}`}>{est.n}</span>
      </div>
      {(searchParams.ok || searchParams.nueva) && <p className="m-0 text-sm text-[#0B5E31]">Guardado.</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <section className="card">
            <h2 className="mt-0">Datos</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 m-0 text-sm">
              {[["Quién consulta", c.nombre], ["Teléfono", c.telefono], ["Paciente", c.paciente_nombre], ["Cobertura", c.obra_social], ["N.º de afiliado", c.nro_afiliado], ["Localidad", c.localidad], ["Motivo", c.motivo]].map(([k, v]) => (
                <div key={k}><dt className="text-xs font-semibold uppercase tracking-wider text-[#4F5C69]">{k}</dt><dd className="m-0">{v || "—"}</dd></div>
              ))}
            </dl>
          </section>
          <section className="card">
            <h2 className="mt-0">Mensaje</h2>
            <p className="m-0 whitespace-pre-line text-[15px]">{c.mensaje || "Sin mensaje."}</p>
          </section>
          {otras.length > 0 && (
            <section className="card">
              <h2 className="mt-0">Otras consultas de este teléfono</h2>
              <ul className="m-0 p-0 list-none flex flex-col gap-1 text-sm">
                {otras.map((o) => <li key={o.id}><Link href={`/consultas/${o.id}`} className="underline">#{o.id}</Link> · {fechaHora(o.creado)} · {o.motivo ?? "—"} · {ESTADOS.find((e) => e.v === o.estado)?.n}</li>)}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          {tel && (
            <a href={`https://wa.me/${tel.startsWith("54") ? tel : "549" + tel}`} target="_blank" rel="noopener noreferrer" className="btn-p">Responder por WhatsApp</a>
          )}
          {c.paciente_id ? (
            <Link href={`/pacientes/${c.paciente_id}`} className="btn-s">Ver ficha del paciente</Link>
          ) : ed && (
            <form action={aPaciente}><input type="hidden" name="id" value={c.id} /><button className="btn-s w-full">Pasar a paciente</button></form>
          )}
          {ed ? (
            <form action={actualizar} className="card flex flex-col gap-3">
              <h2 className="m-0 text-base">Seguimiento</h2>
              <input type="hidden" name="id" value={c.id} />
              <label className="lbl">Estado<select name="estado" defaultValue={c.estado} className="inp">{ESTADOS.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}</select></label>
              <label className="lbl">Responsable<input name="asignado" defaultValue={c.asignado ?? u.nombre} className="inp" /></label>
              <label className="lbl">Notas internas<textarea name="notas" rows={5} defaultValue={c.notas ?? ""} className="inp" placeholder="Qué se habló, próximos pasos…" /></label>
              <button className="btn-p">Guardar</button>
              <p className="m-0 text-xs text-[#4F5C69]">Última actualización: {fechaHora(c.actualizado)}</p>
            </form>
          ) : (
            <section className="card text-sm"><strong>Responsable:</strong> {c.asignado ?? "Sin asignar"}<p className="mb-0 whitespace-pre-line">{c.notas}</p></section>
          )}
        </aside>
      </div>
    </div>
  )
}
