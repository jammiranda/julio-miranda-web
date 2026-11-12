import { NextResponse, type NextRequest } from "next/server"
import { waitUntil } from "@vercel/functions"
import { empresaPorPhoneId, empresaPorIG, firmaValida, marcarLeido, perfilIG } from "@/lib/whatsapp"
import { procesar } from "@/lib/bot"
import { q } from "@/lib/db"
import { desdeReferral } from "@/lib/origen"
import { bajarAudio, esJulio, jefePorWhatsApp } from "@/lib/oficina-wa"
import { transcribir } from "@/lib/oficina"
import { reengancharSiToca } from "@/lib/reenganche"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Verificación del webhook (Meta llama con hub.challenge). El token de verificación no es secreto: la seguridad real es la firma de cada POST (WA_APP_SECRETS). */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === (process.env.WA_VERIFY_TOKEN || "sistema-devisebit-webhook")) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 })
  }
  return new NextResponse("forbidden", { status: 403 })
}

/** Mensajes entrantes de WhatsApp Cloud API. */
export async function POST(req: NextRequest) {
  const cuerpo = await req.text()
  if (!firmaValida(cuerpo, req.headers.get("x-hub-signature-256"))) {
    console.warn("webhook: firma inválida", { objeto: cuerpo.match(/"object":"(\w+)"/)?.[1] ?? null })
    const obj = cuerpo.match(/"object":"(\w+)"/)?.[1]
    if (obj === "whatsapp_business_account" || obj === "instagram") await q("insert into config(clave,valor) values ($1, now()::text) on conflict (clave) do update set valor=excluded.valor", [`webhook_rechazo_${obj}`]).catch(() => {})
    return new NextResponse("firma inválida", { status: 401 })
  }
  let j: any
  try { j = JSON.parse(cuerpo) } catch { return new NextResponse("ok") }
  const tareas: Promise<unknown>[] = []
  // Instagram: mensajes directos
  if (j.object === "instagram") {
    for (const entry of j.entry ?? []) {
      const e = empresaPorIG(String(entry.id))
      if (!e) continue
      for (const ev of entry.messaging ?? []) {
        const m = ev.message
        if (!m || m.is_echo || !ev.sender?.id || ev.sender.id === String(entry.id)) continue
        const texto = m.text ?? (m.attachments?.length ? null : null)
        tareas.push(perfilIG(e, ev.sender.id).then((nombre) => procesar(e, `ig:${ev.sender.id}`, nombre, texto, m.text ? "text" : "archivo", `ig_${m.mid}`, "instagram", desdeReferral(m.referral ?? ev.referral, "instagram"))).catch((err) => console.error("bot ig", err)))
      }
    }
    waitUntil(Promise.all(tareas))
    return new NextResponse("ok")
  }
  for (const entry of j.entry ?? []) for (const ch of entry.changes ?? []) {
    const v = ch.value ?? {}
    const e = empresaPorPhoneId(v.metadata?.phone_number_id)
    if (!e) continue
    // El id de la entrada es la cuenta de WhatsApp Business: hace falta para cargar las plantillas
    if (entry.id) tareas.push(q("insert into config(clave,valor) values ('wa_waba',$1) on conflict (clave) do update set valor=excluded.valor where config.valor <> excluded.valor", [String(entry.id)]).catch(() => {}))
    const perfiles: Record<string, string> = Object.fromEntries((v.contacts ?? []).map((c: any) => [c.wa_id, c.profile?.name]))
    for (const m of v.messages ?? []) {
      const texto = m.type === "text" ? m.text?.body : m.type === "button" ? m.button?.text : m.type === "interactive" ? (m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title) : (m[m.type]?.caption ?? null)
      tareas.push(marcarLeido(e, m.id))
      // Julio (OFICINA_WA_NUMERO) le habla al jefe de gabinete: ordenes, audios y OK/NO a las propuestas. El resto sigue con Bit.
      if (esJulio(String(m.from ?? ""))) { tareas.push(jefePorWhatsApp(e, m).catch((err) => console.error("jefe wa", err))); continue }
      // Audios de clientes: primero se guarda el mensaje (dentro de procesar) y después se transcribe; así, si la transcripción falla o se corta,
      // el mensaje y la consulta ya quedaron guardados (procesar() le pide que escriba y avisa al equipo)
      const transcribirAudio = m.type === "audio" && m.audio?.id ? () => bajarAudio(e, m.audio.id).then((au) => (au ? transcribir(au.buf, au.mime) : null)) : undefined
      tareas.push(procesar(e, m.from, perfiles[m.from] ?? null, texto ?? null, m.type === "interactive" || m.type === "button" ? "text" : m.type, m.id, "whatsapp", desdeReferral(m.referral, "whatsapp"), { transcribir: transcribirAudio }).catch((err) => console.error("bot", err)))
    }
  }
  // Seguimiento a quienes no contestaron (como mucho cada 10 minutos)
  tareas.push(reengancharSiToca())
  waitUntil(Promise.all(tareas))
  return new NextResponse("ok")
}
