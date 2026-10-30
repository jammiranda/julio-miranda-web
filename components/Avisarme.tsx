"use client"
import { useState } from "react"

/**
 * "Quiero que me avisen": abre un mini formulario (nombre y email) y registra el interés en el CRM
 * por /api/suscribir, con la misma etiqueta de lista de espera que usan los productos (espera-<slug>).
 */
export default function Avisarme({ tag, titulo }: { tag: string; titulo: string }) {
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("")
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEstado("enviando")
    const p = new URLSearchParams(location.search)
    const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "gclid", "fbclid"].map((k) => [k, p.get(k)]).filter(([, v]) => v))
    const r = await fetch("/api/suscribir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.get("email"), nombre: f.get("nombre"), website: f.get("website"), tag, origen: "ACADEMIA DEVISEBIT · Programas", referrer: document.referrer, ...utm }) }).catch(() => null)
    setEstado(r?.ok ? "ok" : "error")
  }
  if (estado === "ok") return <p role="status" className="m-0 rounded-xl bg-emerald-50 text-emerald-800 px-4 py-3 text-[15px] font-semibold">✓ Listo. Te avisamos apenas abra la inscripción.</p>
  if (!abierto) return <button type="button" onClick={() => setAbierto(true)} aria-expanded={false} className="btn-p min-h-[48px] w-full sm:w-auto text-base sm:text-sm">Quiero que me avisen</button>
  return (
    <form onSubmit={enviar} className="flex flex-col gap-2" aria-busy={estado === "enviando"} aria-label={`Avisarme de ${titulo}`}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr] gap-2">
        <label className="sr-only" htmlFor={`n-${tag}`}>Nombre</label>
        <input id={`n-${tag}`} name="nombre" placeholder="Tu nombre" autoComplete="given-name" autoCapitalize="words" className="inp" />
        <label className="sr-only" htmlFor={`e-${tag}`}>Email</label>
        <input id={`e-${tag}`} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false} required placeholder="Tu email" className="inp" autoFocus />
      </div>
      <button disabled={estado === "enviando"} className="btn-p min-h-[48px] text-base sm:text-sm disabled:opacity-60">{estado === "enviando" ? "Enviando…" : "Avisarme"}</button>
      {estado === "error" && <span role="alert" className="text-sm text-rojo">Revisá el email e intentá de nuevo.</span>}
    </form>
  )
}
