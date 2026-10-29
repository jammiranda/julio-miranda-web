import { unstable_cache } from "next/cache"
import { YT_URL } from "@/lib/youtube"

/**
 * Publicaciones de la pestaña "Publicaciones" del canal de YouTube de DEVISEBIT.
 * - PROGRAMADAS: YouTube no las muestra en público ni tiene API, así que se cargan acá.
 *   La tarea semanal de los domingos (que las programa en YouTube) actualiza esta lista.
 * - PUBLICADAS: se leen de la página pública del canal (me gusta, comentarios y votos de encuestas).
 */
export type PostPlan = { fecha: string; tipo: "Texto" | "Encuesta" | "Video" | "Imagen"; tema: string; texto: string; opciones?: string[]; video?: string; estado: "programada" | "pendiente" }

export const RITMO = [
  { dia: "Lunes", que: "Autodiagnóstico de madurez digital (todas las semanas)" },
  { dia: "Miércoles", que: "Encuesta de texto para pymes e instituciones" },
  { dia: "Viernes", que: "Rotación del ecosistema: Academia, casos, Bit, webs, sistemas, comunidades, transformación digital, demos" },
  { dia: "Cada short nuevo", que: "Publicación con el video adjunto y una pregunta" },
]

export const PROGRAMADAS: PostPlan[] = [
  { fecha: "2026-11-01T09:00:00-03:00", tipo: "Texto", tema: "Lanzamiento del ecosistema", estado: "programada", texto: "Hoy arranca todo el ecosistema DEVISEBIT renovado: web, sistemas, ACADEMIA DEVISEBIT y Bit, nuestro asistente de WhatsApp con IA." },
  { fecha: "2026-11-02T09:00:00-03:00", tipo: "Texto", tema: "Autodiagnóstico", estado: "programada", texto: "¿Qué tan digital es tu organización? 12 preguntas, 6 dimensiones, 5 minutos y gratis." },
  { fecha: "2026-11-04T09:00:00-03:00", tipo: "Encuesta", tema: "Canales de consulta", estado: "programada", texto: "¿Por dónde te llegan más consultas de clientes?", opciones: ["WhatsApp", "Instagram o Facebook", "Email o formulario web", "Teléfono o en persona"] },
  { fecha: "2026-11-06T09:00:00-03:00", tipo: "Texto", tema: "ACADEMIA DEVISEBIT", estado: "programada", texto: "IA aplicada, explicada simple. Guías gratis y cursos con certificado." },
  { fecha: "2026-11-09T09:00:00-03:00", tipo: "Texto", tema: "Autodiagnóstico", estado: "programada", texto: "Antes de sumar otra herramienta, medí dónde estás parado." },
  { fecha: "2026-11-11T09:00:00-03:00", tipo: "Encuesta", tema: "Tareas manuales", estado: "programada", texto: "¿Qué tarea te gustaría dejar de hacer a mano?", opciones: ["Responder las mismas consultas", "Pasar datos entre planillas", "Coordinar turnos y reuniones", "Armar informes"] },
  { fecha: "2026-11-13T09:00:00-03:00", tipo: "Video", tema: "Caso real: Comunidad USL · Academia", estado: "pendiente", texto: "Caso real: más de 1000 inscriptos en el primer año.", video: "Caso real: más de 1000 inscriptos en un año" },
]

export type PostPublicado = { id: string; texto: string; hace: string; meGusta: number | null; comentarios: number | null; votos: number | null; tipo: string; url: string }

const num = (t?: string | null) => {
  if (!t) return null
  const s = t.toLowerCase().replace(/\s/g, "")
  const base = parseFloat(s.replace(/[^\d.,]/g, "").replace(/\./g, "").replace(",", "."))
  if (!Number.isFinite(base)) return null
  return Math.round(/mil|k/.test(s) ? base * 1000 : /m/.test(s) && !/mil/.test(s) ? base * 1e6 : base)
}
const txt = (o: any): string => (o?.simpleText ?? (o?.runs ?? []).map((r: any) => r.text).join("") ?? "") as string

/** Lee las publicaciones públicas del canal desde la página /posts (sin claves). */
export async function publicacionesYouTube() {
  const html = await fetch(`${YT_URL}/posts`, { cache: "no-store", signal: AbortSignal.timeout(9000), headers: { "accept-language": "es-AR,es;q=0.9", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130" } }).then((r) => (r.ok ? r.text() : "")).catch(() => "")
  const crudo = html.split("var ytInitialData = ")[1]?.split(";</script>")[0]
  const posts: PostPublicado[] = []
  if (crudo) {
    let data: any = null
    try { data = JSON.parse(crudo) } catch { data = null }
    const vistos = new Set<string>()
    const walk = (o: any) => {
      if (!o || typeof o !== "object") return
      const p = o.backstagePostRenderer ?? o.postRenderer
      if (p?.postId && !vistos.has(p.postId)) {
        vistos.add(p.postId)
        const att = p.backstageAttachment ?? {}
        const poll = att.pollRenderer
        const comentarios = txt(p.actionButtons?.commentActionButtonsRenderer?.replyButton?.buttonRenderer?.text)
        posts.push({
          id: p.postId,
          texto: txt(p.contentText).slice(0, 280),
          hace: txt(p.publishedTimeText),
          meGusta: num(txt(p.voteCount)) ?? 0,
          comentarios: num(comentarios),
          votos: poll ? num(txt(poll.totalVotes)) ?? 0 : null,
          tipo: poll ? "Encuesta" : att.videoRenderer ? "Video" : att.backstageImageRenderer || att.postMultiImageRenderer ? "Imagen" : "Texto",
          url: `https://www.youtube.com/post/${p.postId}`,
        })
      }
      for (const k in o) walk(o[k])
    }
    walk(data)
  }
  const ahora = Date.now()
  const proximas = PROGRAMADAS.filter((x) => new Date(x.fecha).getTime() > ahora)
  const suma = (k: "meGusta" | "comentarios" | "votos") => posts.reduce((s, x) => s + (x[k] ?? 0), 0)
  return {
    url: `${YT_URL}/posts`,
    leido: !!crudo,
    publicadas: posts,
    totalPublicadas: posts.length,
    meGusta: suma("meGusta"),
    comentarios: suma("comentarios"),
    votos: suma("votos"),
    proximas,
    pendientes: proximas.filter((x) => x.estado === "pendiente").length,
    ritmo: RITMO,
  }
}

/** Con caché de 15 minutos (para el panel). */
export const publicacionesYouTubeCache = unstable_cache(() => publicacionesYouTube(), ["pc-yt-publicaciones"], { revalidate: 900 })
