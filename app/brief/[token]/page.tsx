import { notFound, redirect } from "next/navigation"
import { waitUntil } from "@vercel/functions"
import type { Metadata } from "next"
import { q, one, audit } from "@/lib/db"
import { TIPOS, FUNCIONES, PLAZOS, INVERSION } from "@/lib/brief"
import { alCRM } from "@/lib/bot"
import { enviarTexto } from "@/lib/whatsapp"
import { notificar } from "@/lib/push"
import { generarPropuesta } from "@/lib/propuesta"
import { linkAgenda } from "@/lib/agenda"
import Redes from "@/components/Redes"

export const dynamic = "force-dynamic"
export const maxDuration = 60
export const metadata: Metadata = { title: "Contanos tu proyecto · DEVISEBIT", robots: { index: false, follow: false } }

const t = (v: FormDataEntryValue | null, n = 1000) => { const s = String(v ?? "").trim(); return s ? s.slice(0, n) : null }

async function enviar(fd: FormData) {
  "use server"
  const tok = String(fd.get("tok") ?? "")
  const c = await one<any>("select id, chat_id, nombre, organizacion, email, estado from consultas where brief_token=$1", [tok])
  if (!c) redirect("/")
  if (fd.get("website")) redirect(`/brief/${tok}?ok=1`)
  const brief = {
    nombre: t(fd.get("nombre"), 120), organizacion: t(fd.get("organizacion"), 160), rubro: t(fd.get("rubro"), 160), email: t(fd.get("email"), 160),
    tipo: fd.getAll("tipo").map(String).slice(0, 10), objetivo: t(fd.get("objetivo"), 2000), funciones: fd.getAll("funciones").map(String).slice(0, 20),
    tiene: fd.getAll("tiene").map(String).slice(0, 10), integraciones: t(fd.get("integraciones"), 600), referencias: t(fd.get("referencias"), 800),
    plazo: t(fd.get("plazo"), 60), inversion: t(fd.get("inversion"), 60), extra: t(fd.get("extra"), 2000),
  }
  await q(
    `update consultas set brief=$1, brief_en=now(), nombre=coalesce(nombre,$2), organizacion=coalesce(organizacion,$3), email=coalesce(email,$4),
       motivo=coalesce(motivo,$5), estado=case when estado in ('nueva','contactada') then 'calificada' else estado end, necesita_humano=true, actualizado=now() where id=$6`,
    [JSON.stringify(brief), brief.nombre, brief.organizacion, brief.email, brief.tipo.join(", ") || null, c.id],
  )
  await audit({ id: 0, usuario: "cliente" }, "brief", "consulta", c.id)
  waitUntil((async () => {
    await alCRM(c.id, c.chat_id?.startsWith("ig:") ? "instagram" : c.chat_id ? "whatsapp" : "web").catch(() => {})
    await q("update db_contactos set etapa=case when etapa in ('base','nuevo','conversando') then 'reunion' else etapa end, proximo='Enviar propuesta preliminar (brief recibido)', proximo_fecha=(now() at time zone 'America/Argentina/Buenos_Aires')::date + 2, actualizado=now() where consulta_id=$1", [c.id]).catch(() => {})
    await notificar(["gerente", "coordinacion"], "📝 Brief completo · lista para propuesta", `${brief.nombre ?? c.nombre ?? "Cliente"}${brief.organizacion ? ` (${brief.organizacion})` : ""}: ${brief.tipo.join(", ")}${brief.inversion ? ` · ${brief.inversion}` : ""}`, `/consultas/${c.id}`)
    if (c.chat_id) {
      const msg = `¡Recibimos tu brief${brief.nombre ? `, ${brief.nombre.split(" ")[0]}` : ""}! ✅ Con esto te armamos una *propuesta preliminar con alcance, plazo e inversión* y te la mandamos en 48 h hábiles.\n\nSi querés, reservá ya la videollamada de 30 minutos para repasarla juntos: ${linkAgenda(tok)}`
      const env = await enviarTexto("devisebit", c.chat_id, msg).catch(() => ({ ok: false }))
      if (env.ok) await q("insert into wa_mensajes(empresa,wa_id,autor,texto,autor_nombre) values ('devisebit',$1,'bot',$2,'Asistente')", [c.chat_id, msg]).catch(() => {})
    }
    await generarPropuesta(c.id)
  })())
  redirect(`/brief/${tok}?ok=1`)
}

const Pill = ({ name, v, type = "checkbox", def = false }: { name: string; v: string; type?: "checkbox" | "radio"; def?: boolean }) => (
  <label className="cursor-pointer">
    <input type={type} name={name} value={v} defaultChecked={def} className="peer sr-only" />
    <span className="inline-block rounded-full border border-[#C3C8D1] bg-white px-3.5 py-2 text-sm font-medium text-[#262C37] transition-colors peer-checked:border-[#C8231F] peer-checked:bg-[#FDECEB] peer-checked:text-[#9E1A17] peer-focus-visible:ring-2 peer-focus-visible:ring-[#C8231F]/40 hover:border-[#C8231F]">{v}</span>
  </label>
)

export default async function Brief({ params, searchParams }: { params: { token: string }; searchParams: { ok?: string } }) {
  const c = await one<any>("select nombre, organizacion, email, motivo, brief_en from consultas where brief_token=$1", [params.token])
  if (!c) notFound()
  const agenda = linkAgenda(params.token)
  const Encabezado = (
    <header className="bg-[#0E1116] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-xl font-extrabold tracking-[0.04em]">DEVISE<span className="text-[#FF6A63]">BIT</span></div>
        <h1 className="m-0 mt-4 text-3xl text-white">{searchParams.ok || c.brief_en ? "¡Gracias! Ya tenemos tu brief" : "Contanos tu proyecto"}</h1>
        <p className="m-0 mt-2 text-white/75">{searchParams.ok || c.brief_en ? "Te mandamos una propuesta preliminar con alcance, plazo e inversión en 48 h hábiles." : "3 minutos. Con esto te armamos una propuesta preliminar con alcance, plazo y rango de inversión en 48 h hábiles, sin costo ni compromiso."}</p>
      </div>
    </header>
  )
  if (searchParams.ok || c.brief_en) {
    return (
      <main className="min-h-screen bg-[#F5F6F8]">
        {Encabezado}
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-4">
          <section className="card flex flex-col gap-3">
            <h2 className="m-0">Qué sigue</h2>
            <ol className="m-0 pl-5 flex flex-col gap-1.5 text-[15px]"><li>Revisamos tu brief y armamos la propuesta preliminar.</li><li>Te la mandamos por WhatsApp o email en 48 h hábiles.</li><li>La repasamos juntos en una videollamada de 30 minutos y la ajustamos.</li><li>Recibís la propuesta final con alcance, fecha y precio fijo por escrito.</li></ol>
            <a href={agenda} className="btn-p self-start">📅 Reservar la videollamada ahora</a>
          </section>
          <section className="card flex flex-col gap-2">
            <h2 className="m-0 text-base">Mientras tanto</h2>
            <a href="https://www.devisebit.com/trabajos" className="underline text-[#9E1A17]">Mirá proyectos que hicimos →</a>
            <a href="https://www.devisebit.com/productos" className="underline text-[#9E1A17]">Conocé nuestros productos listos para implementar →</a>
          </section>
        </div>
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-[#F5F6F8]">
      {Encabezado}
      <form action={enviar} className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-5">
        <input type="hidden" name="tok" value={params.token} />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <section className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
          <h2 className="m-0 sm:col-span-2 text-lg">1. Sobre vos</h2>
          <label className="lbl">Nombre<input name="nombre" defaultValue={c.nombre ?? ""} required className="inp" /></label>
          <label className="lbl">Empresa u organización<input name="organizacion" defaultValue={c.organizacion ?? ""} className="inp" /></label>
          <label className="lbl">Rubro<input name="rubro" placeholder="Ej.: venta de motos, clínica, gremio…" className="inp" /></label>
          <label className="lbl">Email para la propuesta<input name="email" type="email" defaultValue={c.email ?? ""} className="inp" /></label>
        </section>
        <section className="card flex flex-col gap-3">
          <h2 className="m-0 text-lg">2. ¿Qué necesitás?</h2>
          <div className="flex flex-wrap gap-2">{TIPOS.map((x) => <Pill key={x} name="tipo" v={x} />)}</div>
          <label className="lbl">¿Qué querés lograr? (vender más, ordenar la gestión, ahorrar tiempo…)<textarea name="objetivo" rows={3} defaultValue={c.motivo ?? ""} className="inp" /></label>
        </section>
        <section className="card flex flex-col gap-3">
          <h2 className="m-0 text-lg">3. ¿Qué tiene que tener?</h2>
          <div className="flex flex-wrap gap-2">{FUNCIONES.map((x) => <Pill key={x} name="funciones" v={x} />)}</div>
          <p className="m-0 text-sm font-semibold">Ya tenés…</p>
          <div className="flex flex-wrap gap-2">{["Logo", "Manual de marca", "Textos", "Fotos de productos", "Dominio", "Hosting", "Una web actual"].map((x) => <Pill key={x} name="tiene" v={x} />)}</div>
          <label className="lbl">¿Se tiene que conectar con algo que ya usás? (sistema, Excel, Mercado Pago, etc.)<input name="integraciones" className="inp" /></label>
          <label className="lbl">Webs o apps que te gusten como referencia (links)<input name="referencias" className="inp" /></label>
        </section>
        <section className="card flex flex-col gap-3">
          <h2 className="m-0 text-lg">4. Tiempos e inversión</h2>
          <p className="m-0 text-sm font-semibold">¿Para cuándo lo necesitás?</p>
          <div className="flex flex-wrap gap-2">{PLAZOS.map((x) => <Pill key={x} name="plazo" v={x} type="radio" />)}</div>
          <p className="m-0 text-sm font-semibold">¿Qué inversión tenés pensada? <span className="font-normal text-[#4A515C]">Nos ayuda a proponerte la mejor opción para tu presupuesto (por ejemplo, arrancar por una primera etapa).</span></p>
          <div className="flex flex-wrap gap-2">{INVERSION.map((x) => <Pill key={x} name="inversion" v={x} type="radio" />)}</div>
          <label className="lbl">¿Algo más que debamos saber?<textarea name="extra" rows={3} className="inp" /></label>
        </section>
        <button className="btn-p text-base py-3.5">Enviar y recibir mi propuesta preliminar</button>
        <Redes className="justify-center" />
        <p className="m-0 text-xs text-center text-[#4A515C]">DEVISEBIT SRL · Tus datos se usan solo para responder tu consulta (Ley 25.326).</p>
      </form>
    </main>
  )
}
