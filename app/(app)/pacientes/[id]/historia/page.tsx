import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir, puede } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { TIPO_NOMBRE, fecha, hoyISO, s } from "@/lib/util"
import Imprimir from "@/components/Imprimir"
import SubirDocumento from "@/components/SubirDocumento"
import { iaActiva } from "@/lib/ia"

export const dynamic = "force-dynamic"

const TIPOS_HC = [
  { v: "ingreso", n: "Ingreso / valoración inicial", c: "bg-[#E3F2E8] text-[#0B5E31]" },
  { v: "evolucion", n: "Evolución", c: "bg-sky-50 text-sky-700" },
  { v: "indicacion", n: "Indicación médica", c: "bg-violet-50 text-violet-700" },
  { v: "estudio", n: "Estudio / laboratorio", c: "bg-amber-50 text-amber-700" },
  { v: "interconsulta", n: "Interconsulta", c: "bg-orange-50 text-orange-700" },
  { v: "epicrisis", n: "Epicrisis / alta", c: "bg-slate-200 text-slate-700" },
  { v: "nota", n: "Nota", c: "bg-slate-100 text-slate-600" },
]
const ROLES_HC = ["gerente", "coordinacion", "profesional"] as const

async function agregar(fd: FormData) {
  "use server"
  const u = await requerir([...ROLES_HC])
  const id = Number(fd.get("id"))
  const tipo = String(fd.get("tipo"))
  const texto = s(fd.get("texto"))
  if (!TIPOS_HC.some((t) => t.v === tipo) || !texto) redirect(`/pacientes/${id}/historia?err=1`)
  const r = await one<{ id: number }>(
    "insert into hc_registros(paciente_id,fecha,tipo,profesional,texto,creado_por,creado_por_nombre) values ($1,$2,$3,$4,$5,$6,$7) returning id",
    [id, s(fd.get("fecha")) ?? hoyISO(), tipo, s(fd.get("profesional")), texto, u.id, u.nombre],
  )
  const adj = Number(fd.get("adjunto") || 0)
  if (adj) await q("update adjuntos set hc_id=$1 where id=$2 and paciente_id=$3", [r!.id, adj, id])
  if (fd.get("aplicar_resumen")) {
    const p = await one<any>("select diagnostico, antecedentes, alergias, medicacion from pacientes where id=$1", [id])
    const junta = (viejo: string | null, nuevo: string | null) => (!nuevo ? viejo : !viejo ? nuevo : viejo.includes(nuevo) ? viejo : `${viejo}\n${nuevo}`)
    await q("update pacientes set diagnostico=$1, antecedentes=$2, alergias=$3, medicacion=$4 where id=$5", [junta(p?.diagnostico, s(fd.get("r_diagnostico"))), junta(p?.antecedentes, s(fd.get("r_antecedentes"))), junta(p?.alergias, s(fd.get("r_alergias"))), junta(p?.medicacion, s(fd.get("r_medicacion"))), id])
  }
  await audit(u, "alta_hc", "hc_registro", r!.id, `paciente ${id} · ${tipo}${adj ? " · con documento" : ""}`)
  redirect(`/pacientes/${id}/historia?ok=1`)
}

async function anular(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id")), reg = Number(fd.get("reg"))
  const motivo = s(fd.get("motivo"))
  if (!motivo) redirect(`/pacientes/${id}/historia`)
  await q("update hc_registros set anulado=true, anulado_motivo=$1 where id=$2 and paciente_id=$3", [`${motivo} (${u.nombre}, ${new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })})`, reg, id])
  await audit(u, "anula_hc", "hc_registro", reg, motivo!)
  redirect(`/pacientes/${id}/historia`)
}

async function resumen(fd: FormData) {
  "use server"
  const u = await requerir([...ROLES_HC])
  const id = Number(fd.get("id"))
  await q("update pacientes set diagnostico=$1, antecedentes=$2, alergias=$3, medicacion=$4 where id=$5", [s(fd.get("diagnostico")), s(fd.get("antecedentes")), s(fd.get("alergias")), s(fd.get("medicacion")), id])
  await audit(u, "edita_resumen_hc", "paciente", id)
  redirect(`/pacientes/${id}/historia?ok=1`)
}

export default async function Historia({ params, searchParams }: { params: { id: string }; searchParams: { t?: string; ok?: string; err?: string } }) {
  const u = await requerir()
  if (!puede.verHC(u)) redirect(`/pacientes/${params.id}`)
  const id = Number(params.id)
  const p = await one<any>("select * from pacientes where id=$1", [id])
  if (!p) notFound()
  await audit(u, "ver_historia_clinica", "paciente", id)
  const t = searchParams.t ?? "todo"
  const regs = await q<any>("select h.*, (select min(a.id) from adjuntos a where a.hc_id=h.id) adjunto from hc_registros h where paciente_id=$1 order by fecha desc, id desc", [id])
  const sueltos = await q<any>("select id, nombre, creado, creado_por_nombre from adjuntos where paciente_id=$1 and hc_id is null order by creado desc", [id])
  const vis = await q<any>(
    "select v.id, v.fecha, v.tipo, v.evolucion, v.ta, v.fc, v.temp, v.sat, pr.nombre prof from visitas v left join profesionales pr on pr.id=v.profesional_id where v.paciente_id=$1 and v.estado='realizada' and (v.evolucion is not null or v.ta is not null) order by v.fecha desc",
    [id],
  )
  type Item = { k: string; fecha: any; tipo: string; titulo: string; prof?: string | null; texto: string; meta?: string; anulado?: boolean; motivo?: string; regId?: number; adjunto?: number | null }
  const items: Item[] = [
    ...regs.map((r) => ({ k: `r${r.id}`, fecha: r.fecha, tipo: r.tipo, titulo: TIPOS_HC.find((x) => x.v === r.tipo)?.n ?? r.tipo, prof: r.profesional, texto: r.texto, meta: `Cargado por ${r.creado_por_nombre ?? "—"} el ${new Date(r.creado).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`, anulado: r.anulado, motivo: r.anulado_motivo, regId: r.id, adjunto: r.adjunto })),
    ...vis.map((v) => ({ k: `v${v.id}`, fecha: v.fecha, tipo: "visita", titulo: `Visita de ${TIPO_NOMBRE[v.tipo] ?? v.tipo}`, prof: v.prof, texto: [[v.ta && `TA ${v.ta}`, v.fc && `FC ${v.fc}`, v.temp && `T ${v.temp}`, v.sat && `Sat ${v.sat}`].filter(Boolean).join(" · "), v.evolucion].filter(Boolean).join("\n") })),
  ]
    .filter((i) => t === "todo" || i.tipo === t)
    .sort((a, b) => String(b.fecha instanceof Date ? b.fecha.toISOString() : b.fecha).localeCompare(String(a.fecha instanceof Date ? a.fecha.toISOString() : a.fecha)))
  const puedeCargar = (ROLES_HC as readonly string[]).includes(u.rol)
  const edad = p.fecha_nac ? Math.floor((Date.now() - new Date(p.fecha_nac).getTime()) / (365.25 * 864e5)) : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/pacientes/${id}`} className="text-sm text-[#4F5C69] no-print">← Ficha del paciente</Link>
          <h1 className="m-0">Historia clínica · {p.apellido_nombre}</h1>
          <p className="m-0 text-sm text-[#4F5C69]">{[p.dni && `DNI ${p.dni}`, edad != null && `${edad} años`, p.obra_social, p.nro_afiliado && `Afiliado ${p.nro_afiliado}`, p.localidad, p.medico_cabecera && `Médico de cabecera: ${p.medico_cabecera}`].filter(Boolean).join(" · ")}</p>
        </div>
        <Imprimir />
      </div>
      {searchParams.ok && <p className="m-0 text-sm text-[#0B5E31] no-print">Guardado.</p>}
      {searchParams.err && <p className="m-0 text-sm text-rojo no-print">Falta el tipo o el texto del registro.</p>}

      <section className="card">
        <h2 className="mt-0">Resumen clínico</h2>
        {puedeCargar ? (
          <form action={resumen} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="hidden" name="id" value={id} />
            <label className="lbl">Diagnóstico principal<textarea name="diagnostico" rows={2} defaultValue={p.diagnostico ?? ""} className="inp" /></label>
            <label className="lbl">Antecedentes<textarea name="antecedentes" rows={2} defaultValue={p.antecedentes ?? ""} className="inp" /></label>
            <label className="lbl">Alergias<textarea name="alergias" rows={2} defaultValue={p.alergias ?? ""} className="inp" placeholder="Sin alergias conocidas" /></label>
            <label className="lbl">Medicación habitual<textarea name="medicacion" rows={2} defaultValue={p.medicacion ?? ""} className="inp" /></label>
            <div className="no-print"><button className="btn-s">Guardar resumen</button></div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 m-0 text-sm">
            {[["Diagnóstico principal", p.diagnostico], ["Antecedentes", p.antecedentes], ["Alergias", p.alergias], ["Medicación habitual", p.medicacion]].map(([k, v]) => (
              <div key={k}><dt className="font-semibold">{k}</dt><dd className="m-0 whitespace-pre-line">{v || "—"}</dd></div>
            ))}
          </dl>
        )}
      </section>

      {puedeCargar && (
        <section className="card no-print flex flex-col gap-2">
          <h2 className="m-0 text-base">Cargar desde un documento</h2>
          <p className="m-0 text-sm text-[#4F5C69]">Sacale una foto a la evolución, indicación o informe (o subí el PDF) y se transcribe solo.</p>
          <SubirDocumento paciente={id} accion={agregar} ia={iaActiva()} hoy={hoyISO()} profesional={u.rol === "profesional" ? u.nombre : ""} />
          {sueltos.length > 0 && <p className="m-0 text-xs text-[#4F5C69]">Documentos subidos sin registro: {sueltos.map((a: any, k: number) => <span key={a.id}>{k ? " · " : ""}<a className="underline" href={`/api/adjuntos/${a.id}`} target="_blank">{a.nombre ?? `#${a.id}`}</a></span>)}</p>}
        </section>
      )}

      {puedeCargar && (
        <details className="card no-print" open={!items.length}>
          <summary className="cursor-pointer font-bold text-[#0B7A3B]">+ Escribir un registro a mano</summary>
          <form action={agregar} className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <input type="hidden" name="id" value={id} />
            <label className="lbl">Tipo<select name="tipo" className="inp">{TIPOS_HC.map((x) => <option key={x.v} value={x.v}>{x.n}</option>)}</select></label>
            <label className="lbl">Fecha<input name="fecha" type="date" defaultValue={hoyISO()} className="inp" /></label>
            <label className="lbl">Profesional<input name="profesional" defaultValue={u.rol === "profesional" ? u.nombre : ""} className="inp" placeholder="Nombre y matrícula" /></label>
            <label className="lbl md:col-span-3">Registro<textarea name="texto" rows={6} required className="inp" placeholder="Motivo, examen, evolución, indicaciones…" /></label>
            <div className="md:col-span-3 flex flex-wrap items-center gap-3">
              <button className="btn-p">Guardar registro</button>
              <span className="text-xs text-[#4F5C69]">Los registros no se editan ni se borran: si hay un error se anulan con motivo y queda constancia.</span>
            </div>
          </form>
        </details>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 no-print">
          {[{ v: "todo", n: "Todo" }, ...TIPOS_HC, { v: "visita", n: "Visitas" }].map((x) => (
            <Link key={x.v} href={`/pacientes/${id}/historia?t=${x.v}`} className={`chip text-sm px-3 py-1 border ${t === x.v ? "bg-[#0B7A3B] text-white border-[#0B7A3B]" : "bg-white border-[#C9D3CD]"}`}>{x.n.split(" /")[0]}</Link>
          ))}
        </div>
        {items.map((i) => {
          const c = TIPOS_HC.find((x) => x.v === i.tipo)?.c ?? "bg-[#F3F5F4] text-[#33414F]"
          return (
            <article key={i.k} className={`card flex flex-col gap-2 ${i.anulado ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <strong>{fecha(i.fecha)}</strong>
                  <span className={`chip ${c}`}>{i.titulo}</span>
                  {i.prof && <span className="text-sm text-[#4F5C69]">{i.prof}</span>}
                  {i.anulado && <span className="chip bg-red-50 text-rojo">Anulado</span>}
                </div>
                {i.meta && <span className="text-xs text-[#4F5C69]">{i.meta}</span>}
              </div>
              <p className={`m-0 text-[15px] whitespace-pre-line ${i.anulado ? "line-through" : ""}`}>{i.texto}</p>
              {i.adjunto && <a href={`/api/adjuntos/${i.adjunto}`} target="_blank" className="text-sm underline text-[#0B7A3B] no-print">📎 Ver documento original</a>}
              {i.anulado && <p className="m-0 text-xs text-rojo">Motivo de anulación: {i.motivo}</p>}
              {!i.anulado && i.regId && puede.editar(u) && (
                <details className="no-print">
                  <summary className="cursor-pointer text-xs text-[#4F5C69]">Anular este registro</summary>
                  <form action={anular} className="flex flex-wrap gap-2 mt-2">
                    <input type="hidden" name="id" value={id} /><input type="hidden" name="reg" value={i.regId} />
                    <input name="motivo" required placeholder="Motivo (obligatorio)" className="inp py-1.5 w-72" />
                    <button className="btn-s py-1.5">Anular</button>
                  </form>
                </details>
              )}
            </article>
          )
        })}
        {!items.length && <p className="text-sm text-[#4F5C69]">Todavía no hay registros en la historia clínica.</p>}
      </section>
    </div>
  )
}
