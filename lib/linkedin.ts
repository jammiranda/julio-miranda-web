import { unstable_cache } from "next/cache"

/**
 * LinkedIn de la página de DEVISEBIT, a través de Buffer (que publica en esa página).
 * Clave: BUFFER_API_KEY (personal, de publish.buffer.com/settings/api). Sin la clave, el panel muestra solo el link.
 * Organización y canal de Buffer: BUFFER_ORG_ID / BUFFER_LINKEDIN_CHANNEL (con los valores actuales por defecto).
 */
const ORG = () => process.env.BUFFER_ORG_ID ?? "6ad77518fa8d2fdc36836810"
const CANAL = () => process.env.BUFFER_LINKEDIN_CHANNEL ?? "6ad776b6778b240e2f6a215d"
export const linkedinConfigurado = () => !!process.env.BUFFER_API_KEY

async function gql(query: string) {
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
export type PostLI = { id: string; texto: string; fecha: string; metricas: Record<string, number> }

const val = (ms: any[], t: string) => { const m = (ms ?? []).find((x) => x.type === t); return m ? Number(m.value) : null }
const aMetricas = (ms: any[]): MetricasLI => ({ posts: val(ms, "postCount"), alcance: val(ms, "reach"), impresiones: val(ms, "impressions"), reacciones: val(ms, "reactions"), comentarios: val(ms, "comments"), compartidos: val(ms, "shares") ?? val(ms, "reposts"), engagement: val(ms, "engagementRate") })

const agregado = (desde: Date, hasta: Date) => `aggregatedPostMetrics(input: { organizationId: "${ORG()}", startDateTime: "${desde.toISOString()}", endDateTime: "${hasta.toISOString()}", channelIds: ["${CANAL()}"] }) { metrics { type value unit } metricsUpdatedAt }`

const traer = unstable_cache(
  async () => {
    const ahora = new Date(), d30 = new Date(Date.now() - 30 * 864e5), d60 = new Date(Date.now() - 60 * 864e5)
    const a = await gql(`query { actual: ${agregado(d30, ahora)} previo: ${agregado(d60, d30)} }`)
    let posts: PostLI[] = []
    try {
      const p = await gql(`query { posts(first: 20, input: { organizationId: "${ORG()}", filter: { status: [sent], channelIds: ["${CANAL()}"] } }) { edges { node { id text dueAt metrics { type value } } } } }`)
      posts = (p.posts?.edges ?? []).map((e: any) => e.node).filter(Boolean).map((n: any) => ({ id: String(n.id), texto: String(n.text ?? ""), fecha: n.dueAt ?? "", metricas: Object.fromEntries((n.metrics ?? []).map((m: any) => [m.type, Number(m.value)])) }))
      posts.sort((x, y) => y.fecha.localeCompare(x.fecha))
    } catch {}
    return { actual: aMetricas(a.actual?.metrics), previo: aMetricas(a.previo?.metrics), posts, actualizado: a.actual?.metricsUpdatedAt ?? new Date().toISOString() }
  },
  ["pc-linkedin-v1"],
  { revalidate: 1800 },
)

export type DatosLI = { ok: true; actual: MetricasLI; previo: MetricasLI; posts: PostLI[]; actualizado: string } | { ok: false; error: string }

export async function linkedin(): Promise<DatosLI> {
  if (!linkedinConfigurado()) return { ok: false, error: "sin_clave" }
  try {
    return { ok: true, ...(await traer()) }
  } catch (e: any) {
    return { ok: false, error: String(e?.message ?? e) }
  }
}
