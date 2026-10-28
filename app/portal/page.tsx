import Link from "next/link"
import { q } from "@/lib/db"
import { requerirCliente, proyectosDe, tipoHito } from "@/lib/portal"
import { estadoProy } from "@/lib/crm"
import { fecha } from "@/lib/util"
import FaseBarra from "@/components/FaseBarra"
import { estadoCuenta, montos, plata } from "@/lib/cobros"
import { misInscripciones } from "@/lib/cursos"
import { URL_ACADEMIA } from "@/lib/academia"

export const dynamic = "force-dynamic"

const fh = (d: any) => new Date(d).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" })

export default async function Portal() {
  const c = await requerirCliente()
  const proyectos = await proyectosDe(c.id)
  const ids = proyectos.map((p) => p.id)
  const [novedades, reuniones, cuenta, cursos, guias] = await Promise.all([
    ids.length ? q<any>(`select h.*, p.nombre proyecto from db_hitos h join db_proyectos p on p.id=h.proyecto_id where h.proyecto_id = any($1) and h.visible order by h.fecha desc limit 8`, [ids]) : Promise.resolve([]),
    q<any>(`select inicio, fin, modalidad, link from db_reuniones where contacto_id=$1 and estado='confirmada' and inicio > now() order by inicio limit 3`, [c.id]),
    estadoCuenta(c.id),
    misInscripciones(c.id),
    q<any>("select slug, titulo, categoria from am_guias where publicada order by destacada desc, creado desc limit 3").catch(() => []),
  ])
  const enCurso = cursos.filter((x) => ["inscripto", "cursando"].includes(x.estado))
  const pendientes = proyectos.reduce((a, p) => a + (p.pendientes ?? 0), 0)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0">Hola, {c.nombre.split(" ")[0]}</h1>
        <p className="m-0 mt-1 text-[#4A515C]">Tus proyectos, pagos y cursos con DEVISEBIT, en un solo lugar.</p>
      </div>

      {(cuenta.pendientes.length > 0 || cursos.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/portal/pagos" className={`card hover:border-[#C8231F] ${cuenta.vencidos.length ? "!border-[#C8231F]" : ""}`}>
            <span className="text-xs text-[#4A515C]">{cuenta.vencidos.length ? "Pagos vencidos" : "Próximo pago"}</span>
            <strong className={`block text-lg ${cuenta.vencidos.length ? "text-rojo" : ""}`}>{cuenta.vencidos.length ? montos(cuenta.deudaVencida) : cuenta.proximo ? plata(cuenta.proximo.monto, cuenta.proximo.moneda) : "Al día"}</strong>
            <span className="text-xs text-[#4A515C]">{cuenta.vencidos.length ? "Regularizalo para no perder el acceso" : cuenta.proximo ? `Vence ${fecha(cuenta.proximo.vence)}` : "Sin pagos pendientes"}</span>
          </Link>
          <Link href="/portal/cursos" className="card hover:border-[#C8231F]">
            <span className="text-xs text-[#4A515C]">Cursos</span>
            <strong className="block text-lg">{enCurso.length ? `${enCurso.length} en curso` : cursos.length ? `${cursos.length} completados` : "Ninguno"}</strong>
            <span className="text-xs text-[#4A515C]">{cursos.filter((x) => x.certificado).length} certificados</span>
          </Link>
          <a href="#t-proy" className="card hover:border-[#C8231F]">
            <span className="text-xs text-[#4A515C]">Proyectos</span>
            <strong className="block text-lg">{proyectos.filter((p) => p.estado !== "terminado").length} activos</strong>
            <span className="text-xs text-[#4A515C]">{proyectos.filter((p) => p.estado === "terminado").length} entregados</span>
          </a>
        </div>
      )}

      {pendientes > 0 && (
        <div role="status" className="card !border-[#C8231F] !bg-[#FDECEB] flex flex-wrap items-center justify-between gap-3">
          <span><strong>Tenés {pendientes} {pendientes === 1 ? "cosa" : "cosas"} para revisar y aprobar.</strong> <span className="text-sm text-[#4A515C]">Tu aprobación nos permite avanzar sin demoras.</span></span>
          {proyectos.find((p) => p.pendientes) && <Link href={`/portal/p/${proyectos.find((p) => p.pendientes)!.id}#aprobar`} className="btn-p py-1.5">Revisar</Link>}
        </div>
      )}

      <section aria-labelledby="t-proy" className="flex flex-col gap-3">
        <h2 id="t-proy" className="m-0">Tus proyectos</h2>
        {!proyectos.length && <p className="card m-0 text-sm text-[#4A515C]">Todavía no hay proyectos cargados. Cuando trabajemos juntos en uno, vas a seguirlo acá paso a paso. <Link href="/portal/servicios" className="underline text-[#C8231F]">Ver servicios</Link></p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {proyectos.map((p) => {
            const e = estadoProy(p.estado)
            return (
              <Link key={p.id} href={`/portal/p/${p.id}`} className="card flex flex-col gap-3 hover:border-[#C8231F]">
                <div className="flex items-start justify-between gap-2">
                  <div><strong className="block text-[17px]">{p.nombre}</strong>{p.servicio && <span className="text-sm text-[#4A515C]">{p.servicio}</span>}</div>
                  <span className={`chip ${e.c} shrink-0`}>{e.n}</span>
                </div>
                <FaseBarra fase={p.fase} terminado={p.estado === "terminado"} />
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#4A515C]">
                  {p.entrega && <span>Entrega estimada: <strong className="text-[#0E1116]">{fecha(p.entrega)}</strong></span>}
                  {p.responsable && <span>Responsable: {p.responsable}</span>}
                  {p.ultima && <span>Última novedad: {fecha(p.ultima)}</span>}
                  {p.pendientes > 0 && <span className="text-[#9E1A17] font-semibold">{p.pendientes} para aprobar</span>}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section aria-labelledby="t-nov" className="card lg:col-span-2 flex flex-col gap-3">
          <h2 id="t-nov" className="m-0 text-base">Últimas novedades</h2>
          {!novedades.length && <p className="m-0 text-sm text-[#4A515C]">Sin novedades todavía.</p>}
          <ul className="m-0 p-0 list-none flex flex-col">
            {novedades.map((h) => (
              <li key={h.id} className="flex gap-3 py-2.5 border-b border-[#EEF0F3] last:border-0">
                <span className="w-7 h-7 rounded-full bg-[#F5F6F8] text-[#C8231F] flex items-center justify-center text-sm shrink-0" aria-hidden="true">{tipoHito(h.tipo).i}</span>
                <Link href={`/portal/p/${h.proyecto_id}`} className="flex-1 hover:underline">
                  <span className="block text-sm font-semibold">{h.titulo}</span>
                  <span className="block text-xs text-[#4A515C]">{h.proyecto} · {tipoHito(h.tipo).n} · {fecha(h.fecha)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="t-reu" className="card flex flex-col gap-3">
          <h2 id="t-reu" className="m-0 text-base">Próximas reuniones</h2>
          {!reuniones.length && <p className="m-0 text-sm text-[#4A515C]">No hay reuniones agendadas.</p>}
          {reuniones.map((r, i) => (
            <div key={i} className="text-sm">
              <strong className="block">{fh(r.inicio)}</strong>
              <span className="text-[#4A515C]">{r.modalidad}</span>
              {r.link && <> · <a href={r.link} target="_blank" rel="noopener noreferrer" className="underline text-[#C8231F]">Unirme</a></>}
            </div>
          ))}
          <div className="mt-auto flex flex-wrap gap-2">
            <Link href="/portal/reuniones" className="btn-p py-1.5">Agendar una reunión</Link>
            <a target="_blank" rel="noopener noreferrer" href="https://wa.me/5491173466490" className="btn-s py-1.5">WhatsApp</a>
          </div>
        </section>
      </div>
      <section aria-labelledby="t-rec" className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2"><h2 id="t-rec" className="m-0 text-base">Recursos de la Academia</h2><a target="_blank" rel="noopener noreferrer" href={URL_ACADEMIA} className="text-sm font-semibold text-[#C8231F]">Ir a la Academia →</a></div>
        <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-3 gap-3">
          {guias.map((g) => <li key={g.slug}><a target="_blank" rel="noopener noreferrer" href={`${URL_ACADEMIA}/guias/${g.slug}`} className="block rounded-xl border border-[#E2E5EA] p-3 hover:border-[#C8231F]"><span className="text-xs font-bold uppercase tracking-wider text-[#C8231F]">{g.categoria ?? "Guía"}</span><strong className="block text-sm mt-1">{g.titulo}</strong></a></li>)}
        </ul>
      </section>
    </div>
  )
}
