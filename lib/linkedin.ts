import { unstable_cache } from "next/cache"
import { guardarPublicaciones } from "./publicaciones"

/**
 * LinkedIn de la página de DEVISEBIT, a través de Buffer (que publica en esa página).
 * Clave: BUFFER_API_KEY (personal, de publish.buffer.com/settings/api). Sin la clave, el panel muestra solo el link.
 * Organización y canal de Buffer: BUFFER_ORG_ID / BUFFER_LINKEDIN_CHANNEL (con los valores actuales por defecto).
 */
const ORG = () => process.env.BUFFER_ORG_ID ?? "6ad77518fa8d2fdc36836810"
const CANAL = () => process.env.BUFFER_LINKEDIN_CHANNEL ?? "6ad776b6778b240e2f6a215d"
/** Perfil personal de Julio en Buffer (también forma parte del ecosistema). */
const CANAL_JULIO = () => process.env.BUFFER_LINKEDIN_JULIO_CHANNEL ?? "6ae3972b2f1f5ed648132112"
export const linkedinConfigurado = () => !!process.env.BUFFER_API_KEY

/** Consulta a la API de Buffer (GraphQL). La usan LinkedIn y TikTok. */
export async function bufferGql(query: string) {
  const r = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.BUFFER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  })
  const j: any = await r.json().catch(() => ({}))
  if (!r.ok || j.errors?.length) throw new Error(`Buffer respondió ${r.status}${j.errors?.[0]?.message ? ": " + j.errors[0].message : ""}`.slice(0, 220))
  return j.data
}

export type MetricasLI = { posts: number | null; alcance: number | null; impresiones: number | null; reacciones: number | null; comentarios: number | null; compartidos: number | null; engagement: number | null }
export type PostLI = { id: string; texto: string; fecha: string; url?: string | null; metricas: Record<string, number> }

const val = (ms: any[], t: string) => { const m = (ms ?? []).find((x) => x.type === t); return m ? Number(m.value) : null }
const aMetricas = (ms: any[]): MetricasLI => ({ posts: val(ms, "postCount"), alcance: val(ms, "reach"), impresiones: val(ms, "impressions"), reacciones: val(ms, "reactions"), comentarios: val(ms, "comments"), compartidos: val(ms, "shares") ?? val(ms, "reposts"), engagement: val(ms, "engagementRate") })

const agregado = (canal: string, desde: Date, hasta: Date) => `aggregatedPostMetrics(input: { organizationId: "${ORG()}", startDateTime: "${desde.toISOString()}", endDateTime: "${hasta.toISOString()}", channelIds: ["${canal}"] }) { metrics { type value unit } metricsUpdatedAt }`

/** El plan gratuito de Buffer solo da métricas de los últimos 31 días: se piden 30 (antes se pedían 60 y Buffer rechazaba todo). */
async function traerCanal(canal: string, red: "linkedin" | "linkedin_julio") {
  const ahora = new Date(), d30 = new Date(Date.now() - 30 * 864e5)
  const a = await bufferGql(`query { actual: ${agregado(canal, d30, ahora)} }`)
  let posts: PostLI[] = []
  try {
    const p = await bufferGql(`query { posts(first: 50, input: { organizationId: "${ORG()}", filter: { status: [sent], channelIds: ["${canal}"] } }) { edges { node { id text dueAt sentAt externalLink metrics { type value } } } } }`)
    posts = (p.posts?.edges ?? []).map((e: any) => e.node).filter(Boolean).map((n: any) => ({ id: String(n.id), texto: String(n.text ?? ""), fecha: n.sentAt ?? n.dueAt ?? "", url: n.externalLink ?? null, metricas: Object.fromEntries((n.metrics ?? []).map((m: any) => [m.type, Number(m.value)])) }))
  } catch {
    const p = await bufferGql(`query { posts(first: 50, input: { organizationId: "${ORG()}", filter: { status: [sent], channelIds: ["${canal}"] } }) { edges { node { id text dueAt metrics { type value } } } } }`).catch(() => null)
    posts = (p?.posts?.edges ?? []).map((e: any) => e.node).filter(Boolean).map((n: any) => ({ id: String(n.id), texto: String(n.text ?? ""), fecha: n.dueAt ?? "", url: null, metricas: Object.fromEntries((n.metrics ?? []).map((m: any) => [m.type, Number(m.value)])) }))
  }
  posts.sort((x, y) => y.fecha.localeCompare(x.fecha))
  await guardarPublicaciones(posts.map((x) => ({ red, id: "buf:" + x.id, fecha: x.fecha || null, texto: x.texto, tipo: "Publicación", url: x.url, me_gusta: x.metricas.reactions ?? x.metricas.likes, comentarios: x.metricas.comments, compartidos: x.metricas.shares ?? x.metricas.reposts, alcance: x.metricas.reach, impresiones: x.metricas.impressions, clics: x.metricas.clicks })), "Buffer").catch(() => {})
  return { actual: aMetricas(a.actual?.metrics), previo: aMetricas([]), posts, actualizado: a.actual?.metricsUpdatedAt ?? new Date().toISOString() }
}

const traer = unstable_cache(() => traerCanal(CANAL(), "linkedin"), ["pc-linkedin-v2"], { revalidate: 1800 })
const traerJulio = unstable_cache(() => traerCanal(CANAL_JULIO(), "linkedin_julio"), ["pc-linkedin-julio-v1"], { revalidate: 1800 })

export type DatosLI = { ok: true; actual: MetricasLI; previo: MetricasLI; posts: PostLI[]; actualizado: string } | { ok: false; error: string }

export async function linkedin(cuenta: "pagina" | "julio" = "pagina"): Promise<DatosLI> {
  if (!linkedinConfigurado()) return { ok: false, error: "sin_clave" }
  try {
    return { ok: true, ...(await (cuenta === "julio" ? traerJulio() : traer())) }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}
