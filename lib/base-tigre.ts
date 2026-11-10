import { q } from "./db"

/**
 * Base Tigre: usuarios de la app Soy Tigre, curados y segmentados por rango etario (edad estimada a partir del DNI).
 * Vive aparte del CRM a propósito: son decenas de miles de personas que no son contactos comerciales, y mezclarlas
 * ensuciaría Contactos, Clasificar y los avisos. NO se guarda el DNI: solo la banda de edad derivada.
 * Nada de esta tabla entra a los envíos hasta que se decida y se pase un segmento al CRM de forma explícita.
 */
export const BANDAS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "Sin dato de edad"] as const
export const TIPOS_EMAIL = ["personal", "corporativo", "educativo", "gobierno"] as const
export const CONFIANZAS = ["alta", "media", "baja", "sin dato"] as const

/** Límite de Brevo gratis (ver lib/email.ts): sirve para estimar cuánto tarda una campaña. */
export const ENVIOS_POR_DIA = 300

export type FilaCarga = { email: string; nombre: string | null; apellido: string | null; banda: string; edad: number | null; confianza: string | null; tipo: string | null }

const txt = (v: unknown, n: number) => { const t = String(v ?? "").trim(); return t ? t.slice(0, n) : null }

/** Valida y normaliza una tanda de filas [email, nombre, apellido, banda, edad, confianza, tipo_email]. Descarta lo inválido (y menores). */
export function normalizarTanda(filas: unknown[][]): { ok: FilaCarga[]; omitidas: number } {
  const ok: FilaCarga[] = []
  const vistos = new Set<string>()
  let omitidas = 0
  for (const r of filas) {
    const email = String(r?.[0] ?? "").trim().toLowerCase()
    const banda = String(r?.[3] ?? "").trim()
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email) || !(BANDAS as readonly string[]).includes(banda) || vistos.has(email)) { omitidas++; continue }
    vistos.add(email)
    const edad = Number(r?.[4])
    const conf = String(r?.[5] ?? "").trim()
    const tipo = String(r?.[6] ?? "").trim()
    ok.push({
      email, nombre: txt(r?.[1], 120), apellido: txt(r?.[2], 120), banda,
      edad: Number.isFinite(edad) && edad >= 18 && edad < 110 ? Math.round(edad) : null,
      confianza: (CONFIANZAS as readonly string[]).includes(conf) ? conf : null,
      tipo: (TIPOS_EMAIL as readonly string[]).includes(tipo) ? tipo : null,
    })
  }
  return { ok, omitidas }
}

export async function cargarTanda(filas: FilaCarga[], lote: string) {
  const r = await q<{ nuevo: boolean }>(
    `insert into base_tigre(email,nombre,apellido,banda,edad_aprox,confianza,tipo_email,lote)
     select email,nombre,apellido,banda,edad,confianza,tipo,$2 from jsonb_to_recordset($1::jsonb)
       as x(email text, nombre text, apellido text, banda text, edad int, confianza text, tipo text)
     on conflict (lower(email)) do update set nombre=excluded.nombre, apellido=excluded.apellido, banda=excluded.banda,
       edad_aprox=excluded.edad_aprox, confianza=excluded.confianza, tipo_email=excluded.tipo_email, lote=excluded.lote, actualizado=now()
     returning (xmax = 0) nuevo`,
    [JSON.stringify(filas), lote.slice(0, 60)],
  )
  const creados = r.filter((x) => x.nuevo).length
  return { creados, actualizados: r.length - creados }
}

export type Resumen = {
  total: number; activos: number; bajas: number
  porBanda: { banda: string; n: number }[]
  porTipo: { tipo: string; n: number }[]
  porConfianza: { confianza: string; n: number }[]
  cruce: { banda: string; tipo: string; n: number }[]
  ultimaCarga: string | null
}

export async function resumen(): Promise<Resumen> {
  const [t, b, tp, cf, cr, u] = await Promise.all([
    q<{ total: number; activos: number; bajas: number }>("select count(*)::int total, count(*) filter (where estado='activo')::int activos, count(*) filter (where estado='baja')::int bajas from base_tigre"),
    q<{ banda: string; n: number }>("select banda, count(*)::int n from base_tigre where estado='activo' group by banda"),
    q<{ tipo: string; n: number }>("select coalesce(tipo_email,'sin clasificar') tipo, count(*)::int n from base_tigre where estado='activo' group by 1 order by 2 desc"),
    q<{ confianza: string; n: number }>("select coalesce(confianza,'sin dato') confianza, count(*)::int n from base_tigre where estado='activo' group by 1 order by 2 desc"),
    q<{ banda: string; tipo: string; n: number }>("select banda, coalesce(tipo_email,'sin clasificar') tipo, count(*)::int n from base_tigre where estado='activo' group by 1,2"),
    q<{ f: string | null }>("select max(cargado)::text f from base_tigre"),
  ])
  const orden = (x: string) => { const i = (BANDAS as readonly string[]).indexOf(x); return i < 0 ? 99 : i }
  return {
    total: t[0]?.total ?? 0, activos: t[0]?.activos ?? 0, bajas: t[0]?.bajas ?? 0,
    porBanda: [...b].sort((x, y) => orden(x.banda) - orden(y.banda)),
    porTipo: tp, porConfianza: cf, cruce: cr, ultimaCarga: u[0]?.f ?? null,
  }
}
