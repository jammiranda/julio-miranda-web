import Link from "next/link"
import Eliminar from "@/components/Eliminar"
import { requerir } from "@/lib/auth"
import { q, one } from "@/lib/db"
import { fecha } from "@/lib/util"
import { Kpis } from "@/components/Kpi"

export const dynamic = "force-dynamic"

const ESTADO: Record<string, string> = { inscripto: "Inscripto", cursando: "Cursando", aprobado: "Aprobado", desaprobado: "Desaprobado", baja: "Baja" }
const COLOR_ESTADO: Record<string, string> = { inscripto: "bg-sky-50 text-sky-700", cursando: "bg-[var(--ac-suave)] text-[var(--ac-texto)]", aprobado: "bg-emerald-50 text-emerald-700", desaprobado: "bg-amber-50 text-amber-700", baja: "bg-slate-100 text-slate-500" }
const iniciales = (n?: string | null) => (n ?? "?").split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("") || "?"
const Avatar = ({ n }: { n?: string | null }) => <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-full bg-[var(--ac-suave)] text-[var(--ac-texto)] text-xs font-bold flex items-center justify-center">{iniciales(n)}</span>
const Persona = ({ nombre, email, href }: { nombre?: string | null; email?: string | null; href?: string }) => (
  <div className="flex items-center gap-3"><Avatar n={nombre ?? email} /><div className="min-w-0">{href ? <Link href={href} className="font-semibold hover:underline">{nombre ?? email}</Link> : <strong>{nombre ?? email}</strong>}<div className="text-xs text-[#4A515C] truncate">{email}</div></div></div>
)

/** Sistema Academia: quién estudia, quién compró y quién está suscripto. */
export default async function Alumnos({ searchParams }: { searchParams: { v?: string; b?: string} }) {
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
    vista === "compradores" ? q<any>(`select o.id, o.nombre, o.email, coalesce(p.titulo, 'Curso: ' || cu.titulo) titulo, o.monto, o.moneda, o.pagada_en from am_ordenes o
      left join am_productos p on p.id=o.producto_id left join am_cursos cu on cu.id=o.curso_id
      where o.estado='pagada' and ($1::text is null or lower(coalesce(o.nombre,'')||' '||o.email||' '||coalesce(p.titulo, cu.titulo, '')) like $1) order by o.pagada_en desc limit 200`, [like]).catch(() => []) : Promise.resolve([]),
    vista === "suscriptos" ? q<any>(`select id, nombre, email, suscrito_en, tags from db_contactos where suscrito_en is not null and email_estado='activo'
      and ($1::text is null or lower(coalesce(nombre,'')||' '||coalesce(email,'')) like $1) order by suscrito_en desc limit 200`, [like]).catch(() => []) : Promise.resolve([]),
  ])
  const volverA = `/sistema/alumnos?v=${vista}${b ? `&b=${encodeURIComponent(b)}` : ""}`
  const tiles = [
    { t: "Alumnos", v: k?.alumnos, d: `${k?.activos ?? 0} activos en 30 días` },
    { t: "Aprobados", v: k?.aprobados, d: "con certificado" },
    { t: "Compradores", v: k?.compradores, d: "guías y productos pagos" },
    { t: "Suscriptos", v: k?.suscriptos, d: `${k?.nuevos ?? 0} nuevos en 30 días` },
  ]
  const tab = (v: string, t: string) => (
    <Link href={`/sistema/alumnos?v=${v}${b ? `&b=${encodeURIComponent(b)}` : ""}`} aria-current={vista === v ? "page" : undefined} className="no-underline">{t}</Link>
  )
  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab"><div><div className="eyebrow">Academia</div><h1 className="m-0">Alumnos y suscriptos</h1><p>Todo en un solo lugar: quién cursa, quién compró y quién recibe el newsletter.</p></div></header>
      <Kpis datos={tiles.map((x) => ({ t: x.t, v: x.v ?? null, d: x.d }))} />
      <div className="pestanas items-center">
        {tab("alumnos", "Alumnos")}{tab("compradores", "Compradores")}{tab("suscriptos", "Suscriptos")}
        <form className="sm:ml-auto flex gap-2 w-full sm:w-auto"><input type="hidden" name="v" value={vista} /><input name="b" defaultValue={b} placeholder="Buscar nombre, email o curso" aria-label="Buscar" className="inp py-2 w-full sm:w-72" /><button className="btn-s py-2">Buscar</button></form>
      </div>
      <div className="card p-0 overflow-x-auto">
        {vista === "alumnos" && (
          <table className="tbl">
            <thead><tr><th>Alumno</th><th>Curso</th><th>Estado</th><th>Lecciones vistas</th><th>Última actividad</th><th>Inscripción</th><th></th></tr></thead>
            <tbody>
              {(alumnos as any[]).map((r) => (
                <tr key={r.id}><td><Persona nombre={r.nombre} email={r.email} href={ficha ? `https://sistema.devisebit.com/contactos/${r.cid}` : undefined} /></td><td>{r.curso}<div className="text-xs text-[#4A515C]">{r.edicion}</div></td><td><span className={`chip ${COLOR_ESTADO[r.estado] ?? "bg-slate-100 text-slate-600"}`}>{ESTADO[r.estado] ?? r.estado}</span></td><td>{r.lecciones}</td><td>{r.ultima_actividad ? fecha(r.ultima_actividad) : "—"}</td><td>{fecha(r.creado)}</td><td><Eliminar e="inscripcion" id={r.id} volver={volverA} nombre={r.nombre ?? r.email} /></td></tr>
              ))}
              {!(alumnos as any[]).length && <tr><td colSpan={7} className="text-center text-[#4A515C] py-6">Todavía no hay alumnos{b ? " con esa búsqueda" : ""}. Se suman al inscribirse en un curso.</td></tr>}
            </tbody>
          </table>
        )}
        {vista === "compradores" && (
          <table className="tbl">
            <thead><tr><th>Comprador</th><th>Producto</th><th>Importe</th><th>Pagado</th><th></th></tr></thead>
            <tbody>
              {(compradores as any[]).map((r) => (
                <tr key={r.id}><td><Persona nombre={r.nombre} email={r.email} /></td><td>{r.titulo}</td><td>{r.monto != null ? `${r.moneda ?? "ARS"} ${Number(r.monto).toLocaleString("es-AR")}` : "—"}</td><td>{r.pagada_en ? fecha(r.pagada_en) : "—"}</td><td className="text-xs text-[var(--gris)]">Registro de venta</td></tr>
              ))}
              {!(compradores as any[]).length && <tr><td colSpan={5} className="text-center text-[#4A515C] py-6">Todavía no hay compras pagadas{b ? " con esa búsqueda" : ""}.</td></tr>}
            </tbody>
          </table>
        )}
        {vista === "suscriptos" && (
          <table className="tbl">
            <thead><tr><th>Suscripto</th><th>Intereses</th><th>Desde</th><th></th></tr></thead>
            <tbody>
              {(suscriptos as any[]).map((r) => (
                <tr key={r.id}><td><Persona nombre={r.nombre} email={r.email} href={ficha ? `https://sistema.devisebit.com/contactos/${r.id}` : undefined} /></td><td className="text-xs"><div className="flex flex-wrap gap-1">{(r.tags ?? []).slice(0, 4).map((t: string) => <span key={t} className="chip bg-[var(--ac-suave)] text-[var(--ac-texto)]">{t}</span>)}{!(r.tags ?? []).length && "—"}</div></td><td>{fecha(r.suscrito_en)}</td><td><Eliminar e="contacto" id={r.id} volver={volverA} nombre={r.nombre ?? r.email} /></td></tr>
              ))}
              {!(suscriptos as any[]).length && <tr><td colSpan={4} className="text-center text-[#4A515C] py-6">Todavía no hay suscriptos{b ? " con esa búsqueda" : ""}.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
