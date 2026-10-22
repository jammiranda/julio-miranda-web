import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { TIPOS, s, hoyISO } from "@/lib/util"

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion", "profesional"])
  const pac = Number(fd.get("paciente_id"))
  const fechas = String(fd.get("fecha") ?? hoyISO())
  const repetir = Math.min(Number(fd.get("repetir") || 1), 31)
  const cada = Math.max(Number(fd.get("cada") || 7), 1)
  const estado = String(fd.get("estado") ?? "programada")
  for (let i = 0; i < repetir; i++) {
    const d = new Date(fechas + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + i * cada)
    const r = await one<{ id: number }>(
      "insert into visitas(paciente_id,profesional_id,fecha,tipo,estado,app_pami,ta,fc,temp,sat,evolucion,creado_por) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id",
      [pac, s(fd.get("profesional_id")) ? Number(fd.get("profesional_id")) : null, d.toISOString().slice(0, 10), s(fd.get("tipo")),
       i === 0 ? estado : "programada", i === 0 && fd.get("app_pami") === "on", s(fd.get("ta")), s(fd.get("fc")), s(fd.get("temp")), s(fd.get("sat")), i === 0 ? s(fd.get("evolucion")) : null, u.id],
    )
    await audit(u, "alta_visita", "visita", r!.id, `paciente ${pac}`)
  }
  redirect(`/agenda?d=${fechas}`)
}

export default async function NuevaVisita({ searchParams }: { searchParams: { paciente?: string; fecha?: string } }) {
  await requerir(["gerente", "coordinacion", "profesional"])
  const pacs = await q<any>("select id, apellido_nombre, localidad from pacientes where estado='activo' order by apellido_nombre")
  const profs = await q<any>("select id, nombre, especialidad from profesionales where activo order by nombre")
  return (
    <form action={guardar} className="flex flex-col gap-4 max-w-3xl">
      <h1 className="m-0">Programar o registrar visita</h1>
      <div className="card grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="lbl sm:col-span-2">Paciente *
          <select name="paciente_id" required defaultValue={searchParams.paciente ?? ""} className="inp">
            <option value="" disabled>Elegí un paciente</option>
            {pacs.map((p) => <option key={p.id} value={p.id}>{p.apellido_nombre}{p.localidad ? ` · ${p.localidad}` : ""}</option>)}
          </select>
        </label>
        <label className="lbl">Tipo *<select name="tipo" required className="inp">{TIPOS.map((t) => <option key={t.v} value={t.v}>{t.n}</option>)}</select></label>
        <label className="lbl">Profesional
          <select name="profesional_id" className="inp" defaultValue=""><option value="">Sin asignar</option>{profs.map((p) => <option key={p.id} value={p.id}>{p.nombre} · {p.especialidad}</option>)}</select>
        </label>
        <label className="lbl">Fecha *<input name="fecha" type="date" required defaultValue={searchParams.fecha ?? hoyISO()} className="inp" /></label>
        <label className="lbl">Estado<select name="estado" className="inp"><option value="programada">Programada</option><option value="realizada">Realizada</option></select></label>
        <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="app_pami" /> Ya está registrada en la APP PAMI Prestadores</label>
      </div>
      <div className="card grid grid-cols-2 sm:grid-cols-4 gap-3">
        <h2 className="m-0 col-span-full text-base">Registro de la visita (si ya se realizó)</h2>
        <label className="lbl">TA<input name="ta" placeholder="120/80" className="inp" /></label>
        <label className="lbl">FC<input name="fc" inputMode="numeric" className="inp" /></label>
        <label className="lbl">Temp.<input name="temp" inputMode="decimal" className="inp" /></label>
        <label className="lbl">Sat. O₂<input name="sat" inputMode="numeric" className="inp" /></label>
        <label className="lbl col-span-full">Evolución / prestación realizada<textarea name="evolucion" rows={3} className="inp" /></label>
      </div>
      <div className="card flex flex-wrap gap-3 items-end">
        <h2 className="m-0 w-full text-base">Repetir (para programar la semana o el mes)</h2>
        <label className="lbl">Cantidad de visitas<input name="repetir" type="number" min={1} max={31} defaultValue={1} className="inp w-28" /></label>
        <label className="lbl">Cada cuántos días<input name="cada" type="number" min={1} defaultValue={7} className="inp w-28" /></label>
      </div>
      <div className="flex gap-2"><button className="btn-p">Guardar</button><a href="/agenda" className="btn-s">Cancelar</a></div>
    </form>
  )
}
