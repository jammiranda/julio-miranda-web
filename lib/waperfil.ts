import { q, one } from "./db"
import { cuenta, enviarTexto } from "./whatsapp"
import { URL_SISTEMA } from "./brief"

/**
 * Perfil comercial de WhatsApp (foto, descripción, email, webs) y plantillas de mensajes
 * para avisar reuniones fuera de la ventana de 24 h. Se cargan solos una vez por versión.
 */
const V = process.env.WA_GRAPH_VERSION ?? "v23.0"
const G = `https://graph.facebook.com/${V}`
export const PERFIL_VERSION = "2026-10-27b"

export const PERFIL = {
  about: "IA, webs y sistemas a medida · Te atiende Bit 24 h",
  description:
    "DEVISEBIT SRL · Software e inteligencia artificial desde 2009.\n" +
    "Páginas web, agentes de WhatsApp con IA, redes y anuncios, sistemas y plataformas para comunidades y gremios.\n" +
    "Webs: devisebit.com/webs · WhatsApp IA: devisebit.com/whatsapp · Redes: devisebit.com/redes · Sistemas: devisebit.com/sistemas · Comunidades: devisebit.com/comunidad\n" +
    "Precios: sistema.devisebit.com/lista-precios · Agendá una reunión: sistema.devisebit.com/agendar\n" +
    "Atención del equipo de lunes a viernes de 8 a 18 h.",
  address: "Circular Cowork · Av. de los Lagos 7008, Nordelta, Tigre, Buenos Aires",
  email: "info@devisebit.com",
  websites: ["https://www.devisebit.com", "https://sistema.devisebit.com/agendar"],
  vertical: "PROF_SERVICES",
}

export const PLANTILLAS = [
  {
    name: "reunion_confirmada", category: "UTILITY",
    text: "Hola {{1}}, quedó confirmada tu reunión con DEVISEBIT para el {{2}}. {{3}} Si necesitás cambiarla, respondé este mensaje.",
    ejemplo: ["Julio", "martes 28 de oct a las 10:00 h", "Entrás desde https://meet.jit.si/DEVISEBIT-abc123"],
  },
  {
    name: "recordatorio_reunion", category: "UTILITY",
    text: "Hola {{1}}, te recordamos tu reunión de hoy con DEVISEBIT a las {{2}}. {{3}} Cualquier cambio, respondé este mensaje.",
    ejemplo: ["Julio", "10:00 h", "Entrás desde https://meet.jit.si/DEVISEBIT-abc123"],
  },
]

async function gj(url: string, init?: RequestInit) {
  const r = await fetch(url, init)
  const j = await r.json().catch(() => ({}))
  return { ok: r.ok, j: j as any }
}

/** App y cuenta de WhatsApp Business a las que pertenece el token. */
async function ids(token: string) {
  const d = await gj(`${G}/debug_token?input_token=${token}&access_token=${token}`)
  const data = d.j?.data ?? {}
  const waba = (data.granular_scopes ?? []).find((s: any) => s.scope === "whatsapp_business_management")?.target_ids?.[0] ?? null
  return { app: data.app_id as string | undefined, waba: waba as string | null }
}

async function subirFoto(app: string, token: string) {
  const img = await fetch(`${URL_SISTEMA}/wa-perfil.jpg`)
  if (!img.ok) return { error: `foto ${img.status}` }
  const buf = Buffer.from(await img.arrayBuffer())
  const s = await gj(`${G}/${app}/uploads?file_length=${buf.length}&file_type=image/jpeg&access_token=${token}`, { method: "POST" })
  if (!s.j?.id) return { error: s.j?.error?.message ?? "no se pudo iniciar la subida" }
  const u = await gj(`${G}/${s.j.id}`, { method: "POST", headers: { Authorization: `OAuth ${token}`, file_offset: "0" }, body: buf })
  return u.j?.h ? { h: u.j.h as string } : { error: u.j?.error?.message ?? "no se pudo subir la foto" }
}

/** Carga perfil y plantillas. Sin `forzar`, solo corre si cambió la versión. */
export async function asegurarPerfil(forzar = false) {
  const { phoneId, token } = cuenta()
  if (!phoneId || !token) return { ok: false, error: "WhatsApp no configurado" }
  const hecho = await one<{ valor: string }>("select valor from config where clave='wa_perfil'").catch(() => null)
  if (!forzar && hecho?.valor === PERFIL_VERSION) return { ok: true, ya: true }
  await q("insert into config(clave,valor) values ('wa_perfil',$1) on conflict (clave) do update set valor=excluded.valor", [PERFIL_VERSION])
  const out: Record<string, unknown> = {}
  const { app, waba } = await ids(token)
  let foto: string | undefined
  if (app) { const f = await subirFoto(app, token); if ("h" in f) foto = f.h; else out.foto = f.error } else out.foto = "sin app id"
  const p = await gj(`${G}/${phoneId}/whatsapp_business_profile`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...PERFIL, ...(foto ? { profile_picture_handle: foto } : {}) }),
  })
  out.perfil = p.ok ? "ok" : p.j?.error?.message
  if (foto) out.foto = p.ok ? "ok" : out.perfil
  if (waba) {
    const ex = await gj(`${G}/${waba}/message_templates?fields=name,status&limit=200&access_token=${token}`)
    const ya = new Set((ex.j?.data ?? []).map((t: any) => t.name))
    const pl: Record<string, string> = {}
    for (const t of PLANTILLAS) {
      if (ya.has(t.name)) { pl[t.name] = (ex.j.data.find((x: any) => x.name === t.name)?.status ?? "existe").toLowerCase(); continue }
      const c = await gj(`${G}/${waba}/message_templates`, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: t.name, language: "es_AR", category: t.category, components: [{ type: "BODY", text: t.text, example: { body_text: [t.ejemplo] } }] }),
      })
      pl[t.name] = c.ok ? (c.j?.status ?? "enviada").toLowerCase() : c.j?.error?.error_user_msg ?? c.j?.error?.message ?? "error"
    }
    out.plantillas = pl
  } else out.plantillas = "sin cuenta de WhatsApp Business en el token"
  if (out.perfil !== "ok") await q("delete from config where clave='wa_perfil'")
  await q("insert into config(clave,valor) values ('wa_perfil_resultado',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify({ ...out, cuando: new Date().toISOString() })])
  return { ok: out.perfil === "ok", ...out }
}

export async function estadoPerfil() {
  const r = await one<{ valor: string }>("select valor from config where clave='wa_perfil_resultado'").catch(() => null)
  try { return r ? JSON.parse(r.valor) : null } catch { return null }
}

/** Teléfono argentino → id de WhatsApp (549 + área + número). */
export function waId(tel?: string | null) {
  let d = String(tel ?? "").replace(/\D/g, "")
  if (!d) return null
  if (d.startsWith("00")) d = d.slice(2)
  if (d.startsWith("0")) d = d.slice(1)
  if (d.startsWith("549") && d.length === 13) return d
  if (d.startsWith("54") && d.length === 12) return "549" + d.slice(2)
  if (d.length === 10) return "549" + d
  if (d.length === 12 && d.startsWith("15")) return null
  return d.length >= 11 && d.length <= 15 ? d : null
}

export async function enviarPlantilla(to: string, nombre: string, params: string[]) {
  const { phoneId, token } = cuenta()
  if (!phoneId || !token) return { ok: false, error: "WhatsApp no configurado" }
  const limpio = (t: string) => t.replace(/[\n\t]+/g, " ").replace(/ {4,}/g, " ").trim().slice(0, 900) || "-"
  const r = await gj(`${G}/${phoneId}/messages`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "template", template: { name: nombre, language: { code: "es_AR" }, components: [{ type: "body", parameters: params.map((t) => ({ type: "text", text: limpio(t) })) }] } }),
  })
  return r.ok ? { ok: true, id: r.j?.messages?.[0]?.id as string | undefined } : { ok: false, error: r.j?.error?.message ?? "error" }
}

/**
 * Manda un aviso al cliente por WhatsApp: texto libre si está dentro de las 24 h, si no, la plantilla aprobada.
 * Deja el chat atado a la consulta para que el equipo siga la conversación desde el CRM.
 */
export async function avisarPorWhatsApp(cid: number, to: string, texto: string, plantilla: string, params: string[], nombre?: string | null) {
  let r = await enviarTexto("devisebit", to, texto)
  let enviado = texto
  if (!r.ok) { r = await enviarPlantilla(to, plantilla, params); enviado = PLANTILLAS.find((p) => p.name === plantilla)!.text.replace(/\{\{(\d)\}\}/g, (_m, i) => params[Number(i) - 1] ?? "") }
  if (r.ok) {
    await q("insert into wa_chats(empresa,wa_id,nombre,consulta_id) values ('devisebit',$1,$2,$3) on conflict (empresa,wa_id) do update set consulta_id=coalesce(wa_chats.consulta_id, excluded.consulta_id)", [to, nombre ?? null, cid]).catch(() => {})
    await q("update consultas set chat_id=coalesce(chat_id,$1) where id=$2", [to, cid]).catch(() => {})
    await q("insert into wa_mensajes(empresa,wa_id,autor,texto,meta_id,autor_nombre) values ('devisebit',$1,'bot',$2,$3,'Bit (asistente IA)')", [to, enviado, (r as any).id ?? null]).catch(() => {})
  }
  return r
}
