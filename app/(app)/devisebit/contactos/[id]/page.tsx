import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { ETAPAS, SECTORES, estadoProy } from "@/lib/devisebit"
import { fechaHora } from "@/lib/consultas"

export const dynamic = "force-dynamic"

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = s(fd.get("id"))
  const nombre = s(fd.get("nombre"))
  if (!nombre) redirect(`/devisebit/contactos/${id ?? "nuevo"}?err=nombre`)
  const et = String(fd.get("etapa") ?? "nuevo")
  const v = [nombre, s(fd.get("organizacion")), s(fd.get("cargo")), s(fd.get("email")), s(fd.get("telefono")), s(fd.get("sector")),
    ETAPAS.some((e) => e.v === et) ? et : "nuevo", s(fd.get("origen")), s(fd.get("notas")), s(fd.get("proximo")), s(fd.get("proximo_fecha"))]
  let cid: number
  if (id) {
    await q("update db_contactos set nombre=$1,organizacion=$2,cargo=$3,email=$4,telefono=$5,sector=$6,etapa=$7,origen=$8,notas=$9,proximo=$10,proximo_fecha=$11,actualizado=now() where id=$12", [...v, Number(id)])
    cid = Number(id)
  } else {
    const r = await one<{ id: number }>("insert into db_contactos(nombre,organizacion,cargo,email,telefono,sector,etapa,origen,notas,proximo,proximo_fecha,consulta_id) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id", [...v, s(fd.get("consulta_id")) ? Number(fd.get("consulta_id")) : null])
    cid = r!.id
  }
  await audit(u, id ? "edita_contacto_db" : "crea_contacto_db", "db_contacto", cid, et)
  redirect(`/devisebit/contactos/${cid}?ok=1`)
}

const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : "")

export default async function Contacto({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string; consulta?: string } }) {
  const nuevo = params.id === "nuevo"
  let c: any = {}
  if (!nuevo) {
    c = await one<any>("select * from db_contactos where id=$1", [Number(params.id)])
    if (!c) notFound()
  } else if (searchParams.consulta) {
    // Precarga desde una consulta del bot
    const k = await one<any>("select id, nombre, organizacion, email, telefono, motivo, mensaje, canal from consultas where id=$1 and empresa='devisebit'", [Number(searchParams.consulta)])
    if (k) c = { nombre: k.nombre, organizacion: k.organizacion, email: k.email, telefono: k.telefono, etapa: "conversando", origen: k.canal === "instagram" ? "Instagram" : "WhatsApp", notas: [k.motivo, k.mensaje].filter(Boolean).join("\n"), consulta_id: k.id }
  }
  const [proyectos, consultas] = nuevo ? [[], []] : await Promise.all([
    q<any>("select p.id, p.nombre, p.estado, s.nombre servicio from db_proyectos p left join db_servicios s on s.id=p.servicio_id where p.contacto_id=$1 order by p.creado desc", [c.id]),
    q<any>(`select id, creado, motivo, estado from consultas where empresa='devisebit' and (id=$1 or (length(regexp_replace(coalesce($2::text,''),'\\D','','g'))>=6 and regexp_replace(coalesce(telefono,''),'\\D','','g') like '%'||right(regexp_replace($2,'\\D','','g'),8))) order by creado desc limit 10`, [c.consulta_id ?? 0, c.telefono]),
  ])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <form action={guardar} className="card lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
        <div className="md:col-span-2 flex items-center justify-between gap-2">
          <h2 className="m-0 text-lg">{nuevo ? "Nuevo contacto" : c.organizacion ?? c.nombre}</h2>
          <Link href="/devisebit/contactos" className="text-sm underline text-[#4F5C69]">Volver</Link>
        </div>
        {searchParams.ok && <p role="status" className="m-0 md:col-span-2 text-sm text-[#0B7A3B]">Guardado.</p>}
        {searchParams.err && <p role="alert" className="m-0 md:col-span-2 text-sm text-rojo">Falta el nombre.</p>}
        {!nuevo && <input type="hidden" name="id" value={c.id} />}
        {c.consulta_id && <input type="hidden" name="consulta_id" value={c.consulta_id} />}
        <label className="lbl">Nombre y apellido *<input name="nombre" required defaultValue={c.nombre ?? ""} className="inp" /></label>
        <label className="lbl">Organización<input name="organizacion" defaultValue={c.organizacion ?? ""} className="inp" /></label>
        <label className="lbl">Cargo<input name="cargo" defaultValue={c.cargo ?? ""} className="inp" /></label>
        <label className="lbl">Sector<select name="sector" defaultValue={c.sector ?? ""} className="inp"><option value="">—</option>{SECTORES.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="lbl">Email<input name="email" type="email" defaultValue={c.email ?? ""} className="inp" /></label>
        <label className="lbl">Teléfono<input name="telefono" type="tel" defaultValue={c.telefono ?? ""} className="inp" /></label>
        <label className="lbl">Etapa<select name="etapa" defaultValue={c.etapa ?? "nuevo"} className="inp">{ETAPAS.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}</select></label>
        <label className="lbl">Cómo llegó<input name="origen" defaultValue={c.origen ?? ""} placeholder="WhatsApp, LinkedIn, referido…" className="inp" /></label>
        <label className="lbl">Próximo paso<input name="proximo" defaultValue={c.proximo ?? ""} placeholder="Ej.: enviar propuesta" className="inp" /></label>
        <label className="lbl">Fecha<input name="proximo_fecha" type="date" defaultValue={iso(c.proximo_fecha)} className="inp" /></label>
        <label className="lbl md:col-span-2">Notas<textarea name="notas" rows={6} defaultValue={c.notas ?? ""} className="inp" /></label>
        <div className="md:col-span-2 flex gap-2 flex-wrap">
          <button className="btn-p">Guardar</button>
          {c.telefono && <a href={`https://wa.me/${String(c.telefono).replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="btn-s">WhatsApp</a>}
          {c.email && <a href={`mailto:${c.email}`} className="btn-s">Email</a>}
        </div>
      </form>
      {!nuevo && (
        <aside className="flex flex-col gap-4">
          <section className="card flex flex-col gap-2">
            <div className="flex items-center justify-between"><h2 className="m-0 text-base">Proyectos</h2><Link href={`/devisebit/proyectos/nuevo?contacto=${c.id}`} className="btn-s py-1 px-3 text-xs">+ Proyecto</Link></div>
            {proyectos.length ? proyectos.map((p: any) => (
              <Link key={p.id} href={`/devisebit/proyectos/${p.id}`} className="flex justify-between gap-2 py-1.5 border-b border-[#EEF1EF] hover:underline"><span>{p.nombre}<span className="block text-xs text-[#4F5C69]">{p.servicio ?? ""}</span></span><span className={`chip self-start ${estadoProy(p.estado).c}`}>{estadoProy(p.estado).n}</span></Link>
            )) : <p className="m-0 text-sm text-[#4F5C69]">Sin proyectos.</p>}
          </section>
          <section className="card flex flex-col gap-2">
            <h2 className="m-0 text-base">Conversaciones del bot</h2>
            {consultas.length ? consultas.map((k: any) => <Link key={k.id} href={`/consultas/${k.id}`} className="text-sm hover:underline">{fechaHora(k.creado)} · {k.motivo ?? "Consulta"}</Link>) : <p className="m-0 text-sm text-[#4F5C69]">Ninguna.</p>}
          </section>
        </aside>
      )}
    </div>
  )
}
