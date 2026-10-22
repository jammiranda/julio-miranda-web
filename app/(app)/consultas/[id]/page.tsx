import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir, puede } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { ESTADOS, CANAL, hace, fechaHora } from "@/lib/consultas"
import { responderDesdeCRM } from "@/lib/bot"
import type { Empresa } from "@/lib/bots/conocimiento"

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

async function responder(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select empresa, telefono from consultas where id=$1", [id])
  const texto = s(fd.get("texto"))
  if (!c || !texto || (c.empresa === "devisebit" && u.rol !== "gerente")) redirect(`/consultas/${id}`)
  const r = await responderDesdeCRM(c.empresa as Empresa, String(c.telefono).replace(/\D/g, ""), texto!, u.nombre)
  await q("update consultas set necesita_humano=false, asignado=coalesce(asignado,$1), estado=case when estado='nueva' then 'contactada' else estado end, actualizado=now() where id=$2", [u.nombre, id])
  await audit(u, "responde_whatsapp", "consulta", id)
  redirect(`/consultas/${id}?${r.ok ? "env=1" : "enverr=" + encodeURIComponent(r.error ?? "error")}`)
}

async function bot(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select empresa, telefono from consultas where id=$1", [id])
  if (!c) redirect("/consultas")
  const pausar = fd.get("a") === "pausar"
  await q(`update wa_chats set bot_pausado_hasta=${pausar ? "now() + interval '7 days'" : "null"}, pausa_motivo=${pausar ? "'equipo'" : "null"} where empresa=$1 and wa_id=$2`, [c.empresa, String(c.telefono).replace(/\D/g, "")])
  if (!pausar) await q("update consultas set necesita_humano=false where id=$1", [id])
  await audit(u, pausar ? "pausa_bot" : "reactiva_bot", "consulta", id)
  redirect(`/consultas/${id}`)
}

async function ensenar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select empresa from consultas where id=$1", [id])
  if (!c || (c.empresa === "devisebit" && u.rol !== "gerente")) redirect(`/consultas/${id}`)
  const respuesta = s(fd.get("respuesta"))
  if (respuesta) await q("insert into bot_conocimiento(empresa,pregunta,respuesta,origen,creado_por) values ($1,$2,$3,'conversacion',$4)", [c.empresa, s(fd.get("pregunta")), respuesta, u.nombre])
  await audit(u, "bot_ensenar", "consulta", id)
  redirect(`/consultas/${id}?ens=1`)
}

export default async function Consulta({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; nueva?: string; env?: string; enverr?: string; ens?: string } }) {
  const u = await requerir()
  const id = Number(params.id)
  const c = await one<any>("select * from consultas where id=$1", [id])
  if (!c) notFound()
  if (c.empresa === "devisebit" && u.rol !== "gerente") notFound()
  const waId = c.telefono ? String(c.telefono).replace(/\D/g, "") : ""
  const chat = waId ? await one<any>("select * from wa_chats where empresa=$1 and wa_id=$2", [c.empresa, waId]) : null
  const msgs = chat ? await q<any>("select autor, texto, tipo, autor_nombre, creado from wa_mensajes where empresa=$1 and wa_id=$2 order by creado desc limit 100", [c.empresa, waId]) : []
  const ventana = chat?.ultimo_entrante && Date.now() - new Date(chat.ultimo_entrante).getTime() < 24 * 3600e3
  const botPausado = chat?.pausa_motivo === "equipo" && chat?.bot_pausado_hasta && new Date(chat.bot_pausado_hasta).getTime() > Date.now()
  const est = ESTADOS.find((e) => e.v === c.estado)!
  const ed = puede.editar(u)
  const tel = c.telefono ? String(c.telefono).replace(/\D/g, "") : null
  const otras = c.telefono ? await q<any>("select id, creado, estado, motivo from consultas where telefono=$1 and id<>$2 and empresa=$3 order by creado desc limit 10", [c.telefono, id, c.empresa]) : []
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={c.empresa === "devisebit" ? "/consultas?e=devisebit" : "/consultas"} className="text-sm text-[#4F5C69]">← Consultas{c.empresa === "devisebit" ? " DEVISEBIT" : ""}</Link>
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
              {(c.empresa === "devisebit" ? [["Quién consulta", c.nombre], ["Teléfono", c.telefono], ["Organización", c.organizacion], ["Email", c.email], ["Motivo", c.motivo]] : [["Quién consulta", c.nombre], ["Teléfono", c.telefono], ["Paciente", c.paciente_nombre], ["Cobertura", c.obra_social], ["N.º de afiliado", c.nro_afiliado], ["Localidad", c.localidad], ["Motivo", c.motivo]]).map(([k, v]) => (
                <div key={k}><dt className="text-xs font-semibold uppercase tracking-wider text-[#4F5C69]">{k}</dt><dd className="m-0">{v || "—"}</dd></div>
              ))}
            </dl>
          </section>
          {chat ? (
            <section className="card flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0">Conversación de WhatsApp</h2>
                {ed && (
                  <form action={bot} className="flex items-center gap-2 text-sm">
                    <input type="hidden" name="id" value={c.id} /><input type="hidden" name="a" value={botPausado ? "activar" : "pausar"} />
                    <span className={botPausado ? "text-amber-700" : "text-[#0B5E31]"}>{botPausado ? "Bot en pausa: responde el equipo" : "El bot está respondiendo"}</span>
                    <button className="btn-s py-1 px-3 text-xs">{botPausado ? "Reactivar bot" : "Pausar bot"}</button>
                  </form>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 max-h-[480px] overflow-y-auto bg-[#EEF3EF] rounded-xl p-3">
                {msgs.map((m: any, i: number) => {
                  const previa = msgs.slice(i + 1).find((x: any) => x.autor === "cliente")
                  return (
                  <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${m.autor === "cliente" ? "self-start bg-white" : m.autor === "bot" ? "self-end bg-[#DCF3E3]" : "self-end bg-[#0B7A3B] text-white"}`}>
                    {m.texto ?? `(${m.tipo})`}
                    <div className={`text-[10px] mt-1 ${m.autor === "equipo" ? "text-white/80" : "text-[#4F5C69]"}`}>{m.autor === "cliente" ? (m.autor_nombre ?? "Cliente") : m.autor === "bot" ? "Asistente" : m.autor_nombre} · {fechaHora(m.creado)}</div>
                    {ed && m.autor === "equipo" && m.texto && (
                      <details className="mt-1 text-[#26323E]">
                        <summary className="cursor-pointer text-[11px] text-white/90 underline">Enseñar al bot</summary>
                        <form action={ensenar} className="flex flex-col gap-1 mt-1 bg-white rounded-lg p-2">
                          <input type="hidden" name="id" value={c.id} />
                          <input name="pregunta" defaultValue={previa?.texto ?? ""} className="inp py-1 text-xs" placeholder="Cuando pregunten…" />
                          <textarea name="respuesta" defaultValue={m.texto} rows={3} className="inp py-1 text-xs" />
                          <button className="btn-p py-1 text-xs">Guardar en el conocimiento del bot</button>
                        </form>
                      </details>
                    )}
                  </div>
                )})}
              </div>
              {ed && (ventana ? (
                <form action={responder} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <textarea name="texto" rows={3} required className="inp" placeholder="Escribí la respuesta: sale por WhatsApp y el bot queda en pausa en este chat" />
                  <div><button className="btn-p">Enviar por WhatsApp</button></div>
                </form>
              ) : (
                <p className="m-0 text-xs text-[#4F5C69]">Pasaron más de 24 h desde el último mensaje del cliente: WhatsApp solo permite responder con una plantilla aprobada. Usá el botón de WhatsApp de la derecha.</p>
              ))}
              {searchParams.env && <p className="m-0 text-sm text-[#0B5E31]">Mensaje enviado.</p>}
              {searchParams.ens && <p className="m-0 text-sm text-[#0B5E31]">Listo: el bot ya lo sabe.</p>}
              {searchParams.enverr && <p className="m-0 text-sm text-rojo">No se pudo enviar: {searchParams.enverr}</p>}
            </section>
          ) : (
            <section className="card">
              <h2 className="mt-0">Mensaje</h2>
              <p className="m-0 whitespace-pre-line text-[15px]">{c.mensaje || "Sin mensaje."}</p>
            </section>
          )}
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
          ) : ed && c.empresa === "sanpatricio" && (
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
