import { createHash } from "crypto"
import { q, one } from "./db"
import type { Empresa } from "./bots/conocimiento"

/**
 * Chat web de Bit: el mismo bot de WhatsApp e Instagram, atendiendo desde un widget en los sitios de DEVISEBIT.
 * Cada visitante es un chat "web:<sid>" en wa_chats / wa_mensajes, con su consulta en Conversaciones (canal "web").
 * El widget es /chat.js y habla con /api/chat. Todo queda en el sistema: mensajes, datos, origen y derivación.
 */
export type Canal = "whatsapp" | "instagram" | "web"
export type DatosWeb = { sitio?: string | null; pagina?: string | null }

/** Sitios donde vive el widget. `foco` le dice a Bit de qué viene hablando la persona según dónde está parada. */
export const SITIOS: Record<string, { nombre: string; url: string; foco: string }> = {
  devisebit: {
    nombre: "DEVISEBIT", url: "www.devisebit.com",
    foco: "Es el sitio institucional: puede venir por cualquier servicio (webs, asistentes de WhatsApp, redes, sistemas a medida, asesoría). Averiguá primero qué necesita.",
  },
  academia: {
    nombre: "ACADEMIA DEVISEBIT", url: "academia.devisebit.com",
    foco: "Es la Academia: guías gratis, cursos con certificado y programas de IA y tecnología aplicada. Si busca aprender, orientala y mandale el link que corresponda (academia.devisebit.com/guias, academia.devisebit.com/cursos o academia.devisebit.com/programas); no inventes nombres de cursos, fechas ni precios que no tengas arriba. Si es una empresa o institución que quiere capacitar a su equipo o implementar lo que enseña la Academia, llevala a la reunión sin costo. Un alumno con un problema de acceso o de pago: tomá su email y derivá (derivar=true, area=\"coordinacion\").",
  },
  matebot: {
    nombre: "MateBot (Familia Mate, by DEVISEBIT)", url: "matebot.devisebit.com",
    foco: "MateBot es el asistente personal por audio (se usa por Telegram) de la Familia Mate. Es una app para personas, no un desarrollo a medida: contá qué hace según lo que dice la página, invitá a probarlo desde matebot.devisebit.com y, por planes o precios que no tengas arriba, mandá a la página (no los inventes). Si quien escribe tiene un negocio y quiere un asistente propio para atender a sus clientes, eso es el Agente de WhatsApp de DEVISEBIT: ahí sí llevalo a propuesta o reunión.",
  },
  matecuentas: {
    nombre: "MateCuentas (Familia Mate, by DEVISEBIT)", url: "matecuentas.devisebit.com",
    foco: "MateCuentas es la app para llevar las cuentas de la casa entre todos, de la Familia Mate. Es una app para personas: contá qué hace según la página, invitá a probarla desde matecuentas.devisebit.com y, por planes o precios que no tengas arriba, mandá a la página (no los inventes). Si quien escribe tiene un negocio y busca un sistema propio, eso es desarrollo a medida de DEVISEBIT: llevalo a propuesta o reunión.",
  },
  mateturnos: {
    nombre: "MateTurnos (Familia Mate, by DEVISEBIT)", url: "mateturnos.devisebit.com",
    foco: "MateTurnos es la app de turnos online de la Familia Mate, para negocios y profesionales que atienden con reserva. Contá qué hace según la página, invitá a probarla desde mateturnos.devisebit.com y, por planes o precios que no tengas arriba, mandá a la página (no los inventes). Si necesita algo más grande o a medida (varios locales, integraciones, un bot que dé turnos por WhatsApp), ofrecé la reunión sin costo.",
  },
  mateeventos: {
    nombre: "MateEventos (Familia Mate, by DEVISEBIT)", url: "mateeventos.devisebit.com",
    foco: "MateEventos es la app de la Familia Mate para organizar eventos e invitaciones. Contá qué hace según la página, invitá a probarla desde mateeventos.devisebit.com y, por planes o precios que no tengas arriba, mandá a la página (no los inventes). Si necesita algo a medida para su organización, ofrecé la reunión sin costo.",
  },
  familiamate: {
    nombre: "Familia Mate (by DEVISEBIT)", url: "familiamate.devisebit.com",
    foco: "Es la página de la Familia Mate: cuatro apps de DEVISEBIT que se complementan (MateBot, MateCuentas, MateTurnos y MateEventos). Preguntá qué quiere resolver y recomendá UNA app, con su link (matebot.devisebit.com, matecuentas.devisebit.com, mateturnos.devisebit.com o mateeventos.devisebit.com). Por planes o precios que no tengas arriba, mandá a la página de esa app (no los inventes).",
  },
  tuweb: {
    nombre: "Web por Suscripción DEVISEBIT", url: "tuweb.devisebit.com",
    foco: "Viene de la página de la Web por Suscripción: acá sí ofrecé primero ese producto, con el precio de la LISTA DE PRECIOS, y resolvé dudas para que avance con la compra desde la misma página. Si necesita tienda con carrito, sistema o algo a medida, ahí recomendá la web a medida que corresponda.",
  },
}
export const sitioValido = (s: unknown) => (typeof s === "string" && s in SITIOS ? s : "devisebit")

/** Código corto del chat web (no revela el sid): viaja en el mensaje precargado de "Seguir por WhatsApp". */
export const codigoChat = (sid: string) => createHash("sha256").update(sid).digest("hex").slice(0, 10)

/** Número de teléfono dentro de un texto (8 a 15 dígitos, con o sin +54, espacios o guiones). Devuelve solo dígitos con + si lo traía. */
export function telefonoEnTexto(t: string | null | undefined) {
  if (!t) return null
  const m = t.match(/(?:\+?\d[\d\s().-]{6,20}\d)/g)
  for (const c of m ?? []) {
    const d = c.replace(/\D/g, "")
    // Se descartan fechas y montos: un teléfono no tiene puntos de miles ni empieza con 20xx seguido de barra
    if (d.length >= 8 && d.length <= 15 && !/^\d{1,3}(\.\d{3})+$/.test(c.trim()) && !/^\d{2}-\d{8}-\d$/.test(c.trim())) return (c.trim().startsWith("+") ? "+" : "") + d
  }
  return null
}

/** Contexto que lee la IA cuando el canal es el chat web: cambia lo que es propio de WhatsApp (número, formato, derivación). */
export function contextoWeb(web?: DatosWeb) {
  const s = SITIOS[sitioValido(web?.sitio)]
  const pag = web?.pagina ? ` (está mirando la página ${String(web.pagina).slice(0, 120)})` : ""
  return `CANAL: CHAT WEB. La persona escribe desde el chat del sitio ${s.nombre}, ${s.url}${pag}. NO es WhatsApp: esto reemplaza las reglas de más arriba que hablan de WhatsApp.
- DE DÓNDE VIENE: ${s.foco}
- No tenemos ni su nombre ni su teléfono, y si cierra la pestaña la perdemos. Por eso el contacto importa más que en WhatsApp: en tu SEGUNDA respuesta (después de ayudarla con lo que preguntó) pedile, como única pregunta de ese mensaje, un *email o un WhatsApp*, el que prefiera, con un motivo concreto (mandarle la propuesta, el folleto o los ejemplos de su rubro, o coordinar la reunión). Pedilo una sola vez; si no quiere darlo, seguí ayudando igual.
- Cuando te dé un teléfono, guardalo en "datos" con la clave "telefono" (además de las otras claves). El email va en "email" como siempre.
- No digas "te escribimos por este chat": el equipo le escribe al WhatsApp o al email que dejó. Si pide hablar con una persona o corresponde derivar y todavía no dejó ningún contacto, pedíselo antes y marcá derivar=true recién cuando lo tenga (si se niega, derivá igual y decile que puede tocar *Seguir por WhatsApp*).
- Debajo del chat la persona tiene el botón *Seguir por WhatsApp*, que continúa esta misma conversación en su celular sin repetir nada. Ofrecelo cuando quiera mandar audios, fotos o archivos, cuando pida un humano o cuando prefiera seguir desde el teléfono. No lo ofrezcas en cada mensaje.
- No muestres el menú numerado de WhatsApp. Mensajes todavía más cortos que en WhatsApp: se leen en una ventanita.
- Si ya se presenta como cliente o alumno con un problema, no le vendas: tomá el dato de contacto y derivá.
`
}

/**
 * "Seguir por WhatsApp" desde el chat web: el primer mensaje trae [web:CODIGO]. Se pasa el historial del chat web
 * al chat de WhatsApp y este toma la misma consulta, para que Bit y el equipo sigan sin hacerle repetir nada.
 * Devuelve el texto sin el código. Si el código no existe o es viejo, solo limpia el texto.
 */
export async function unirChatWeb(e: Empresa, waId: string, texto: string | null) {
  const m = texto?.match(/\[web:([a-f0-9]{10})\]/i)
  if (!m || !texto) return texto
  const limpio = texto.replace(/\s*\[web:[a-f0-9]{10}\]\s*/gi, " ").trim() || "Hola"
  const web = await one<{ wa_id: string; consulta_id: number | null }>(
    `select wa_id, consulta_id from wa_chats
      where empresa=$1 and wa_id like 'web:%' and actualizado > now() - interval '7 days'
        and substr(encode(sha256(convert_to(substr(wa_id, 5), 'UTF8')), 'hex'), 1, 10) = $2
      limit 1`,
    [e, m[1].toLowerCase()],
  )
  if (!web) return limpio
  // Una sola vez por par (chat web, WhatsApp): si ya se unieron, no se copia de nuevo
  const marca = `web_union_${web.wa_id.slice(4)}_${waId}`
  const primera = await one("insert into config(clave,valor) values ($1, now()::text) on conflict (clave) do nothing returning 1", [marca])
  if (!primera) return limpio
  await q(
    `insert into wa_mensajes(empresa,wa_id,autor,texto,tipo,autor_nombre,creado,atendido_en)
     select empresa, $3, autor, texto, tipo, case when autor='bot' then 'Bit (chat web)' else autor_nombre end, creado, coalesce(atendido_en, now())
       from wa_mensajes where empresa=$1 and wa_id=$2 order by creado, id`,
    [e, web.wa_id, waId],
  )
  if (web.consulta_id) {
    await q(
      `insert into wa_chats(empresa,wa_id,consulta_id,ultimo_entrante) values ($1,$2,$3,now())
       on conflict (empresa,wa_id) do update set consulta_id=excluded.consulta_id, actualizado=now()`,
      [e, waId, web.consulta_id],
    )
    // La consulta pasa a seguirse por WhatsApp: desde Conversaciones se responde al celular
    await q("update consultas set chat_id=$1, telefono=coalesce(telefono,$2), actualizado=now() where id=$3", [waId, "+" + waId, web.consulta_id])
    await q("update wa_chats set consulta_id=null where empresa=$1 and wa_id=$2", [e, web.wa_id])
  }
  return limpio
}
