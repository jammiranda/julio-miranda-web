import Link from "next/link"
import { q } from "@/lib/db"
import { ETAPAS, etapa } from "@/lib/devisebit"
import { fecha } from "@/lib/util"

export const dynamic = "force-dynamic"

export default async function Contactos({ searchParams }: { searchParams: { etapa?: string; b?: string } }) {
  const et = ETAPAS.some((e) => e.v === searchParams.etapa) ? searchParams.etapa! : null
  const b = (searchParams.b ?? "").trim()
  const rows = await q<any>(
    `select c.*, (select count(*)::int from db_proyectos p where p.contacto_id=c.id) proyectos from db_contactos c
     where ($1::text is null or etapa=$1)
       and ($2='' or nombre ilike '%'||$2||'%' or organizacion ilike '%'||$2||'%' or email ilike '%'||$2||'%' or telefono ilike '%'||$2||'%')
     order by actualizado desc limit 500`,
    [et, b],
  )
  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#E1E6E3]">
        <div className="flex flex-wrap gap-1.5">
          <Link href="/devisebit/contactos" className={`chip text-sm px-3 py-1 border ${!et ? "bg-[#26323E] text-white border-[#26323E]" : "bg-white border-[#C9D3CD]"}`}>Todos</Link>
          {ETAPAS.map((e) => <Link key={e.v} href={`/devisebit/contactos?etapa=${e.v}`} className={`chip text-sm px-3 py-1 border ${et === e.v ? "bg-[#26323E] text-white border-[#26323E]" : "bg-white border-[#C9D3CD]"}`}>{e.n}</Link>)}
        </div>
        <div className="flex gap-2 items-center">
          <form className="flex gap-2">{et && <input type="hidden" name="etapa" value={et} />}<input name="b" defaultValue={b} placeholder="Buscar" className="inp py-1.5 w-48" /><button className="btn-s py-1.5">Buscar</button></form>
          <a href="/api/devisebit/contactos?formato=csv" className="btn-s py-1.5">Exportar</a>
          <Link href="/devisebit/contactos/nuevo" className="btn-p py-1.5">+ Nuevo</Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Organización</th><th>Contacto</th><th>Etapa</th><th>Sector</th><th>Próximo paso</th><th>Proyectos</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-[#F7FAF8]">
                <td className="font-semibold"><Link href={`/devisebit/contactos/${c.id}`} className="hover:underline">{c.organizacion ?? "—"}</Link></td>
                <td>{c.nombre}<div className="text-xs text-[#4F5C69]">{[c.cargo, c.email, c.telefono].filter(Boolean).join(" · ")}</div></td>
                <td><span className={`chip ${etapa(c.etapa).c}`}>{etapa(c.etapa).n}</span></td>
                <td>{c.sector ?? "—"}</td>
                <td>{c.proximo ?? "—"}{c.proximo_fecha && <div className="text-xs text-[#4F5C69]">{fecha(c.proximo_fecha)}</div>}</td>
                <td>{c.proyectos || "—"}</td>
                <td><Link href={`/devisebit/contactos/${c.id}`} className="btn-s py-1 px-3 text-xs">Abrir</Link></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="text-center text-[#4F5C69] py-6">No hay contactos{et || b ? " con ese filtro" : " todavía"}.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
