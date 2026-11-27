import { q, one } from "./db"
import { enHorario } from "./bot"
import { avisarConHilo } from "./telegram"
import { notificar } from "./push"
import { SITIOS, sitioValido, type DatosWeb } from "./chat-web"
import type { Origen } from "./origen"
import type { Empresa } from "./bots/conocimiento"

/** Minutos que Bit queda en pausa esperando a la persona del equipo. Si alguien contesta, la pausa pasa a 24 h (responderDesdeCRM). */
const ESPERA_MIN = 30

/**
 * Botón «Hablar con una persona» del chat web: pausa a Bit en esa conversación, la marca para el equipo y avisa por Telegram
 * (con hilo: respondiendo el aviso, el texto le llega a la persona), push y email. Sirve aunque todavía no haya escrito nada.
 * Devuelve si el aviso de Telegram salió, para dejarlo registrado.
 */
export async function pedirHumano(e: Empresa, waId: string, web: DatosWeb, og: Origen) {
  const sitio = SITIOS[sitioValido(web.sitio)]
  const pedido = "Quiero hablar con una persona"
  await q("insert into wa_mensajes(empresa,wa_id,autor,texto,tipo,atendido_en) values ($1,$2,'cliente',$3,'text',now())", [e, waId, pedido])
  const chat = await one<{ consulta_id: number | null }>(
    `insert into wa_chats(empresa,wa_id,ultimo_entrante,bot_pausado_hasta,pausa_motivo) values ($1,$2,now(),now() + interval '${ESPERA_MIN} minutes','equipo')
     on conflict (empresa,wa_id) do update set ultimo_entrante=now(), actualizado=now(), pausa_motivo='equipo',
       bot_pausado_hasta=greatest(coalesce(wa_chats.bot_pausado_hasta, now()), now() + interval '${ESPERA_MIN} minutes')
     returning consulta_id`,
    [e, waId],
  )
  let cid = chat?.consulta_id ?? null
  if (cid) {
    const c = await one<{ estado: string }>("select estado from consultas where id=$1", [cid])
    if (!c || c.estado === "descartada") cid = null
  }
  if (!cid) {
    const n = await one<{ id: number }>(
      "insert into consultas(empresa,canal,mensaje,chat_id,fuente,campania,origen_detalle,necesita_humano) values ($1,'web',$2,$3,$4,$5,$6,true) returning id",
      [e, `Pidió hablar con una persona desde el chat de ${sitio.url}`, waId, og.fuente, og.campania ?? null, og.detalle ? JSON.stringify(og.detalle) : null],
    )
    cid = n!.id
    await q("update wa_chats set consulta_id=$1 where empresa=$2 and wa_id=$3", [cid, e, waId])
  } else await q("update consultas set necesita_humano=true, actualizado=now() where id=$1", [cid])

  // Lo que ve Julio en el aviso: quién es (si ya dejó datos), dónde está y lo último que escribió
  const k = await one<{ nombre: string | null; email: string | null; telefono: string | null; organizacion: string | null }>("select nombre, email, telefono, organizacion from consultas where id=$1", [cid])
  const ult = await q<{ texto: string | null }>("select texto from wa_mensajes where empresa=$1 and wa_id=$2 and autor='cliente' and texto <> $3 order by id desc limit 4", [e, waId, pedido])
  const datos = [k?.nombre, k?.organizacion, k?.email, k?.telefono].filter(Boolean).join(" · ")
  const cuerpo = [
    `Sitio: ${sitio.url}${web.pagina ? web.pagina : ""} · ${og.fuente}`,
    datos ? `Datos: ${datos}` : "Todavía no dejó datos de contacto.",
    ult.length ? `Lo último que escribió:\n${ult.reverse().map((m) => `• ${(m.texto ?? "").slice(0, 220)}`).join("\n")}` : "Todavía no escribió nada: abrió el chat y pidió una persona.",
    "Está esperando en la web: si cierra la pestaña se pierde.",
  ].join("\n")
  const titulo = `🙋 Piden hablar con una persona AHORA · chat de ${sitio.nombre}`
  const tg = await avisarConHilo(waId, { titulo, cuerpo, url: `/consultas/${cid}` })
  await q("insert into config(clave,valor) values ('chat_humano_ultimo',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify({ cuando: new Date().toISOString(), consulta: cid, telegram: tg.ok, enviados: tg.enviados, error: tg.error ?? null })]).catch(() => {})
  if (!tg.ok) console.error("chat web: el aviso de Telegram para hablar con una persona NO salió", tg.error)
  else console.log("chat web: aviso de Telegram enviado", tg.enviados)
  // Push y email igual; Telegram solo se repite por la vía común si el aviso con hilo no salió
  await notificar(["gerente", "coordinacion"], titulo, cuerpo.replace(/\n/g, " · ").slice(0, 400), `/consultas/${cid}`, { sinTelegram: tg.ok })

  const texto = enHorario()
    ? "Listo, ya le avisé a una persona del equipo y se suma a este chat en unos minutos. Yo quedo en pausa. Mientras tanto, ¿me dejás un email por si se corta la conexión?"
    : "Ya le avisé al equipo. Ahora estamos fuera del horario de atención (lunes a viernes de 8 a 18 h), así que puede demorar. ¿Me dejás un email y te escriben apenas vuelvan? Si preferís, seguí por *WhatsApp* con el botón de arriba."
  await q("insert into wa_mensajes(empresa,wa_id,autor,texto,autor_nombre) values ($1,$2,'bot',$3,'Bit (asistente IA)')", [e, waId, texto])
  return { consulta: cid, telegram: tg.ok }
}
