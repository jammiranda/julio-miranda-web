import Link from "next/link"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
import { CAT_DOC } from "@/lib/gestion"
import { TablaRegistro, Aviso, Kpi } from "@/components/Registro"

export const dynamic = "force-dynamic"

type SP = { cat?: string; b?: string; editar?: string; nuevo?: string; ok?: string; error?: string }

export default async function Documentos({ searchParams: sp }: { searchParams: SP }) {
  const u = await requerir()
  const edita = u.rol === "gerente" || u.rol === "coordinacion"
  const cat = CAT_DOC.some((c) => c.v === sp.cat) ? sp.cat! : null
  const b = (sp.b ?? "").trim()
  const [docs, cuenta] = await Promise.all([
    q<any>(
      `select * from g_documentos where ($1::bool or not confidencial) and ($2::text is null or categoria=$2)
       and ($3::text = '' or titulo ilike '%'||$3||'%' or coalesce(descripcion,'') ilike '%'||$3||'%')
       order by actualizado desc`, [edita, cat, b]),
    q<{ categoria: string; n: number }>("select categoria, count(*)::int n from g_documentos where ($1::bool or not confidencial) group by 1", [edita]),
  ])
  const N = Object.fromEntries(cuenta.map((c) => [c.categoria, c.n]))
  const total = cuenta.reduce((a, c) => a + c.n, 0)
  const params = new URLSearchParams({ ...(cat ? { cat } : {}), ...(b ? { b } : {}) }).toString()
  const volver = `/documentos${params ? `?${params}` : ""}`

  return (
    <div className="flex flex-col gap-5">
      <header className="pag-cab">
        <div><div className="eyebrow">Gestión</div><h1 className="m-0">Documentos</h1><p>Todo lo que DEVISEBIT tiene escrito, en un solo lugar: institucional, propuestas, contratos, papeles contables, documentación técnica y plantillas.</p></div>
        {edita && <div className="pag-acc"><Link href={`${volver}${params ? "&" : "?"}nuevo=1`} className="btn-p">+ Documento</Link></div>}
      </header>
      <Aviso ok={sp.ok} error={sp.error} />

      <section aria-label="Categorías" className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {CAT_DOC.map((c) => (
          <Link key={c.v} href={cat === c.v ? "/documentos" : `/documentos?cat=${c.v}`} aria-current={cat === c.v ? "true" : undefined}
            className={`card card-link !p-3.5 flex flex-col gap-2 min-w-0 transition-shadow ${cat === c.v ? "!border-[var(--ac)] ring-2 ring-[var(--ac-anillo)]" : ""}`}>
            <span className={`chip self-start ${c.c}`}>{c.n}</span>
            <span className="text-2xl font-extrabold tabular-nums">{N[c.v] ?? 0}</span>
          </Link>
        ))}
      </section>

      <form action="/documentos" className="flex flex-wrap gap-2 items-center">
        {cat && <input type="hidden" name="cat" value={cat} />}
        <label htmlFor="b" className="sr-only">Buscar documento</label>
        <input id="b" name="b" defaultValue={b} placeholder="Buscar por nombre o descripción" className="inp !w-auto flex-1 min-w-[220px]" />
        <button className="btn-s">Buscar</button>
        {(cat || b) && <Link href="/documentos" className="text-sm underline text-[var(--gris)]">Ver todo ({total})</Link>}
      </form>

      <TablaRegistro clave="documentos" filas={docs} volver={volver} editar={Number(sp.editar) || null} nuevo={!!sp.nuevo} puedeEditar={edita}
        vacio={b || cat ? "No hay documentos con ese filtro." : "Todavía no hay documentos. Subí cada archivo a Drive y pegá el link acá: así el equipo encuentra la última versión sin buscar en chats."} />
      {!edita && <p className="m-0 text-xs text-[var(--gris)]">Los documentos confidenciales solo los ven Dirección y Coordinación.</p>}
    </div>
  )
}
