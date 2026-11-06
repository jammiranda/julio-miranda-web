import { unstable_cache } from "next/cache"
import { q } from "./db"
import { cuentaIG } from "./whatsapp"
import { guardarPublicaciones } from "./publicaciones"

/**
 * Instagram de DEVISEBIT para el Panel de Contenido (API de Instagram con inicio de sesión de Instagram).
 * Con el permiso actual (instagram_business_basic) hay perfil y publicaciones con me gusta y comentarios.
 * No hay insights (alcance ni impresiones): el engagement es aproximado = (me gusta + comentarios) / seguidores.
 */
const V = () => process.env.WA_GRAPH_VERSION ?? "v23.0"

export type PerfilIG = { username: string; seguidores: number; siguiendo: number; publicaciones: number; foto: string | null }
export type PostIG = { id: string; texto: string; tipo: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string; fecha: string; meGusta: number | null; comentarios: number | null; url: string; imagen: string | null }

async function pedir(ruta: string) {
  const { token } = cuentaIG()
  if (!token) throw new Error("sin_token")
  const r = await fetch(`https://graph.instagram.com/${V()}/${ruta}${ruta.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`, { cache: "no-store", signal: AbortSignal.timeout(12000) })
  const j: any = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`Instagram respondió ${r.status}${j?.error?.message ? ": " + j.error.message : ""}`.slice(0, 200))
  return j
}

/** Perfil y últimas 30 publicaciones (caché de 15 minutos; los errores no se guardan en caché). */
const traer = unstable_cache(
  async () => {
    const [p, m] = await Promise.all([
      pedir("me?fields=username,followers_count,follows_count,media_count,profile_picture_url"),
      pedir("me/media?fields=id,caption,media_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url&limit=30"),
    ])
    const perfil: PerfilIG = { username: p.username ?? "", seguidores: Number(p.followers_count ?? 0), siguiendo: Number(p.follows_count ?? 0), publicaciones: Number(p.media_count ?? 0), foto: p.profile_picture_url ?? null }
    const posts: PostIG[] = (m.data ?? []).map((x: any) => ({
      id: String(x.id),
      texto: String(x.caption ?? ""),
      tipo: x.media_type ?? "",
      fecha: x.timestamp ?? "",
      meGusta: x.like_count == null ? null : Number(x.like_count),
      comentarios: x.comments_count == null ? null : Number(x.comments_count),
      url: x.permalink ?? "",
      imagen: (x.media_type === "VIDEO" ? x.thumbnail_url : x.media_url) ?? x.thumbnail_url ?? null,
    }))
    return { perfil, posts, actualizado: new Date().toISOString() }
  },
  ["pc-instagram-v1"],
  { revalidate: 900 },
)

export type DatosIG = { ok: true; perfil: PerfilIG; posts: PostIG[]; actualizado: string } | { ok: false; error: string }

export async function instagram(): Promise<DatosIG> {
  try {
    return { ok: true, ...(await traer()) }
  } catch (e: any) {
    const m = String(e?.message ?? e)
    return { ok: false, error: m === "sin_token" ? "La cuenta de Instagram no está conectada al sistema." : m }
  }
}

/** Guarda en el historial todas las publicaciones que devuelve la API (pagina hasta `max`). */
export async function sincronizarPublicacionesIG(max = 300) {
  const campos = "id,caption,media_type,timestamp,like_count,comments_count,permalink"
  let ruta: string | null = `me/media?fields=${campos}&limit=100`
  const todas: any[] = []
  while (ruta && todas.length < max) {
    const j: any = await pedir(ruta)
    todas.push(...(j.data ?? []))
    const sig: string | undefined = j.paging?.next
    ruta = sig ? sig.replace(/^https:\/\/graph\.instagram\.com\/[^/]+\//, "").replace(/([?&])access_token=[^&]*&?/, "$1").replace(/[?&]$/, "") : null
  }
  // Si la API ya no lista una publicación (la borraron en Instagram), sale también del historial; así los conteos coinciden con el perfil.
  if (!ruta && todas.length > 0 && todas.length < max) {
    const ids = todas.map((x) => String(x.id))
    await q(`delete from pc_publicaciones where red='instagram' and origen='API de Instagram' and id <> all($1::text[]) and (select count(*) from pc_publicaciones where red='instagram' and id <> all($1::text[])) <= 5`, [ids]).catch(() => {})
  }
  return guardarPublicaciones(todas.map((x) => ({ red: "instagram", id: String(x.id), fecha: x.timestamp ?? null, texto: String(x.caption ?? ""), tipo: x.media_type ?? null, url: x.permalink ?? null, me_gusta: x.like_count, comentarios: x.comments_count })), "API de Instagram")
}

/** Engagement aproximado de una publicación, en %. */
export const engagement = (p: PostIG, seguidores: number) => (seguidores > 0 && (p.meGusta != null || p.comentarios != null) ? (((p.meGusta ?? 0) + (p.comentarios ?? 0)) / seguidores) * 100 : null)

/** Guarda la foto del día de seguidores (una fila por día de Argentina; si se repite el día, queda la última). */
export async function registrarSeguidores(perfil?: PerfilIG) {
  let p = perfil
  if (!p) {
    const d = await instagram()
    if (!d.ok) return d.error
    p = d.perfil
  }
  await q(
    `insert into pc_ig_seguidores(dia,seguidores,siguiendo,publicaciones) values ((now() at time zone 'America/Argentina/Buenos_Aires')::date,$1,$2,$3)
     on conflict (dia) do update set seguidores=excluded.seguidores, siguiendo=excluded.siguiendo, publicaciones=excluded.publicaciones, actualizado=now()
     where pc_ig_seguidores.seguidores is distinct from excluded.seguidores or pc_ig_seguidores.publicaciones is distinct from excluded.publicaciones`,
    [p.seguidores, p.siguiendo, p.publicaciones],
  )
  const pubs = await sincronizarPublicacionesIG().catch((e) => `error ${String(e?.message ?? e).slice(0, 80)}`)
  return `instagram: ${p.seguidores} seguidores · ${pubs} publicaciones en el historial`
}

/** Evolución de seguidores (fotos diarias guardadas). */
export function historialSeguidores(dias = 120) {
  return q<{ dia: string; seguidores: number }>(`select to_char(dia,'YYYY-MM-DD') dia, seguidores from pc_ig_seguidores where dia > current_date - $1::int order by dia`, [dias])
}
