import { q, one } from "./db"
import { enviarTexto } from "./whatsapp"
import { modoBot } from "./bot"
import { MATERIALES } from "./materiales"
import type { Empresa } from "./bots/conocimiento"

/** Firma con la que se guarda el mensaje de seguimiento (sirve para no mandarlo dos veces). */
export const AUTOR_SEGUIMIENTO = "Bit (seguimiento)"
const ESPERA_MIN = 60 // minutos sin respuesta del cliente antes de insistir
const VENTANA_H = 22 // WhatsApp solo deja escribir gratis dentro de las 24 h del último mensaje del cliente

type Fila = { empresa: Empresa; wa_id: string; nombre: string | null; mensaje: string | null; motivo: string | null; email: string | null; ultimo_cliente: string | null }

/** Solo se usa el nombre de pila si parece un nombre de verdad (no "..", "nadina.22", etc.). */
export function nombreDePila(n: string | null) {
  const p = (n ?? "").trim().split(/\s+/)[0] ?? ""
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,15}$/.test(p) ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : null
}

/** Texto del segundo mensaje: material concreto según lo que pidió + pedido de email (si todavía no lo dejó). */
export function textoSeguimiento(f: Pick<Fila, "nombre" | "mensaje" | "motivo" | "email">) {
  const n = nombreDePila(f.nombre)
  const hola = `Hola${n ? ` ${n}` : ""}, soy Bit de DEVISEBIT 👋`
  const tema = `${f.mensaje ?? ""} ${f.motivo ?? ""}`.toLowerCase()
  const link = (k: string) => MATERIALES.find((m) => m.k === k)?.link ?? ""
  const cierre = f.email
    ? "Si me contás un poco más de lo que necesitás, te armamos una propuesta a medida. ¿Seguimos por acá?"
    : "Si me contás a qué se dedica tu negocio y me dejás un email, te mandamos una propuesta a medida por escrito. ¿A qué email te la enviamos?"
  if (/\bweb|sitio|p[aá]gina|landing|tienda/.test(tema)) return `${hola} Te dejo el folleto de páginas web, con qué incluye cada una y cómo trabajamos: ${link("brochure")}\n\nY acá están los precios: ${link("webs")}\n\n${cierre}`
  if (/redes|instagram|facebook|anuncio|seguidor|community/.test(tema)) return `${hola} Te dejo los planes de redes y anuncios, con precios y qué incluye cada uno: ${link("redes")}\n\n${cierre}`
  if (/whatsapp|bot|asistente|chatbot/.test(tema)) return `${hola} Te dejo cómo funciona el asistente de WhatsApp con IA y sus precios: ${link("whatsapp")}\n\n${cierre}`
  return `${hola} Te dejo algunos trabajos que hicimos para que veas cómo trabajamos: ${link("casos")}\n\n${cierre}`
}

const CIERRE = new Set(["no", "gracias", "ok", "okey", "okay", "oka", "listo", "chau", "dale"])
const RELLENO = new Set(["muchas", "mil", "igual", "bueno", "perfecto", "por", "ahora", "nada", "mas", "esta", "bien", "saludos", "hasta", "luego"])
/**
 * ¿El mensaje es solo un cierre ("gracias", "ok", "no, gracias", "listo, muchas gracias")?
 * Si después del cierre sigue hablando ("dale, pasame precios", "no entiendo", "ok, ¿cuánto sale?") no es un cierre.
 */
export function esCierre(t: string | null) {
  const p = (t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean)
  return p.length > 0 && p.length <= 6 && p.some((x) => CIERRE.has(x)) && p.every((x) => CIERRE.has(x) || RELLENO.has(x))
}

/** Entre las 9 y las 21 de Argentina, todos los días: una consulta de madrugada recibe el seguimiento a la mañana. */
export function horaDeSeguimiento(d = new Date()) {
  const h = new Date(d.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" })).getHours()
  return h >= 9 && h < 21
}

/**
 * Segundo mensaje del bot cuando el cliente no contestó: una sola vez por chat, si el último mensaje es del bot,
 * pasó al menos una hora, todavía está abierta la ventana de 24 h de WhatsApp y ninguna persona del equipo tomó el chat.
 */
export async function reenganchar() {
  if (!horaDeSeguimiento()) return { enviados: 0, motivo: "fuera de horario" }
  const filas = await q<Fila>(
    `select c.empresa, c.wa_id, c.nombre, k.mensaje, k.motivo, k.email,
            (select m.texto from wa_mensajes m where m.empresa=c.empresa and m.wa_id=c.wa_id and m.autor='cliente' order by m.creado desc, m.id desc limit 1) ultimo_cliente
       from wa_chats c join consultas k on k.id=c.consulta_id
      where c.wa_id not like 'ig:%'
        and c.ultimo_entrante between now() - interval '${VENTANA_H} hours' and now() - interval '${ESPERA_MIN} minutes'
        and (c.bot_pausado_hasta is null or c.bot_pausado_hasta < now())
        and k.estado not in ('convertida','descartada')
        and (select m.autor from wa_mensajes m where m.empresa=c.empresa and m.wa_id=c.wa_id order by m.creado desc, m.id desc limit 1) = 'bot'
        and (select max(m.creado) from wa_mensajes m where m.empresa=c.empresa and m.wa_id=c.wa_id) < now() - interval '${ESPERA_MIN} minutes'
        and not exists (select 1 from wa_mensajes m where m.empresa=c.empresa and m.wa_id=c.wa_id and m.creado > now() - interval '7 days' and (m.autor='equipo' or m.autor_nombre=$1))
      order by c.ultimo_entrante limit 20`,
    [AUTOR_SEGUIMIENTO],
  )
  let enviados = 0
  for (const f of filas) {
    // Si lo último que dijo fue solo un cierre ("gracias", "no", "ok"), no se insiste
    if (esCierre(f.ultimo_cliente)) continue
    if ((await modoBot(f.empresa)) === "nunca") continue
    const texto = textoSeguimiento(f)
    const env = await enviarTexto(f.empresa, f.wa_id, texto)
    // Se registra aunque falle el envío, para no reintentar en cada pasada
    await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ($1,$2,'bot',$3,$4,$5)", [f.empresa, f.wa_id, env.ok ? texto : `[no enviado: ${env.error}] ${texto}`, env.ok ? env.id ?? null : null, AUTOR_SEGUIMIENTO])
    if (env.ok) enviados++
  }
  return { enviados }
}

/**
 * Dispara reenganchar() como mucho una vez cada 10 minutos. No hay un cron frecuente, así que se llama desde
 * lo que sí pasa seguido: el webhook de WhatsApp y el contador de visitas del sitio. El candado es atómico en la base.
 */
export async function reengancharSiToca() {
  const toca = await one(
    `insert into config(clave,valor) values ('reenganche_ultimo', now()::text)
     on conflict (clave) do update set valor=excluded.valor
       where config.valor::timestamptz < now() - interval '10 minutes'
     returning 1`,
  ).catch(() => null)
  if (!toca) return null
  return reenganchar().catch((e) => { console.error("reenganche", e); return null })
}
