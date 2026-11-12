import { q, one } from "./db"
import { enviarTelegram } from "./telegram"

/**
 * Tablero diario de Julio: una edición a la mañana (8:27) y una de cierre (18:57), armadas por tareas programadas
 * que hacen POST a /api/panel/informe. Julio tilda decisiones y deja notas en el tablero; los agentes las leen al día siguiente.
 */
export type Nivel = "ok" | "aviso" | "alto"
export type Item = { t: string; d?: string; nivel?: Nivel; url?: string; hora?: string }
export type Seccion = { id: string; titulo: string; tipo?: "lista" | "decisiones"; items: Item[] }
export type Edicion = { dia: string; edicion: "manana" | "cierre"; semaforo: "verde" | "amarillo" | "rojo"; resumen: string; secciones: Seccion[]; creado: string }

export const TABLERO_URL = () => process.env.TABLERO_URL ?? "https://tablero.devisebit.com"
export const EDICIONES = { manana: "Mañana · 8:27", cierre: "Cierre · 18:57" } as const

/** Fecha de hoy en Argentina (YYYY-MM-DD). */
export const hoyAR = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date())
export const diaValido = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d))
export const claveItem = (sec: string, t: string) => `${sec}:${t.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, "-").slice(0, 60)}`

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

/** Limpia lo que mandan las tareas: tamaños acotados y solo los campos conocidos. */
export function limpiarSecciones(raw: unknown): Seccion[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 30).map((s: any, i) => {
    const id = txt(s?.id, 30).toLowerCase().replace(/[^a-z0-9_-]/g, "") || `s${i + 1}`
    const items: Item[] = (Array.isArray(s?.items) ? s.items : []).slice(0, 80).map((it: any) => {
      const url = txt(it?.url, 400)
      const nivel = ["ok", "aviso", "alto"].includes(it?.nivel) ? (it.nivel as Nivel) : undefined
      return { t: txt(it?.t, 220), d: txt(it?.d, 500) || undefined, nivel, url: /^https?:\/\//.test(url) ? url : undefined, hora: txt(it?.hora, 20) || undefined }
    }).filter((it: Item) => it.t)
    return { id, titulo: txt(s?.titulo, 80) || id, tipo: (s?.tipo === "decisiones" ? "decisiones" : "lista") as Seccion["tipo"], items }
  }).filter((s) => s.titulo)
}

export async function guardarEdicion(e: { dia: string; edicion: "manana" | "cierre"; semaforo: string; resumen: string; secciones: Seccion[] }) {
  const sem = ["verde", "amarillo", "rojo"].includes(e.semaforo) ? e.semaforo : "verde"
  await q(
    `insert into informe_diario(dia,edicion,semaforo,resumen,secciones,creado) values ($1,$2,$3,$4,$5::jsonb,now())
     on conflict (dia,edicion) do update set semaforo=excluded.semaforo, resumen=excluded.resumen, secciones=excluded.secciones, creado=now()`,
    [e.dia, e.edicion, sem, e.resumen.slice(0, 1500), JSON.stringify(e.secciones)],
  )
  await q("delete from informe_diario where dia < current_date - 45")
}

const sel = "select to_char(dia,'YYYY-MM-DD') dia, edicion, semaforo, resumen, secciones, creado::text creado from informe_diario"
export const edicionesDe = (dia: string) => q<Edicion>(`${sel} where dia=$1 order by edicion`, [dia])
export const ultimaEdicion = (dia: string) => one<Edicion>(`${sel} where dia=$1 order by creado desc limit 1`, [dia])
export const diasConInforme = () => q<{ dia: string; semaforo: string }>("select to_char(dia,'YYYY-MM-DD') dia, (array_agg(semaforo order by creado desc))[1] semaforo from informe_diario group by dia order by dia desc limit 14")

export async function tildesDe(dia: string): Promise<Record<string, boolean>> {
  const f = await q<{ clave: string; hecho: boolean }>("select clave, hecho from informe_tildes where dia=$1", [dia])
  return Object.fromEntries(f.map((x) => [x.clave, x.hecho]))
}
export async function notaDe(dia: string) { return (await one<{ texto: string; actualizado: string }>("select texto, actualizado::text from informe_notas where dia=$1", [dia])) ?? null }

export async function tildar(dia: string, clave: string, hecho: boolean) {
  await q("insert into informe_tildes(dia,clave,hecho,actualizado) values ($1,$2,$3,now()) on conflict (dia,clave) do update set hecho=excluded.hecho, actualizado=now()", [dia, clave.slice(0, 120), hecho])
}
export async function guardarNota(dia: string, texto: string) {
  await q("insert into informe_notas(dia,texto,actualizado) values ($1,$2,now()) on conflict (dia) do update set texto=excluded.texto, actualizado=now()", [dia, texto.slice(0, 4000)])
}

/** Aviso corto por Telegram: semáforo + resumen + cuántas decisiones esperan, con link al tablero. Nunca lanza. */
export async function avisarTelegram(e: { edicion: "manana" | "cierre"; semaforo: string; resumen: string; secciones: Seccion[] }) {
  const dec = e.secciones.filter((s) => s.tipo === "decisiones").reduce((a, s) => a + s.items.length, 0)
  const ico = e.semaforo === "rojo" ? "🔴" : e.semaforo === "amarillo" ? "🟡" : "🟢"
  const titulo = `${ico} ${e.edicion === "manana" ? "Tablero de la mañana" : "Cierre del día"}`
  const cuerpo = [e.resumen.split("\n").slice(0, 4).join("\n"), dec ? `Te esperan ${dec} decisión${dec === 1 ? "" : "es"}.` : ""].filter(Boolean).join("\n")
  return enviarTelegram({ titulo, cuerpo, url: TABLERO_URL() })
}
