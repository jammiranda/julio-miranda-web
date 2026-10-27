import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { horario, guardarHorario, calendarioConectado, turnosLibres, type HorarioAgenda } from "@/lib/agenda"
import { URL_SISTEMA } from "@/lib/brief"
import Copiar from "@/components/Copiar"

export const dynamic = "force-dynamic"
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const hh = (k: string, d: string) => (/^\d{2}:\d{2}$/.test(String(fd.get(k))) ? String(fd.get(k)) : d)
  const h: HorarioAgenda = {
    dias: fd.getAll("dias").map(Number).filter((n) => n >= 0 && n <= 6),
    desde: hh("desde", "09:00"), hasta: hh("hasta", "18:00"),
    duracion: [15, 20, 30, 45, 60, 90].includes(Number(fd.get("duracion"))) ? Number(fd.get("duracion")) : 30,
    anticipacion: Math.max(0, Math.min(72, Number(fd.get("anticipacion")) || 2)),
    bloqueos: String(fd.get("bloqueos") ?? "").split(/[\s,;]+/).filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)),
  }
  if (!h.dias.length) redirect("/agenda?e=" + encodeURIComponent("Elegí al menos un día."))
  if (h.desde >= h.hasta) redirect("/agenda?e=" + encodeURIComponent("El horario de fin tiene que ser posterior al de inicio."))
  await guardarHorario(h)
  await q("insert into config(clave,valor) values ('avisos_email',$1) on conflict (clave) do update set valor=excluded.valor", [fd.get("avisos_email") === "on" ? "si" : "no"])
  await audit(u, "edita_agenda", "config", 0, JSON.stringify(h))
  revalidatePath("/agenda")
  redirect("/agenda?ok=1")
}

export default async function Agenda({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const [h, av, prox, libres] = await Promise.all([
    horario(),
    one<{ valor: string }>("select valor from config where clave='avisos_email'"),
    q<any>("select r.inicio, r.modalidad, c.nombre, c.organizacion, c.id cid from db_reuniones r left join consultas c on c.id=r.consulta_id where r.estado='confirmada' and r.inicio > now() order by r.inicio limit 8"),
    turnosLibres(3),
  ])
  const link = `${URL_SISTEMA}/agendar`
  const gcal = calendarioConectado()
  const fmt = (d: string) => new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" })
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">Agenda y avisos</h1>
        <p className="m-0 text-sm text-[#4A515C]">Los horarios en los que los clientes pueden reservar una reunión, sin Calendly: el bot ofrece estos turnos por WhatsApp y el link general sirve para la web, las firmas de email y las redes.</p>
      </div>
      {searchParams.ok && <p role="status" className="m-0 text-sm font-semibold text-[#C8231F]">Guardado.</p>}
      {searchParams.e && <p role="alert" className="m-0 text-sm font-semibold text-[#C8231F]">{searchParams.e}</p>}
      <section className="card text-sm flex flex-col gap-2">
        <strong>Link para agendar</strong>
        <div className="flex flex-wrap items-center gap-2"><a href={link} target="_blank" className="underline break-all">{link}</a><Copiar texto={link} etiqueta="Copiar link" /></div>
        <span className="text-[#4A515C]">Cada consulta tiene además su link propio, que el bot manda solo cuando el cliente quiere una reunión.</span>
      </section>
      <form action={guardar} className="card grid grid-cols-1 md:grid-cols-2 gap-4">
        <fieldset className="md:col-span-2 border-0 p-0 m-0 flex flex-col gap-2">
          <legend className="lbl mb-1">Días que se puede reservar</legend>
          <div className="flex flex-wrap gap-3">{[1, 2, 3, 4, 5, 6, 0].map((d) => <label key={d} className="flex items-center gap-1 text-sm"><input type="checkbox" name="dias" value={d} defaultChecked={h.dias.includes(d)} /> {DIAS[d]}</label>)}</div>
        </fieldset>
        <label className="lbl">Desde<input type="time" name="desde" defaultValue={h.desde} step={900} className="inp" /></label>
        <label className="lbl">Hasta<input type="time" name="hasta" defaultValue={h.hasta} step={900} className="inp" /></label>
        <label className="lbl">Duración de la reunión
          <select name="duracion" defaultValue={h.duracion} className="inp">{[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} minutos</option>)}</select>
        </label>
        <label className="lbl">Anticipación mínima (horas)<input type="number" name="anticipacion" min={0} max={72} defaultValue={h.anticipacion} className="inp" /></label>
        <label className="lbl md:col-span-2">Días bloqueados (feriados, vacaciones) · formato AAAA-MM-DD, separados por coma
          <input name="bloqueos" defaultValue={h.bloqueos.join(", ")} placeholder="2026-11-20, 2026-12-08" className="inp" />
        </label>
        <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" name="avisos_email" defaultChecked={av?.valor !== "no"} /> Mandar también por email los avisos del sistema (consultas nuevas, piden una persona, reuniones agendadas, formularios). Llegan al email de cada usuario de Dirección y Coordinación.</label>
        <button className="btn-p md:col-span-2 justify-self-start">Guardar</button>
      </form>
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card text-sm flex flex-col gap-2">
          <h2 className="m-0 text-base">Próximas reuniones</h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-1">
            {prox.map((r: any, i: number) => <li key={i} className="border-b border-[#EEF0F3] pb-1"><a href={`/consultas/${r.cid}`} className="font-semibold">{fmt(r.inicio)}</a> · {r.nombre ?? "Cliente"}{r.organizacion ? ` (${r.organizacion})` : ""} · {r.modalidad}</li>)}
            {!prox.length && <li className="text-[#4A515C]">No hay reuniones agendadas.</li>}
          </ul>
          <h3 className="m-0 mt-2 text-sm">Turnos libres de los próximos días</h3>
          {libres.map((d) => <p key={d.fecha} className="m-0"><strong>{d.etiqueta}:</strong> {d.turnos.map((t) => t.hora).join(" · ") || "sin turnos"}</p>)}
        </div>
        <div className="card text-sm flex flex-col gap-2">
          <h2 className="m-0 text-base">Google Calendar {gcal ? <span className="chip bg-emerald-100 text-emerald-800">conectado</span> : <span className="chip bg-amber-100 text-amber-800">sin conectar</span>}</h2>
          <p className="m-0 text-[#4A515C]">Conectado, el sistema no ofrece horarios en los que ya tengas algo en tu Google Calendar y cada reunión reservada se crea sola en tu calendario, con invitación al cliente.</p>
          {!gcal && <ol className="m-0 pl-5 flex flex-col gap-1">
            <li>Entrá a <a href="https://script.google.com/home/start" target="_blank" rel="noopener noreferrer" className="underline">script.google.com</a> con tu cuenta de Google y creá un proyecto nuevo.</li>
            <li>Pegá el código de <a href="/agenda/script" target="_blank" className="underline">este archivo</a> y cambiá la palabra CLAVE por una clave larga que inventes.</li>
            <li>Implementar → Nueva implementación → Aplicación web · Ejecutar como: yo · Acceso: cualquier persona. Autorizá el acceso a tu calendario.</li>
            <li>En Vercel (proyecto devisebit-sistema → Settings → Environment Variables) cargá <code>GCAL_SCRIPT_URL</code> con la URL que te da Google y <code>GCAL_TOKEN</code> con la misma clave. Avisame y lo vuelvo a publicar.</li>
          </ol>}
        </div>
      </section>
    </div>
  )
}
