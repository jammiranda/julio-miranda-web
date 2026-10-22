import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir, puede } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { LOCALIDADES, s } from "@/lib/util"

export const dynamic = "force-dynamic"
const ESTADOS = [
  { v: "nueva", n: "Nueva", c: "bg-red-50 text-rojo" },
  { v: "contactada", n: "Contactada", c: "bg-amber-50 text-amber-700" },
  { v: "evaluacion", n: "En evaluación", c: "bg-sky-50 text-sky-700" },
  { v: "ingreso", n: "Ingresó", c: "bg-[#E3F2E8] text-[#0B5E31]" },
  { v: "descartada", n: "Descartada", c: "bg-slate-100 text-slate-600" },
]
const CANAL: Record<string, string> = { whatsapp: "WhatsApp", web: "Web", telefono: "Teléfono", derivacion: "Derivación", instagram: "Instagram", otro: "Otro" }

async function nueva(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const r = await one<{ id: number }>(
    "insert into consultas(canal,nombre,telefono,paciente_nombre,obra_social,localidad,motivo,mensaje) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id",
    [s(fd.get("canal")) ?? "telefono", s(fd.get("nombre")), s(fd.get("telefono")), s(fd.get("paciente_nombre")), s(fd.get("obra_social")), s(fd.get("localidad")), s(fd.get("motivo")), s(fd.get("mensaje"))],
  )
  await audit(u, "alta_consulta", "consulta", r!.id)
  redirect("/consultas")
}

async function actualizar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const est = String(fd.get("estado"))
  if (!ESTADOS.some((e) => e.v === est)) return
  await q("update consultas set estado=$1, asignado=$2, notas=$3, actualizado=now() where id=$4", [est, s(fd.get("asignado")), s(fd.get("notas")), id])
  await audit(u, "estado_consulta", "consulta", id, est)
  redirect(`/consultas?f=${fd.get("f") ?? "abiertas"}`)
}

async function aPaciente(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const c = await one<any>("select * from consultas where id=$1", [id])
  if (!c) redirect("/consultas")
  const p = await one<{ id: number }>(
    "insert into pacientes(apellido_nombre,obra_social,nro_afiliado,localidad,telefono,contacto_familiar,tel_familiar,notas) values ($1,$2,$3,$4,$5,$6,$7,$8) returning id",
    [String(c.paciente_nombre ?? c.nombre ?? "SIN NOMBRE").toUpperCase(), c.obra_social ?? "PAMI", c.nro_afiliado, c.localidad, null, c.nombre, c.telefono, `Ingresó por consulta #${id} (${CANAL[c.canal] ?? c.canal}). ${c.motivo ?? ""}`],
  )
  await q("update consultas set estado='ingreso', paciente_id=$1, actualizado=now() where id=$2", [p!.id, id])
  await audit(u, "consulta_a_paciente", "consulta", id, `paciente ${p!.id}`)
  redirect(`/pacientes/${p!.id}`)
}

export default async function Consultas({ searchParams }: { searchParams: { f?: string } }) {
  const u = await requerir()
  const f = searchParams.f ?? "abiertas"
  const rows = await q<any>(
    `select * from consultas where ($1='todas' or ($1='abiertas' and estado in ('nueva','contactada','evaluacion')) or estado=$1) order by (estado='nueva') desc, creado desc limit 300`,
    [f],
  )
  const cuenta = await q<{ estado: string; n: number }>("select estado, count(*)::int n from consultas group by estado")
  const n = Object.fromEntries(cuenta.map((c) => [c.estado, c.n]))
  const ed = puede.editar(u)
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="m-0">Consultas · CRM</h1><p className="m-0 text-sm text-[#4F5C69]">Todo lo que entra por WhatsApp, la web, teléfono o derivaciones, hasta que se convierte en paciente.</p></div>
      <div className="flex flex-wrap gap-2">
        {[{ v: "abiertas", n: "Abiertas" }, ...ESTADOS, { v: "todas", n: "Todas" }].map((e) => (
          <Link key={e.v} href={`/consultas?f=${e.v}`} className={`chip text-sm px-3 py-1 border ${f === e.v ? "bg-[#0B7A3B] text-white border-[#0B7A3B]" : "bg-white border-[#C9D3CD]"}`}>
            {e.n}{n[e.v] != null ? ` (${n[e.v]})` : ""}
          </Link>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((c) => {
          const est = ESTADOS.find((e) => e.v === c.estado)!
          return (
            <div key={c.id} className="card flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`chip ${est.c}`}>{est.n}</span>
                  <span className="chip bg-[#F3F5F4]">{CANAL[c.canal] ?? c.canal}</span>
                  <strong>{c.nombre ?? "Sin nombre"}</strong>
                  {c.telefono && <a className="text-sm text-[#0B7A3B] underline" href={`https://wa.me/${String(c.telefono).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">{c.telefono}</a>}
                </div>
                <span className="text-xs text-[#4F5C69]">#{c.id} · {new Date(c.creado).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}</span>
              </div>
              <div className="text-sm text-[#33414F]">
                {[c.motivo && `Motivo: ${c.motivo}`, c.paciente_nombre && `Paciente: ${c.paciente_nombre}`, c.obra_social && `Cobertura: ${c.obra_social}`, c.localidad && `Localidad: ${c.localidad}`].filter(Boolean).join(" · ")}
              </div>
              {c.mensaje && <p className="m-0 text-sm whitespace-pre-line bg-[#F3F5F4] rounded-lg p-2">{c.mensaje}</p>}
              {c.paciente_id && <Link href={`/pacientes/${c.paciente_id}`} className="text-sm underline text-[#0B5E31]">Ver ficha del paciente</Link>}
              {ed && (
                <div className="flex flex-wrap gap-2 items-end">
                  <form action={actualizar} className="flex flex-wrap gap-2 items-end">
                    <input type="hidden" name="id" value={c.id} /><input type="hidden" name="f" value={f} />
                    <label className="lbl">Estado<select name="estado" defaultValue={c.estado} className="inp py-1.5">{ESTADOS.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}</select></label>
                    <label className="lbl">Responsable<input name="asignado" defaultValue={c.asignado ?? ""} className="inp py-1.5 w-36" /></label>
                    <label className="lbl">Notas<input name="notas" defaultValue={c.notas ?? ""} className="inp py-1.5 w-64" /></label>
                    <button className="btn-s py-1.5">Guardar</button>
                  </form>
                  {!c.paciente_id && <form action={aPaciente}><input type="hidden" name="id" value={c.id} /><button className="btn-p py-1.5">Pasar a paciente</button></form>}
                </div>
              )}
            </div>
          )
        })}
        {!rows.length && <p className="text-sm text-[#4F5C69]">No hay consultas en esta vista.</p>}
      </div>
      {ed && (
        <form action={nueva} className="card grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <h2 className="m-0 col-span-full text-base">Cargar consulta a mano (llamado, derivación…)</h2>
          <label className="lbl">Canal<select name="canal" className="inp"><option value="telefono">Teléfono</option><option value="whatsapp">WhatsApp</option><option value="derivacion">Derivación</option><option value="web">Web</option><option value="instagram">Instagram</option><option value="otro">Otro</option></select></label>
          <label className="lbl">Quién consulta<input name="nombre" className="inp" /></label>
          <label className="lbl">Teléfono<input name="telefono" className="inp" /></label>
          <label className="lbl">Paciente<input name="paciente_nombre" className="inp" /></label>
          <label className="lbl">Cobertura<input name="obra_social" defaultValue="PAMI" className="inp" /></label>
          <label className="lbl">Localidad<input name="localidad" list="locs" className="inp" /><datalist id="locs">{LOCALIDADES.map((l) => <option key={l} value={l} />)}</datalist></label>
          <label className="lbl">Motivo<select name="motivo" className="inp"><option>Internación domiciliaria</option><option>Enfermería</option><option>Kinesiología</option><option>Visita médica</option><option>Equipamiento</option><option>Convenio / institución</option><option>Trabajar con nosotros</option><option>Otro</option></select></label>
          <label className="lbl sm:col-span-2">Mensaje<input name="mensaje" className="inp" /></label>
          <button className="btn-p">Agregar</button>
        </form>
      )}
    </div>
  )
}
