import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Asistente de IA para los editores del sistema (cursos, descripciones, lecciones). Solo equipo con sesión. */
const ACCIONES: Record<string, string> = {
  mejorar: "Mejorá la redacción: más claro, directo y profesional, sin cambiar el significado ni inventar datos. Mantené el formato (títulos con ##, listas con -, **negrita**).",
  resumir: "Resumí el texto a la mitad de su extensión, conservando las ideas y los datos importantes.",
  ampliar: "Ampliá el texto con más explicación y ejemplos concretos, sin inventar cifras, nombres ni datos que no estén en el original.",
  estructurar: "Reorganizá el texto con títulos (##), listas (-) y párrafos cortos para que se lea fácil. No agregues información nueva.",
  corregir: "Corregí ortografía, puntuación y gramática sin cambiar el estilo ni el contenido.",
  ingles: "Traducí el texto a inglés natural y profesional, conservando el formato.",
  quiz: 'Generá un quiz de 4 preguntas de opción múltiple (3 opciones cada una) basado SOLO en el texto. Devolvé únicamente un JSON válido con este formato: [{"p":"Pregunta","o":["A","B","C"],"c":0,"e":"Por qué es correcta"}] donde c es el número de la opción correcta (desde 0). Sin comentarios ni texto adicional.',
  libre: "",
}

export async function POST(req: NextRequest) {
  const u = await usuarioActual().catch(() => null)
  if (!u || !["gerente", "coordinacion", "profesional"].includes(u.rol)) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "Falta ANTHROPIC_API_KEY en el servidor." }, { status: 503 })
  const b = await req.json().catch(() => null)
  const texto = String(b?.texto ?? "").slice(0, 30000)
  const accion = String(b?.accion ?? "mejorar")
  const instruccion = String(b?.instruccion ?? "").slice(0, 600)
  const contexto = String(b?.contexto ?? "").slice(0, 300)
  if (!texto.trim() && accion !== "libre") return NextResponse.json({ error: "No hay texto para trabajar." }, { status: 400 })
  if (!(accion in ACCIONES)) return NextResponse.json({ error: "Acción desconocida" }, { status: 400 })
  const pedido = accion === "libre" ? instruccion : ACCIONES[accion] + (instruccion ? `\nIndicación adicional: ${instruccion}` : "")
  if (!pedido.trim()) return NextResponse.json({ error: "Escribí qué querés que haga." }, { status: 400 })
  const prompt = `Sos el editor de contenidos de DEVISEBIT SRL (software e IA desde 2009; ACADEMIA DEVISEBIT). Escribís en español rioplatense, con voseo, claro y profesional. Sin precios ni datos inventados.
${contexto ? `Contexto: ${contexto}\n` : ""}
TAREA: ${pedido}

Devolvé SOLO el texto resultante, sin explicaciones, sin comillas ni bloques de código.

TEXTO:
${texto}`
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5", max_tokens: 4000, messages: [{ role: "user", content: prompt }] }),
    })
    if (!r.ok) return NextResponse.json({ error: "La IA no respondió. Probá de nuevo." }, { status: 502 })
    const j = await r.json()
    const out: string = (j.content ?? []).map((x: any) => x.text ?? "").join("").trim()
    if (!out) return NextResponse.json({ error: "La IA devolvió una respuesta vacía." }, { status: 502 })
    return NextResponse.json({ texto: out })
  } catch {
    return NextResponse.json({ error: "No se pudo consultar a la IA." }, { status: 502 })
  }
}
