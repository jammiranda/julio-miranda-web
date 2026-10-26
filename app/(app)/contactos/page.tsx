import Link from "next/link"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { q, audit } from "@/lib/db"
import { requerir, puede } from "@/lib/auth"
import { ETAPAS, SECTORES, etapa } from "@/lib/crm"
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

export default async function Contactos({ searchParams }: { searchParams: { etapa?: string; b?: string; msg?: string; n?: string } }) {
  const u = await requerir()
  const et = ETAPAS.some((e) => e.v === searchParams.etapa) ? searchParams.etapa! : null
  const b = (searchParams.b ?? "").trim()
  const rows = await q<any>(
    `select c.*, (select count(*)::int from db_proyectos p where p.contacto_id=c.id) proyectos from db_contactos c
     where ($1::text is null or etapa=$1)
       and ($2='' or nombre ilike '%'||$2||'%' or organizacion ilike '%'||$2||'%' or email ilike '%'||$2||'%' or telefono ilike '%'||$2||'%')
     order by actualizado desc limit 500`,
    [et, b],
  )
  const filas = rows.map((c) => ({
    id: c.id, organizacion: c.organizacion, nombre: c.nombre, cargo: c.cargo, email: c.email, telefono: c.telefono,
    etapa: c.etapa, etapaN: etapa(c.etapa).n, etapaC: etapa(c.etapa).c, sector: c.sector, proximo: c.proximo,
    proximoF: c.proximo_fecha ? fecha(c.proximo_fecha) : null, proyectos: c.proyectos,
  }))
  const n = Number(searchParams.n ?? 0)
  const aviso = searchParams.msg === "eliminados" ? `Se eliminaron ${n} contacto${n === 1 ? "" : "s"}.` : searchParams.msg === "editados" ? `Se actualizaron ${n} contacto${n === 1 ? "" : "s"}.` : null
  return (
    <div className="flex flex-col gap-4">
      <div><h1 className="m-0">Contactos</h1><p className="m-0 text-sm text-[#4A515C]">Personas y organizaciones con las que DEVISEBIT conversa, de la primera consulta al cliente ganado.</p></div>
      {aviso && <p role="status" className="m-0 text-sm font-semibold text-[#C8231F]">{aviso}</p>}
      <div className="card p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#E2E5EA]">
        <div className="flex flex-wrap gap-1.5">
          <Link href="/contactos" className={`chip text-sm px-3 py-1 border ${!et ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>Todos</Link>
          {ETAPAS.map((e) => <Link key={e.v} href={`/contactos?etapa=${e.v}`} className={`chip text-sm px-3 py-1 border ${et === e.v ? "bg-[#0E1116] text-white border-[#0E1116]" : "bg-white border-[#C3C8D1]"}`}>{e.n}</Link>)}
        </div>
        <div className="flex gap-2 items-center">
          <form className="flex gap-2">{et && <input type="hidden" name="etapa" value={et} />}<input name="b" defaultValue={b} placeholder="Buscar" className="inp py-1.5 w-48" /><button className="btn-s py-1.5">Buscar</button></form>
          <Importar ent="contactos" ayuda="Reconozco las columnas por su nombre (Nombre, Email, Organización, Cargo, Teléfono, Sector, Etapa, Notas…). Si el email ya existe, se completa el contacto; si no, se crea. Lo que no traiga etapa queda como «En la base»." /><a href="/api/crm/contactos?formato=csv" className="btn-s py-1.5">Exportar</a>
          <Link href="/contactos/nuevo" className="btn-p py-1.5">+ Nuevo</Link>
        </div>
      </div>
      {puede.editar(u) && rows.length > 0 && <p className="m-0 px-5 pt-3 text-xs text-[#4A515C]">Tildá los contactos (o el casillero del encabezado para elegir todos los de la lista) para cambiarles la etapa, el sector o el próximo paso, o para eliminarlos.</p>}
      <ContactosTabla filas={filas} etapas={ETAPAS.map((e) => ({ v: e.v, n: e.n }))} sectores={SECTORES} editar={puede.editar(u)} accion={masivo} />
    </div>
    </div>
  )
}
