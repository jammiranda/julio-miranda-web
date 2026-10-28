import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { ETAPAS, SECTORES, CLASES, esClase, estadoProy } from "@/lib/crm"
import { fechaHora } from "@/lib/consultas"
import { accesoDe, estadoCuenta, montos } from "@/lib/cobros"
import { enviarAcceso } from "@/lib/portal"
import { estadoInsc } from "@/lib/cursos"

async function accesoPortal(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const op = String(fd.get("op") ?? "")
  if (op === "invitar") {
    const r = await enviarAcceso(id, "invitacion")
    await audit(u, r.ok ? "portal_invita" : "portal_invita_error", "db_contacto", id, r.ok ? undefined : r.error)
    redirect(`/contactos/${id}?${r.ok ? "pinv=1" : `perr=${encodeURIComponent(r.error ?? "error")}`}#portal`)
  }
  const v = String(fd.get("acceso"))
  if (["auto", "habilitado", "bloqueado"].includes(v)) {
    await q("update db_contactos set portal_acceso=$1, portal_nota=$2, actualizado=now() where id=$3", [v, String(fd.get("nota") ?? "").slice(0, 300) || null, id])
    await audit(u, `portal_acceso_${v}`, "db_contacto", id)
  }
  redirect(`/contactos/${id}?pok=1#portal`)
}


export const dynamic = "force-dynamic"

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = s(fd.get("id"))
  const nombre = s(fd.get("nombre"))
  if (!nombre) redirect(`/contactos/${id ?? "nuevo"}?err=nombre`)
  const et = String(fd.get("etapa") ?? "nuevo")
  const v = [nombre, s(fd.get("organizacion")), s(fd.get("cargo")), s(fd.get("email")), s(fd.get("telefono")), s(fd.get("sector")),
    ETAPAS.some((e) => e.v === et) ? et : "nuevo", s(fd.get("origen")), s(fd.get("notas")), s(fd.get("proximo")), s(fd.get("proximo_fecha")), s(fd.get("categoria")), s(fd.get("consentimiento"))]
  const cla = String(fd.get("clase") ?? "")
  const claseV = esClase(cla) ? cla : null
  let cid: number
  if (id) {
    await q("update db_contactos set nombre=$1,organizacion=$2,cargo=$3,email=$4,telefono=$5,sector=$6,etapa=$7,origen=$8,notas=$9,proximo=$10,proximo_fecha=$11,categoria=$12,consentimiento=$13,actualizado=now() where id=$14", [...v, Number(id)])
    await q("update db_contactos set clase=$1, clasificado_en=case when $1::text is distinct from clase then now() else clasificado_en end, clasificado_por=case when $1::text is distinct from clase then $2 else clasificado_por end where id=$3", [claseV, u.nombre, Number(id)])
    cid = Number(id)
  } else {
    const r = await one<{ id: number }>("insert into db_contactos(nombre,organizacion,cargo,email,telefono,sector,etapa,origen,notas,proximo,proximo_fecha,categoria,consentimiento,consulta_id,clase,clasificado_en,clasificado_por) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,now(),$16) returning id", [...v, s(fd.get("consulta_id")) ? Number(fd.get("consulta_id")) : null, claseV ?? "oportunidad", u.nombre])
    cid = r!.id
  }
  await audit(u, id ? "edita_contacto_db" : "crea_contacto_db", "db_contacto", cid, et)
  redirect(`/contactos/${cid}?ok=1`)
}

const iso = (d: any) => (d ? (typeof d === "string" ? d : new Date(d).toISOString()).slice(0, 10) : "")

export default async function Contacto({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string; consulta?: string; pok?: string; pinv?: string; perr?: string } }) {
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
  const [acc, cuenta, cursos] = nuevo ? [null, null, []] : await Promise.all([
    accesoDe(c.id), estadoCuenta(c.id),
    q<any>("select i.id, i.estado, cu.titulo, e.id edicion_id, e.nombre edicion from am_inscripciones i join am_ediciones e on e.id=i.edicion_id join am_cursos cu on cu.id=e.curso_id where i.contacto_id=$1 order by i.creado desc", [c.id]),
  ])
  const [proyectos, consultas] = nuevo ? [[], []] : await Promise.all([
    q<any>("select p.id, p.nombre, p.estado, s.nombre servicio from db_proyectos p left join db_servicios s on s.id=p.servicio_id where p.contacto_id=$1 order by p.creado desc", [c.id]),
    q<any>(`select id, creado, motivo, estado from consultas where empresa='devisebit' and (id=$1 or (length(regexp_replace(coalesce($2::text,''),'\\D','','g'))>=6 and regexp_replace(coalesce(telefono,''),'\\D','','g') like '%'||right(regexp_replace($2,'\\D','','g'),8))) order by creado desc limit 10`, [c.consulta_id ?? 0, c.telefono]),
  ])
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <form action={guardar} className="card lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 content-start">
        <div className="md:col-span-2 flex items-center justify-between gap-2">
          <h2 className="m-0 text-lg">{nuevo ? "Nuevo contacto" : c.organizacion ?? c.nombre}</h2>
          <Link href="/contactos" className="text-sm underline text-[#4A515C]">Volver</Link>
        </div>
        {searchParams.ok && <p role="status" className="m-0 md:col-span-2 text-sm text-[#C8231F]">Guardado.</p>}
        {searchParams.err && <p role="alert" className="m-0 md:col-span-2 text-sm text-rojo">Falta el nombre.</p>}
        {!nuevo && <input type="hidden" name="id" value={c.id} />}
        {c.consulta_id && <input type="hidden" name="consulta_id" value={c.consulta_id} />}
        <label className="lbl">Nombre y apellido *<input name="nombre" required defaultValue={c.nombre ?? ""} className="inp" /></label>
        <label className="lbl">Organización<input name="organizacion" defaultValue={c.organizacion ?? ""} className="inp" /></label>
        <label className="lbl">Cargo<input name="cargo" defaultValue={c.cargo ?? ""} className="inp" /></label>
        <label className="lbl">Sector<select name="sector" defaultValue={c.sector ?? ""} className="inp"><option value="">—</option>{[...SECTORES, ...(c.sector && !SECTORES.includes(c.sector) ? [c.sector] : [])].map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="lbl">Categoría<input name="categoria" defaultValue={c.categoria ?? ""} placeholder="Cliente, aliado, proveedor, red…" className="inp" /></label>
        <label className="lbl">Email<input name="email" type="email" defaultValue={c.email ?? ""} className="inp" /></label>
        <label className="lbl">Teléfono<input name="telefono" type="tel" defaultValue={c.telefono ?? ""} className="inp" /></label>
        <label className="lbl">Lista<select name="clase" defaultValue={nuevo ? "oportunidad" : c.clase ?? ""} className="inp"><option value="">Por clasificar</option>{CLASES.map((x) => <option key={x.v} value={x.v}>{x.n}</option>)}</select></label>
        <label className="lbl">Etapa<select name="etapa" defaultValue={c.etapa ?? "nuevo"} className="inp">{ETAPAS.map((e) => <option key={e.v} value={e.v}>{e.n}</option>)}</select></label>
        <label className="lbl">Cómo llegó<input name="origen" defaultValue={c.origen ?? ""} placeholder="WhatsApp, LinkedIn, referido…" className="inp" /></label>
        <label className="lbl">Próximo paso<input name="proximo" defaultValue={c.proximo ?? ""} placeholder="Ej.: enviar propuesta" className="inp" /></label>
        <label className="lbl">Fecha<input name="proximo_fecha" type="date" defaultValue={iso(c.proximo_fecha)} className="inp" /></label>
        <label className="lbl">Consentimiento para comunicaciones<select name="consentimiento" defaultValue={c.consentimiento ?? ""} className="inp"><option value="">No relevado</option><option>Sí</option><option>No</option></select></label>
        <div className="text-sm text-[#4A515C] self-end pb-2">{c.ultimo_contacto ? `Último contacto: ${new Date(c.ultimo_contacto).toLocaleDateString("es-AR")}` : ""}{c.interacciones ? ` · ${c.interacciones} mails` : ""}</div>
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
            <div className="flex items-center justify-between"><h2 className="m-0 text-base">Proyectos</h2><Link href={`/proyectos/nuevo?contacto=${c.id}`} className="btn-s py-1 px-3 text-xs">+ Proyecto</Link></div>
            {proyectos.length ? proyectos.map((p: any) => (
              <Link key={p.id} href={`/proyectos/${p.id}`} className="flex justify-between gap-2 py-1.5 border-b border-[#EEF0F3] hover:underline"><span>{p.nombre}<span className="block text-xs text-[#4A515C]">{p.servicio ?? ""}</span></span><span className={`chip self-start ${estadoProy(p.estado).c}`}>{estadoProy(p.estado).n}</span></Link>
            )) : <p className="m-0 text-sm text-[#4A515C]">Sin proyectos.</p>}
          </section>
          <section id="portal" className="card flex flex-col gap-2">
            <h2 className="m-0 text-base">Cuenta y portal</h2>
            {searchParams.pok && <p role="status" className="m-0 text-xs text-emerald-700">Guardado.</p>}
            {searchParams.pinv && <p role="status" className="m-0 text-xs text-emerald-700">Invitación enviada.</p>}
            {searchParams.perr && <p role="alert" className="m-0 text-xs text-rojo">{searchParams.perr}</p>}
            <p className="m-0 text-sm">Estado: <strong className={acc?.estado === "ok" ? "text-emerald-700" : "text-rojo"}>{acc?.estado === "ok" ? "Puede entrar" : acc?.estado === "deuda" ? `Suspendido por deuda (${acc.atraso} días)` : "Bloqueado"}</strong>{c.portal_ultimo ? <span className="block text-xs text-[#4A515C]">Último ingreso {new Date(c.portal_ultimo).toLocaleDateString("es-AR")}</span> : <span className="block text-xs text-[#4A515C]">Nunca entró</span>}</p>
            {cuenta && cuenta.pendientes.length > 0 && <p className="m-0 text-sm">Pendiente: {montos(cuenta.aPagar)}{cuenta.vencidos.length ? <span className="block text-xs text-rojo font-semibold">Vencido: {montos(cuenta.deudaVencida)}</span> : null}</p>}
            <form action={accesoPortal} className="flex flex-col gap-2">
              <input type="hidden" name="id" value={c.id} />
              <label className="lbl">Acceso<select name="acceso" defaultValue={c.portal_acceso ?? "auto"} className="inp py-1.5"><option value="auto">Automático (se suspende si debe)</option><option value="habilitado">Habilitar siempre</option><option value="bloqueado">Bloquear</option></select></label>
              <label className="lbl">Motivo (interno)<input name="nota" defaultValue={c.portal_nota ?? ""} className="inp py-1.5" /></label>
              <div className="flex gap-2"><button name="op" value="guardar" className="btn-s py-1.5">Guardar</button>{c.email && <button name="op" value="invitar" className="btn-s py-1.5">Mandar acceso</button>}</div>
            </form>
            {cursos.length > 0 && <><h3 className="m-0 mt-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">Cursos</h3>{cursos.map((k: any) => <Link key={k.id} href={`/cursos/edicion/${k.edicion_id}`} className="flex justify-between gap-2 text-sm hover:underline"><span>{k.titulo}<span className="block text-xs text-[#4A515C]">{k.edicion}</span></span><span className={`chip self-start ${estadoInsc(k.estado).c}`}>{estadoInsc(k.estado).n}</span></Link>)}</>}
          </section>
          <section className="card flex flex-col gap-2">
            <h2 className="m-0 text-base">Conversaciones del bot</h2>
            {consultas.length ? consultas.map((k: any) => <Link key={k.id} href={`/consultas/${k.id}`} className="text-sm hover:underline">{fechaHora(k.creado)} · {k.motivo ?? "Consulta"}</Link>) : <p className="m-0 text-sm text-[#4A515C]">Ninguna.</p>}
          </section>
        </aside>
      )}
    </div>
  )
}
