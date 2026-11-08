import { randomBytes, timingSafeEqual } from "crypto"
import { q, one } from "./db"

/**
 * Avisos por Telegram.
 * - TELEGRAM_BOT_TOKEN (variable de Vercel, la carga Julio): el bot que crea con @BotFather.
 * - Los chats que reciben los avisos se vinculan solos con un código (/vincular CÓDIGO) y quedan en la base (config.telegram_chats).
 *   TELEGRAM_CHAT_ID (opcional) fuerza uno o varios chats separados por coma.
 * - Nunca lanza errores: un aviso que no sale no puede romper lo que lo disparó.
 */

const API = "https://api.telegram.org"
const BASE = () => process.env.SISTEMA_URL ?? "https://sistema.devisebit.com"

const leer = async (clave: string) => (await one<{ valor: string }>("select valor from config where clave=$1", [clave]).catch(() => null))?.valor ?? null
const guardar = (clave: string, valor: string) => q("insert into config(clave,valor) values ($1,$2) on conflict (clave) do update set valor=excluded.valor", [clave, valor])

export const tokenBot = () => process.env.TELEGRAM_BOT_TOKEN?.trim() || ""
const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

export async function chatsDestino(): Promise<string[]> {
  const env = (process.env.TELEGRAM_CHAT_ID ?? "").split(",").map((x) => x.trim()).filter(Boolean)
  if (env.length) return env
  try { const l = JSON.parse((await leer("telegram_chats")) ?? "[]"); return Array.isArray(l) ? l.map(String) : [] } catch { return [] }
}
export async function avisosTelegramActivos() { return (await leer("avisos_telegram")) !== "no" }

async function anotar(ok: boolean, error?: string) {
  await guardar("telegram_estado", JSON.stringify({ cuando: new Date().toISOString(), ok, error: error ?? null })).catch(() => {})
}

async function llamar(metodo: string, cuerpo: Record<string, unknown>, ms = 8000) {
  const t = tokenBot()
  if (!t) return { ok: false as const, error: "Falta TELEGRAM_BOT_TOKEN en Vercel" }
  try {
    const r = await fetch(`${API}/bot${t}/${metodo}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo), signal: AbortSignal.timeout(ms), cache: "no-store" })
    const j: any = await r.json().catch(() => ({}))
    return j?.ok ? { ok: true as const, result: j.result } : { ok: false as const, error: String(j?.description ?? `Telegram respondió ${r.status}`).slice(0, 200), codigo: Number(j?.error_code ?? r.status) }
  } catch (e: any) {
    return { ok: false as const, error: `No se pudo hablar con Telegram: ${String(e?.message ?? e).slice(0, 120)}` }
  }
}

export type AvisoTg = { titulo: string; cuerpo?: string; url?: string; silencioso?: boolean }

/** Manda un aviso a todos los chats vinculados. Devuelve cuántos salieron. No lanza. */
export async function enviarTelegram(a: AvisoTg): Promise<{ ok: boolean; enviados: number; error?: string }> {
  try {
    if (!tokenBot()) return { ok: false, enviados: 0, error: "sin bot" }
    if (!(await avisosTelegramActivos())) return { ok: false, enviados: 0, error: "desactivado" }
    const chats = await chatsDestino()
    if (!chats.length) return { ok: false, enviados: 0, error: "sin chat vinculado" }
    const link = a.url ? (a.url.startsWith("http") ? a.url : BASE() + a.url) : ""
    const texto = [`<b>${esc(a.titulo).slice(0, 200)}</b>`, a.cuerpo ? esc(a.cuerpo).slice(0, 900) : "", link ? `<a href="${esc(link)}">Abrir</a>` : ""].filter(Boolean).join("\n")
    let enviados = 0, error: string | undefined
    for (const chat of chats) {
      const r = await llamar("sendMessage", { chat_id: chat, text: texto, parse_mode: "HTML", disable_web_page_preview: true, disable_notification: !!a.silencioso })
      if (r.ok) enviados++
      else error = r.error
    }
    await anotar(enviados > 0, error)
    return { ok: enviados > 0, enviados, error }
  } catch (e: any) {
    return { ok: false, enviados: 0, error: String(e?.message ?? e).slice(0, 120) }
  }
}

/** Evita repetir el mismo aviso (por ejemplo, el mismo correo) dentro de una ventana. */
export async function primeraVez(clave: string, minutos = 1440): Promise<boolean> {
  const r = await q<{ clave: string }>(
    "insert into avisos_telegram(clave) values ($1) on conflict (clave) do update set enviado=now() where avisos_telegram.enviado < now() - ($2 || ' minutes')::interval returning clave",
    [clave.slice(0, 200), String(minutos)],
  ).catch(() => [{ clave }])
  if (Math.random() < 0.02) await q("delete from avisos_telegram where enviado < now() - interval '3 days'").catch(() => {})
  return r.length > 0
}

/* ---------------- Vincular un chat ---------------- */

export async function generarCodigo(): Promise<string> {
  const codigo = randomBytes(4).toString("hex").toUpperCase()
  await guardar("telegram_codigo", JSON.stringify({ codigo, vence: Date.now() + 15 * 60 * 1000 }))
  return codigo
}
export async function vincularChat(codigo: string, chatId: string | number): Promise<boolean> {
  try {
    const c = JSON.parse((await leer("telegram_codigo")) ?? "null")
    if (!c || Date.now() > c.vence) return false
    const a = Buffer.from(String(codigo).trim().toUpperCase()), b = Buffer.from(String(c.codigo))
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false
    const l = new Set(await chatsDestino()); l.add(String(chatId))
    await guardar("telegram_chats", JSON.stringify([...l]))
    await q("delete from config where clave='telegram_codigo'")
    return true
  } catch { return false }
}
export async function codigoVigente(): Promise<string | null> {
  try { const c = JSON.parse((await leer("telegram_codigo")) ?? "null"); return c && Date.now() < c.vence ? String(c.codigo) : null } catch { return null }
}
export async function desvincularTodo() { await guardar("telegram_chats", "[]") }
export async function chatVinculado(chatId: string | number) { return (await chatsDestino()).includes(String(chatId)) }

export async function responder(chatId: string | number, texto: string) {
  return llamar("sendMessage", { chat_id: chatId, text: texto, parse_mode: "HTML", disable_web_page_preview: true })
}

/* ---------------- Webhook ---------------- */

export async function secretoWebhook() {
  let s = await leer("telegram_secreto")
  if (!s) { s = randomBytes(24).toString("base64url"); await guardar("telegram_secreto", s) }
  return s
}
export async function secretoOk(h: string | null) {
  const s = await secretoWebhook()
  if (!h || h.length !== s.length) return false
  return timingSafeEqual(Buffer.from(h), Buffer.from(s))
}
export async function registrarWebhook() {
  const r = await llamar("setWebhook", { url: `${BASE()}/api/telegram`, secret_token: await secretoWebhook(), allowed_updates: ["message"], drop_pending_updates: true })
  return r.ok ? { ok: true as const } : { ok: false as const, error: r.error }
}
export async function datosBot(): Promise<{ usuario: string | null; error?: string }> {
  const r = await llamar("getMe", {}, 6000)
  return r.ok ? { usuario: (r.result as any)?.username ?? null } : { usuario: null, error: r.error }
}
export async function estadoTelegram() {
  let ult: { cuando: string; ok: boolean; error: string | null } | null = null
  try { ult = JSON.parse((await leer("telegram_estado")) ?? "null") } catch {}
  return { bot: !!tokenBot(), chats: (await chatsDestino()).length, activo: await avisosTelegramActivos(), ultimo: ult }
}
export async function fijarActivo(si: boolean) { await guardar("avisos_telegram", si ? "si" : "no") }
