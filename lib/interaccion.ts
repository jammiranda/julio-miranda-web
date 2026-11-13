import { q, one } from "./db"

/**
 * Interacción en redes: lo que hacemos en conversaciones de otros (comentarios, presentaciones en grupos,
 * cuentas que seguimos, reacciones) y las métricas que solo se leen a mano (LinkedIn de Julio).
 * La tarea programada "Comentarios en redes DEVISEBIT" hace POST a /api/panel/interaccion al terminar cada corrida.
 */
export const REDES = { linkedin: "LinkedIn", instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", x: "X" } as const
export const TIPOS = { comentario: "Comentario", presentacion: "Presentación en grupo", grupo: "Ingreso a grupo", seguir: "Cuenta seguida", reaccion: "Reacción", respuesta: "Respuesta recibida", mensaje: "Conversación por mensaje" } as const
export const ESTADOS = { publicado: "Publicado", pendiente: "Pendiente de aprobación", rechazado: "Rechazado", borrado: "Borrado" } as const
export type Red = keyof typeof REDES
export type Tipo = keyof typeof TIPOS
export type Estado = keyof typeof ESTADOS
export type Accion = { clave: string; dia: string; red: Red; tipo: Tipo; cuenta: string; tamano: string; texto: string; url: string; estado: Estado; n: number; actualizado: string }

/** Metas del mes (plan de comentarios, 02/11). */
export const METAS = { comentarios: 300, seguidas: 100, conversaciones: 10 }

const txt = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")
/** Clave estable para grupos y cuentas: sin tildes, sin @ inicial; "@Cuenta" y "cuenta" son la misma. */
export const slug = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/^@+/, "").replace(/[^a-z0-9._]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)

/** Normaliza una acción que manda la tarea. La clave evita duplicados si la tarea reenvía lo mismo (y permite pasar de pendiente a publicado). */
export function limpiarAccion(a: any, diaDefecto: string): Omit<Accion, "actualizado"> | null {
  const red = txt(a?.red, 20).toLowerCase() as Red
  const tipo = txt(a?.tipo, 20).toLowerCase() as Tipo
  if (!(red in REDES) || !(tipo in TIPOS)) return null
  const dia = typeof a?.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.dia) ? a.dia : diaDefecto
  const cuenta = txt(a?.cuenta, 160)
  const url = /^https?:\/\//.test(txt(a?.url, 500)) ? txt(a?.url, 500) : ""
  const texto = txt(a?.texto, 600)
  const estado = (txt(a?.estado, 20) || "publicado") as Estado
  const n = Math.max(1, Math.min(500, Math.round(Number(a?.n) || 1)))
  const clave =
    txt(a?.clave, 120) ||
    (tipo === "presentacion" || tipo === "grupo" ? `g:${slug(cuenta)}` : tipo === "seguir" ? `s:${red === "instagram" ? "ig" : red}:${slug(cuenta)}` : `${dia}:${red}:${tipo}:${slug(url || cuenta + ":" + texto.slice(0, 40))}`)
  if (!cuenta && !url && tipo !== "reaccion") return null
  return { clave, dia, red, tipo, cuenta, tamano: txt(a?.tamano, 40), texto, url, estado: estado in ESTADOS ? estado : "publicado", n }
}

export async function guardarAcciones(lista: Omit<Accion, "actualizado">[]) {
  for (const a of lista) {
    await q(
      `insert into interaccion_acciones(clave,dia,red,tipo,cuenta,tamano,texto,url,estado,n) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (clave) do update set estado=excluded.estado,
         texto=case when excluded.texto<>'' then excluded.texto else interaccion_acciones.texto end,
         url=case when excluded.url<>'' then excluded.url else interaccion_acciones.url end,
         tamano=case when excluded.tamano<>'' then excluded.tamano else interaccion_acciones.tamano end,
         n=excluded.n, actualizado=now()`,
      [a.clave, a.dia, a.red, a.tipo, a.cuenta, a.tamano, a.texto, a.url, a.estado, a.n],
    )
  }
}

export async function guardarMetricas(dia: string, lista: { red: string; metrica: string; valor: number }[]) {
  for (const m of lista) {
    const red = txt(m?.red, 30).toLowerCase(), metrica = txt(m?.metrica, 40).toLowerCase().replace(/[^a-z0-9_]/g, "_")
    const valor = Number(m?.valor)
    if (!red || !metrica || !Number.isFinite(valor)) continue
    await q("insert into interaccion_metricas(dia,red,metrica,valor) values ($1,$2,$3,$4) on conflict (dia,red,metrica) do update set valor=excluded.valor, actualizado=now()", [dia, red, metrica, valor])
  }
}

const SEL = "select clave, to_char(dia,'YYYY-MM-DD') dia, red, tipo, cuenta, tamano, texto, url, estado, n, actualizado::text actualizado from interaccion_acciones"

/** Todo lo que necesita la pestaña: totales, serie diaria, grupos, cuentas seguidas, detalle reciente y métricas manuales. */
export async function resumenInteraccion() {
  const [porDia, totales, mes, grupos, seguidas, recientes, metricas, ultima] = await Promise.all([
    q<{ dia: string; red: string; c: number }>(`select to_char(dia,'YYYY-MM-DD') dia, red, sum(n)::int c from interaccion_acciones where tipo='comentario' and estado='publicado' and dia > current_date - 45 group by 1,2 order by 1`),
    q<{ red: string; tipo: string; estado: string; c: number }>(`select red, tipo, estado, sum(n)::int c from interaccion_acciones group by 1,2,3`),
    one<{ comentarios: number; seguidas: number; conversaciones: number; d7: number; p7: number }>(`select
      coalesce(sum(n) filter (where tipo='comentario' and estado='publicado' and date_trunc('month',dia)=date_trunc('month',current_date)),0)::int comentarios,
      coalesce(sum(n) filter (where tipo='seguir' and estado<>'borrado' and date_trunc('month',dia)=date_trunc('month',current_date)),0)::int seguidas,
      coalesce(sum(n) filter (where tipo='mensaje' and date_trunc('month',dia)=date_trunc('month',current_date)),0)::int conversaciones,
      coalesce(sum(n) filter (where tipo='comentario' and estado='publicado' and dia > current_date - 7),0)::int d7,
      coalesce(sum(n) filter (where tipo='comentario' and estado='publicado' and dia <= current_date - 7 and dia > current_date - 14),0)::int p7
      from interaccion_acciones`),
    q<Accion>(`${SEL} where tipo in ('presentacion','grupo') order by case estado when 'pendiente' then 0 when 'publicado' then 1 else 2 end, dia desc, cuenta`),
    q<Accion>(`${SEL} where tipo='seguir' order by dia desc, cuenta`),
    q<Accion>(`${SEL} where tipo not in ('presentacion','grupo','seguir') and clave not like 'hist:%' order by dia desc, actualizado desc limit 60`),
    q<{ dia: string; red: string; metrica: string; valor: number }>(`select to_char(dia,'YYYY-MM-DD') dia, red, metrica, valor::float valor from interaccion_metricas order by dia`),
    one<{ t: string }>("select max(actualizado)::text t from interaccion_acciones"),
  ])
  return { porDia, totales, mes, grupos, seguidas, recientes, metricas, ultima: ultima?.t ?? null }
}

/** Seguidores que ya junta el panel por su cuenta (Instagram, Facebook y lo que traigan las importaciones). */
export async function seguidoresPanel() {
  const [ig, fb, otras] = await Promise.all([
    q<{ dia: string; v: number }>("select to_char(dia,'YYYY-MM-DD') dia, seguidores v from pc_ig_seguidores where dia > current_date - 45 order by dia"),
    q<{ dia: string; v: number }>("select to_char(dia,'YYYY-MM-DD') dia, seguidores v from pc_fb_diario where seguidores is not null and dia > current_date - 45 order by dia"),
    q<{ red: string; dia: string; v: number }>("select red, to_char(dia,'YYYY-MM-DD') dia, seguidores v from pc_red_diario where seguidores is not null and dia > current_date - 45 order by red, dia"),
  ])
  return { instagram: ig, facebook: fb, otras }
}
