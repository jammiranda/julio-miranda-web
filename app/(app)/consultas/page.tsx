import Link from "next/link"
import { requerir, puede } from "@/lib/auth"
import { q } from "@/lib/db"
import { ESTADOS, CANAL, PASO_AL_CRM, hace, fechaHora } from "@/lib/consultas"
import { borrarConsultas } from "@/lib/consultas-borrar"
import { audit } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { pasarAlCRM } from "@/lib/consultas-crm"
import AccionesSeleccion from "@/components/AccionesSeleccion"


export const dynamic = "force-dynamic"

/** «Pasaron al CRM» no es un estado: son las que tienen contacto comercial (PASO_AL_CRM). Una conversación puede estar ahí y, a la vez, en «Sin atender» o «En seguimiento». */
const VISTAS: { v: string; n: string; d: string; estados: string[]; crm?: boolean; c: string; t: string }[] = [
  { v: "bandeja", n: "Sin atender", d: "Nadie del equipo respondió todavía", estados: ["nueva"], c: "border-red-300", t: "text-rojo" },
  { v: "seguimiento", n: "En seguimiento", d: "En conversación o calificadas", estados: ["contactada", "calificada"], c: "border-amber-300", t: "text-amber-700" },
  { v: "convertida", n: "Pasaron al CRM", d: "Ya son contactos comerciales. No quiere decir ganadas", estados: ["convertida"], crm: true, c: "border-emerald-300", t: "text-emerald-700" },
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

/** Pasa las marcadas al CRM (las que ya tienen contacto se saltean) y vuelve a la misma vista con el resultado. */
async function alCRMVarias(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const ids = fd.getAll("ids").map(Number)
  const r = await pasarAlCRM(ids).catch(() => null)
  if (r?.pasadas) await audit(u, "consultas_al_crm", "consulta", ids.join(",").slice(0, 500), `${r.pasadas} pasadas, ${r.yaEstaban} ya estaban, ${r.sinDatos} sin datos`)
  revalidatePath("/consultas")
  redirect("/consultas?" + new URLSearchParams({ ...volver(fd), ...(r ? { crm: `${r.pasadas}-${r.yaEstaban}-${r.sinDatos}` } : { crm: "error" }) }).toString())
}

/** Marca varias como descartadas: lo mismo que elegir «Descartada» en el seguimiento de cada una. */
async function descartar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const ids = [...new Set(fd.getAll("ids").map(Number).filter((n) => Number.isInteger(n) && n > 0))]
  const r = ids.length ? await q<{ id: number }>("update consultas set estado='descartada', actualizado=now() where id = any($1::int[]) and empresa='devisebit' and estado<>'descartada' returning id", [ids]).catch(() => null) : []
  for (const x of r ?? []) await audit(u, "estado_consulta", "consulta", x.id, "descartada")
  revalidatePath("/consultas")
  redirect("/consultas?" + new URLSearchParams({ ...volver(fd), desc: r ? String(r.length) : "error" }).toString())
}

/** Vista y búsqueda desde las que se hizo la acción, para volver al mismo lugar. */
const volver = (fd: FormData) => Object.fromEntries((["v", "b"] as const).map((k) => [k, String(fd.get(k) ?? "")]).filter(([, x]) => x))

const pl = (n: number, uno: string, varias: string) => `${n} ${n === 1 ? uno : varias}`
/** «3-1-0» → «Pasaron al CRM 3 consultas. 1 ya estaba en el CRM.» */
function avisoCRM(x: string) {
  if (x === "error") return "No se pudieron pasar al CRM. Probá de nuevo."
  const [p, y, sd] = x.split("-").map((n) => Number(n) || 0)
  return [
    p ? `${p === 1 ? "Pasó" : "Pasaron"} al CRM ${pl(p, "consulta", "consultas")}.` : "No pasó ninguna al CRM.",
    y ? `${pl(y, "ya estaba", "ya estaban")} en el CRM.` : "",
    sd ? `${pl(sd, "quedó", "quedaron")} sin pasar porque ${sd === 1 ? "le" : "les"} falta el nombre o algún dato de la consulta.` : "",
  ].filter(Boolean).join(" ")
}

export default async function Consultas({ searchParams }: { searchParams: { v?: string; b?: string; e?: string; borr?: string; crm?: string; desc?: string } }) {
  const u = await requerir()
  const emp = "devisebit"
  const qs = (x: Record<string, string>) => "?" + new URLSearchParams(x).toString()
  const [cuenta, enCRM] = await Promise.all([
    q<{ estado: string; n: number }>("select estado, count(*)::int n from consultas where empresa=$1 group by estado", [emp]),
    q<{ n: number }>(`select count(*)::int n from consultas k where k.empresa=$1 and ${PASO_AL_CRM("k")}`, [emp]),
  ])
  const n = Object.fromEntries(cuenta.map((c) => [c.estado, c.n]))
  const total = (est: string[]) => est.reduce((a, e) => a + (n[e] ?? 0), 0)
  const cuantas = (x: (typeof VISTAS)[number]) => (x.crm ? enCRM[0]?.n ?? 0 : total(x.estados))
  const vista = VISTAS.find((x) => x.v === searchParams.v) ?? (searchParams.v === "todas" ? null : total(["nueva"]) ? VISTAS[0] : VISTAS[1])
  const b = (searchParams.b ?? "").trim()
  const rows = await q<any>(
    `select k.*, (select d.id from db_contactos d where d.consulta_id=k.id limit 1) contacto_id, (select m.autor from wa_mensajes m where m.empresa=k.empresa and m.wa_id=coalesce(k.chat_id, regexp_replace(coalesce(k.telefono,''),'[^0-9]','','g')) and m.autor<>'cliente' order by m.creado desc limit 1) respondio
     from consultas k
     where empresa=$3 and ${vista?.crm ? `($1::text[] is null and ${PASO_AL_CRM("k")})` : "($1::text[] is null or estado = any($1))"}
       and ($2 = '' or nombre ilike '%'||$2||'%' or organizacion ilike '%'||$2||'%' or email ilike '%'||$2||'%' or telefono ilike '%'||$2||'%' or mensaje ilike '%'||$2||'%')
     order by creado desc limit 300`,
    [vista && !vista.crm ? vista.estados : null, b, emp],
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

      {searchParams.crm && <p className="m-0 text-sm text-[#9E1A17]" role="status">{avisoCRM(searchParams.crm)}{searchParams.crm !== "error" && <> <Link href="/contactos" className="underline">Ver contactos</Link></>}</p>}
      {searchParams.desc && <p className="m-0 text-sm text-[#9E1A17]" role="status">{searchParams.desc === "error" ? "No se pudieron descartar. Probá de nuevo." : searchParams.desc === "0" ? "Ya estaban descartadas." : `${searchParams.desc === "1" ? "Se descartó 1 consulta" : `Se descartaron ${searchParams.desc} consultas`}.`}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {VISTAS.map((x) => {
          const activa = vista?.v === x.v
          return (
            <Link key={x.v} href={`/consultas${qs({ v: x.v })}`} className={`card flex flex-col gap-0.5 border-2 transition-colors ${activa ? x.c + " shadow-sm" : "border-transparent hover:border-[#C3C8D1]"}`}>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">{x.n}</span>
              <span className={`text-3xl font-extrabold ${x.t}`}>{cuantas(x)}</span>
              <span className="text-xs text-[#4A515C]">{x.d}</span>
            </Link>
          )
        })}
      </div>
      <p className="m-0 -mt-2 text-xs text-[#4A515C]">«Pasaron al CRM» cuenta las que ya tienen un contacto comercial, lo haya creado una persona o el bot. Si todavía esperan respuesta, siguen además en «Sin atender» o «En seguimiento». «Ganada» es otra cosa: es el contacto que llega a la etapa Ganado en el CRM.</p>

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
        {ed && <form id="f-sel"><input type="hidden" name="v" value={vista ? vista.v : "todas"} />{b && <input type="hidden" name="b" value={b} />}</form>}
        {ed && (
          <AccionesSeleccion
            form="f-sel" singular="consulta" plural="consultas"
            acciones={[
              { n: "Pasar al CRM", accion: alCRMVarias, principal: true },
              ...(vista?.v === "descartada" ? [] : [{ n: "Descartar", accion: descartar, confirmar: "Quedan en «Descartadas»: no se borra nada y se pueden volver a abrir." }]),
            ]}
            eliminar={adm ? eliminar : undefined}
            aviso="Se borran también su chat, mensajes y reuniones; el contacto del CRM queda."
          />
        )}
        <div>
          <table className="tbl table-fixed">
            <colgroup>{ed && <col className="w-12" />}<col /><col className="w-[19%]" /><col className="w-[17%]" /><col className="w-[19%]" /><col className="w-[15%]" /></colgroup>
            <thead><tr>{ed && <th></th>}<th>Quién consulta</th><th>Estado</th><th>Motivo</th><th>Canal y origen</th><th>Entró</th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const est = ESTADOS.find((e) => e.v === c.estado)!
                const demora = c.estado === "nueva" && Date.now() - new Date(c.creado).getTime() > 4 * 3600e3
                return (
                  <tr key={c.id} className={`hover:bg-[#F8F9FB] ${c.estado === "nueva" ? "font-semibold" : ""}`}>
                    {ed && <td><label className="flex items-center justify-center w-11 h-11 -m-2 cursor-pointer"><input type="checkbox" name="ids" value={c.id} form="f-sel" className="sel-fila w-5 h-5" aria-label={`Marcar la consulta de ${c.nombre ?? "sin nombre"}`} /></label></td>}
                    <td className="break-words"><Link href={`/consultas/${c.id}`} className="hover:underline">{c.nombre ?? "Sin nombre"}</Link><div className="text-xs font-normal text-[#4A515C] break-all">{[c.organizacion, c.telefono, c.email].filter(Boolean).join(" · ")}</div></td>
                    <td><span className={`chip  ${est.c}`}>{est.n}</span>{c.estado === "nueva" && c.respondio && <div className="text-xs font-normal text-[#4A515C] mt-1 ">{c.respondio === "bot" ? "El bot ya respondió" : "El equipo ya escribió"}</div>}{c.necesita_humano && c.estado !== "descartada" && <div><span className="chip  bg-red-600 text-white mt-1">Quiere una persona</span></div>}{c.contacto_id && c.estado !== "convertida" && <div><Link href={`/contactos/${c.contacto_id}`} className="chip  bg-emerald-50 text-emerald-700 mt-1 font-normal hover:underline">En el CRM</Link></div>}</td>
                    <td className="font-normal break-words">{c.motivo ?? "—"}</td>
                    <td className="font-normal break-words">{CANAL[c.canal] ?? c.canal}{c.fuente && <div className={`text-xs ${/Ads/.test(c.fuente) ? "text-[#C8231F] font-semibold" : "text-[#4A515C]"}`}>{c.fuente}{c.campania ? ` · ${c.campania}` : ""}</div>}</td>
                    <td>{fechaHora(c.creado)}<div className={`text-xs font-normal ${demora ? "text-rojo font-semibold" : "text-[#4A515C]"}`}>{hace(c.creado)}</div><div className="text-xs font-normal text-[#4A515C]">{c.asignado ?? "Sin asignar"}</div></td>
                  </tr>
                )
              })}
              {!rows.length && <tr><td colSpan={ed ? 6 : 5} className="text-[#4A515C] py-6 text-center">No hay consultas en esta vista.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
