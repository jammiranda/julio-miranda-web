import { one, q } from "./db"

/**
 * Preferencias del Panel de Contenido por usuario (qué tarjetas ve en Inicio, en qué orden, qué bloques y qué
 * indicador destaca el menú lateral). Se guardan en la tabla config, una fila por usuario.
 */
export const TARJETAS: { id: string; t: string }[] = [
  { id: "visitas", t: "Visitas web (30 días)" },
  { id: "visitas_hoy", t: "Visitas de hoy" },
  { id: "consultas", t: "Consultas (30 días)" },
  { id: "ig_seg", t: "Seguidores de Instagram" },
  { id: "ig_pub", t: "Publicaciones de Instagram (30 días)" },
  { id: "ig_eng", t: "Engagement de Instagram" },
  { id: "fb_seg", t: "Seguidores de Facebook" },
  { id: "li_seg", t: "Seguidores de LinkedIn (página)" },
  { id: "yt_vistas", t: "Vistas de YouTube" },
  { id: "tt_seg", t: "Seguidores de TikTok" },
  { id: "academia", t: "Suscriptores de la Academia" },
  { id: "inversion", t: "Inversión en anuncios" },
]
export const BLOQUES: { id: string; t: string }[] = [
  { id: "atencion", t: "Qué requiere atención" },
  { id: "embudo", t: "Embudo: del visitante a la venta" },
  { id: "redes", t: "Resumen por red" },
  { id: "recientes", t: "Últimas publicaciones" },
  { id: "consultas", t: "Consultas por estado" },
]
export const LATERAL: { id: string; t: string }[] = [
  { id: "visitas", t: "Visitas diarias de la web" },
  { id: "consultas", t: "Consultas (30 días)" },
  { id: "ig_seg", t: "Seguidores de Instagram" },
  { id: "fb_seg", t: "Seguidores de Facebook" },
  { id: "ninguno", t: "Ninguno" },
]

export type Prefs = { tarjetas: string[]; bloques: string[]; lateral: string }
export const PREFS_BASE: Prefs = {
  tarjetas: ["visitas", "consultas", "ig_seg", "fb_seg", "yt_vistas", "visitas_hoy", "academia", "inversion", "ig_pub", "ig_eng"],
  bloques: BLOQUES.map((b) => b.id),
  lateral: "visitas",
}

/** Deja solo valores conocidos y sin repetir; si algo viene mal, usa lo de base. */
export function limpiar(raw: any): Prefs {
  const lista = (v: unknown, validos: string[]) => (Array.isArray(v) ? [...new Set(v.map(String))].filter((x) => validos.includes(x)) : null)
  const tarjetas = lista(raw?.tarjetas, TARJETAS.map((t) => t.id))
  const bloques = lista(raw?.bloques, BLOQUES.map((b) => b.id))
  const lateral = LATERAL.some((l) => l.id === raw?.lateral) ? String(raw.lateral) : PREFS_BASE.lateral
  return { tarjetas: tarjetas ?? PREFS_BASE.tarjetas, bloques: bloques ?? PREFS_BASE.bloques, lateral }
}

const clave = (id: number) => `pc_prefs_${id}`

export async function prefsDe(userId: number): Promise<Prefs> {
  const r = await one<{ valor: string }>("select valor from config where clave=$1", [clave(userId)]).catch(() => null)
  if (!r) return PREFS_BASE
  try { return limpiar(JSON.parse(r.valor)) } catch { return PREFS_BASE }
}
export async function guardarPrefsDe(userId: number, p: Prefs) {
  await q("insert into config(clave,valor) values ($1,$2) on conflict (clave) do update set valor=excluded.valor", [clave(userId), JSON.stringify(p)])
}
export async function borrarPrefsDe(userId: number) {
  await q("delete from config where clave=$1", [clave(userId)])
}
