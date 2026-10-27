import { q, one } from "./db"
import { URL_SISTEMA } from "./brief"
import { notificar } from "./push"
import { enviarBrevo } from "./email"
import { waId, avisarPorWhatsApp } from "./waperfil"

/** Agenda propia de DEVISEBIT: turnos de 30 minutos, lunes a viernes. Si está conectado, crea el evento en Google Calendar (con invitación al cliente). */
const TZ = 3 // Argentina, UTC-3 sin horario de verano

/** Horario de atención para reuniones: se define en Sistema → Agenda (tabla config, clave "agenda"). */
/** franjas: rangos "HH:MM-HH:MM" en los que se ofrecen turnos (por ejemplo 09:00-11:00 y 14:00-15:00). */
export type HorarioAgenda = { dias: number[]; franjas: string[]; duracion: number; anticipacion: number; bloqueos: string[] }
export const HORARIO_INICIAL: HorarioAgenda = { dias: [1, 2, 3, 4, 5], franjas: ["09:00-11:00", "14:00-15:00", "17:00-18:00"], duracion: 30, anticipacion: 2, bloqueos: [] }
export async function horario(): Promise<HorarioAgenda> {
  const r = await one<{ valor: string }>("select valor from config where clave='agenda'").catch(() => null)
  try {
    const g = r ? JSON.parse(r.valor) : {}
    const h = { ...HORARIO_INICIAL, ...g } as HorarioAgenda
    if (!Array.isArray(g.franjas) || !g.franjas.length) h.franjas = HORARIO_INICIAL.franjas
    return h
  } catch { return HORARIO_INICIAL }
}
/** "09:00-11:00, 14:00-15:00" → franjas válidas y ordenadas. */
export function leerFranjas(t: string) {
  return t.split(/[,;\n]+/).map((x) => x.trim().replace(/\s+/g, "")).filter((x) => /^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/.test(x))
    .map((x) => x.split("-").map((h) => h.padStart(5, "0")).join("-")).filter((x) => x.slice(0, 5) < x.slice(6)).sort()
}
export async function guardarHorario(h: HorarioAgenda) {
  await q("insert into config(clave,valor) values ('agenda',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify(h)])
}
const minutos = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0) }
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

/** Fecha/hora local de Argentina → Date (UTC). */
export function deLocal(fecha: string, hora: string) {
  const [y, m, d] = fecha.split("-").map(Number), [h, mi] = hora.split(":").map(Number)
  return new Date(Date.UTC(y, m - 1, d, h + TZ, mi))
}
/** Date → partes en hora argentina. */
export function local(d: Date) {
  const x = new Date(d.getTime() - TZ * 3600e3)
  const p = (n: number) => String(n).padStart(2, "0")
  return { fecha: `${x.getUTCFullYear()}-${p(x.getUTCMonth() + 1)}-${p(x.getUTCDate())}`, hora: `${p(x.getUTCHours())}:${p(x.getUTCMinutes())}`, dia: x.getUTCDay(), texto: `${DIAS[x.getUTCDay()]} ${x.getUTCDate()} de ${MESES[x.getUTCMonth()]} a las ${p(x.getUTCHours())}:${p(x.getUTCMinutes())} h` }
}

/**
 * Conexión con Google Calendar por Apps Script. La clave la genera el sistema (no hay que cargar nada en Vercel):
 * el código del script ya la trae puesta y solo hay que pegar acá la URL de la implementación.
 */
export async function gcalConfig() {
  const r = await one<{ valor: string }>("select valor from config where clave='gcal'").catch(() => null)
  let c: { token?: string; url?: string } = {}
  try { c = r ? JSON.parse(r.valor) : {} } catch {}
  if (!c.token) {
    c.token = (await import("crypto")).randomBytes(24).toString("base64url")
    await q("insert into config(clave,valor) values ('gcal',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify(c)])
  }
  return { token: process.env.GCAL_TOKEN || c.token!, url: process.env.GCAL_SCRIPT_URL || c.url || "" }
}
export async function guardarGcalUrl(url: string) {
  const c = await gcalConfig()
  await q("insert into config(clave,valor) values ('gcal',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify({ token: c.token, url })])
}
async function gcal(body: Record<string, unknown>) {
  const { url, token } = await gcalConfig()
  if (!url || !token) return null
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ ...body, token }), redirect: "follow" })
    return await r.json()
  } catch { return null }
}
export async function probarGcal() {
  const ahora = new Date()
  const r = await gcal({ accion: "ocupado", desde: ahora.toISOString(), hasta: new Date(ahora.getTime() + 864e5).toISOString() })
  return r && Array.isArray(r.ocupado) ? { ok: true, n: r.ocupado.length } : { ok: false, error: r?.error ?? "sin respuesta" }
}
export const calendarioConectado = async () => !!(await gcalConfig()).url

/** Turnos libres de los próximos días hábiles (descuenta reuniones del sistema y lo ocupado en Google Calendar). */
export async function turnosLibres(diasHabiles = 10) {
  const hz = await horario()
  const DURACION = hz.duracion
  const ahora = Date.now(), minimo = ahora + hz.anticipacion * 3600e3
  const fechas: string[] = []
  for (let i = 0; fechas.length < diasHabiles && i < 45; i++) {
    const l = local(new Date(ahora + i * 864e5))
    if (hz.dias.includes(l.dia) && !hz.bloqueos.includes(l.fecha)) fechas.push(l.fecha)
  }
  if (!fechas.length) return []
  const desde = deLocal(fechas[0], "00:00"), hasta = deLocal(fechas[fechas.length - 1], "23:59")
  const tomadas = await q<{ inicio: Date; fin: Date }>("select inicio, fin from db_reuniones where estado='confirmada' and inicio < $2 and fin > $1", [desde, hasta])
  const g = await gcal({ accion: "ocupado", desde: desde.toISOString(), hasta: hasta.toISOString() })
  const ocupado: [number, number][] = [
    ...tomadas.map((t) => [new Date(t.inicio).getTime(), new Date(t.fin).getTime()] as [number, number]),
    ...((g?.ocupado ?? []) as [string, string][]).map(([a, b]) => [new Date(a).getTime(), new Date(b).getTime()] as [number, number]),
  ]
  return fechas.map((f) => {
    const turnos: { iso: string; hora: string }[] = []
    for (const fr of hz.franjas) {
      const [d0, h0] = fr.split("-")
      for (let m = minutos(d0); m + DURACION <= minutos(h0); m += DURACION) {
        const ini = deLocal(f, `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)
        const a = ini.getTime(), b = a + DURACION * 60e3
        if (a < minimo || ocupado.some(([x, y]) => a < y && b > x)) continue
        turnos.push({ iso: ini.toISOString(), hora: local(ini).hora })
      }
    }
    const l = local(deLocal(f, "12:00"))
    return { fecha: f, etiqueta: `${DIAS[l.dia]} ${Number(f.slice(8))}/${Number(f.slice(5, 7))}`, turnos }
  }).filter((d) => d.turnos.length)
}

/** Algunos turnos para ofrecer por chat (repartidos en distintos días y horarios). */
export async function sugerencias(n = 6) {
  const dias = await turnosLibres(5)
  const out: string[] = []
  for (const d of dias) {
    const t = d.turnos, pick = [t[Math.floor(t.length * 0.2)], t[Math.floor(t.length * 0.7)]].filter(Boolean)
    for (const x of pick) if (out.length < n && !out.includes(x.iso)) out.push(x.iso)
  }
  return out.map((iso) => ({ iso, texto: local(new Date(iso)).texto, clave: `${local(new Date(iso)).fecha}T${local(new Date(iso)).hora}` }))
}

export const linkAgenda = (token: string) => `${URL_SISTEMA}/agendar/${token}`
export const linkVideo = (token: string) => `https://meet.jit.si/DEVISEBIT-${token}`

/** Reserva un turno para una consulta. Devuelve el texto de confirmación. */
export async function reservar(cid: number, inicio: Date, datos: { nombre?: string | null; email?: string | null; telefono?: string | null; modalidad?: string | null; notas?: string | null } = {}) {
  const c = await one<any>("select id, nombre, organizacion, email, telefono, motivo, brief_token, chat_id from consultas where id=$1", [cid])
  if (!c) return { ok: false as const, error: "Consulta inexistente" }
  if (isNaN(inicio.getTime())) return { ok: false as const, error: "Fecha inválida" }
  const libre = (await turnosLibres(10)).some((d) => d.turnos.some((t) => t.iso === inicio.toISOString()))
  if (!libre) return { ok: false as const, error: "Ese horario ya no está disponible" }
  const fin = new Date(inicio.getTime() + (await horario()).duracion * 60e3)
  const nombre = datos.nombre ?? c.nombre, email = datos.email ?? c.email, tel = datos.telefono ?? c.telefono
  const modalidad = datos.modalidad === "llamada" ? "llamada" : "videollamada"
  const link = modalidad === "videollamada" ? linkVideo(c.brief_token ?? String(cid)) : null
  const contacto = await one<{ id: number }>("select id from db_contactos where consulta_id=$1", [cid])
  const r = await one<{ id: number }>(
    "insert into db_reuniones(consulta_id,contacto_id,nombre,email,telefono,inicio,fin,modalidad,link,notas) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id",
    [cid, contacto?.id ?? null, nombre, email, tel, inicio, fin, modalidad, link, datos.notas ?? null],
  )
  const ev = await gcal({
    accion: "crear", titulo: `DEVISEBIT · ${nombre ?? "Cliente"}${c.organizacion ? ` (${c.organizacion})` : ""}`, inicio: inicio.toISOString(), fin: fin.toISOString(), email: email ?? "",
    lugar: link ?? (tel ? `Llamada al ${tel}` : ""), descripcion: `${modalidad === "llamada" ? `Llamada al ${tel ?? "cliente"}` : `Videollamada: ${link}`}\nNecesidad: ${c.motivo ?? "—"}\nFicha: ${URL_SISTEMA}/consultas/${cid}`,
  })
  if (ev?.id) await q("update db_reuniones set calendar_id=$1 where id=$2", [ev.id, r!.id])
  await q("update consultas set estado=case when estado in ('nueva','contactada') then 'calificada' else estado end, actualizado=now() where id=$1", [cid])
  if (contacto) await q("update db_contactos set etapa=case when etapa in ('base','nuevo','conversando') then 'reunion' else etapa end, proximo=$1, proximo_fecha=$2, actualizado=now() where id=$3", [`Reunión ${local(inicio).texto}`, local(inicio).fecha, contacto.id])
  const l = local(inicio)
  await notificar(["gerente", "coordinacion"], "📅 Reunión agendada", `${nombre ?? "Cliente"}${c.organizacion ? ` (${c.organizacion})` : ""} · ${l.texto}`, `/consultas/${cid}`)
  const reu = { id: r!.id, inicio, fin, link, modalidad, telefono: tel, nombre, organizacion: c.organizacion, motivo: c.motivo, cid, token: c.brief_token }
  await mailCliente(reu, email).catch((e) => console.error("mail cliente", e))
  await mailEquipo(reu).catch((e) => console.error("mail equipo", e))
  // Si el cliente agendó por la web (sin chat abierto), le llega también por WhatsApp
  if (!c.chat_id) {
    const to = waId(tel)
    if (to) {
      const dl = modalidad === "videollamada" ? `Entrás desde ${link}` : `Te llamamos a este número.`
      await avisarPorWhatsApp(cid, to, `Hola${nombre ? ` ${String(nombre).split(" ")[0]}` : ""} 👋 Soy Bit, el asistente de DEVISEBIT.\n📅 Quedó confirmada tu ${modalidad} para el *${l.texto}*.\n${dl}\nPara sumarla a tu calendario: ${URL_SISTEMA}/agendar/${c.brief_token}/ics\nSi necesitás cambiarla, respondé este mensaje.`,
        "reunion_confirmada", [nombre ? String(nombre).split(" ")[0] : "", l.texto, dl], nombre).catch((e) => console.error("wa cliente", e))
    }
  }
  const confirmacion = `📅 ¡Listo! Quedó agendada la ${modalidad} de ${Math.round((fin.getTime() - inicio.getTime()) / 60e3)} minutos para el *${l.texto}*.${link ? `\nEntrás desde acá (no hace falta instalar nada): ${link}` : `\nTe llamamos al ${tel ?? "número que nos dejaste"}.`}${email ? `\nTe mandamos la confirmación con la invitación a ${email}.` : ""}\nPara sumarla a tu calendario: ${URL_SISTEMA}/agendar/${c.brief_token}/ics\n\nSi necesitás cambiarla, avisanos por acá.`
  return { ok: true as const, id: r!.id, inicio, link, texto: l.texto, confirmacion, gcal: !!ev?.id }
}

/** Archivo .ics (sirve para cualquier calendario: Google, Outlook, Apple). */
export function ics(r: { id: number; inicio: Date; fin: Date; link: string | null; modalidad: string; telefono: string | null; nombre?: string | null; organizacion?: string | null; equipo?: boolean }) {
  const f = (d: Date) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DEVISEBIT//Agenda//ES", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:reunion-${r.id}@devisebit.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(r.inicio)}`, `DTEND:${f(r.fin)}`,
    `SUMMARY:${r.equipo ? `DEVISEBIT · ${r.nombre ?? "Cliente"}${r.organizacion ? ` (${r.organizacion})` : ""}` : `Reunión con DEVISEBIT (${r.modalidad})`}`, `LOCATION:${r.link ?? "Llamada telefónica"}`,
    `DESCRIPTION:${r.link ? `Entrá a la videollamada: ${r.link}` : `${r.equipo ? "Llamar al" : "Te llamamos al"} ${r.telefono ?? ""}`}\\nDEVISEBIT SRL · www.devisebit.com · WhatsApp +54 9 11 7346-6490`,
    "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Reunión con DEVISEBIT", "TRIGGER:-PT15M", "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n")
}

type Reu = { id: number; inicio: Date; fin: Date; link: string | null; modalidad: string; telefono: string | null; nombre?: string | null; organizacion?: string | null; motivo?: string | null; cid: number; token?: string | null }
const b64 = (t: string) => Buffer.from(t, "utf8").toString("base64")
const gcalLink = (r: Reu) => {
  const f = (d: Date) => new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, "")
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Reunión con DEVISEBIT")}&dates=${f(r.inicio)}/${f(r.fin)}&details=${encodeURIComponent(r.link ? `Videollamada: ${r.link}` : "Llamada telefónica")}&location=${encodeURIComponent(r.link ?? "")}`
}
const marco = (titulo: string, cuerpo: string) => `<!doctype html><html><body style="margin:0;background:#F5F6F8;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden">
<tr><td style="background:#0E1116;padding:16px 22px;color:#fff;font-weight:800;letter-spacing:.04em">DEVISE<span style="color:#FF6A63">BIT</span></td></tr>
<tr><td style="padding:22px;color:#262C37;font-size:15px;line-height:1.55"><p style="margin:0 0 10px;font-size:20px;font-weight:800;color:#0E1116">${titulo}</p>${cuerpo}</td></tr>
<tr><td style="padding:14px 22px;border-top:1px solid #EEF0F3;font-size:12px;color:#4A515C">DEVISEBIT SRL · www.devisebit.com · WhatsApp +54 9 11 7346-6490</td></tr>
</table></td></tr></table></body></html>`
const btn = (href: string, t: string, rojo = true) => `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;background:${rojo ? "#C8231F" : "#fff"};color:${rojo ? "#fff" : "#0E1116"};border:1px solid ${rojo ? "#C8231F" : "#C9CED6"};text-decoration:none;font-weight:700;padding:11px 16px;border-radius:10px">${t}</a>`

/** Confirmación al cliente con la invitación (.ics) adjunta y el botón para Google Calendar. */
async function mailCliente(r: Reu, email?: string | null) {
  if (!email || !process.env.BREVO_API_KEY) return
  const l = local(r.inicio)
  const cuerpo = `<p style="margin:0 0 14px">Hola${r.nombre ? ` ${String(r.nombre).split(" ")[0]}` : ""}, quedó confirmada tu ${r.modalidad} con DEVISEBIT:</p>
<p style="margin:0 0 16px;font-size:18px;font-weight:800;color:#0E1116">${l.texto.charAt(0).toUpperCase() + l.texto.slice(1)} (hora de Argentina)</p>
${r.link ? `<p style="margin:0 0 16px">${btn(r.link, "Entrar a la videollamada")}<br><span style="font-size:13px;color:#4A515C">No hace falta instalar nada: se abre en el navegador.</span></p>` : `<p style="margin:0 0 16px">Te llamamos al ${r.telefono ?? "número que nos dejaste"}.</p>`}
<p style="margin:0 0 6px;font-weight:700">Sumala a tu calendario</p>
<p style="margin:0 0 16px">${btn(gcalLink(r), "Google Calendar", false)}${btn(`${URL_SISTEMA}/agendar/${r.token}/ics`, "Outlook / Apple", false)}</p>
<p style="margin:0">Te mandamos un recordatorio el mismo día. Si necesitás cambiarla, respondé este correo o escribinos por WhatsApp.</p>`
  await enviarBrevo({ email, name: r.nombre ?? null }, `📅 Reunión confirmada: ${l.texto}`, marco("¡Reunión confirmada!", cuerpo), null, [{ name: "reunion-devisebit.ics", content: b64(ics(r)) }])
}

/** Al equipo le llega la misma invitación: Gmail la ofrece para sumar a Google Calendar con un clic. */
async function mailEquipo(r: Reu) {
  if (!process.env.BREVO_API_KEY) return
  const us = await q<{ email: string; nombre: string }>("select email, nombre from usuarios where activo and rol in ('gerente','coordinacion') and email is not null and email <> ''")
  const l = local(r.inicio)
  const cuerpo = `<p style="margin:0 0 10px"><strong>${r.nombre ?? "Cliente"}${r.organizacion ? ` (${r.organizacion})` : ""}</strong> agendó una ${r.modalidad} para el <strong>${l.texto}</strong>.</p>
${r.motivo ? `<p style="margin:0 0 10px">Necesidad: ${String(r.motivo).replace(/</g, "&lt;")}</p>` : ""}${r.telefono ? `<p style="margin:0 0 10px">WhatsApp: ${r.telefono}</p>` : ""}
<p style="margin:0 0 6px">${btn(`${URL_SISTEMA}/consultas/${r.cid}`, "Abrir la ficha")}${r.link ? btn(r.link, "Videollamada", false) : ""}${btn(gcalLink(r), "Sumar a Google Calendar", false)}</p>`
  for (const u of us) await enviarBrevo({ email: u.email, name: u.nombre }, `📅 Reunión: ${r.nombre ?? "Cliente"} · ${l.texto}`, marco("Nueva reunión agendada", cuerpo), null, [{ name: "reunion.ics", content: b64(ics({ ...r, equipo: true })) }])
}

/** Recordatorio del día (lo dispara el cron de la mañana): WhatsApp y email al cliente. */
export async function recordatoriosDelDia() {
  const hoy = local(new Date()).fecha
  const rs = await q<any>(
    `select r.*, c.chat_id, c.brief_token token, c.organizacion, c.motivo from db_reuniones r left join consultas c on c.id=r.consulta_id
     where r.estado='confirmada' and r.recordado is null and r.inicio > now() and (r.inicio at time zone 'America/Argentina/Buenos_Aires')::date = $1::date`, [hoy])
  let n = 0
  for (const r of rs) {
    const reu: Reu = { id: r.id, inicio: new Date(r.inicio), fin: new Date(r.fin), link: r.link, modalidad: r.modalidad, telefono: r.telefono, nombre: r.nombre, organizacion: r.organizacion, motivo: r.motivo, cid: r.consulta_id, token: r.token }
    const l = local(reu.inicio)
    const dl = reu.link ? `Entrás desde ${reu.link}` : "Te llamamos a este número."
    const to = r.chat_id && !String(r.chat_id).startsWith("ig:") ? r.chat_id : waId(r.telefono)
    if (to && r.consulta_id) await avisarPorWhatsApp(r.consulta_id, to, `Hola${reu.nombre ? ` ${String(reu.nombre).split(" ")[0]}` : ""} 👋 Te recuerdo la reunión de hoy con DEVISEBIT a las *${l.hora} h*.\n${dl}\n¡Te esperamos!`, "recordatorio_reunion", [reu.nombre ? String(reu.nombre).split(" ")[0] : "", `${l.hora} h`, dl], reu.nombre).catch(() => {})
    if (r.email && process.env.BREVO_API_KEY) await enviarBrevo({ email: r.email, name: r.nombre }, `⏰ Hoy a las ${l.hora} h: reunión con DEVISEBIT`, marco("Hoy nos vemos", `<p style="margin:0 0 14px">Te recordamos la ${reu.modalidad} de hoy a las <strong>${l.hora} h</strong> (hora de Argentina).</p>${reu.link ? `<p style="margin:0">${btn(reu.link, "Entrar a la videollamada")}</p>` : `<p style="margin:0">Te llamamos al ${reu.telefono ?? "número que nos dejaste"}.</p>`}`)).catch(() => {})
    await q("update db_reuniones set recordado=now() where id=$1", [r.id])
    n++
  }
  return n
}
