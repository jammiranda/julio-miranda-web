import { redirect } from "next/navigation"
import { waitUntil } from "@vercel/functions"
import { q, one, audit } from "@/lib/db"
import { requerirCliente } from "@/lib/portal"
import { precios, ars, type Precio } from "@/lib/precios"
import { comprar, primerPago } from "@/lib/compras"
import { LANDINGS, urlLanding } from "@/lib/landings"
import { notificar } from "@/lib/push"

export const dynamic = "force-dynamic"

/** Línea de la lista de precios que corresponde a cada landing. */
const LINEA: Record<string, string> = { webs: "Páginas web", whatsapp: "Agentes de WhatsApp", redes: "Redes y anuncios", sistemas: "Sistemas a medida", comunidad: "Plataforma para comunidades" }

const PRODUCTOS = [
  { id: "clinicas", n: "Sistema para clínicas", d: "Turnos, historia clínica, recetas y tablero." },
  { id: "whatsapp", n: "Asistente de WhatsApp con IA", d: "Atención 24 h con derivación a personas." },
  { id: "crm", n: "CRM de afiliados y prestadores", d: "Padrón único, autorizaciones y trazabilidad." },
  { id: "tableros", n: "Tableros de control", d: "Indicadores al día con alertas." },
  { id: "comunidad#productos-aparte", n: "Sistema de padrón", d: "Socios, afiliados o alumnos con credencial, cuotas y beneficios. Para gremios, mutuales, colegios y cámaras.", web: true },
  { id: "comunidad#productos-aparte", n: "Sistema para obras sociales", d: "Beneficiarios, órdenes y autorizaciones, prestadores y cartilla.", web: true },
  { id: "app", n: "App y credencial digital", d: "Tu institución en el celular de cada afiliado." },
  { id: "academias", n: "Academias online", d: "Cursos, pagos y certificados." },
  { id: "votacion", n: "Votación y control de acceso", d: "Elecciones sin papel y acceso con QR." },
  { id: "documental", n: "Gestor documental con firma digital", d: "Documentos ordenados y firmados en línea." },
]

async function compra(fd: FormData) {
  "use server"
  const c = await requerirCliente()
  const r = await comprar(c, Number(fd.get("precio")))
  if (!r.ok) redirect(`/portal/servicios?e=${encodeURIComponent(r.error)}`)
  redirect(`/portal/pagar/${r.id}`)
}

/** "Consultar": un clic, queda como conversación en el sistema comercial y avisa al equipo. */
async function consultar(fd: FormData) {
  "use server"
  const c = await requerirCliente(true)
  const servicio = String(fd.get("servicio") ?? "").slice(0, 120) || "Servicios"
  const k = await one<{ telefono: string | null }>("select telefono from db_contactos where id=$1", [c.id])
  const r = await one<{ id: number }>(
    `insert into consultas(empresa, canal, nombre, email, telefono, organizacion, motivo, mensaje, fuente, necesita_humano)
     values ('devisebit','portal',$1,$2,$3,$4,$5,$6,'portal',true) returning id`,
    [c.nombre, c.email, k?.telefono ?? null, c.organizacion, `Interés: ${servicio}`, `Desde Mi cuenta, ${c.nombre} pidió que lo contacten por ${servicio}.`],
  )
  await q("update db_contactos set proximo=$1, proximo_fecha=(now() at time zone 'America/Argentina/Buenos_Aires')::date + 1, actualizado=now() where id=$2", [`Responder consulta por ${servicio} (Mi cuenta)`, c.id])
  await audit({ id: 0, usuario: `cliente:${c.id}` }, "portal_interes", "consulta", r!.id, servicio)
  waitUntil(notificar(["gerente", "coordinacion"], "⭐ Cliente pide info de un servicio", `${c.organizacion ?? c.nombre} · ${servicio}`, `/consultas/${r!.id}`).catch(() => {}))
  redirect(`/portal/servicios?ok=${encodeURIComponent(servicio)}#lista`)
}

const Consultar = ({ servicio, chico = false }: { servicio: string; chico?: boolean }) => (
  <form action={consultar}>
    <input type="hidden" name="servicio" value={servicio} />
    <button className={`btn-s ${chico ? "py-1 text-xs" : "py-1.5"}`}>Consultar</button>
  </form>
)

function Item({ p }: { p: Precio }) {
  const pp = primerPago(p)
  return (
    <li className="rounded-xl border border-[#E2E5EA] bg-white p-4 flex flex-col gap-2">
      <strong className="text-[15px] leading-snug">{p.producto}</strong>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        {p.precio != null && <span className="text-xl font-extrabold">{ars(p.precio)}</span>}
        {p.abono != null && <span className={p.precio != null ? "text-sm text-[#4A515C]" : "text-xl font-extrabold"}>{p.precio != null ? "+ abono " : ""}{ars(p.abono)}<span className="text-sm font-normal text-[#4A515C]"> /mes</span></span>}
      </div>
      {p.condicion && <span className="text-xs text-[#4A515C]">{p.condicion}</span>}
      {p.incluye && <p className="m-0 text-sm text-[#262C37]">{p.incluye}</p>}
      <div className="mt-auto pt-2 flex flex-wrap items-center gap-2">
        {pp ? (
          <form action={compra}>
            <input type="hidden" name="precio" value={p.id} />
            <button className="btn-p py-1.5">Comprar</button>
          </form>
        ) : null}
        <Consultar servicio={p.producto} />
        {pp && <span className="text-xs text-[#4A515C] w-full">Hoy pagás {pp.tipo === "anticipo" ? "la seña del 50%" : pp.tipo === "total" ? "el total" : "el primer mes"}: <strong>{ars(pp.monto)}</strong>. Mercado Pago o transferencia (10% off).</span>}
      </div>
    </li>
  )
}

export default async function Servicios({ searchParams }: { searchParams: { ok?: string; e?: string } }) {
  await requerirCliente()
  const ps = await precios(true).catch(() => [] as Precio[])
  const lineas = Array.from(new Set(ps.map((p) => p.linea)))
  const desde = (linea?: string) => {
    const v = ps.filter((p) => p.linea === linea).map((p) => p.precio ?? p.abono).filter((x): x is number => x != null)
    return v.length ? Math.min(...v) : null
  }
  const slug = (l: string) => "l-" + l.toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-")
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0">Servicios y productos</h1>
        <p className="m-0 mt-1 text-[#4A515C]">Precios vigentes, finales y en pesos. Comprás desde acá y pagás con Mercado Pago o transferencia; las páginas de cada solución se abren en otra pestaña.</p>
      </div>
      {searchParams.ok && <p role="status" className="m-0 card py-3 text-sm !bg-emerald-50 !border-emerald-200">¡Listo! Le avisamos al equipo que querés info de <strong>{searchParams.ok}</strong>. Te contactamos en menos de 24 h hábiles.</p>}
      {searchParams.e && <p role="alert" className="m-0 card py-3 text-sm !bg-[#FDECEB] !border-[#F3B7B4]">{searchParams.e}</p>}

      <section aria-labelledby="t-land" className="flex flex-col gap-3">
        <h2 id="t-land" className="m-0">Soluciones</h2>
        <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LANDINGS.map((l) => {
            const d = desde(LINEA[l.slug])
            return (
              <li key={l.slug} className="card p-0 overflow-hidden flex flex-col">
                <a href={urlLanding(l.slug)} target="_blank" rel="noopener noreferrer" className="block group" aria-label={`${l.titulo} (se abre en otra pestaña)`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.img} alt="" width={1200} height={630} loading="lazy" className="w-full aspect-[1200/630] object-cover border-b border-[#E2E5EA] group-hover:opacity-90" />
                </a>
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <strong className="text-[16px] leading-snug">{l.titulo}</strong>
                  <p className="m-0 text-sm text-[#4A515C]">{l.bajada}</p>
                  {d != null && <span className="text-sm">Desde <strong>{ars(d)}</strong></span>}
                  <div className="mt-auto pt-2 flex flex-wrap items-start gap-2">
                    {LINEA[l.slug] ? <a href={`#${slug(LINEA[l.slug])}`} className="btn-p py-1.5">Ver precios y comprar</a> : <a href="#productos" className="btn-p py-1.5">Ver productos</a>}
                    <a href={urlLanding(l.slug)} target="_blank" rel="noopener noreferrer" className="btn-s py-1.5">Ver la página ↗</a>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section id="lista" aria-labelledby="t-lista" className="card flex flex-col gap-5 scroll-mt-4">
        <div>
          <h2 id="t-lista" className="m-0">Lista de precios</h2>
          <p className="m-0 mt-1 text-sm text-[#4A515C]">Proyectos: 50% de seña al comprar y el resto contra entrega. Abonos: se pagan mes a mes. Horas y bolsas de asesoría: pago total por adelantado. Todo con contrato y factura de DEVISEBIT SRL.</p>
        </div>
        {!ps.length && <p className="m-0 text-sm text-[#4A515C]">No pudimos cargar la lista. Escribinos por WhatsApp y te la mandamos.</p>}
        {lineas.map((l) => (
          <div key={l} id={slug(l)} className="scroll-mt-4">
            <h3 className="m-0 mb-2 text-xs font-bold uppercase tracking-wider text-[#4A515C]">{l}</h3>
            <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ps.filter((p) => p.linea === l).map((p) => <Item key={p.id} p={p} />)}
            </ul>
          </div>
        ))}
      </section>

      <section id="productos" aria-labelledby="t-prod" className="card flex flex-col gap-4 scroll-mt-4">
        <div>
          <h2 id="t-prod" className="m-0">Productos</h2>
          <p className="m-0 mt-1 text-sm text-[#4A515C]">Sistemas propios, probados en clientes reales, que adaptamos a tu organización. Se cotizan según alcance.</p>
        </div>
        <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRODUCTOS.map((p) => (
            <li key={p.n} className="rounded-xl border border-[#E2E5EA] p-4 flex flex-col gap-1.5">
              <strong className="text-sm">{p.n}</strong>
              <span className="text-xs text-[#4A515C]">{p.d}</span>
              <div className="mt-auto pt-2 flex flex-wrap gap-2 items-start">
                <a href={"web" in p ? `https://www.devisebit.com/${p.id}` : `https://www.devisebit.com/productos#${p.id}`} target="_blank" rel="noopener noreferrer" className="btn-s py-1 text-xs">Ver ↗</a>
                <Consultar servicio={p.n} chico />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
