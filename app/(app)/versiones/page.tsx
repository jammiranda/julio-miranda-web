import { readFile } from "fs/promises"
import path from "path"
import { requerir } from "@/lib/auth"
import Indice from "@/components/Indice"

export const dynamic = "force-dynamic"
export const metadata = { title: "Versiones" }

/* La fuente es content/versiones.md: una tarea diaria lo actualiza con lo publicado. Esta pantalla solo le da forma. */

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const enLinea = (t: string) =>
  esc(t)
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/`([^`]+)`/g, '<code class="rounded bg-[var(--sup-2)] px-1 text-[.85em] break-all">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
const H = ({ t, as: As = "span", className }: { t: string; as?: any; className?: string }) => <As className={className} dangerouslySetInnerHTML={{ __html: enLinea(t) }} />
const celdas = (l: string) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim())
const ancla = (t: string) => t.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().toLowerCase().replace(/[\s_]+/g, "-")
const limpio = (t: string) => t.replace(/\*/g, "")

type Bloque =
  | { k: "h2"; t: string; n: number }
  | { k: "h3"; t: string; dir: string }
  | { k: "p"; t: string }
  | { k: "lista"; ord: boolean; items: string[] }
  | { k: "codigo"; t: string }
  | { k: "tabla"; cab: string[]; filas: string[][] }

function leer(md: string) {
  const L = md.split("\n")
  const bloques: Bloque[] = []
  let bajada = "", i = 0, visto = false
  while (i < L.length) {
    const l = L[i]
    if (l.startsWith("# ")) { i++; continue }
    if (l.trim() === "---" || !l.trim()) { i++; continue }
    if (!bajada && !visto && !l.startsWith("#")) { bajada = l.trim(); i++; continue }
    if (l.startsWith("## ")) { visto = true; const m = l.slice(3).trim().match(/^(\d+)\.\s*(.*)$/); bloques.push({ k: "h2", t: m ? m[2] : l.slice(3).trim(), n: m ? Number(m[1]) : 0 }); i++; continue }
    if (l.startsWith("### ")) { const [nom, dir = ""] = l.slice(4).trim().replace(/^\d+\.\d+\s*/, "").split(" — "); bloques.push({ k: "h3", t: nom, dir }); i++; continue }
    if (l.startsWith("```")) { const b: string[] = []; i++; while (i < L.length && !L[i].startsWith("```")) b.push(L[i++]); i++; bloques.push({ k: "codigo", t: b.join("\n") }); continue }
    if (l.startsWith("|")) { const t: string[] = []; while (i < L.length && L[i].startsWith("|")) t.push(L[i++]); bloques.push({ k: "tabla", cab: celdas(t[0]), filas: t.slice(2).map(celdas) }); continue }
    if (/^(\d+\.|-)\s+/.test(l)) { const ord = /^\d+\./.test(l); const it: string[] = []; while (i < L.length && /^(\d+\.|-)\s+/.test(L[i])) it.push(L[i++].replace(/^(\d+\.|-)\s+/, "")); bloques.push({ k: "lista", ord, items: it }); continue }
    bloques.push({ k: "p", t: l.trim() }); i++
  }
  return { bajada, bloques }
}

const TIPO = (t: string) => {
  const x = t.toLowerCase()
  return x.includes("seguridad") ? "bg-red-50 text-red-800" : x.includes("novedad") ? "bg-emerald-50 text-emerald-800" : x.includes("mejora") ? "bg-sky-50 text-sky-800" : "bg-amber-50 text-amber-800"
}

function Vinetas({ t }: { t: string }) {
  const p = t.split("<br>").map((x) => x.trim()).filter(Boolean)
  if (p.length && p.every((x) => x.startsWith("•"))) return <ul className="m-0 mt-1.5 pl-5 list-disc flex flex-col gap-1 max-w-[72ch]">{p.map((x, k) => <H key={k} as="li" t={x.replace(/^•\s*/, "")} />)}</ul>
  return <H as="p" className="m-0 mt-1.5 max-w-[72ch]" t={t} />
}

export default async function Versiones() {
  await requerir()
  const md = await readFile(path.join(process.cwd(), "content", "versiones.md"), "utf8").catch(() => "")
  if (!md) return <div className="card"><h1 className="m-0 text-xl">Versiones</h1><p className="mb-0">No se pudo leer el documento de versiones. Avisale a Dirección.</p></div>
  const { bajada, bloques } = leer(md)
  const productos = bloques.filter((b): b is Extract<Bloque, { k: "h3" }> => b.k === "h3")
  let seccion = 0, estadoHecho = false
  const antes: JSX.Element[] = [], tecnico: JSX.Element[] = []

  bloques.forEach((b, k) => {
    if (b.k === "h2") seccion = b.n
    const a = seccion >= 6 ? tecnico : antes
    if (b.k === "h2") a.push(<h2 key={k} id={ancla(b.t)} className="m-0 mt-4 text-xl scroll-mt-28">{b.t}</h2>)
    else if (b.k === "h3") a.push(<div key={k} id={ancla(b.t)} className="mt-4 scroll-mt-28"><h3 className="m-0 text-lg">{b.t}</h3>{b.dir && <p className="m-0 text-sm text-[#4A515C] break-words">{b.dir}</p>}</div>)
    else if (b.k === "p") a.push(<H key={k} as="p" className="m-0 max-w-[72ch]" t={b.t} />)
    else if (b.k === "lista") { const Tag: any = b.ord ? "ol" : "ul"; a.push(<Tag key={k} className={`m-0 pl-6 max-w-[72ch] flex flex-col gap-1 ${b.ord ? "list-decimal" : "list-disc"}`}>{b.items.map((x, j) => <H key={j} as="li" t={x} />)}</Tag>) }
    else if (b.k === "codigo") a.push(<div key={k} className="overflow-x-auto"><pre className="m-0 card text-xs leading-relaxed">{b.t}</pre></div>)
    else if (seccion === 1 && !estadoHecho) {
      estadoHecho = true
      a.push(
        <div key={k} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {b.filas.map((f, j) => (
            <a key={j} href={`#${ancla(f[0])}`} className="card flex flex-col gap-1 no-underline text-inherit min-w-0">
              <span className="flex items-baseline justify-between gap-3"><strong>{f[0]}</strong><span className="font-mono font-bold text-lg tabular-nums text-[var(--ac-texto)]">{limpio(f[2] ?? "")}</span></span>
              <span className="text-xs text-[#4A515C] break-words">{f[1]}</span>
              <span className="text-sm"><strong className="tabular-nums">{f[3]}</strong> · <H t={f[4] ?? ""} /></span>
            </a>
          ))}
        </div>,
      )
    } else if (b.cab[0]?.toLowerCase().startsWith("versi")) {
      a.push(
        <ol key={k} className="m-0 p-0 list-none flex flex-col gap-4 border-l-2 border-[var(--borde)]">
          {b.filas.map((f, j) => (
            <li key={j} className="pl-4 min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><span className="font-mono font-bold tabular-nums">{limpio(f[0])}</span><span className="text-sm text-[#4A515C] tabular-nums">{f[1]}</span><span className={`chip ${TIPO(f[3] ?? "")}`}>{f[3]}</span></div>
              <Vinetas t={f[2] ?? ""} />
              <p className="m-0 mt-1 text-xs text-[#4A515C]">Rastro: <H t={f[4] ?? ""} /></p>
            </li>
          ))}
        </ol>,
      )
    } else {
      a.push(
        <div key={k} className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead><tr>{b.cab.map((c, j) => <th key={j} className="text-left text-xs uppercase tracking-wide text-[#4A515C] font-semibold px-3 py-2 border-b border-[var(--borde)]">{c}</th>)}</tr></thead>
            <tbody>{b.filas.map((f, j) => <tr key={j}>{f.map((c, m) => <H key={m} as="td" className="align-top px-3 py-2 border-b border-[var(--borde)] tabular-nums" t={c} />)}</tr>)}</tbody>
          </table>
        </div>,
      )
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <header className="pag-cab">
        <div><div className="eyebrow">Ajustes</div><h1 className="m-0">Versiones</h1><H as="p" t={bajada} /></div>
      </header>
      <Indice filtra="tbody tr" placeholder="Buscar un cambio o una versión" />
      <nav aria-label="Productos" className="flex flex-wrap gap-2">
        {productos.map((p) => <a key={p.t} href={`#${ancla(p.t)}`} className="chip bg-[var(--sup-2)] text-[var(--ac-texto)] no-underline border border-[var(--borde)]">{p.t}</a>)}
      </nav>
      {antes}
      {tecnico.length > 0 && <details className="card mt-4"><summary className="cursor-pointer font-semibold">Datos técnicos (para quien mantiene el sistema)</summary><div className="mt-3 flex flex-col gap-3">{tecnico}</div></details>}
    </div>
  )
}
