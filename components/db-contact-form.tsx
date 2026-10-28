"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import { sendForm } from "@/lib/send-form"

const NEEDS = [
  "Asistente de WhatsApp con IA",
  "Sistema para clínicas o centros",
  "Tableros e indicadores",
  "CRM de afiliados o clientes",
  "Academia online",
  "Web o app",
  "Desarrollo a medida",
  "Consultoría de transformación digital",
  "Quiero ver una demo",
  "Otro",
]

const EMPTY = { nombre: "", org: "", email: "", tel: "", tema: NEEDS[0], msg: "", website: "" }

export default function DbContactForm({ dark = false }: { dark?: boolean }) {
  const router = useRouter()
  const [f, setF] = useState(EMPTY)
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle")
  // ?tema=Demo: Producto (desde Productos) completa el formulario
  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tema")
      if (!t) return
      if (NEEDS.includes(t)) setF((x) => ({ ...x, tema: t }))
      else if (/^demo/i.test(t)) setF((x) => ({ ...x, tema: "Quiero ver una demo", msg: x.msg || `Quiero ver una demo de ${t.replace(/^demo:\s*/i, "")}.` }))
    } catch {}
  }, [])
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  const mailto = () => {
    const subject = `Consulta web · ${f.tema} · ${f.nombre}`
    const body = `Nombre: ${f.nombre}\nOrganización: ${f.org}\nEmail: ${f.email}\nWhatsApp: ${f.tel}\nTema: ${f.tema}\n\n${f.msg}`
    return `mailto:info@devisebit.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState("sending")
    try {
      const ok = await sendForm({ ...f, pagina: typeof window !== "undefined" ? window.location.pathname : "" })
      if (ok) {
        setState("ok"); setF(EMPTY)
        try { (window as any).gtag?.("event", "conversion", { send_to: "AW-10953063902/fEQsCN6s7aQdEN776eYo", value: 1.0, currency: "ARS" }) } catch {}
        setTimeout(() => router.push("/gracias"), 400)
      } else setState("error")
    } catch {
      setState("error")
    }
  }

  const box = dark ? "bg-[#161A22] border-[#262C37] text-white" : "bg-white border-[#E2E5EA] text-[#0E1116]"
  const input = "w-full rounded-xl border px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-[#C8231F]/40 focus:border-[#C8231F] " + (dark ? "bg-[#0B0D12] border-[#3A404B] text-white" : "bg-white border-[#C9CED6] text-[#0E1116]")
  const label = "flex flex-col gap-1.5 text-[15px] font-semibold"
  const muted = dark ? "text-[#C3C8D1]" : "text-[#4A515C]"

  if (state === "ok") {
    return (
      <div role="status" className={"rounded-[20px] border p-8 flex flex-col gap-3 " + box}>
        <div className="w-12 h-12 rounded-full bg-[#E3F2E8] text-[#0B7A3B] flex items-center justify-center text-2xl font-extrabold" aria-hidden="true">✓</div>
        <h3 className="m-0 font-tight text-2xl font-extrabold">¡Recibimos tu consulta!</h3>
        <p className={"m-0 text-[17px] leading-relaxed " + muted}>Te respondemos en 24 horas hábiles con los próximos pasos.</p>
        <button type="button" onClick={() => setState("idle")} className="self-start mt-2 font-bold text-[#C8231F] hover:text-[#9E1A17]">Enviar otra consulta</button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className={"rounded-[20px] border p-6 md:p-8 grid gap-4 sm:grid-cols-2 " + box}>
      <label className={label}>Nombre<input required value={f.nombre} onChange={set("nombre")} className={input} autoComplete="name" /></label>
      <label className={label}>Organización<input value={f.org} onChange={set("org")} className={input} autoComplete="organization" /></label>
      <label className={label}>Email<input required type="email" value={f.email} onChange={set("email")} className={input} autoComplete="email" /></label>
      <label className={label}>WhatsApp<input type="tel" value={f.tel} onChange={set("tel")} className={input} autoComplete="tel" /></label>
      <label className={label + " sm:col-span-2"}>¿Qué necesitás?
        <select value={f.tema} onChange={set("tema")} className={input}>
          {NEEDS.map((n) => <option key={n}>{n}</option>)}
        </select>
      </label>
      <label className={label + " sm:col-span-2"}>Contanos un poco más<textarea rows={4} value={f.msg} onChange={set("msg")} className={input + " font-[inherit]"} /></label>
      <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "sending"} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] disabled:opacity-60 px-7 py-4 font-bold text-white text-[17px] transition-colors">
          {state === "sending" ? "Enviando…" : "Enviar consulta"}
        </button>
        {state === "error" && (
          <p role="alert" className={"m-0 " + muted}>
            No pudimos enviarla. <a href={mailto()} className="font-bold text-[#C8231F]">Mandala por correo</a> o escribinos a info@devisebit.com.
          </p>
        )}
      </div>
    </form>
  )
}
