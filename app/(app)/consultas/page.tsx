import Link from "next/link"
import { requerir, puede } from "@/lib/auth"
import { q } from "@/lib/db"
import { ESTADOS, CANAL, hace, fechaHora } from "@/lib/consultas"
import { borrarConsultas } from "@/lib/consultas-borrar"
import { audit } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import BorrarSeleccion from "@/components/BorrarSeleccion"


export const dynamic = "force-dynamic"

const VISTAS = [
  { v: "bandeja", n: "Sin atender", d: "Nadie del equipo respondió todavía", estados: ["nueva"], c: "border-red-300", t: "text-rojo" },
  { v: "seguimiento", n: "En seguimiento", d: "En conversación o calificadas", estados: ["contactada", "calificada"], c: "border-amber-300", t: "text-amber-700" },
  { v: "convertida", n: "Pasaron al CRM", d: "Ya son contactos comerciales", estados: ["convertida"], c: "border-emerald-300", t: "text-emerald-700" },
  { v: "descartada", n: "Descartadas", d: "No avanzaron", estados: ["descartada"], c: "border-slate-300", t: "text-slate-600" },
]

async function eliminar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const ids = fd.getAll("ids").map(Number)
  const n = await borrarConsultas(ids).catch(() => -1)
  if (n > 0) await audit(u, "elimina_consultas", "consulta", ids.join(","), `${n} consultas`)
  revalidatePath("/consultas")
  redirect(n < 0 ? "/consultas?borr=error" : `/consultas?borr=${n}`)
}

export default async function Consultas({ searchParams }: { searchParams: { v?: string; b?: string; e?: string; borr?: string } }) {
  const u = await requerir()
  const emp = "devisebit"
  const qs = (x: Record<string, string>) => "?" + new URLSearchParams(x).toString()
  const cuenta = await q<{ estado: string; n: number }>("select estado, count(*)::int n from consultas where empresa=$1 group by estado", [emp])
  const n = Object.fromEntries(cuenta.map((c) => [c.estado, c.n]))
  const total = (est: string[]) => est.reduce((a, e) => a + (n[e] ?? 0), 0)
  const vista = VISTAS.find((x) => x.v === searchParams.v) ?? (searchParams.v === "todas" ? null : total(["nueva"]) ? VISTAS[0] : VISTAS[1])
  const b = (searchParams.b ?? "").trim()
  const rows = await q<any>(
    `select k.*, (select m.autor from wa_mensajes m where m.empresa=k.empresa and m.wa_id=coalesce(k.chat_id, regexp_replace(coalesce(k.telefono,''),'[^0-9]','','g')) and m.autor<>'cliente' order by m.creado desc limit 1) respondio
     from consultas k
     where empresa=$3 and ($1::text[] is null or estado = any($1))
       and ($2 = '' or nombre ilike '%'||$2||'%' or organizacion ilike '%'||$2||'%' or email ilike '%'||$2||'%' or telefono ilike '%'||$2||'%' or mensaje ilike '%'||$2||'%')
     order by creado desc limit 300`,
    [vista ? vista.estados : null, b, emp],
  )
  const ed = puede.editar(u)
  const adm = puede.admin(u)
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">Conversaciones</h1>
          <p className="m-0 text-sm text-[#4A515C]">Todo lo que entra por WhatsApp, Instagram y la web, con el bot respondiendo, hasta que pasa al CRM.</p>
        </div>
        {ed && <div className="flex flex-wrap gap-2 items-start"><Link href="/consultas/nueva" className="btn-p">+ Nueva consulta</Link></div>}
      </div>

      {searchParams.borr && <p className="m-0 text-sm text-[#9E1A17]">{searchParams.borr === "error" ? "No se pudo eliminar. Probá de nuevo." : `Se eliminaron ${searchParams.borr} consulta${searchParams.borr === "1" ? "" : "s"}.`}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {VISTAS.map((x) => {
          const activa = vista?.v === x.v
          return (
            <Link key={x.v} href={`/consultas${qs({ v: x.v })}`} className={`card flex flex-col gap-0.5 border-2 transition-colors ${activa ? x.c + " shadow-sm" : "border-transparent hover:border-[#C3C8D1]"}`}>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">{x.n}</span>
              <span className={`text-3xl font-extrabold ${x.t}`}>{total(x.estados)}</span>
              <span className="text-xs text-[#4A515C]">{x.d}</span>
            </Link>
          )
        })}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[#E2E5EA]">
          <h2 className="m-0 text-base">{vista ? vista.n : "Todas las consultas"} <span className="text-[#4A515C] font-normal">· {rows.length}</span></h2>
          <form role="search" className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
            {vista && <input type="hidden" name="v" value={vista.v} />}
            <input name="b" type="search" defaultValue={b} placeholder="Buscar nombre, organización o teléfono" aria-label="Buscar consultas por nombre, organización o teléfono" className="inp py-1.5 w-full sm:w-64" />
            <button className="btn-s py-1.5">Buscar</button>
            {vista && <Link href={`/consultas${qs({ v: "todas" })}`} className="text-sm underline text-[#4A515C] whitespace-nowrap">Ver todas</Link>}
          </form>
        </div>
        {adm && <form id="f-eliminar" action={eliminar} />}
        {adm && <BorrarSeleccion form="f-eliminar" singular="consulta" plural="consultas" aviso="Se borran también su chat, mensajes y reuniones; el contacto del CRM queda." />}
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr>{adm && <th></th>}<th>Entró</th><th>Estado</th><th>Quién consulta</th><th>Organización</th><th>Motivo</th><th>Canal y origen</th><th>Responsable</th><th></th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const est = ESTADOS.find((e) => e.v === c.estado)!
                const demora = c.estado === "nueva" && Date.now() - new Date(c.creado).getTime() > 4 * 3600e3
                return (
                  <tr key={c.id} className={`hover:bg-[#F8F9FB] ${c.estado === "nueva" ? "font-semibold" : ""}`}>
                    {adm && <td><input type="checkbox" name="ids" value={c.id} form="f-eliminar" className="sel-fila" aria-label="Marcar" /></td>}
                    <td className="whitespace-nowrap">{fechaHora(c.creado)}<div className={`text-xs font-normal ${demora ? "text-rojo font-semibold" : "text-[#4A515C]"}`}>{hace(c.creado)}</div></td>
                    <td><span className={`chip whitespace-nowrap ${est.c}`}>{est.n}</span>{c.estado === "nueva" && c.respondio && <div className="text-xs font-normal text-[#4A515C] mt-1 whitespace-nowrap">{c.respondio === "bot" ? "El bot ya respondió" : "El equipo ya escribió"}</div>}{c.necesita_humano && c.estado !== "descartada" && <div><span className="chip whitespace-nowrap bg-red-600 text-white mt-1">Quiere una persona</span></div>}</td>
                    <td><Link href={`/consultas/${c.id}`} className="hover:underline">{c.nombre ?? "Sin nombre"}</Link><div className="text-xs font-normal text-[#4A515C]">{c.telefono ?? ""}</div></td>
                    <td>{c.organizacion ?? "—"}<div className="text-xs font-normal text-[#4A515C]">{c.email ?? ""}</div></td>
                    <td className="font-normal">{c.motivo ?? "—"}</td>
                    <td className="font-normal">{CANAL[c.canal] ?? c.canal}{c.fuente && <div className={`text-xs ${/Ads/.test(c.fuente) ? "text-[#C8231F] font-semibold" : "text-[#4A515C]"}`}>{c.fuente}{c.campania ? ` · ${c.campania}` : ""}</div>}</td>
                    <td className="font-normal">{c.asignado ?? <span className="text-[#4A515C]">Sin asignar</span>}</td>
                    <td><Link href={`/consultas/${c.id}`} className="btn-s py-1 px-3 text-xs">Abrir</Link></td>
                  </tr>
                )
              })}
              {!rows.length && <tr><td colSpan={9} className="text-[#4A515C] py-6 text-center">No hay consultas en esta vista.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
