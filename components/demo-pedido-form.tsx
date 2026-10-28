"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { DEMOS } from "@/lib/demos"

const TYPOS: Record<string, string> = { "gmal.com": "gmail.com", "gmial.com": "gmail.com", "gmail.con": "gmail.com", "gmail.co": "gmail.com", "gamil.com": "gmail.com", "hotmial.com": "hotmail.com", "hotmail.con": "hotmail.com", "hotmai.com": "hotmail.com", "outlok.com": "outlook.com", "yaho.com": "yahoo.com", "yahoo.con": "yahoo.com" }

/** Pedido de demo: la demo no es pública, llega por email con un link personal. */
export default function DemoPedidoForm() {
  const [f, setF] = useState({ nombre: "", email: "", org: "", tel: "", demo: "todas", acepta: false, website: "" })
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle")
  const [error, setError] = useState("")
  useEffect(() => {
    const d = new URLSearchParams(window.location.search).get("d")
    if (d && DEMOS.some((x) => x.slug === d)) setF((x) => ({ ...x, demo: d }))
  }, [])
  const dom = f.email.split("@")[1]?.toLowerCase() ?? ""
  const sugerencia = TYPOS[dom] ? f.email.split("@")[0] + "@" + TYPOS[dom] : null
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState("sending"); setError("")
    try {
      const r = await fetch("https://sistema.devisebit.com/api/demos/solicitar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: f.nombre, email: f.email, organizacion: f.org, telefono: f.tel, demo: f.demo, acepta: f.acepta, website: f.website }),
      })
      const j = await r.json().catch(() => ({}))
      if (j.ok) setState("ok")
      else { setState("error"); setError(j.error ?? "No pudimos enviarla. Probá de nuevo o escribinos por WhatsApp.") }
    } catch {
      setState("error"); setError("No pudimos conectarnos. Probá de nuevo o escribinos por WhatsApp.")
    }
  }

  const input = "w-full rounded-xl border border-[#C9CED6] bg-white px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-[#C8231F]/40 focus:border-[#C8231F]"
  const label = "flex flex-col gap-1.5 text-[15px] font-semibold"

  if (state === "ok") {
    return (
      <div role="status" className="rounded-[20px] border border-[#E2E5EA] bg-white p-8 flex flex-col gap-3">
        <div className="w-12 h-12 rounded-full bg-[#E3F2E8] text-[#0B7A3B] flex items-center justify-center text-2xl font-extrabold" aria-hidden="true">✓</div>
        <h3 className="m-0 font-tight text-2xl font-extrabold">¡Listo! Revisá tu correo</h3>
        <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Te mandamos a <strong>{f.email}</strong> un link personal para probar {f.demo === "todas" ? "las demos" : "la demo"}. Si no lo ves en unos minutos, revisá promociones o spam.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-[20px] border border-[#E2E5EA] bg-white p-6 md:p-8 grid gap-4 sm:grid-cols-2">
      <label className={label}>Nombre y apellido *<input required value={f.nombre} onChange={set("nombre")} className={input} autoComplete="name" /></label>
      <label className={label}>Email de trabajo *<input required type="email" inputMode="email" value={f.email} onChange={set("email")} className={input} autoComplete="email" />
        {sugerencia && <button type="button" onClick={() => setF({ ...f, email: sugerencia })} className="self-start text-sm font-normal text-[#C8231F] underline">¿Quisiste decir {sugerencia}?</button>}
      </label>
      <label className={label}>Organización<input value={f.org} onChange={set("org")} className={input} autoComplete="organization" /></label>
      <label className={label}>WhatsApp<input type="tel" inputMode="tel" value={f.tel} onChange={set("tel")} className={input} autoComplete="tel" /></label>
      <label className={label + " sm:col-span-2"}>¿Qué querés probar?
        <select value={f.demo} onChange={set("demo")} className={input}>
          <option value="todas">Todas las demos</option>
          {DEMOS.filter((d) => d.slug !== "transformacion-digital").map((d) => <option key={d.slug} value={d.slug}>{d.titulo}</option>)}
        </select>
      </label>
      <label className="sm:col-span-2 flex items-start gap-3 text-[15px]"><input type="checkbox" required checked={f.acepta} onChange={set("acepta")} className="mt-1 w-5 h-5 accent-[#C8231F]" /> <span>Acepto la <a href="/privacidad" className="underline">política de privacidad</a></span></label>
      <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "sending"} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] disabled:opacity-60 px-7 py-4 font-bold text-white text-[17px] transition-colors">{state === "sending" ? "Enviando…" : "Recibir la demo por email"}</button>
        {state === "error" && <p role="alert" className="m-0 text-[#C8231F]">{error}</p>}
      </div>
      <p className="sm:col-span-2 m-0 text-sm text-[#4A515C]">Te llega un link personal que vale unos días. Las demos muestran las funciones básicas, con datos de ejemplo.</p>
    </form>
  )
}
