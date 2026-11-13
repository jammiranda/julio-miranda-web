import { q, one } from "./db"
import { enviarTelegram } from "./telegram"

/**
 * Control mensual de Julio: un corte el último día hábil de cada mes (el primero suma octubre y noviembre de 2026).
 * La tarea programada arma el PDF y la infografía y hace POST a /api/panel/control; acá quedan guardados para verlos en el Panel.
 */
export type Indicador = { k: string; v: string; meta?: string }
export type Corte = { dia: string; numero: number; titulo: string; periodo: string; semaforo: "verde" | "amarillo" | "rojo"; resumen: string; indicadores: Indicador[]; tiene_pdf: boolean; tiene_info: boolean; pdf_nombre: string; creado: string }

export const CONTROL_URL = () => (process.env.PANEL_URL ?? "https://panel.devisebit.com") + "/control"
export const diaValido = (d: unknown): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d))
const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

export const MAX_PDF_B64 = 4_000_000 // ~3 MB de PDF
export const MAX_INFO = 600_000

export function limpiarIndicadores(raw: unknown): Indicador[] {
  if (!Array.isArray(raw)) return []
  return raw.slice(0, 40).map((x: any) => ({ k: txt(x?.k, 80), v: txt(x?.v, 80), meta: txt(x?.meta, 80) || undefined })).filter((x) => x.k && x.v)
}

const sel = `select to_char(dia,'YYYY-MM-DD') dia, numero, titulo, periodo, semaforo, resumen, indicadores, pdf_b64 <> '' tiene_pdf, infografia <> '' tiene_info, pdf_nombre, creado::text creado from control_cortes`
export const cortes = () => q<Corte>(`${sel} order by dia desc limit 60`)
export const corteDe = (dia: string) => one<Corte>(`${sel} where dia=$1`, [dia])
export const pdfDe = (dia: string) => one<{ pdf_b64: string; pdf_nombre: string }>("select pdf_b64, pdf_nombre from control_cortes where dia=$1 and pdf_b64 <> ''", [dia])
export const infografiaDe = (dia: string) => one<{ infografia: string }>("select infografia from control_cortes where dia=$1 and infografia <> ''", [dia])

/** Guarda o reemplaza el corte de ese día. Si no llega PDF o infografía, se conserva lo que ya había. */
export async function guardarCorte(c: { dia: string; numero: number; titulo: string; periodo: string; semaforo: string; resumen: string; indicadores: Indicador[]; infografia: string; pdf_b64: string; pdf_nombre: string }) {
  const sem = ["verde", "amarillo", "rojo"].includes(c.semaforo) ? c.semaforo : "amarillo"
  await q(
    `insert into control_cortes(dia,numero,titulo,periodo,semaforo,resumen,indicadores,infografia,pdf_b64,pdf_nombre,creado)
     values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,now())
     on conflict (dia) do update set numero=excluded.numero, titulo=excluded.titulo, periodo=excluded.periodo, semaforo=excluded.semaforo, resumen=excluded.resumen,
       indicadores=excluded.indicadores, creado=now(),
       infografia = case when excluded.infografia <> '' then excluded.infografia else control_cortes.infografia end,
       pdf_b64 = case when excluded.pdf_b64 <> '' then excluded.pdf_b64 else control_cortes.pdf_b64 end,
       pdf_nombre = case when excluded.pdf_b64 <> '' then excluded.pdf_nombre else control_cortes.pdf_nombre end`,
    [c.dia, c.numero, c.titulo, c.periodo, sem, c.resumen, JSON.stringify(c.indicadores), c.infografia, c.pdf_b64, c.pdf_nombre],
  )
}

/** Aviso corto por Telegram con link al Control mensual. Nunca lanza. */
export async function avisarCorte(c: { titulo: string; semaforo: string; resumen: string }) {
  const ico = c.semaforo === "rojo" ? "🔴" : c.semaforo === "verde" ? "🟢" : "🟡"
  return enviarTelegram({ titulo: `${ico} ${c.titulo || "Control mensual"}`, cuerpo: c.resumen.split("\n").slice(0, 5).join("\n"), url: CONTROL_URL() })
}
