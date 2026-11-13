import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { q } from "@/lib/db"
import { guardarFacebook, type FilaFB } from "@/lib/facebook"
import { guardarRespaldoYouTube } from "@/lib/panel"
import { guardarRespaldoPosts } from "@/lib/youtube-publicaciones"
import { guardarPublicaciones, guardarRedDiario } from "@/lib/publicaciones"
import { idDeLink, TT_CREADA, TT_URL } from "@/lib/tiktok"

export const dynamic = "force-dynamic"

/**
 * Ingesta de redes para el Panel de Contenido (la usa la tarea programada diaria que lee Metricool y YouTube).
 * Header x-api-key = REDES_INGESTA_KEY (o ADS_INGESTA_KEY, o PANEL_TOKEN).
 * Cuerpo:
 * - { red: "facebook", filas?: [{ dia: "YYYY-MM-DD", seguidores, nuevos, perdidos, vistas_pagina, vistas_contenido, publicaciones, interacciones }],
 *     posts?: [{ id, fecha, texto, tipo, url, impresiones, alcance, reacciones, comentarios, compartidos, clics }] }
 * - { red: "linkedin_julio" | "linkedin", filas?: [{ dia, seguidores, nuevos, impresiones, alcance, interacciones, publicaciones }], posts?: [{ id, fecha, texto, url, impresiones, reacciones, comentarios, compartidos, clics, interacciones }] }
 * - { red: "tiktok", filas?: [{ dia, seguidores, nuevos, impresiones (reproducciones del día), alcance, interacciones, publicaciones, me_gusta }],
 *     posts?: [{ id o url (link del video), fecha, texto, vistas, me_gusta, comentarios, compartidos, alcance }] } · datos de Metricool; se juntan con lo de Buffer y lo cargado a mano
 * - { red: "youtube", suscriptores?: number, videos: [{ id, titulo, fecha, corto, vistas, meGusta }], posts?: [{ id, texto, hace, meGusta, comentarios, votos, tipo, url }] }
 *   Es el respaldo que usa el panel cuando YouTube no responde a los servidores de Vercel.
 */
const autorizado = (k: string | null) => claveOk(k, "REDES_INGESTA_KEY") || claveOk(k, "ADS_INGESTA_KEY") || claveOk(k, "PANEL_TOKEN")
const anotar = (v: object) => q("insert into config(clave,valor) values ('redes_ultima_ingesta',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify({ cuando: new Date().toISOString(), ...v })]).catch(() => {})

export async function POST(req: NextRequest) {
  if (!autorizado(req.headers.get("x-api-key"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const b: any = await req.json().catch(() => ({}))
  const posts = (red: string, origen: string) => (Array.isArray(b.posts) ? guardarPublicaciones(b.posts.map((p: any) => ({ red, id: String(p.id ?? p.url ?? ""), fecha: p.fecha ?? null, texto: p.texto ?? "", tipo: p.tipo ?? null, url: p.url ?? null, impresiones: p.impresiones, alcance: p.alcance, me_gusta: p.reacciones ?? p.meGusta ?? p.me_gusta, comentarios: p.comentarios, compartidos: p.compartidos, clics: p.clics, vistas: p.vistas, interacciones: p.interacciones })), origen) : Promise.resolve(0))
  if (b.red === "facebook" && (Array.isArray(b.filas) || Array.isArray(b.posts))) {
    const n = Array.isArray(b.filas) ? await guardarFacebook((b.filas as FilaFB[]).slice(0, 400)) : 0
    const p = await posts("facebook", "Metricool")
    await anotar({ red: "facebook", filas: n, posts: p })
    return NextResponse.json({ ok: true, red: "facebook", guardadas: n, posts: p })
  }
  if ((b.red === "linkedin_julio" || b.red === "linkedin") && (Array.isArray(b.filas) || Array.isArray(b.posts))) {
    const n = Array.isArray(b.filas) ? await guardarRedDiario(b.red, b.filas) : 0
    const p = await posts(b.red, String(b.origen ?? "ingesta"))
    await anotar({ red: b.red, filas: n, posts: p })
    return NextResponse.json({ ok: true, red: b.red, dias: n, posts: p })
  }
  if (b.red === "tiktok" && (Array.isArray(b.filas) || Array.isArray(b.posts))) {
    const n = Array.isArray(b.filas) ? await guardarRedDiario("tiktok", (b.filas as any[]).filter((f) => String(f?.dia ?? "") >= TT_CREADA).slice(0, 400)) : 0
    // Mismo id que Buffer y la carga a mano (el número del video), así no se duplican
    const vids = Array.isArray(b.posts) ? (b.posts as any[]).slice(0, 500).map((p) => { const vid = idDeLink(p.url) ?? (/^\d{15,22}$/.test(String(p.id ?? "")) ? String(p.id) : null); return vid ? { red: "tiktok", id: vid, fecha: p.fecha ?? null, texto: p.texto ?? "", tipo: "Video", url: `${TT_URL}/video/${vid}`, vistas: p.vistas, me_gusta: p.me_gusta ?? p.meGusta, comentarios: p.comentarios, compartidos: p.compartidos, alcance: p.alcance } : null }).filter(Boolean) : []
    const p = vids.length ? await guardarPublicaciones(vids as any[], "Metricool") : 0
    await anotar({ red: "tiktok", filas: n, posts: p })
    return NextResponse.json({ ok: true, red: "tiktok", dias: n, posts: p })
  }
  if (b.red === "youtube" && Array.isArray(b.videos)) {
    const n = await guardarRespaldoYouTube({ suscriptores: b.suscriptores ?? null, videos: b.videos })
    const p = Array.isArray(b.posts) ? await guardarRespaldoPosts(b.posts) : 0
    await anotar({ red: "youtube", videos: n, posts: p })
    return NextResponse.json({ ok: true, red: "youtube", videos: n, posts: p })
  }
  return NextResponse.json({ ok: false, error: "red no reconocida o faltan datos" }, { status: 400 })
}
