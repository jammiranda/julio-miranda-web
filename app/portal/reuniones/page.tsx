import { redirect } from "next/navigation"
import { one, q, audit } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { turnosLibres, reservar, local, horario } from "@/lib/agenda"
import { consultaDe } from "@/lib/compras"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const MOTIVOS = ["Seguimiento de mi proyecto", "Revisar una entrega", "Consulta sobre pagos o facturas", "Capacitación o soporte", "Un servicio nuevo", "Otro tema"]

async function agendar(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const s = (k: string, n = 160) => { const v = String(fd.get(k) ?? "").trim(); return v ? v.slice(0, n) : null }
  const cons = await consultaDe(c)
  const k = await one<{ telefono: string | null }>("select telefono from db_contactos where id=$1", [c.id])
  const tel = s("telefono", 40)?.replace(/[^\d+]/g, "") || k?.telefono || null
  if (tel && !k?.telefono) await q("update db_contactos set telefono=$1 where id=$2 and telefono is null", [tel, c.id])
  const notas = [s("motivo"), s("notas", 1000)].filter(Boolean).join(" · ") || null
  const r = await reservar(cons.id, new Date(String(fd.get("turno"))), { nombre: c.nombre, email: c.email, telefono: tel, modalidad: s("modalidad"), notas: notas ? `Desde Mi cuenta: ${notas}` : "Desde Mi cuenta" })
  if (!r.ok) redirect(`/portal/reuniones?e=${encodeURIComponent(r.error)}`)
  await audit({ id: 0, usuario: `cliente:${c.id}` }, "portal_reunion", "db_reunion", r.id, r.texto)
  redirect("/portal/reuniones?ok=1")
}

const gcalLink = (r: { inicio: Date; fin: Date; link: string | null }) =>
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("Reunión con DEVISEBIT")}&dates=${new Date(r.inicio).toISOString().replace(/[-:]|\.\d{3}/g, "")}/${new Date(r.fin).toISOString().replace(/[-:]|\.\d{3}/g, "")}&details=${encodeURIComponent(r.link ? `Videollamada: ${r.link}` : "Llamada telefónica")}`

export default async function Reuniones({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  const c = await requerirCliente(true)
  const [prox, pasadas, dias, h, k] = await Promise.all([
    q<any>("select r.*, c.brief_token from db_reuniones r left join consultas c on c.id=r.consulta_id where r.contacto_id=$1 and r.estado='confirmada' and r.inicio > now() order by r.inicio", [c.id]),
    q<any>("select inicio, modalidad, notas from db_reuniones where contacto_id=$1 and inicio <= now() order by inicio desc limit 5", [c.id]),
    turnosLibres(10).catch(() => []),
    horario(),
    one<{ telefono: string | null }>("select telefono from db_contactos where id=$1", [c.id]),
  ])
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">Reuniones</h1>
        <p className="m-0 mt-1 text-[#4A515C]">Agendá una reunión de {h.duracion} minutos con el equipo. Los horarios salen de nuestra agenda real y la reunión queda en nuestro calendario.</p>
      </div>
      {searchParams.ok && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50 !border-emerald-200">¡Listo! Quedó agendada. Te mandamos la invitación por email{k?.telefono ? " y por WhatsApp" : ""}.</p>}
      {searchParams.e && <p role="alert" className="m-0 card py-3 text-sm !bg-[#FDECEB] !border-[#F3B7B4]">{searchParams.e}. Elegí otro horario.</p>}

      <section className="card flex flex-col gap-3" aria-labelledby="t-prox">
        <h2 id="t-prox" className="m-0 text-base">Próximas</h2>
        {!prox.length && <p className="m-0 text-sm text-[#4A515C]">No tenés reuniones agendadas.</p>}
        {prox.map((r) => (
          <div key={r.id} className="rounded-xl border border-[#E2E5EA] p-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <strong className="block first-letter:uppercase">{local(new Date(r.inicio)).texto}</strong>
              <span className="text-sm text-[#4A515C]">{r.modalidad === "llamada" ? `Llamada al ${r.telefono ?? "teléfono que nos dejaste"}` : "Videollamada"}{r.notas ? ` · ${String(r.notas).replace(/^Desde Mi cuenta:?\s*/, "")}` : ""}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.link && <a href={r.link} target="_blank" rel="noopener noreferrer" className="btn-p py-1.5">Entrar</a>}
              <a href={gcalLink(r)} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Google Calendar ↗</a>
              {r.brief_token && <a href={`/agendar/${r.brief_token}/ics`} className="btn-s py-1.5">Outlook / Apple</a>}
            </div>
          </div>
        ))}
        <p className="m-0 text-xs text-[#4A515C]">¿Necesitás cambiarla? Escribinos por <a href="https://wa.me/5491173466490" target="_blank" rel="noopener noreferrer" className="underline">WhatsApp</a>.</p>
      </section>

      <form action={agendar} className="card flex flex-col gap-4" aria-labelledby="t-nueva">
        <h2 id="t-nueva" className="m-0 text-base">Agendar una reunión</h2>
        {dias.length ? dias.map((d) => (
          <fieldset key={d.fecha} className="m-0 p-0 border-0 flex flex-col gap-2">
            <legend className="text-xs font-bold uppercase tracking-wider text-[#4A515C] mb-1">{d.etiqueta}</legend>
            <div className="flex flex-wrap gap-2">{d.turnos.map((t) => (
              <label key={t.iso} className="cursor-pointer"><input type="radio" name="turno" value={t.iso} required className="peer sr-only" />
                <span className="inline-block rounded-xl border border-[#C3C8D1] bg-white px-3 py-2 text-sm font-semibold tabular-nums peer-checked:border-[#C8231F] peer-checked:bg-[#C8231F] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#C8231F]/40 hover:border-[#C8231F]">{t.hora}</span></label>
            ))}</div>
          </fieldset>
        )) : <p className="m-0 text-sm">No hay horarios libres en los próximos días. Escribinos por WhatsApp y lo coordinamos.</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="lbl">Tema<select name="motivo" className="inp">{MOTIVOS.map((m) => <option key={m}>{m}</option>)}</select></label>
          <label className="lbl">¿Cómo preferís?<select name="modalidad" className="inp"><option value="videollamada">Videollamada (sin instalar nada)</option><option value="llamada">Llamada telefónica</option></select></label>
          <label className="lbl">WhatsApp o teléfono<input name="telefono" defaultValue={k?.telefono ?? ""} inputMode="tel" className="inp" /></label>
          <label className="lbl">¿Algo que quieras que preparemos?<input name="notas" className="inp" /></label>
        </div>
        {dias.length > 0 && <button className="btn-p self-start">Confirmar reunión</button>}
      </form>

      {pasadas.length > 0 && (
        <section className="card flex flex-col gap-2" aria-labelledby="t-pas">
          <h2 id="t-pas" className="m-0 text-base">Anteriores</h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-1 text-sm">
            {pasadas.map((r, i) => <li key={i} className="text-[#4A515C]"><span className="first-letter:uppercase inline-block">{local(new Date(r.inicio)).texto}</span> · {r.modalidad}</li>)}
          </ul>
        </section>
      )}
    </div>
  )
}
