import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { waitUntil } from "@vercel/functions"
import { one, q, audit } from "@/lib/db"
import { turnosLibres, reservar, local, horario } from "@/lib/agenda"
import { enviarTexto } from "@/lib/whatsapp"
import { alCRM } from "@/lib/bot"

export const dynamic = "force-dynamic"
export const maxDuration = 60
export const metadata: Metadata = { title: "Agendá tu reunión · DEVISEBIT", robots: { index: false, follow: false } }

async function agendar(fd: FormData) {
  "use server"
  const tok = String(fd.get("tok") ?? "")
  const c = await one<any>("select id, chat_id from consultas where brief_token=$1", [tok])
  if (!c) redirect("/")
  if (fd.get("website")) redirect(`/agendar/${tok}`)
  const s = (k: string, n = 160) => { const v = String(fd.get(k) ?? "").trim(); return v ? v.slice(0, n) : null }
  if (s("email")) await q("update consultas set email=coalesce(email,$1), nombre=coalesce(nombre,$2) where id=$3", [s("email"), s("nombre"), c.id])
  await alCRM(c.id, c.chat_id?.startsWith("ig:") ? "instagram" : c.chat_id ? "whatsapp" : "web").catch(() => {})
  const r = await reservar(c.id, new Date(String(fd.get("turno"))), { nombre: s("nombre"), email: s("email"), telefono: s("telefono", 40), modalidad: s("modalidad"), notas: s("notas", 1000) })
  if (!r.ok) redirect(`/agendar/${tok}?e=${encodeURIComponent(r.error)}`)
  await audit({ id: 0, usuario: "cliente" }, "agenda_reunion", "consulta", c.id, r.texto)
  if (c.chat_id) waitUntil((async () => {
    const env = await enviarTexto("devisebit", c.chat_id, r.confirmacion).catch(() => ({ ok: false }))
    if (env.ok) await q("insert into wa_mensajes(empresa,wa_id,autor,texto,autor_nombre) values ('devisebit',$1,'bot',$2,'Asistente')", [c.chat_id, r.confirmacion]).catch(() => {})
  })())
  redirect(`/agendar/${tok}?ok=1`)
}

export default async function Agendar({ params, searchParams }: { params: { token: string }; searchParams: { ok?: string; e?: string } }) {
  const c = await one<any>("select id, nombre, email, telefono, organizacion from consultas where brief_token=$1", [params.token])
  if (!c) notFound()
  const prox = await one<any>("select * from db_reuniones where consulta_id=$1 and estado='confirmada' and inicio > now() order by inicio limit 1", [c.id])
  const head = (titulo: string, sub: string) => (
    <header className="bg-[#0E1116] text-white"><div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-xl font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></div>
      <h1 className="m-0 mt-4 text-3xl text-white">{titulo}</h1><p className="m-0 mt-2 text-white/75">{sub}</p>
    </div></header>
  )
  if (prox) {
    const l = local(new Date(prox.inicio))
    const g = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Reunión con DEVISEBIT")}&dates=${new Date(prox.inicio).toISOString().replace(/[-:]|\.\d{3}/g, "")}/${new Date(prox.fin).toISOString().replace(/[-:]|\.\d{3}/g, "")}&details=${encodeURIComponent(prox.link ? `Videollamada: ${prox.link}` : "Llamada telefónica")}`
    return (
      <main className="min-h-screen bg-[#F5F6F8]">
        {head(searchParams.ok ? "¡Reunión agendada!" : "Ya tenés una reunión agendada", `${prox.modalidad === "llamada" ? "Llamada" : "Videollamada"} de ${Math.round((new Date(prox.fin).getTime() - new Date(prox.inicio).getTime()) / 60e3)} minutos, sin costo.`)}
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
          <section className="card flex flex-col gap-3">
            <p className="m-0 text-2xl font-extrabold text-[#0E1116] first-letter:uppercase">{l.texto}</p>
            {prox.link ? <a href={prox.link} className="btn-p self-start" target="_blank" rel="noopener noreferrer">Entrar a la videollamada</a> : <p className="m-0">Te llamamos al {prox.telefono}.</p>}
            <div className="flex flex-wrap gap-2">
              <a href={`/agendar/${params.token}/ics`} className="btn-s">Agregar a mi calendario (Outlook, Apple, otros)</a>
              <a href={g} target="_blank" rel="noopener noreferrer" className="btn-s">Agregar a Google Calendar</a>
            </div>
            <p className="m-0 text-sm text-[#4A515C]">¿Necesitás cambiarla? Escribinos por WhatsApp al +54 9 11 7346-6490.</p>
          </section>
        </div>
      </main>
    )
  }
  const dias = await turnosLibres(10)
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      {head("Agendá tu reunión", `${(await horario()).duracion} minutos, sin costo. Elegí el día y el horario que te quede mejor (hora de Argentina).`)}
      <form action={agendar} className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">
        <input type="hidden" name="tok" value={params.token} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        {searchParams.e && <p role="alert" className="m-0 card text-rojo">{searchParams.e}. Elegí otro horario.</p>}
        <section className="card flex flex-col gap-4">
          <h2 className="m-0 text-lg">1. Día y horario</h2>
          {dias.length ? dias.map((d) => (
            <fieldset key={d.fecha} className="m-0 p-0 border-0 flex flex-col gap-2">
              <legend className="text-sm font-bold uppercase tracking-wider text-[#4A515C] mb-1">{d.etiqueta}</legend>
              <div className="flex flex-wrap gap-2">{d.turnos.map((t) => (
                <label key={t.iso} className="cursor-pointer"><input type="radio" name="turno" value={t.iso} required className="peer sr-only" />
                  <span className="inline-block rounded-xl border border-[#C3C8D1] bg-white px-3 py-2 text-sm font-semibold tabular-nums peer-checked:border-[#C8231F] peer-checked:bg-[#C8231F] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#C8231F]/40 hover:border-[#C8231F]">{t.hora}</span></label>
              ))}</div>
            </fieldset>
          )) : <p className="m-0">No hay horarios libres en los próximos días. Escribinos por WhatsApp y lo coordinamos.</p>}
        </section>
        <section className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <h2 className="m-0 sm:col-span-2 text-lg">2. Tus datos</h2>
          <label className="lbl">Nombre<input name="nombre" defaultValue={c.nombre ?? ""} required className="inp" /></label>
          <label className="lbl">Email (te llega la invitación)<input name="email" type="email" defaultValue={c.email ?? ""} className="inp" /></label>
          <label className="lbl">WhatsApp o teléfono<input name="telefono" defaultValue={c.telefono ?? ""} className="inp" /></label>
          <label className="lbl">¿Cómo preferís?<select name="modalidad" className="inp"><option value="videollamada">Videollamada (sin instalar nada)</option><option value="llamada">Llamada telefónica</option></select></label>
          <label className="lbl sm:col-span-2">¿Algo que quieras que preparemos?<textarea name="notas" rows={2} className="inp" /></label>
        </section>
        <button className="btn-p text-base py-3.5">Confirmar reunión</button>
      </form>
    </main>
  )
}
