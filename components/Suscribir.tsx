"use client"
import { useState } from "react"

/** Formulario de newsletter de la Academia. `desbloquea` abre una guía exclusiva al suscribirse. */
export default function Suscribir({ tag = "newsletter", boton = "Suscribirme gratis", desbloquea = false, oscuro = false }: { tag?: string; boton?: string; desbloquea?: boolean; oscuro?: boolean }) {
  const [estado, setEstado] = useState<"" | "enviando" | "ok" | "error">("")
  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setEstado("enviando")
    const p = new URLSearchParams(location.search)
    const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "gclid", "fbclid"].map((k) => [k, p.get(k)]).filter(([, v]) => v))
    const r = await fetch("/api/suscribir", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.get("email"), nombre: f.get("nombre"), website: f.get("website"), tag, origen: "Academia DEVISEBIT", referrer: document.referrer, ...utm }) }).catch(() => null)
    if (r?.ok) {
      setEstado("ok")
      try { document.cookie = "acad=1; path=/; max-age=31536000; samesite=lax" } catch {}
      if (desbloquea) setTimeout(() => location.reload(), 600)
    } else setEstado("error")
  }
  if (estado === "ok") return <p role="status" className={`m-0 font-semibold ${oscuro ? "text-white" : "text-emerald-700"}`}>✅ ¡Listo! Te mandamos un correo de bienvenida.{desbloquea ? " Abriendo la guía…" : ""}</p>
  return (
    <form onSubmit={enviar} className="flex flex-col sm:flex-row gap-2 w-full" aria-busy={estado === "enviando"}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="sr-only" htmlFor={`n-${tag}`}>Nombre</label>
      <input id={`n-${tag}`} name="nombre" placeholder="Tu nombre" autoComplete="given-name" autoCapitalize="words" enterKeyHint="next" className="inp sm:max-w-[180px]" />
      <label className="sr-only" htmlFor={`e-${tag}`}>Email</label>
      <input id={`e-${tag}`} name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="send" required placeholder="Tu email" className="inp" />
      <button disabled={estado === "enviando"} className="btn-p whitespace-nowrap min-h-[48px] text-base sm:text-sm disabled:opacity-60">{estado === "enviando" ? "Enviando…" : boton}</button>
      {estado === "error" && <span role="alert" className={`text-sm self-center ${oscuro ? "text-[#FF8A84]" : "text-rojo"}`}>Revisá el email e intentá de nuevo.</span>}
    </form>
  )
}
