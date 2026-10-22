/** Lectura de documentos clínicos con Claude (Anthropic API). Requiere ANTHROPIC_API_KEY. */
export const iaActiva = () => !!process.env.ANTHROPIC_API_KEY

export type Sugerido = {
  fecha: string | null
  tipo: "ingreso" | "evolucion" | "indicacion" | "estudio" | "interconsulta" | "epicrisis" | "nota"
  profesional: string | null
  texto: string
  resumen?: { diagnostico?: string | null; antecedentes?: string | null; alergias?: string | null; medicacion?: string | null }
  legible?: boolean
}

const PROMPT = `Sos un asistente de una empresa de internación domiciliaria en Argentina. Te paso un documento clínico (foto o PDF): puede ser una evolución manuscrita, una indicación médica, un informe de estudio, una epicrisis o una hoja de enfermería.
Transcribilo para cargarlo en la historia clínica. Reglas:
- Transcribí fielmente, sin inventar ni completar datos que no estén. Si una palabra no se lee, poné [ilegible].
- Respetá dosis, unidades y valores tal cual.
- No agregues diagnósticos ni interpretaciones propias.
Respondé SOLO un JSON con esta forma:
{"fecha":"AAAA-MM-DD o null","tipo":"ingreso|evolucion|indicacion|estudio|interconsulta|epicrisis|nota","profesional":"nombre y matrícula si figuran, o null","texto":"transcripción ordenada en texto plano","resumen":{"diagnostico":null,"antecedentes":null,"alergias":null,"medicacion":null},"legible":true}
En "resumen" completá solo lo que el documento diga explícitamente; lo demás en null.`

export async function leerDocumento(mime: string, base64: string): Promise<Sugerido> {
  const bloque = mime === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
    : { type: "image", source: { type: "base64", media_type: mime, data: base64 } }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5", max_tokens: 4000, messages: [{ role: "user", content: [bloque, { type: "text", text: PROMPT }] }] }),
  })
  if (!r.ok) throw new Error(`La IA no respondió (${r.status})`)
  const j = await r.json()
  const t: string = (j.content ?? []).map((c: any) => c.text ?? "").join("")
  const m = t.match(/\{[\s\S]*\}/)
  if (!m) throw new Error("La IA no devolvió un resultado válido")
  const o = JSON.parse(m[0])
  const tipos = ["ingreso", "evolucion", "indicacion", "estudio", "interconsulta", "epicrisis", "nota"]
  return { fecha: /^\d{4}-\d{2}-\d{2}$/.test(o.fecha ?? "") ? o.fecha : null, tipo: tipos.includes(o.tipo) ? o.tipo : "nota", profesional: o.profesional ?? null, texto: String(o.texto ?? ""), resumen: o.resumen ?? {}, legible: o.legible !== false }
}
