import { q, one } from "./db"
import { URL_SISTEMA } from "./brief"
import { notificar } from "./push"

/** Agenda propia de DEVISEBIT: turnos de 30 minutos, lunes a viernes. Si está conectado, crea el evento en Google Calendar (con invitación al cliente). */
const TZ = 3 // Argentina, UTC-3 sin horario de verano
const [H_DESDE, H_HASTA] = (process.env.AGENDA_HORAS ?? "9-18").split("-").map(Number)
const DURACION = 30
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

async function gcal(body: Record<string, unknown>) {
  const url = process.env.GCAL_SCRIPT_URL, token = process.env.GCAL_TOKEN
  if (!url || !token) return null
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ ...body, token }), redirect: "follow" })
    return await r.json()
  } catch { return null }
}
export const calendarioConectado = () => !!(process.env.GCAL_SCRIPT_URL && process.env.GCAL_TOKEN)

/** Turnos libres de los próximos días hábiles (descuenta reuniones del sistema y lo ocupado en Google Calendar). */
export async function turnosLibres(diasHabiles = 10) {
  const ahora = Date.now(), minimo = ahora + 2 * 3600e3
  const fechas: string[] = []
  for (let i = 0; fechas.length < diasHabiles && i < 30; i++) {
    const l = local(new Date(ahora + i * 864e5))
    if (l.dia >= 1 && l.dia <= 5) fechas.push(l.fecha)
  }
  const desde = deLocal(fechas[0], "00:00"), hasta = deLocal(fechas[fechas.length - 1], "23:59")
  const tomadas = await q<{ inicio: Date; fin: Date }>("select inicio, fin from db_reuniones where estado='confirmada' and inicio < $2 and fin > $1", [desde, hasta])
  const g = await gcal({ accion: "ocupado", desde: desde.toISOString(), hasta: hasta.toISOString() })
  const ocupado: [number, number][] = [
    ...tomadas.map((t) => [new Date(t.inicio).getTime(), new Date(t.fin).getTime()] as [number, number]),
    ...((g?.ocupado ?? []) as [string, string][]).map(([a, b]) => [new Date(a).getTime(), new Date(b).getTime()] as [number, number]),
  ]
  return fechas.map((f) => {
    const turnos: { iso: string; hora: string }[] = []
    for (let m = H_DESDE * 60; m + DURACION <= H_HASTA * 60; m += DURACION) {
      const ini = deLocal(f, `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`)
      const a = ini.getTime(), b = a + DURACION * 60e3
      if (a < minimo || ocupado.some(([x, y]) => a < y && b > x)) continue
      turnos.push({ iso: ini.toISOString(), hora: local(ini).hora })
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
  const fin = new Date(inicio.getTime() + DURACION * 60e3)
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
  const confirmacion = `📅 ¡Listo! Quedó agendada la ${modalidad} de 30 minutos para el *${l.texto}*.${link ? `\nEntrás desde acá (no hace falta instalar nada): ${link}` : `\nTe llamamos al ${tel ?? "número que nos dejaste"}.`}${email && calendarioConectado() ? `\nTe llegó la invitación a ${email}.` : ""}\nPara sumarla a tu calendario: ${URL_SISTEMA}/agendar/${c.brief_token}/ics\n\nSi necesitás cambiarla, avisanos por acá.`
  return { ok: true as const, id: r!.id, inicio, link, texto: l.texto, confirmacion, gcal: !!ev?.id }
}

/** Archivo .ics (sirve para cualquier calendario: Google, Outlook, Apple). */
export function ics(r: { id: number; inicio: Date; fin: Date; link: string | null; modalidad: string; telefono: string | null }) {
  const f = (d: Date) => new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DEVISEBIT//Agenda//ES", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:reunion-${r.id}@devisebit.com`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(r.inicio)}`, `DTEND:${f(r.fin)}`,
    `SUMMARY:Reunión con DEVISEBIT (${r.modalidad})`, `LOCATION:${r.link ?? "Llamada telefónica"}`,
    `DESCRIPTION:${r.link ? `Entrá a la videollamada: ${r.link}` : `Te llamamos al ${r.telefono ?? ""}`}\\nDEVISEBIT SRL · www.devisebit.com · WhatsApp +54 9 11 7346-6490`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n")
}
