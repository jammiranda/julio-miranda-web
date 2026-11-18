/** Bloques de las notas de un acercamiento: SUGERENCIA, ASUNTO, MENSAJE, RESPUESTA, etc. El texto de cada bloque puede tener varios párrafos. */
const CLAVES: [RegExp, string][] = [[/^MENSAJE/, "mensaje"], [/^PASO 1/, "invitacion"], [/^PASO 2/, "paso2"], [/^SEGUIMIENTO/, "seguimiento"], [/^RESPUESTA/, "respuesta"], [/^NOS ESCRIBI/, "recibido"], [/^SUGERENCIA/, "sugerencia"], [/^ASUNTO/, "asunto"]]
export function bloques(notas: string): Record<string, string> {
  const out: Record<string, string> = {}
  let k: string | null = null
  for (const l of notas.replace(/\r/g, "").split("\n")) {
    const t = l.trim()
    // Un encabezado es una línea corta en mayúsculas que termina en «:» (o una de las claves conocidas sola)
    const cab = /^[A-ZÁÉÍÓÚÑ0-9 ·.º()/-]{3,60}:$/.test(t) || CLAVES.some(([re]) => re.test(t.toUpperCase()) && t.length < 40 && t === t.toUpperCase())
    if (cab) { k = CLAVES.find(([re]) => re.test(t.toUpperCase()))?.[1] ?? "_"; continue }
    if (k && k !== "_") out[k] = (out[k] ? out[k] + "\n" : "") + l
  }
  for (const c of Object.keys(out)) { out[c] = out[c].trim(); if (!out[c]) delete out[c] }
  return out
}
