import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir, puede } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { CAMPOS, valores } from "@/lib/paciente"
import { MODULOS, TIPO_NOMBRE, fecha, s, hoyISO } from "@/lib/util"
import FormPaciente from "@/components/FormPaciente"

export const dynamic = "force-dynamic"

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const vals = valores(fd)
  const estado = s(fd.get("estado")) ?? "activo"
  await q(`update pacientes set ${CAMPOS.map((c, i) => `${c}=$${i + 1}`).join(",")}, estado=$${CAMPOS.length + 1} where id=$${CAMPOS.length + 2}`, [...vals, estado, id])
  await audit(u, "edicion_paciente", "paciente", id)
  revalidatePath(`/pacientes/${id}`)
  redirect(`/pacientes/${id}?ok=1`)
}

async function nuevaOP(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const r = await one<{ id: number }>(
    "insert into ordenes(paciente_id,nro_op,modulo,fecha_inicio,fecha_vencimiento,enf_mes,kin_mes,med_mes,notas) values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id",
    [id, s(fd.get("nro_op")), s(fd.get("modulo")), s(fd.get("fecha_inicio")), s(fd.get("fecha_vencimiento")), Number(fd.get("enf_mes") || 0), Number(fd.get("kin_mes") || 0), Number(fd.get("med_mes") || 0), s(fd.get("notas"))],
  )
  if (fd.get("renueva")) await q("update ordenes set estado='renovada' where paciente_id=$1 and estado='vigente' and id<>$2", [id, r!.id])
  await audit(u, "alta_op", "orden", r!.id, `paciente ${id}`)
  redirect(`/pacientes/${id}`)
}

async function estadoOP(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const op = Number(fd.get("op")), id = Number(fd.get("id")), est = String(fd.get("estado"))
  if (!["vigente", "vencida", "renovada", "baja"].includes(est)) return
  await q("update ordenes set estado=$1 where id=$2", [est, op])
  await audit(u, "estado_op", "orden", op, est)
  redirect(`/pacientes/${id}`)
}

async function equipo(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const ret = fd.get("retirar")
  if (ret) {
    await q("update equipamiento set fecha_retiro=$1 where id=$2", [hoyISO(), Number(ret)])
    await audit(u, "retiro_equipo", "equipamiento", String(ret))
  } else {
    await q("insert into equipamiento(paciente_id,item,fecha_entrega) values ($1,$2,$3)", [id, s(fd.get("item")), s(fd.get("fecha_entrega")) ?? hoyISO()])
    await audit(u, "entrega_equipo", "paciente", id)
  }
  redirect(`/pacientes/${id}`)
}

export default async function Ficha({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string } }) {
  const u = await requerir()
  const id = Number(params.id)
  const p = await one<any>("select * from pacientes where id=$1", [id])
  if (!p) notFound()
  await audit(u, "ver_ficha", "paciente", id)
  const ops = await q<any>("select * from ordenes where paciente_id=$1 order by fecha_inicio desc", [id])
  const eqs = await q<any>("select * from equipamiento where paciente_id=$1 order by fecha_retiro nulls first, fecha_entrega desc", [id])
  const vis = await q<any>("select v.*, pr.nombre prof from visitas v left join profesionales pr on pr.id=v.profesional_id where paciente_id=$1 order by fecha desc, id desc limit 100", [id])
  const ed = puede.editar(u)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/pacientes" className="text-sm text-[#4F5C69]">← Pacientes</Link>
          <h1 className="m-0">{p.apellido_nombre}</h1>
          <p className="m-0 text-sm text-[#4F5C69]">{p.obra_social} {p.nro_afiliado ? `· Afiliado ${p.nro_afiliado}` : ""} {p.localidad ? `· ${p.localidad}` : ""} · <strong>{p.estado}</strong></p>
        </div>
        {puede.registrarVisita(u) && <Link href={`/agenda/nueva?paciente=${id}`} className="btn-p">+ Registrar visita</Link>}
      </div>
      {searchParams.ok && <p className="m-0 text-sm text-[#0B5E31]">Cambios guardados.</p>}

      <section className="card">
        <h2 className="mt-0">Órdenes de prestación (OP)</h2>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>N.º OP</th><th>Módulo</th><th>Inicio</th><th>Vencimiento</th><th>Enf/Kin/Méd por mes</th><th>Estado</th></tr></thead>
            <tbody>
              {ops.map((o) => (
                <tr key={o.id}>
                  <td>{o.nro_op ?? "—"}</td><td><strong>{o.modulo}</strong></td><td>{fecha(o.fecha_inicio)}</td><td>{fecha(o.fecha_vencimiento)}</td>
                  <td>{o.enf_mes}/{o.kin_mes}/{o.med_mes}</td>
                  <td>
                    {ed ? (
                      <form action={estadoOP} className="flex gap-1">
                        <input type="hidden" name="op" value={o.id} /><input type="hidden" name="id" value={id} />
                        <select name="estado" defaultValue={o.estado} className="inp py-1 w-auto"><option>vigente</option><option>vencida</option><option>renovada</option><option>baja</option></select>
                        <button className="btn-s py-1">OK</button>
                      </form>
                    ) : o.estado}
                  </td>
                </tr>
              ))}
              {!ops.length && <tr><td colSpan={6} className="text-[#4F5C69]">Sin OP cargadas.</td></tr>}
            </tbody>
          </table>
        </div>
        {ed && (
          <details className="mt-3">
            <summary className="cursor-pointer font-semibold text-[#0B7A3B]">+ Cargar OP nueva o renovación</summary>
            <form action={nuevaOP} className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <input type="hidden" name="id" value={id} />
              <label className="lbl">N.º OP<input name="nro_op" className="inp" /></label>
              <label className="lbl">Módulo *<select name="modulo" required className="inp">{MODULOS.map((m) => <option key={m}>{m}</option>)}</select></label>
              <label className="lbl">Inicio *<input name="fecha_inicio" type="date" required defaultValue={hoyISO()} className="inp" /></label>
              <label className="lbl">Vencimiento<input name="fecha_vencimiento" type="date" className="inp" /></label>
              <label className="lbl">Enfermería/mes<input name="enf_mes" type="number" min={0} defaultValue={0} className="inp" /></label>
              <label className="lbl">Kinesiología/mes<input name="kin_mes" type="number" min={0} defaultValue={0} className="inp" /></label>
              <label className="lbl">Médico/mes<input name="med_mes" type="number" min={0} defaultValue={1} className="inp" /></label>
              <label className="lbl">Notas<input name="notas" className="inp" /></label>
              <label className="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" name="renueva" defaultChecked /> Es renovación (marca la OP anterior como renovada)</label>
              <div className="col-span-2 md:col-span-4"><button className="btn-p">Guardar OP</button></div>
            </form>
          </details>
        )}
      </section>

      <section className="card">
        <h2 className="mt-0">Visitas</h2>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Profesional</th><th>Estado</th><th>APP PAMI</th><th>Signos</th><th>Evolución</th></tr></thead>
            <tbody>
              {vis.map((v) => (
                <tr key={v.id}>
                  <td>{fecha(v.fecha)}</td><td>{TIPO_NOMBRE[v.tipo]}</td><td>{v.prof ?? "—"}</td><td>{v.estado}</td>
                  <td>{v.app_pami ? "Sí" : <span className="text-rojo font-semibold">No</span>}</td>
                  <td className="text-xs">{[v.ta && `TA ${v.ta}`, v.fc && `FC ${v.fc}`, v.temp && `T ${v.temp}`, v.sat && `Sat ${v.sat}`].filter(Boolean).join(" · ") || "—"}</td>
                  <td className="text-xs max-w-[320px]">{v.evolucion ?? "—"}</td>
                </tr>
              ))}
              {!vis.length && <tr><td colSpan={7} className="text-[#4F5C69]">Sin visitas registradas.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="mt-0">Equipamiento</h2>
        <ul className="m-0 p-0 list-none flex flex-col gap-2">
          {eqs.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 text-sm">
              <strong>{e.item}</strong> · entregado {fecha(e.fecha_entrega)} {e.fecha_retiro ? `· retirado ${fecha(e.fecha_retiro)}` : ""}
              {ed && !e.fecha_retiro && (
                <form action={equipo}><input type="hidden" name="id" value={id} /><input type="hidden" name="retirar" value={e.id} /><button className="btn-s py-1">Marcar retirado</button></form>
              )}
            </li>
          ))}
          {!eqs.length && <li className="text-sm text-[#4F5C69]">Sin equipamiento.</li>}
        </ul>
        {ed && (
          <form action={equipo} className="flex flex-wrap gap-2 items-end mt-3">
            <input type="hidden" name="id" value={id} />
            <label className="lbl">Ítem<input name="item" required list="eqs" className="inp" /></label>
            <datalist id="eqs">{["Cama", "Colchón antiescaras", "Silla de ruedas", "Andador", "Elevador", "Concentrador de oxígeno", "Aspirador"].map((x) => <option key={x} value={x} />)}</datalist>
            <label className="lbl">Entrega<input name="fecha_entrega" type="date" defaultValue={hoyISO()} className="inp" /></label>
            <button className="btn-s">Agregar</button>
          </form>
        )}
      </section>

      <section className="card">
        <h2 className="mt-0">Datos del paciente</h2>
        {ed ? (
          <form action={guardar} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={id} />
            <FormPaciente p={p} />
            <div><button className="btn-p">Guardar cambios</button></div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm m-0">
            {[["DNI", p.dni], ["Domicilio", p.domicilio], ["Localidad", p.localidad], ["Teléfono", p.telefono], ["Contacto familiar", p.contacto_familiar], ["Médico de cabecera", p.medico_cabecera]].map(([k, v]) => (
              <div key={k}><dt className="inline font-semibold">{k}: </dt><dd className="inline m-0">{v ?? "—"}</dd></div>
            ))}
          </dl>
        )}
      </section>
    </div>
  )
}
