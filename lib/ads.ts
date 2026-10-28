import { q } from "./db"

/**
 * Anuncios en el Panel: inversión y resultados por día y campaña.
 * - Meta Ads: se trae solo todos los días con META_ADS_TOKEN + META_AD_ACCOUNT_ID (los carga Julio en Vercel).
 * - Google Ads: un script de Google Ads manda los datos a /api/ads/ingesta con la clave ADS_INGESTA_KEY.
 */
export type FilaAds = { fecha: string; campania: string; campania_id?: string; gasto: number; moneda?: string; impresiones?: number; clics?: number; conversiones?: number }

export async function guardarFilas(plataforma: "google" | "meta", filas: FilaAds[]) {
  let n = 0
  for (const f of filas) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.fecha) || !f.campania) continue
    await q(
      `insert into ads_diario(plataforma,fecha,campania,campania_id,gasto,moneda,impresiones,clics,conversiones) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       on conflict (plataforma,fecha,campania_id,campania) do update set gasto=excluded.gasto, moneda=excluded.moneda, impresiones=excluded.impresiones, clics=excluded.clics, conversiones=excluded.conversiones, actualizado=now()`,
      [plataforma, f.fecha, String(f.campania).slice(0, 200), String(f.campania_id ?? "").slice(0, 60), Number(f.gasto) || 0, (f.moneda ?? "ARS").slice(0, 3), Math.round(Number(f.impresiones) || 0), Math.round(Number(f.clics) || 0), Number(f.conversiones) || 0],
    )
    n++
  }
  return n
}

const CONV_META = ["lead", "onsite_conversion.lead_grouped", "onsite_conversion.messaging_conversation_started_7d", "offsite_conversion.fb_pixel_lead", "contact", "onsite_web_lead"]

/** Trae los últimos 30 días de Meta Ads (si están las claves). */
export async function sincronizarMeta() {
  const token = process.env.META_ADS_TOKEN, cuenta = process.env.META_AD_ACCOUNT_ID
  if (!token || !cuenta) return "sin claves de Meta Ads"
  const act = cuenta.startsWith("act_") ? cuenta : `act_${cuenta}`
  let url: string | null = `https://graph.facebook.com/v21.0/${act}/insights?level=campaign&time_increment=1&date_preset=last_30d&limit=500&fields=campaign_id,campaign_name,spend,impressions,clicks,actions,account_currency&access_token=${encodeURIComponent(token)}`
  const filas: FilaAds[] = []
  while (url) {
    const r: Response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) })
    const j: any = await r.json().catch(() => ({}))
    if (!r.ok) return `Meta respondió ${r.status}: ${j?.error?.message ?? ""}`.slice(0, 200)
    for (const d of j.data ?? []) {
      const conv = (d.actions ?? []).filter((a: any) => CONV_META.includes(a.action_type)).reduce((s: number, a: any) => s + Number(a.value || 0), 0)
      filas.push({ fecha: d.date_start, campania: d.campaign_name, campania_id: d.campaign_id, gasto: Number(d.spend || 0), moneda: d.account_currency, impresiones: Number(d.impressions || 0), clics: Number(d.clicks || 0), conversiones: conv })
    }
    url = j.paging?.next ?? null
  }
  return `meta: ${await guardarFilas("meta", filas)} filas`
}

/** Resumen para el Panel: últimos 30 días, por plataforma, día y campaña, cruzado con las consultas que llegaron de anuncios. */
export async function resumenAds() {
  const [plat, dias, camp, consultas, ultima] = await Promise.all([
    q<{ plataforma: string; gasto: number; impresiones: number; clics: number; conversiones: number; moneda: string }>(`select plataforma, sum(gasto)::float gasto, sum(impresiones)::int impresiones, sum(clics)::int clics, sum(conversiones)::float conversiones, max(moneda) moneda from ads_diario where fecha > current_date - 30 group by plataforma`),
    q<{ fecha: string; plataforma: string; gasto: number; clics: number }>(`select to_char(fecha,'YYYY-MM-DD') fecha, plataforma, sum(gasto)::float gasto, sum(clics)::int clics from ads_diario where fecha > current_date - 30 group by 1,2 order by 1`),
    q<{ plataforma: string; campania: string; gasto: number; impresiones: number; clics: number; conversiones: number }>(`select plataforma, campania, sum(gasto)::float gasto, sum(impresiones)::int impresiones, sum(clics)::int clics, sum(conversiones)::float conversiones from ads_diario where fecha > current_date - 30 group by 1,2 order by 3 desc limit 20`),
    q<{ fuente: string; c: number; contactos: number; ganadas: number }>(`select fuente, count(*)::int c, count(*) filter (where estado in ('contactada','convertida') or exists (select 1 from db_contactos d where d.consulta_id=consultas.id))::int contactos, count(*) filter (where estado='convertida')::int ganadas from consultas where creado > now() - interval '30 days' and fuente in ('Google Ads','Meta Ads') group by fuente`),
    q<{ plataforma: string; u: string }>(`select plataforma, to_char(max(actualizado) at time zone 'America/Argentina/Buenos_Aires','YYYY-MM-DD HH24:MI') u from ads_diario group by plataforma`),
  ])
  const consultasDe = (p: string) => consultas.find((c) => c.fuente === (p === "google" ? "Google Ads" : "Meta Ads"))
  const plataformas = ["google", "meta"].map((p) => {
    const x = plat.find((r) => r.plataforma === p)
    const c = consultasDe(p)
    return {
      plataforma: p,
      nombre: p === "google" ? "Google Ads" : "Meta Ads",
      conectada: p === "meta" ? !!(process.env.META_ADS_TOKEN && process.env.META_AD_ACCOUNT_ID) : !!ultima.find((u) => u.plataforma === "google"),
      ultimaActualizacion: ultima.find((u) => u.plataforma === p)?.u ?? null,
      moneda: x?.moneda ?? "ARS",
      gasto: x?.gasto ?? 0, impresiones: x?.impresiones ?? 0, clics: x?.clics ?? 0, conversiones: x?.conversiones ?? 0,
      ctr: x && x.impresiones ? Math.round((x.clics / x.impresiones) * 1000) / 10 : null,
      cpc: x && x.clics ? Math.round(x.gasto / x.clics) : null,
      consultas: c?.c ?? 0, consultasAtendidas: c?.contactos ?? 0, ventas: c?.ganadas ?? 0,
      costoPorConsulta: x && c?.c ? Math.round(x.gasto / c.c) : null,
    }
  })
  return { periodo: "30 días", plataformas, dias, campanias: camp, nota: "Inversión y clics vienen de cada plataforma; las consultas son las que entraron al sistema marcadas como Google Ads o Meta Ads." }
}
