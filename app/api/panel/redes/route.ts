import { NextResponse, type NextRequest } from "next/server"
import { claveOk } from "@/lib/clave"
import { q } from "@/lib/db"
import { guardarFacebook, type FilaFB } from "@/lib/facebook"
import { guardarRespaldoYouTube } from "@/lib/panel"
import { guardarRespaldoPosts } from "@/lib/youtube-publicaciones"

export const dynamic = "force-dynamic"

/**
 * Ingesta de redes para el Panel de Contenido (la usa la tarea programada diaria que lee Metricool y YouTube).
 * Header x-api-key = REDES_INGESTA_KEY (o ADS_INGESTA_KEY, o PANEL_TOKEN).
 * Cuerpo:
 * - { red: "facebook", filas: [{ dia: "YYYY-MM-DD", seguidores, nuevos, perdidos, vistas_pagina, vistas_contenido, publicaciones, interacciones }] }
 * - { red: "youtube", suscriptores?: number, videos: [{ id, titulo, fecha, corto, vistas, meGusta }], posts?: [{ id, texto, hace, meGusta, comentarios, votos, tipo, url }] }
 *   Es el respaldo que usa el panel cuando YouTube no responde a los servidores de Vercel.
 */
const autorizado = (k: string | null) => claveOk(k, "REDES_INGESTA_KEY") || claveOk(k, "ADS_INGESTA_KEY") || claveOk(k, "PANEL_TOKEN")
const anotar = (v: object) => q("insert into config(clave,valor) values ('redes_ultima_ingesta',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify({ cuando: new Date().toISOString(), ...v })]).catch(() => {})

export async function POST(req: NextRequest) {
  if (!autorizado(req.headers.get("x-api-key"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const b: any = await req.json().catch(() => ({}))
  if (b.red === "facebook" && Array.isArray(b.filas)) {
    const n = await guardarFacebook((b.filas as FilaFB[]).slice(0, 400))
    await anotar({ red: "facebook", filas: b.filas.length, guardadas: n })
    return NextResponse.json({ ok: true, red: "facebook", guardadas: n })
  }
  if (b.red === "youtube" && Array.isArray(b.videos)) {
    const n = await guardarRespaldoYouTube({ suscriptores: b.suscriptores ?? null, videos: b.videos })
    const p = Array.isArray(b.posts) ? await guardarRespaldoPosts(b.posts) : 0
    await anotar({ red: "youtube", videos: n, posts: p })
    return NextResponse.json({ ok: true, red: "youtube", videos: n, posts: p })
  }
  return NextResponse.json({ ok: false, error: "red no reconocida o faltan datos" }, { status: 400 })
}
