/** De dónde llega cada consulta: publicidad (Google Ads, Meta Ads), orgánico o directo. */
export type Origen = { fuente: string; campania?: string | null; utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null; gclid?: string | null; detalle?: Record<string, unknown> | null }

export const FUENTES = ["Google Ads", "Meta Ads", "Google orgánico", "Redes (orgánico)", "Web directa", "WhatsApp directo", "Instagram directo", "Referido", "Otro"] as const

/** Anuncio de Meta "clic a WhatsApp/Instagram": viene el objeto referral en el mensaje. */
export function desdeReferral(ref: any, canal: "whatsapp" | "instagram"): Origen | null {
  if (!ref) return null
  const esAd = ref.source_type === "ad" || ref.source === "ADS" || !!ref.ctwa_clid || !!ref.ad_id
  return {
    fuente: esAd ? "Meta Ads" : canal === "instagram" ? "Redes (orgánico)" : "Redes (orgánico)",
    campania: ref.headline ?? ref.ads_context_data?.ad_title ?? ref.source_id ?? ref.ad_id ?? null,
    detalle: ref,
  }
}

/** Código que la web agrega al texto precargado del botón de WhatsApp, p. ej. "[ref:gads|campaña]". */
export function desdeTexto(texto: string | null): Origen | null {
  const m = texto?.match(/\[ref:([a-z]+)(?:\|([^\]]{1,80}))?\]/i)
  if (!m) return null
  const k = m[1].toLowerCase()
  const fuente = k === "gads" ? "Google Ads" : k === "meta" ? "Meta Ads" : k === "seo" ? "Google orgánico" : k === "social" ? "Redes (orgánico)" : k === "ref" ? "Referido" : "Web directa"
  return { fuente, campania: m[2] ?? null }
}
export const limpiarRef = (t: string | null) => t?.replace(/\s*\[ref:[^\]]*\]\s*/gi, " ").trim() || t

/** Formulario web: utm_* y gclid que la web guardó al entrar. */
export function desdeUtm(b: Record<string, any>): Origen {
  const src = String(b.utm_source ?? "").toLowerCase(), med = String(b.utm_medium ?? "").toLowerCase()
  let fuente = "Web directa"
  if (b.gclid || b.gbraid || b.wbraid || (src.includes("google") && /cpc|ppc|paid|ads/.test(med))) fuente = "Google Ads"
  else if (b.fbclid && /cpc|paid|ads/.test(med) || /facebook|instagram|meta/.test(src) && /cpc|paid|ads/.test(med)) fuente = "Meta Ads"
  else if (/facebook|instagram|linkedin|meta|social/.test(src) || b.fbclid) fuente = "Redes (orgánico)"
  else if (/google|bing/.test(src) || /google\./.test(String(b.referrer ?? ""))) fuente = "Google orgánico"
  else if (b.referrer && !/devisebit\.com/.test(String(b.referrer))) fuente = "Referido"
  return { fuente, campania: b.utm_campaign ?? null, utm_source: b.utm_source ?? null, utm_medium: b.utm_medium ?? null, utm_campaign: b.utm_campaign ?? null, gclid: b.gclid ?? null, detalle: { landing: b.landing ?? null, referrer: b.referrer ?? null } }
}
