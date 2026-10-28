import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { q, audit } from "@/lib/db"
import { requerir, puede } from "@/lib/auth"
import { ETAPAS, SECTORES, CLASES, etapa, clase as claseDe, esClase } from "@/lib/crm"
import { fecha } from "@/lib/util"
import Importar from "@/components/Importar"
import ContactosTabla from "@/components/ContactosTabla"

export const dynamic = "force-dynamic"

/** Cambios en lote: editar etapa, sector o próximo paso, o eliminar varios contactos. */
async function masivo(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const ids = String(fd.get("ids") ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 1000)
  const op = String(fd.get("op") ?? "")
  if (!ids.length) redirect("/contactos")
  if (op === "eliminar") {
    // Los proyectos, reuniones y envíos de email se conservan, sin contacto asociado.
    await q("update db_proyectos set contacto_id=null where contacto_id = any($1::int[])", [ids])
    await q("update db_reuniones set contacto_id=null where contacto_id = any($1::int[])", [ids])
    await q("update em_envios set contacto_id=null where contacto_id = any($1::int[])", [ids])
    const r = await q<{ id: number }>("delete from db_contactos where id = any($1::int[]) returning id", [ids])
    await audit(u, "elimina_contactos_db", "db_contacto", r.map((x) => x.id).join(","), `${r.length} contactos`)
    revalidatePath("/contactos")
    redirect(`/contactos?msg=eliminados&n=${r.length}`)
  }
  if (op === "editar") {
    const cl = String(fd.get("clase") ?? "")
    if (esClase(cl) || cl === "__ninguna") {
      await q("update db_contactos set clase=$2, clasificado_en=now(), clasificado_por=$3, actualizado=now() where id = any($1::int[])", [ids, cl === "__ninguna" ? null : cl, u.nombre])
      await audit(u, "clasifica_contactos", "db_contacto", ids.join(","), `${ids.length} → ${cl}`)
    }
    const et = String(fd.get("etapa") ?? "")
    const sector = String(fd.get("sector") ?? "").trim()
    const proximo = String(fd.get("proximo") ?? "").trim().slice(0, 300)
    const pf = String(fd.get("proximo_fecha") ?? "").trim()
    const r = await q<{ id: number }>(
      `update db_contactos set
         etapa = coalesce($2, etapa),
         sector = coalesce($3, sector),
         proximo = coalesce($4, proximo),
         proximo_fecha = coalesce($5::date, proximo_fecha),
         actualizado = now()
       where id = any($1::int[]) returning id`,
      [ids, ETAPAS.some((e) => e.v === et) ? et : null, SECTORES.includes(sector) ? sector : null, proximo || null, /^\d{4}-\d{2}-\d{2}$/.test(pf) ? pf : null],
    )
    await audit(u, "edita_contactos_db_lote", "db_contacto", r.map((x) => x.id).join(","), [et && `etapa=${et}`, sector && `sector=${sector}`, proximo && "proximo", pf && `fecha=${pf}`].filter(Boolean).join(" "))
    revalidatePath("/contactos")
    redirect(`/contactos?msg=editados&n=${r.length}`)
  }
  redirect("/contactos")
}

export default async function Contactos({ searchParams }: { searchParams: { etapa?: string; b?: string; msg?: string; n?: string; lista?: string } }) {
  const u = await requerir()
  const et = ETAPAS.some((e) => e.v === searchParams.etapa) ? searchParams.etapa! : null
  const lista = esClase(searchParams.lista) ? searchParams.lista : null
  const b = (searchParams.b ?? "").trim()
  const cuentas = await q<{ clase: string | null; n: number }>("select clase, count(*)::int n from db_contactos group by clase")
  const cuenta = (v: string | null) => cuentas.find((x) => x.clase === v)?.n ?? 0
  const rows = await q<any>(
    `select c.*, (select count(*)::int from db_proyectos p where p.contacto_id=c.id) proyectos from db_contactos c
     where c.clase is not null and (case when $3::text is null then c.clase<>'descartado' else c.clase=$3 end)
       and ($1::text is null or etapa=$1)
       and ($2='' or nombre ilike '%'||$2||'%' or organizacion ilike '%'||$2||'%' or email ilike '%'||$2||'%' or telefono ilike '%'||$2||'%')
     order by actualizado desc limit 500`,
    [et, b, lista],
  )
  const filas = rows.map((c) => ({
    id: c.id, organizacion: c.organizacion, nombre: c.nombre, cargo: c.cargo, email: c.email, telefono: c.telefono,
    etapa: c.etapa, etapaN: etapa(c.etapa).n, etapaC: etapa(c.etapa).c, sector: c.sector, proximo: c.proximo,
    proximoF: c.proximo_fecha ? fecha(c.proximo_fecha) : null, proyectos: c.proyectos,
    claseN: lista ? null : claseDe(c.clase)?.n ?? null, claseC: claseDe(c.clase)?.c ?? null,
  }))
  const qs = (o: Record<string, string | null>) => { const p = new URLSearchParams(); for (const [k, v] of Object.entries(o)) if (v) p.set(k, v); const t = p.toString(); return `/contactos${t ? `?${t}` : ""}` }
  const sinClasificar = cuenta(null)
  const n = Number(searchParams.n ?? 0)
  const aviso = searchParams.msg === "eliminados" ? `Se eliminaron ${n} contacto${n === 1 ? "" : "s"}.` : searchParams.msg === "editados" ? `Se actualizaron ${n} contacto${n === 1 ? "" : "s"}.` : null
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="m-0">Contactos</h1><p className="m-0 text-sm text-[#4A515C]">Cada contacto en su lista: clientes, oportunidades, email marketing, alumnos y red. Lo nuevo sin ubicar queda en «Por clasificar».</p></div>
        <Link href="/contactos/clasificar" className={`btn py-2 ${sinClasificar ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-white border border-[#C3C8D1]"}`}>Por clasificar <span className="chip bg-white/90 text-[#0E1116]">{sinClasificar}</span></Link>
      </div>
      <nav aria-label="Listas" className="flex flex-wrap gap-1.5">
        <Link href={qs({ b: b || null })} aria-current={!lista ? "page" : undefined} className={`chip text-sm px-3 py-1.5 border ${!lista ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>Todas · {cuentas.filter((x) => x.clase && x.clase !== "descartado").reduce((a, x) => a + x.n, 0)}</Link>
        {CLASES.map((x) => <Link key={x.v} href={qs({ lista: x.v, b: b || null })} aria-current={lista === x.v ? "page" : undefined} title={x.d} className={`chip text-sm px-3 py-1.5 border ${lista === x.v ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>{x.n} · {cuenta(x.v)}</Link>)}
      </nav>
      {aviso && <p role="status" className="m-0 text-sm font-semibold text-[#C8231F]">{aviso}</p>}
      <div className="card p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#E2E5EA]">
        <div className="flex flex-wrap gap-1.5">
          <Link href={qs({ lista })} className={`chip text-sm px-3 py-1 border ${!et ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>Todos</Link>
          {ETAPAS.map((e) => <Link key={e.v} href={qs({ lista, etapa: e.v })} className={`chip text-sm px-3 py-1 border ${et === e.v ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>{e.n}</Link>)}
        </div>
        <div className="flex gap-2 items-center">
          <form className="flex gap-2">{et && <input type="hidden" name="etapa" value={et} />}{lista && <input type="hidden" name="lista" value={lista} />}<input name="b" defaultValue={b} placeholder="Buscar" className="inp py-1.5 w-48" /><button className="btn-s py-1.5">Buscar</button></form>
          <Importar ent="contactos" ayuda="Reconozco las columnas por su nombre (Nombre, Email, Organización, Cargo, Teléfono, Sector, Etapa, Notas…). Si el email ya existe, se completa el contacto; si no, se crea. Lo que no traiga etapa queda como «En la base». Lo importado entra en «Por clasificar» para que lo ubiques en su lista." /><a href="/api/crm/contactos?formato=csv" className="btn-s py-1.5">Exportar</a>
          <Link href="/contactos/nuevo" className="btn-p py-1.5">+ Nuevo</Link>
        </div>
      </div>
      {puede.editar(u) && rows.length > 0 && <p className="m-0 px-5 pt-3 text-xs text-[#4A515C]">Tildá los contactos (o el casillero del encabezado para elegir todos los de la lista) para cambiarles la etapa, el sector o el próximo paso, o para eliminarlos.</p>}
      <ContactosTabla clases={CLASES.map((x) => ({ v: x.v, n: x.n }))} filas={filas} etapas={ETAPAS.map((e) => ({ v: e.v, n: e.n }))} sectores={SECTORES} editar={puede.editar(u)} accion={masivo} />
    </div>
    </div>
  )
}
