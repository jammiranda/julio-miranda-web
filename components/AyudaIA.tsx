"use client"
import { useRef, useState } from "react"

/**
 * Barra de IA para un campo de texto del formulario: mejora, resume, estructura, traduce o sigue una instrucción libre.
 * Trabaja sobre el <textarea name="campo"> de su mismo formulario y guarda el texto anterior para deshacer.
 */
export default function AyudaIA({ campo, quiz, contexto }: { campo: string; quiz?: string; contexto?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cargando, setCargando] = useState<string | null>(null)
  const [msg, setMsg] = useState("")
  const [previo, setPrevio] = useState<{ campo: string; texto: string } | null>(null)
  const [libre, setLibre] = useState("")

  const area = (n: string) => ref.current?.closest("form")?.querySelector<HTMLTextAreaElement>(`textarea[name="${n}"]`) ?? null

  async function ir(accion: string, instruccion = "") {
    const origen = area(campo)
    if (!origen) return
    const destino = accion === "quiz" && quiz ? area(quiz) : origen
    if (!destino) return
    const seleccion = origen.selectionStart !== origen.selectionEnd && accion !== "quiz" ? origen.value.slice(origen.selectionStart, origen.selectionEnd) : ""
    const texto = seleccion || origen.value
    setCargando(accion); setMsg("")
    try {
      const r = await fetch("/api/ia/editar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texto, accion, instruccion, contexto }) })
      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.texto) { setMsg(j.error ?? "No se pudo completar."); return }
      setPrevio({ campo: destino.name, texto: destino.value })
      if (seleccion && destino === origen) destino.value = origen.value.slice(0, origen.selectionStart) + j.texto + origen.value.slice(origen.selectionEnd)
      else destino.value = j.texto
      destino.dispatchEvent(new Event("input", { bubbles: true }))
      setMsg(accion === "quiz" ? "Quiz generado: revisalo antes de guardar." : "Listo: revisá el texto antes de guardar.")
    } catch { setMsg("Sin conexión con la IA.") } finally { setCargando(null) }
  }

  function deshacer() {
    if (!previo) return
    const a = area(previo.campo)
    if (a) a.value = previo.texto
    setPrevio(null); setMsg("Cambio deshecho.")
  }

  const B = ({ a, t }: { a: string; t: string }) => <button type="button" disabled={!!cargando} onClick={() => ir(a)}>{cargando === a ? "Trabajando…" : t}</button>

  return (
    <div ref={ref} className="ia-bar" role="group" aria-label="Asistente de IA">
      <span className="ia-t"><span aria-hidden="true">✦</span> IA</span>
      <B a="mejorar" t="Mejorar redacción" /><B a="estructurar" t="Ordenar" /><B a="resumir" t="Resumir" /><B a="ampliar" t="Ampliar" /><B a="corregir" t="Corregir" /><B a="ingles" t="Pasar a inglés" />
      {quiz && <B a="quiz" t="Armar quiz" />}
      <input value={libre} onChange={(e) => setLibre(e.target.value)} placeholder="O pedile algo: «hacelo más corto y con un ejemplo de salud»" aria-label="Instrucción libre para la IA" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (libre.trim()) ir("libre", libre) } }} />
      <button type="button" disabled={!!cargando || !libre.trim()} onClick={() => ir("libre", libre)}>{cargando === "libre" ? "Trabajando…" : "Pedir"}</button>
      {previo && <button type="button" onClick={deshacer}>Deshacer</button>}
      {msg && <span role="status" className="text-xs text-[var(--gris)] basis-full">{msg} Si seleccionás parte del texto, la IA trabaja solo sobre esa parte.</span>}
    </div>
  )
}
