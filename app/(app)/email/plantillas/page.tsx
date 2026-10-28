import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { ESTILOS, estilo as estiloDe, emailConEstilo } from "@/lib/email-estilos"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Crea una campaña nueva a partir de un estilo (con su texto de ejemplo o escrita por la IA). */
async function usar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const e = estiloDe(s(fd.get("estilo")))
  const r = await one<{ id: number }>(
    "insert into em_campanias(asunto,preheader,contenido,estilo,portada,creado_por) values ($1,$2,$3,$4,$5,$6) returning id",
    [e.ejemplo.asunto, e.ejemplo.preheader, e.ejemplo.contenido, e.id, e.ejemplo.portada ?? null, u.nombre],
  )
  await audit(u, "email_desde_plantilla", "em_campania", r!.id, e.id)
  redirect(`/email/${r!.id}?ok=${encodeURIComponent(`Campaña creada con el estilo «${e.nombre}». Cambiá el texto o pedile a la IA que lo escriba.`)}`)
}

export default async function Plantillas() {
  await requerir(["gerente", "coordinacion"])
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/email" className="text-sm text-[#4A515C]">← Envíos</Link>
          <h1 className="m-0">Elegí una plantilla</h1>
          <p className="m-0 text-sm text-[#4A515C]">Cada estilo trae un texto de ejemplo. Después lo cambiás a mano o le pedís a la IA que lo escriba con tu tema, y elegís a quién se manda.</p>
        </div>
      </div>
      <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ESTILOS.map((e) => (
          <li key={e.id} className="card !p-0 overflow-hidden flex flex-col">
            <div className="relative h-[340px] overflow-hidden border-b border-[#E2E5EA] bg-[#F5F6F8]" aria-hidden="true">
              <iframe title={`Vista de ${e.nombre}`} srcDoc={emailConEstilo(e.ejemplo.contenido, { estilo: e.id, preheader: e.ejemplo.preheader, nombre: "Ana", baja: "#" })} tabIndex={-1} className="absolute top-0 left-0 w-[640px] h-[760px] origin-top-left scale-[0.45] pointer-events-none border-0" />
            </div>
            <div className="p-4 flex flex-col gap-1.5 flex-1">
              <strong>{e.nombre}</strong>
              <span className="text-sm text-[#4A515C]">{e.para}</span>
              <form action={usar} className="mt-auto pt-2">
                <input type="hidden" name="estilo" value={e.id} />
                <button className="btn-p w-full">Usar esta plantilla</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
