"use client"
import { useEffect } from "react"

const K = "db_origen"
type O = { utm_source?: string; utm_medium?: string; utm_campaign?: string; gclid?: string; gbraid?: string; wbraid?: string; fbclid?: string; landing?: string; referrer?: string; t?: number }

/** Origen de la visita (primer contacto, 90 días): para saber si el cliente llegó por Google Ads, Meta, orgánico o directo. */
export function leerOrigen(): O {
  try { const o = JSON.parse(localStorage.getItem(K) || "{}") as O; return o.t && Date.now() - o.t < 90 * 864e5 ? o : {} } catch { return {} }
}
function codigo(o: O) {
  const s = (o.utm_source || "").toLowerCase(), m = (o.utm_medium || "").toLowerCase()
  const k = o.gclid || o.gbraid || o.wbraid || (s.includes("google") && /cpc|ppc|paid|ads/.test(m)) ? "gads"
    : (/facebook|instagram|meta/.test(s) && /cpc|paid|ads/.test(m)) ? "meta"
    : /facebook|instagram|linkedin|social/.test(s) || o.fbclid ? "social"
    : /google|bing/.test(s) || /google\./.test(o.referrer || "") ? "seo" : ""
  return k ? `[ref:${k}${o.utm_campaign ? "|" + o.utm_campaign.slice(0, 40) : ""}]` : ""
}

export default function Attribution() {
  useEffect(() => {
    try {
      const p = new URLSearchParams(location.search)
      const nuevo: O = {}
      for (const k of ["utm_source", "utm_medium", "utm_campaign", "gclid", "gbraid", "wbraid", "fbclid"] as const) { const v = p.get(k); if (v) nuevo[k] = v.slice(0, 200) }
      const actual = leerOrigen()
      // Un clic pago nuevo pisa al anterior; si no, se respeta el primer contacto
      if (Object.keys(nuevo).length || !actual.t) {
        localStorage.setItem(K, JSON.stringify({ ...nuevo, landing: location.pathname, referrer: document.referrer && !document.referrer.includes(location.host) ? document.referrer.slice(0, 200) : "", t: Date.now() }))
      }
    } catch {}
    const alClic = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href*='wa.me'], a[href*='api.whatsapp.com']") as HTMLAnchorElement | null
      if (!a) return
      const c = codigo(leerOrigen())
      if (!c) return
      try {
        const u = new URL(a.href)
        const txt = u.searchParams.get("text") || "Hola DEVISEBIT"
        if (!txt.includes("[ref:")) { u.searchParams.set("text", `${txt} ${c}`); a.href = u.toString() }
      } catch {}
    }
    document.addEventListener("click", alClic, true)
    return () => document.removeEventListener("click", alClic, true)
  }, [])
  return null
}
