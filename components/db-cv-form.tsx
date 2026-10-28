"use client"

import { useState } from "react"
import type React from "react"
import { sendForm } from "@/lib/send-form"

const ROLES = [
  "Desarrollador Full Stack",
  "Analista de Datos",
  "Analista Funcional",
  "Analista QA",
  "Analista BI",
  "DevOps Engineer",
  "Diseñador UI/UX",
  "Project Manager",
  "Analista en Ciberseguridad",
  "Administrador de Redes",
  "Otro",
]

const EMPTY = { nombre: "", email: "", tel: "", puesto: ROLES[0], link: "", exp: "", motivo: "", website: "" }

export default function DbCvForm() {
  const [f, setF] = useState(EMPTY)
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle")
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState("sending")
    try {
      const ok = await sendForm({
          nombre: f.nombre,
          email: f.email,
          tel: f.tel,
          org: f.link ? `CV / LinkedIn: ${f.link}` : "",
          tema: `Postulación · ${f.puesto}`,
          msg: `Experiencia:\n${f.exp}\n\n¿Por qué DEVISEBIT?\n${f.motivo}`,
          pagina: "/trabaja-con-nosotros",
          website: f.website,
        })
      if (ok) { setState("ok"); setF(EMPTY) } else setState("error")
    } catch {
      setState("error")
    }
  }

  const input = "w-full rounded-xl border border-[#C9CED6] bg-white px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-[#C8231F]/40 focus:border-[#C8231F]"
  const label = "flex flex-col gap-1.5 text-[15px] font-semibold"

  if (state === "ok") {
    return (
      <div role="status" className="rounded-[20px] border border-[#E2E5EA] bg-[#F5F6F8] p-8 flex flex-col gap-3">
        <div className="w-12 h-12 rounded-full bg-[#E3F2E8] text-[#0B7A3B] flex items-center justify-center text-2xl font-extrabold" aria-hidden="true">✓</div>
        <h3 className="m-0 font-tight text-2xl font-extrabold">¡Gracias por postularte!</h3>
        <p className="m-0 text-[17px] leading-relaxed text-[#4A515C]">Recibimos tus datos. Si hay una búsqueda que encaje con tu perfil, te vamos a escribir.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-[20px] border border-[#E2E5EA] bg-[#F5F6F8] p-6 md:p-8 grid gap-4 sm:grid-cols-2">
      <label className={label}>Nombre y apellido *<input required value={f.nombre} onChange={set("nombre")} className={input} autoComplete="name" /></label>
      <label className={label}>Email *<input required type="email" value={f.email} onChange={set("email")} className={input} autoComplete="email" /></label>
      <label className={label}>Teléfono<input type="tel" value={f.tel} onChange={set("tel")} className={input} autoComplete="tel" /></label>
      <label className={label}>Puesto de interés *
        <select value={f.puesto} onChange={set("puesto")} className={input}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>
      <label className={label + " sm:col-span-2"}>Link a tu CV o LinkedIn<input type="url" value={f.link} onChange={set("link")} className={input} placeholder="https://" /></label>
      <label className={label + " sm:col-span-2"}>Experiencia relevante<textarea rows={4} value={f.exp} onChange={set("exp")} className={input + " font-[inherit]"} /></label>
      <label className={label + " sm:col-span-2"}>¿Por qué querés trabajar en DEVISEBIT?<textarea rows={3} value={f.motivo} onChange={set("motivo")} className={input + " font-[inherit]"} /></label>
      <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
      <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={state === "sending"} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] disabled:opacity-60 px-7 py-4 font-bold text-white text-[17px] transition-colors">
          {state === "sending" ? "Enviando…" : "Enviar postulación"}
        </button>
        {state === "error" && <p role="alert" className="m-0 text-[#4A515C]">No pudimos enviarla. Escribinos a info@devisebit.com con tu CV.</p>}
      </div>
    </form>
  )
}
