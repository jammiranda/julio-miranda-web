import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q, one } from "@/lib/db"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"

const ESTADO: Record<string, string> = { inscripto: "Inscripto", cursando: "Cursando", aprobado: "Aprobado", desaprobado: "Desaprobado", baja: "Baja" }

/** Sistema Academia: quién estudia, quién compró y quién está suscripto. */
export default async function Alumnos({ searchParams }: { searchParams: { v?: string; b?: string } }) {
  const u = await requerir(["gerente", "coordinacion", "consulta", "profesional"])
  const ficha = u.espacios.includes("comercial")
  const vista = ["alumnos", "compradores", "suscriptos"].includes(searchParams.v ?? "") ? searchParams.v! : "alumnos"
  const b = (searchParams.b ?? "").trim()
  const like = b ? `%${b.toLowerCase()}%` : null
  const [k, alumnos, compradores, suscriptos] = await Promise.all([
    one<{ alumnos: number; activos: number; aprobados: number; compradores: number; suscriptos: number; nuevos: number }>(`select
      (select count(distinct contacto_id) from am_inscripciones where estado <> 'baja')::int alumnos,
      (select count(distinct contacto_id) from am_inscripciones where ultima_actividad > now()-interval '30 days')::int activos,
      (select count(*) from am_inscripciones where estado='aprobado')::int aprobados,
      (select count(distinct lower(email)) from am_ordenes where estado='pagada')::int compradores,
      (select count(*) from db_contactos where suscrito_en is not null and email_estado='activo')::int suscriptos,
      (select count(*) from db_contactos where suscrito_en > now()-interval '30 days')::int nuevos`).catch(() => null),
    vista === "alumnos" ? q<any>(`select i.id, c.id cid, c.nombre, c.email, cu.titulo curso, e.nombre edicion, i.estado, i.ultima_actividad, i.creado,
      (select count(*) from am_progreso pr where pr.inscripcion_id=i.id)::int lecciones
      from am_inscripciones i join db_contactos c on c.id=i.contacto_id join am_ediciones e on e.id=i.edicion_id join am_cursos cu on cu.id=e.curso_id
      where ($1::text is null or lower(c.nombre||' '||coalesce(c.email,'')||' '||cu.titulo) like $1)
      order by i.creado desc limit 200`, [like]).catch(() => []) : Promise.resolve([]),
    vista === "compradores" ? q<any>(`select o.id, o.nombre, o.email, p.titulo, o.monto, o.moneda, o.pagada_en from am_ordenes o join am_productos p on p.id=o.producto_id
      where o.estado='pagada' and ($1::text is null or lower(coalesce(o.nombre,'')||' '||o.email||' '||p.titulo) like $1) order by o.pagada_en desc limit 200`, [like]).catch(() => []) : Promise.resolve([]),
    vista === "suscriptos" ? q<any>(`select id, nombre, email, suscrito_en, tags from db_contactos where suscrito_en is not null and email_estado='activo'
      and ($1::text is null or lower(coalesce(nombre,'')||' '||coalesce(email,'')) like $1) order by suscrito_en desc limit 200`, [like]).catch(() => []) : Promise.resolve([]),
  ])
  const tiles = [
    { t: "Alumnos", v: k?.alumnos, d: `${k?.activos ?? 0} activos en 30 días` },
    { t: "Aprobados", v: k?.aprobados, d: "con certificado" },
    { t: "Compradores", v: k?.compradores, d: "guías y productos pagos" },
    { t: "Suscriptos", v: k?.suscriptos, d: `${k?.nuevos ?? 0} nuevos en 30 días` },
  ]
  const tab = (v: string, t: string) => (
    <Link href={`/academia-admin/alumnos?v=${v}${b ? `&b=${encodeURIComponent(b)}` : ""}`} aria-current={vista === v ? "page" : undefined} className={`px-4 py-2 rounded-lg text-sm font-semibold ${vista === v ? "bg-[#0F766E] text-white" : "bg-white border border-[#E2E5EA] text-[#262C37]"}`}>{t}</Link>
  )
  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="m-0">Alumnos y suscriptos</h1><p className="m-0 text-sm text-[#4A515C]">Todo lo de la Academia en un solo lugar: quién cursa, quién compró y quién recibe el newsletter.</p></div>
      <ul className="m-0 p-0 list-none grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((x) => (
          <li key={x.t} className="card py-4"><div className="text-sm text-[#4A515C]">{x.t}</div><div className="text-3xl font-extrabold text-[#0F766E]">{x.v ?? "—"}</div><div className="text-xs text-[#4A515C]">{x.d}</div></li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        {tab("alumnos", "Alumnos")}{tab("compradores", "Compradores")}{tab("suscriptos", "Suscriptos")}
        <form className="ml-auto flex gap-2"><input type="hidden" name="v" value={vista} /><input name="b" defaultValue={b} placeholder="Buscar nombre, email o curso" className="inp py-2 w-56" /><button className="btn-s py-2">Buscar</button></form>
      </div>
      <div className="card p-0 overflow-x-auto">
        {vista === "alumnos" && (
          <table className="tbl">
            <thead><tr><th>Alumno</th><th>Curso</th><th>Estado</th><th>Lecciones vistas</th><th>Última actividad</th><th>Inscripción</th></tr></thead>
            <tbody>
              {(alumnos as any[]).map((r) => (
                <tr key={r.id}><td>{ficha ? <Link href={`/contactos/${r.cid}`} className="font-semibold underline">{r.nombre ?? r.email}</Link> : <strong>{r.nombre ?? r.email}</strong>}<div className="text-xs text-[#4A515C]">{r.email}</div></td><td>{r.curso}<div className="text-xs text-[#4A515C]">{r.edicion}</div></td><td>{ESTADO[r.estado] ?? r.estado}</td><td>{r.lecciones}</td><td>{r.ultima_actividad ? fecha(r.ultima_actividad) : "—"}</td><td>{fecha(r.creado)}</td></tr>
              ))}
              {!(alumnos as any[]).length && <tr><td colSpan={6} className="text-center text-[#4A515C] py-6">Todavía no hay alumnos{b ? " con esa búsqueda" : ""}. Se suman al inscribirse en un curso.</td></tr>}
            </tbody>
          </table>
        )}
        {vista === "compradores" && (
          <table className="tbl">
            <thead><tr><th>Comprador</th><th>Producto</th><th>Importe</th><th>Pagado</th></tr></thead>
            <tbody>
              {(compradores as any[]).map((r) => (
                <tr key={r.id}><td className="font-semibold">{r.nombre ?? "—"}<div className="text-xs text-[#4A515C] font-normal">{r.email}</div></td><td>{r.titulo}</td><td>{r.monto != null ? `${r.moneda ?? "ARS"} ${Number(r.monto).toLocaleString("es-AR")}` : "—"}</td><td>{r.pagada_en ? fecha(r.pagada_en) : "—"}</td></tr>
              ))}
              {!(compradores as any[]).length && <tr><td colSpan={4} className="text-center text-[#4A515C] py-6">Todavía no hay compras pagadas{b ? " con esa búsqueda" : ""}.</td></tr>}
            </tbody>
          </table>
        )}
        {vista === "suscriptos" && (
          <table className="tbl">
            <thead><tr><th>Suscripto</th><th>Intereses</th><th>Desde</th></tr></thead>
            <tbody>
              {(suscriptos as any[]).map((r) => (
                <tr key={r.id}><td>{ficha ? <Link href={`/contactos/${r.id}`} className="font-semibold underline">{r.nombre ?? r.email}</Link> : <strong>{r.nombre ?? r.email}</strong>}<div className="text-xs text-[#4A515C]">{r.email}</div></td><td className="text-xs">{(r.tags ?? []).slice(0, 4).join(" · ") || "—"}</td><td>{fecha(r.suscrito_en)}</td></tr>
              ))}
              {!(suscriptos as any[]).length && <tr><td colSpan={3} className="text-center text-[#4A515C] py-6">Todavía no hay suscriptos{b ? " con esa búsqueda" : ""}.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
