import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir, puede } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { ESTADOS, CANAL, hace, fechaHora } from "@/lib/consultas"
import { responderDesdeCRM } from "@/lib/bot"
import type { Empresa } from "@/lib/bots/conocimiento"
import { linkBrief } from "@/lib/brief"
import { linkAgenda, local } from "@/lib/agenda"
import { generarPropuesta } from "@/lib/propuesta"
import Copiar from "@/components/Copiar"
import { material, materialesPara, lineaDe } from "@/lib/materiales"
import { enviarTexto } from "@/lib/whatsapp"
import { borrarConsultas } from "@/lib/consultas-borrar"
import BotonConfirmar from "@/components/BotonConfirmar"
import { enviarAConsulta, type Envio } from "@/lib/consultas-email"

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

async function eliminar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  const n = await borrarConsultas([id]).catch(() => 0)
  if (n) await audit(u, "elimina_consultas", "consulta", id, "1 consulta")
  redirect(n ? "/consultas?borr=1" : `/consultas/${id}`)
}

async function responder(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select empresa, telefono, chat_id from consultas where id=$1", [id])
  const texto = s(fd.get("texto"))
  if (!c || !texto) redirect(`/consultas/${id}`)
  const r = await responderDesdeCRM(c.empresa as Empresa, c.chat_id ?? String(c.telefono).replace(/\D/g, ""), texto!, u.nombre)
  // Solo queda como atendida si el mensaje salió: si falló el envío, sigue en «Sin atender» y con el pedido de una persona
  if (r.ok) await q("update consultas set necesita_humano=false, asignado=coalesce(asignado,$1), estado=case when estado='nueva' then 'contactada' else estado end, actualizado=now() where id=$2", [u.nombre, id])
  await audit(u, "responde_whatsapp", "consulta", id, r.ok ? undefined : `no salió: ${String(r.error ?? "error").slice(0, 200)}`)
  redirect(`/consultas/${id}?${r.ok ? "env=1" : "enverr=" + encodeURIComponent(r.error ?? "error")}`)
}

/** Alguien del equipo le escribió al cliente (brief, agenda o material): la consulta deja de figurar como «Sin atender». */
const atendidaPor = (id: number, nombre: string) =>
  q("update consultas set asignado=coalesce(asignado,$1), estado=case when estado='nueva' then 'contactada' else estado end, actualizado=now() where id=$2", [nombre, id])

async function bot(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select empresa, telefono, chat_id from consultas where id=$1", [id])
  if (!c) redirect("/consultas")
  const pausar = fd.get("a") === "pausar"
  await q(`update wa_chats set bot_pausado_hasta=${pausar ? "now() + interval '7 days'" : "null"}, pausa_motivo=${pausar ? "'equipo'" : "null"} where empresa=$1 and wa_id=$2`, [c.empresa, c.chat_id ?? String(c.telefono).replace(/\D/g, "")])
  if (!pausar) await q("update consultas set necesita_humano=false where id=$1", [id])
  await audit(u, pausar ? "pausa_bot" : "reactiva_bot", "consulta", id)
  redirect(`/consultas/${id}`)
}

async function mandarBrief(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select nombre, telefono, chat_id from consultas where id=$1", [id])
  if (!c) redirect("/consultas")
  const link = await linkBrief(id)
  const texto = `${c.nombre ? `${c.nombre.split(" ")[0]}, ` : ""}para armarte una *propuesta preliminar con alcance, plazo e inversión en 48 h hábiles*, completá este brief de 3 minutos: ${link}`
  const r = await responderDesdeCRM("devisebit", c.chat_id ?? String(c.telefono).replace(/\D/g, ""), texto, u.nombre)
  if (r.ok) await atendidaPor(id, u.nombre)
  await audit(u, "envia_brief", "consulta", id)
  redirect(`/consultas/${id}?${r.ok ? "env=1" : "enverr=" + encodeURIComponent(r.error ?? "error")}`)
}

async function mandarAgenda(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select nombre, telefono, chat_id from consultas where id=$1", [id])
  if (!c) redirect("/consultas")
  await linkBrief(id)
  const tok = (await one<{ brief_token: string }>("select brief_token from consultas where id=$1", [id]))!.brief_token
  const texto = `${c.nombre ? `${c.nombre.split(" ")[0]}, ` : ""}elegí acá el día y horario para la videollamada de 30 minutos (sin costo): ${linkAgenda(tok)}`
  const r = await responderDesdeCRM("devisebit", c.chat_id ?? String(c.telefono).replace(/\D/g, ""), texto, u.nombre)
  if (r.ok) await atendidaPor(id, u.nombre)
  redirect(`/consultas/${id}?${r.ok ? "env=1" : "enverr=" + encodeURIComponent(r.error ?? "error")}`)
}

/** Manda material comercial (brochure, lista de precios, landing, datos de pago…) sin pausar al bot. */
async function mandarMaterial(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const m = material(String(fd.get("k") ?? ""))
  const c = await one<any>("select nombre, telefono, chat_id from consultas where id=$1", [id])
  if (!c || !m) redirect(`/consultas/${id}`)
  const waId = c.chat_id ?? String(c.telefono).replace(/\D/g, "")
  const texto = m!.texto(c.nombre)
  const r = await enviarTexto("devisebit", waId, texto)
  if (r.ok) await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ('devisebit',$1,'equipo',$2,$3,$4)", [waId, texto, r.id ?? null, u.nombre])
  if (r.ok) await atendidaPor(id, u.nombre)
  await audit(u, "envia_material", "consulta", id, m!.k)
  redirect(`/consultas/${id}?${r.ok ? "env=1" : "enverr=" + encodeURIComponent(r.error ?? "error")}`)
}

/** Lo mismo que los envíos por WhatsApp (agenda, material o brief), pero por email. Si la consulta no tenía email, guarda el que se escribió. */
async function mandarEmail(que: Envio, fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  if (!["agenda", "brief", "material"].includes(que)) redirect(`/consultas/${id}`)
  const r = await enviarAConsulta(id, que, { k: String(fd.get("k") ?? ""), emailNuevo: s(fd.get("email")) })
  // Igual que por WhatsApp: solo queda como atendida si el correo salió
  if (r.ok) await atendidaPor(id, u.nombre)
  await audit(u, `envia_${que}_email`, "consulta", id, `${r.ok ? "" : "no salió: "}${r.etiqueta ?? que} → ${r.email ?? "sin email"}${r.ok ? "" : ` (${String(r.error).slice(0, 200)})`}`)
  redirect(`/consultas/${id}?${r.ok ? `mail=${encodeURIComponent(`${r.etiqueta} → ${r.email}`)}` : "mailerr=" + encodeURIComponent(r.error ?? "error")}`)
}

async function rehacerPropuesta(fd: FormData) {
  "use server"
  await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  await generarPropuesta(id)
  redirect(`/consultas/${id}#propuesta`)
}

async function ensenar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select empresa from consultas where id=$1", [id])
  if (!c) redirect(`/consultas/${id}`)
  const respuesta = s(fd.get("respuesta"))
  if (respuesta) await q("insert into bot_conocimiento(empresa,pregunta,respuesta,origen,creado_por) values ($1,$2,$3,'conversacion',$4)", [c.empresa, s(fd.get("pregunta")), respuesta, u.nombre])
  await audit(u, "bot_ensenar", "consulta", id)
  redirect(`/consultas/${id}?ens=1`)
}

export default async function Consulta({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; nueva?: string; env?: string; enverr?: string; ens?: string; mail?: string; mailerr?: string } }) {
  const u = await requerir()
  const id = Number(params.id)
  const c = await one<any>("select * from consultas where id=$1", [id])
  if (!c) notFound()
  const contacto = await one<{ id: number }>("select id from db_contactos where consulta_id=$1", [c.id])
  const reunion = await one<any>("select * from db_reuniones where consulta_id=$1 and estado='confirmada' and fin > now() order by inicio limit 1", [c.id])
  const waId = c.chat_id ?? (c.telefono ? String(c.telefono).replace(/\D/g, "") : "")
  const chat = waId ? await one<any>("select * from wa_chats where empresa=$1 and wa_id=$2", [c.empresa, waId]) : null
  const msgs = chat ? await q<any>("select autor, texto, tipo, autor_nombre, creado from wa_mensajes where empresa=$1 and wa_id=$2 order by creado desc limit 100", [c.empresa, waId]) : []
  const ventana = chat?.ultimo_entrante && Date.now() - new Date(chat.ultimo_entrante).getTime() < 24 * 3600e3
  const botPausado = chat?.pausa_motivo === "equipo" && chat?.bot_pausado_hasta && new Date(chat.bot_pausado_hasta).getTime() > Date.now()
  const est = ESTADOS.find((e) => e.v === c.estado)!
  const ed = puede.editar(u)
  const tel = c.telefono ? String(c.telefono).replace(/\D/g, "") : null
  const correos = ed ? await q<{ ts: string; usuario: string | null; detalle: string | null }>("select ts, usuario, detalle from auditoria where entidad='consulta' and entidad_id=$1 and accion in ('envia_agenda_email','envia_brief_email','envia_material_email') order by ts desc limit 8", [String(id)]) : []
  const mats = materialesPara(lineaDe(c.motivo, c.mensaje))
  const canalChat = String(c.chat_id ?? "").startsWith("ig:") ? "Instagram" : "WhatsApp"
  const otras = c.telefono ? await q<any>("select id, creado, estado, motivo from consultas where telefono=$1 and id<>$2 and empresa=$3 order by creado desc limit 10", [c.telefono, id, c.empresa]) : []
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/consultas" className="text-sm text-[#4A515C]">← Conversaciones</Link>
          <h1 className="m-0">{c.nombre ?? "Sin nombre"}</h1>
          <p className="m-0 text-sm text-[#4A515C]">Conversación #{c.id} · {CANAL[c.canal] ?? c.canal} · entró el {fechaHora(c.creado)} ({hace(c.creado)})</p>
        </div>
        <span className={`chip text-sm px-3 py-1 ${est.c}`}>{est.n}</span>
      </div>
      {(searchParams.ok || searchParams.nueva) && <p className="m-0 text-sm text-[#9E1A17]">Guardado.</p>}
      {searchParams.mail && <p className="m-0 text-sm text-emerald-700" role="status">Email enviado: {searchParams.mail}</p>}
      {searchParams.mailerr && <p className="m-0 text-sm text-rojo" role="alert">No se pudo enviar el email: {searchParams.mailerr}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <section className="card">
            <h2 className="mt-0">Datos</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 m-0 text-sm">
              {[["Quién consulta", c.nombre], ["Teléfono", c.telefono], ["Organización", c.organizacion], ["Email", c.email], ["Motivo", c.motivo], ["Llegó por", [c.fuente, c.campania].filter(Boolean).join(" · ")], ...(c.utm_source ? [["UTM", [c.utm_source, c.utm_medium, c.utm_campaign].filter(Boolean).join(" / ")]] : [])].map(([k, v]) => (
                <div key={k}><dt className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">{k}</dt><dd className="m-0">{v || "—"}</dd></div>
              ))}
            </dl>
          </section>
          {chat ? (
            <section className="card flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0">Conversación de {String(waId).startsWith("ig:") ? "Instagram" : "WhatsApp"}</h2>
                {ed && (
                  <form action={bot} className="flex items-center gap-2 text-sm">
                    <input type="hidden" name="id" value={c.id} /><input type="hidden" name="a" value={botPausado ? "activar" : "pausar"} />
                    <span className={botPausado ? "text-amber-700" : "text-[#9E1A17]"}>{botPausado ? "Bot en pausa: responde el equipo" : "El bot está respondiendo"}</span>
                    <button className="btn-s py-1 px-3 text-xs">{botPausado ? "Reactivar bot" : "Pausar bot"}</button>
                  </form>
                )}
              </div>
              <div className="flex flex-col-reverse gap-2 max-h-[480px] overflow-y-auto bg-[#F1F2F5] rounded-xl p-3">
                {msgs.map((m: any, i: number) => {
                  const previa = msgs.slice(i + 1).find((x: any) => x.autor === "cliente")
                  return (
                  <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${m.autor === "cliente" ? "self-start bg-white" : m.autor === "bot" ? "self-end bg-[#FFE3E1]" : "self-end bg-[#C8231F] text-white"}`}>
                    {m.tipo === "audio" && m.texto ? `🎤 Audio transcripto: ${m.texto}` : (m.texto ?? `(${m.tipo})`)}
                    <div className={`text-[10px] mt-1 ${m.autor === "equipo" ? "text-white/80" : "text-[#4A515C]"}`}>{m.autor === "cliente" ? (m.autor_nombre ?? "Cliente") : m.autor === "bot" ? "Asistente" : m.autor_nombre} · {fechaHora(m.creado)}</div>
                    {ed && m.autor === "equipo" && m.texto && (
                      <details className="mt-1 text-[#0E1116]">
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
                  <textarea name="texto" rows={3} required aria-label="Respuesta al cliente" className="inp" placeholder="Escribí la respuesta: sale por el mismo canal y el bot queda en pausa en este chat" />
                  <div><button className="btn-p">Enviar{String(waId).startsWith("ig:") ? " por Instagram" : " por WhatsApp"}</button></div>
                </form>
              ) : (
                <p className="m-0 text-xs text-[#4A515C]">Pasaron más de 24 h desde el último mensaje del cliente: WhatsApp solo permite responder con una plantilla aprobada. Usá el botón de WhatsApp de la derecha.</p>
              ))}
              {searchParams.env && <p className="m-0 text-sm text-[#9E1A17]">Mensaje enviado.</p>}
              {searchParams.ens && <p className="m-0 text-sm text-[#9E1A17]">Listo: el bot ya lo sabe.</p>}
              {searchParams.enverr && <p className="m-0 text-sm text-rojo">No se pudo enviar: {searchParams.enverr}</p>}
            </section>
          ) : (
            <section className="card">
              <h2 className="mt-0">Mensaje</h2>
              <p className="m-0 whitespace-pre-line text-[15px]">{c.mensaje || "Sin mensaje."}</p>
            </section>
          )}
          {c.brief && (
            <section className="card flex flex-col gap-2">
              <h2 className="m-0">Brief del cliente <span className="text-sm font-normal text-[#4A515C]">· {fechaHora(c.brief_en)}</span></h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 m-0 text-sm">
                {[["Rubro", c.brief.rubro], ["Necesita", (c.brief.tipo ?? []).join(", ")], ["Objetivo", c.brief.objetivo], ["Funciones", (c.brief.funciones ?? []).join(", ")], ["Ya tiene", (c.brief.tiene ?? []).join(", ")], ["Integraciones", c.brief.integraciones], ["Referencias", c.brief.referencias], ["Plazo", c.brief.plazo], ["Inversión pensada", c.brief.inversion], ["Más", c.brief.extra]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string}><dt className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">{k}</dt><dd className="m-0 whitespace-pre-line">{v as string}</dd></div>
                ))}
              </dl>
            </section>
          )}
          {(c.brief || c.propuesta) && (
            <section id="propuesta" className="card flex flex-col gap-3 scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="m-0">Propuesta preliminar <span className="text-sm font-normal text-[#4A515C]">· borrador de la IA, revisalo antes de mandarlo</span></h2>
                <div className="flex gap-2">{c.propuesta && <Copiar texto={c.propuesta} />}{ed && <form action={rehacerPropuesta}><input type="hidden" name="id" value={c.id} /><button className="btn-s py-1 px-3 text-xs">{c.propuesta ? "Rehacer" : "Generar"}</button></form>}</div>
              </div>
              {c.propuesta ? <pre className="m-0 whitespace-pre-wrap font-[inherit] text-[15px] leading-relaxed bg-[#F8F9FB] rounded-xl p-4">{c.propuesta}</pre> : <p className="m-0 text-sm text-[#4A515C]">Se está generando; recargá en un minuto.</p>}
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
          {reunion ? (
            <section className="card text-sm flex flex-col gap-1 border-2 border-[#C8231F]"><strong className="first-letter:uppercase">📅 {local(new Date(reunion.inicio)).texto}</strong><span>{reunion.modalidad}{reunion.calendar_id ? " · en Google Calendar" : ""}</span>{reunion.link && <a href={reunion.link} target="_blank" rel="noopener noreferrer" className="underline">Entrar a la videollamada</a>}</section>
          ) : null}
          {ed && (
            <form className="card flex flex-col gap-3">
              <h2 className="m-0 text-base">📨 Mandarle al cliente</h2>
              <input type="hidden" name="id" value={c.id} />
              {c.email ? <p className="m-0 text-xs text-[#4A515C] break-all">Por email sale a <strong>{c.email}</strong>.</p> : (
                <label className="lbl">Email del cliente
                  <input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required className="inp" placeholder="nombre@ejemplo.com" />
                  <span className="text-xs font-normal text-[#4A515C]">Hace falta solo para enviar por email: se guarda en la consulta al enviar.</span>
                </label>
              )}
              {!reunion && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">📅 El link para agendar</span>
                  <div className={`grid gap-2 ${c.chat_id ? "grid-cols-2" : ""}`}>
                    {c.chat_id && <button formAction={mandarAgenda} formNoValidate className="btn-s px-2">Por {canalChat}</button>}
                    <button formAction={mandarEmail.bind(null, "agenda")} className="btn-s px-2">Por email</button>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold">📎 Material</span>
                <select name="k" aria-label="Material para enviar" className="inp" defaultValue={mats.sugerido}>{mats.grupos.map((g) => <optgroup key={g.t} label={g.t}>{g.items.map((m) => <option key={m.k} value={m.k}>{m.n}</option>)}</optgroup>)}</select>
                <div className={`grid gap-2 ${c.chat_id ? "grid-cols-2" : ""}`}>
                  {c.chat_id && <button formAction={mandarMaterial} formNoValidate className="btn-s px-2">Por {canalChat}</button>}
                  <button formAction={mandarEmail.bind(null, "material")} className="btn-s px-2">Por email</button>
                </div>
              </div>
              {!c.brief && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">📝 El brief</span>
                  <div className={`grid gap-2 ${c.chat_id ? "grid-cols-2" : ""}`}>
                    {c.chat_id && <button formAction={mandarBrief} formNoValidate className="btn-s px-2">Por {canalChat}</button>}
                    <button formAction={mandarEmail.bind(null, "brief")} className="btn-s px-2">Por email</button>
                  </div>
                </div>
              )}
              <p className="m-0 text-xs text-[#4A515C]">Sale con un mensaje listo{c.chat_id ? " y el bot sigue activo. El bot también manda el material solo cuando se lo piden" : ""}.</p>
              {correos.length > 0 && (
                <div className="border-t border-[#E2E5EA] pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">Enviado por email</span>
                  <ul className="m-0 mt-1 p-0 list-none flex flex-col gap-1 text-xs">
                    {correos.map((x, i) => <li key={i} className={`break-words ${x.detalle?.startsWith("no salió") ? "text-rojo" : ""}`}>{fechaHora(x.ts)} · {x.detalle}{x.usuario ? ` · ${x.usuario}` : ""}</li>)}
                  </ul>
                </div>
              )}
            </form>
          )}
          {contacto ? <Link href={`/contactos/${contacto.id}`} className="btn-s">Ver contacto en el CRM</Link>
            : ed && <Link href={`/contactos/nuevo?consulta=${c.id}`} className="btn-s">Pasar a contacto del CRM</Link>}
          {ed ? (
            <form action={actualizar} className="card flex flex-col gap-3">
              <h2 className="m-0 text-base">Seguimiento</h2>
              <input type="hidden" name="id" value={c.id} />
              <label className="lbl">Estado<select name="estado" defaultValue={c.estado} className="inp">{ESTADOS.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}</select></label>
              <label className="lbl">Responsable<input name="asignado" defaultValue={c.asignado ?? u.nombre} className="inp" /></label>
              <label className="lbl">Notas internas<textarea name="notas" rows={5} defaultValue={c.notas ?? ""} className="inp" placeholder="Qué se habló, próximos pasos…" /></label>
              <button className="btn-p">Guardar</button>
              <p className="m-0 text-xs text-[#4A515C]">Última actualización: {fechaHora(c.actualizado)}</p>
            </form>
          ) : (
            <section className="card text-sm"><strong>Responsable:</strong> {c.asignado ?? "Sin asignar"}<p className="mb-0 whitespace-pre-line">{c.notas}</p></section>
          )}
          {puede.admin(u) && (
            <form action={eliminar} className="card flex flex-col gap-2">
              <input type="hidden" name="id" value={c.id} />
              <BotonConfirmar mensaje="¿Eliminar esta consulta con su chat, mensajes y reuniones? El contacto del CRM queda. No se puede deshacer.">Eliminar consulta</BotonConfirmar>
            </form>
          )}
        </aside>
      </div>
    </div>
  )
}
