"use client"

import { useState } from "react"
import type React from "react"
import { MessageCircle } from "lucide-react"
import { sendForm } from "@/lib/send-form"

/** Al pie de cada nota: consulta corta sobre el tema de la nota (entra al CRM con la nota de origen) o WhatsApp. */
export default function NotaCta({ titulo, slug }: { titulo: string; slug: string }) {
  const [f, setF] = useState({ nombre: "", contacto: "", msg: "", website: "" })
  const [state, setState] = useState<"idle" | "sending" | "ok" | "error">("idle")
  const wa = `https://wa.me/5491173466490?text=${encodeURIComponent(`Hola DEVISEBIT, leí la nota «${titulo}» y quiero hacer una consulta.`)}`
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState("sending")
    const esMail = f.contacto.includes("@")
    try {
      const ok = await sendForm({
        nombre: f.nombre,
        email: esMail ? f.contacto : "",
        tel: esMail ? "" : f.contacto,
        tema: `Nota del blog: ${titulo}`,
        msg: f.msg || `Quiero saber más sobre «${titulo}».`,
        pagina: `/novedades/${slug}`,
        website: f.website,
      })
      setState(ok ? "ok" : "error")
    } catch {
      setState("error")
    }
  }

  const input = "w-full rounded-xl border border-[#C9CED6] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#C8231F]/40 focus:border-[#C8231F]"

  return (
    <section aria-labelledby="nota-cta" className="mt-10 rounded-[20px] border border-[#E2E5EA] bg-[#F5F6F8] p-6 md:p-8">
      <h2 id="nota-cta" className="m-0 font-tight text-2xl font-extrabold">¿Querés aplicar esto en tu organización?</h2>
      <p className="m-0 mt-2 text-[#4A515C]">Dejanos tu consulta sobre esta nota y te respondemos en el día hábil.</p>
      {state === "ok" ? (
        <p role="status" className="m-0 mt-5 rounded-xl bg-[#E3F2E8] px-4 py-3 font-semibold text-[#0B7A3B]">¡Gracias! Recibimos tu consulta y te escribimos pronto.</p>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-[15px] font-semibold">Nombre *<input required value={f.nombre} onChange={set("nombre")} className={input} autoComplete="name" /></label>
          <label className="flex flex-col gap-1.5 text-[15px] font-semibold">Email o WhatsApp *<input required value={f.contacto} onChange={set("contacto")} className={input} autoComplete="email" /></label>
          <label className="flex flex-col gap-1.5 text-[15px] font-semibold sm:col-span-2">Tu consulta<textarea rows={3} value={f.msg} onChange={set("msg")} className={input + " font-[inherit]"} placeholder={`Sobre «${titulo}»…`} /></label>
          <input type="text" name="website" value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={state === "sending"} className="rounded-xl bg-[#C8231F] hover:bg-[#9E1A17] disabled:opacity-60 px-6 py-3.5 font-bold text-white transition-colors">
              {state === "sending" ? "Enviando…" : "Enviar consulta"}
            </button>
            <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border-2 border-[#0E1116] px-5 py-3 font-bold hover:bg-[#0E1116] hover:text-white transition-colors">
              <MessageCircle size={18} aria-hidden="true" /> Preguntar por WhatsApp
            </a>
            {state === "error" && <p role="alert" className="m-0 text-[#4A515C]">No pudimos enviarla. Escribinos por WhatsApp o a info@devisebit.com.</p>}
          </div>
        </form>
      )}
    </section>
  )
}
