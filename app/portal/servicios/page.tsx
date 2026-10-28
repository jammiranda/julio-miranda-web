import { redirect } from "next/navigation"
import { waitUntil } from "@vercel/functions"
import { q, one, audit } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { catalogo } from "@/lib/brief"
import { LANDINGS, urlLanding } from "@/lib/landings"
import { notificar } from "@/lib/push"

export const dynamic = "force-dynamic"

/** "Me interesa": queda como conversación en el sistema comercial y avisa al equipo. El cliente no sale del portal. */
async function interes(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const servicio = String(fd.get("servicio") ?? "").slice(0, 120) || "Servicios"
  const msg = String(fd.get("mensaje") ?? "").trim().slice(0, 1500)
  const k = await one<{ telefono: string | null }>("select telefono from db_contactos where id=$1", [c.id])
  const r = await one<{ id: number }>(
    `insert into consultas(empresa, canal, nombre, email, telefono, organizacion, motivo, mensaje, fuente, necesita_humano)
     values ('devisebit','portal',$1,$2,$3,$4,$5,$6,'portal',true) returning id`,
    [c.nombre, c.email, k?.telefono ?? null, c.organizacion, `Interés: ${servicio}`, msg || `Desde su portal, ${c.nombre} pidió info sobre ${servicio}.`],
  )
  await q("update db_contactos set proximo=$1, proximo_fecha=(now() at time zone 'America/Argentina/Buenos_Aires')::date + 1, actualizado=now() where id=$2", [`Responder interés en ${servicio} (portal)`, c.id])
  await audit({ id: 0, usuario: `cliente:${c.id}` }, "portal_interes", "consulta", r!.id, servicio)
  waitUntil(notificar(["gerente", "coordinacion"], "⭐ Cliente interesado en un servicio", `${c.organizacion ?? c.nombre} · ${servicio}${msg ? ` — ${msg}` : ""}`, `/consultas/${r!.id}`).catch(() => {}))
  redirect(`/portal/servicios?ok=${encodeURIComponent(servicio)}`)
}

const Interes = ({ servicio, chico = false }: { servicio: string; chico?: boolean }) => (
  <details className="mt-auto">
    <summary className={`list-none cursor-pointer [&::-webkit-details-marker]:hidden ${chico ? "btn-s py-1 text-xs" : "btn-p py-1.5"} inline-flex`}>Me interesa</summary>
    <form action={interes} className="mt-2 flex flex-col gap-2">
      <input type="hidden" name="servicio" value={servicio} />
      <label className="lbl font-normal text-xs">Contanos qué necesitás (opcional)<textarea name="mensaje" rows={2} className="inp text-sm" /></label>
      <button className="btn-p py-1.5 text-sm">Avisar al equipo</button>
    </form>
  </details>
)

export default async function Servicios({ searchParams }: { searchParams: { ok?: string } }) {
  await requerirCliente()
  const cat = await catalogo().catch(() => [] as Awaited<ReturnType<typeof catalogo>>)
  const grupos = cat.reduce<Record<string, typeof cat>>((a, s) => ((a[s.categoria ?? "Otros"] ??= []).push(s), a), {})
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0">Servicios DEVISEBIT</h1>
        <p className="m-0 mt-1 text-[#4A515C]">Todo lo que podemos hacer con vos. Las páginas se abren en otra pestaña: tu cuenta queda abierta acá.</p>
      </div>
      {searchParams.ok && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50 !border-emerald-200">¡Listo! Le avisamos al equipo de tu interés en <strong>{searchParams.ok}</strong>. Te contactamos en menos de 24 h hábiles.</p>}

      <section aria-labelledby="t-land" className="flex flex-col gap-3">
        <h2 id="t-land" className="m-0">Soluciones</h2>
        <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANDINGS.map((l) => (
            <li key={l.slug} className="card p-0 overflow-hidden flex flex-col">
              <a href={urlLanding(l.slug)} target="_blank" rel="noopener noreferrer" className="block group" aria-label={`${l.titulo} (se abre en otra pestaña)`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.img} alt="" width={1200} height={630} loading="lazy" className="w-full aspect-[1200/630] object-cover border-b border-[#E2E5EA] group-hover:opacity-90" />
              </a>
              <div className="p-4 flex flex-col gap-2 flex-1">
                <strong className="text-[16px] leading-snug">{l.titulo}</strong>
                <p className="m-0 text-sm text-[#4A515C]">{l.bajada}</p>
                <div className="mt-auto pt-2 flex flex-wrap items-start gap-2">
                  <a href={urlLanding(l.slug)} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Ver la página ↗</a>
                  <Interes servicio={l.titulo} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {cat.length > 0 && (
        <section aria-labelledby="t-cat" className="card flex flex-col gap-4">
          <div><h2 id="t-cat" className="m-0">Catálogo con valores de referencia</h2><p className="m-0 mt-1 text-sm text-[#4A515C]">Rangos orientativos: el valor final depende del alcance. Cada ficha se abre en otra pestaña.</p></div>
          {Object.entries(grupos).map(([g, l]) => (
            <div key={g}>
              <h3 className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">{g}</h3>
              <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 gap-3">
                {l.map((s) => (
                  <li key={s.nombre} className="rounded-xl border border-[#E2E5EA] p-3 flex flex-col gap-1">
                    <strong className="text-sm">{s.nombre}</strong>
                    {s.descripcion && <span className="text-xs text-[#4A515C]">{s.descripcion}</span>}
                    <span className="text-xs">{[s.rango, s.plazo].filter(Boolean).join(" · ")}</span>
                    <div className="flex flex-wrap gap-2 items-start mt-1">
                      {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" className="btn-s py-1 text-xs">Ver ficha ↗</a>}
                      <Interes servicio={s.nombre} chico />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
