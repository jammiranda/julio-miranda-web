import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { q, one, audit } from "@/lib/db"
import { mdWeb, mpConfigurado, crearPreferencia, URL_ACADEMIA } from "@/lib/academia"
import { modalidad, tipoLeccion, inscribir, contactoPorEmail, edicionPermanente, pesos, dolares, textoCuotas } from "@/lib/cursos"
import { paypalConfigurado, crearOrdenPayPal } from "@/lib/paypal"
import { entregarOrden } from "@/lib/academia-entrega"
import { perfil } from "@/lib/equipo"
import { clienteActual } from "@/lib/portal"
import { fecha } from "@/lib/util"
import BarraAccion from "../../_ui/BarraAccion"
import BotonEnviar from "../../_ui/BotonEnviar"

export const dynamic = "force-dynamic"

const curso = (slug: string) => one<any>("select * from am_cursos where slug=$1 and estado='publicado'", [slug])

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await curso(params.slug)
  return c ? { title: c.titulo, description: c.bajada ?? undefined, alternates: { canonical: `/cursos/${c.slug}` }, openGraph: c.imagen ? { images: [c.imagen] } : undefined } : {}
}

const t = (v: FormDataEntryValue | null, n = 160) => String(v ?? "").trim().slice(0, n) || null

async function anotarme(fd: FormData) {
  "use server"
  const slug = String(fd.get("slug") ?? "")
  const c = await curso(slug)
  if (!c) redirect("/cursos")
  if (fd.get("website")) redirect(`/cursos/${slug}?ok=1`)
  const edicion = Number(fd.get("edicion"))
  if (!(await one("select 1 from am_ediciones where id=$1 and curso_id=$2", [edicion, c.id]))) redirect(`/cursos/${slug}?e=edicion#inscripcion`)
  const yo = await clienteActual()
  let cid: number
  if (yo && !t(fd.get("email"))) cid = yo.id
  else {
    const email = (t(fd.get("email")) ?? "").toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`/cursos/${slug}?e=email#inscripcion`)
    if (!fd.get("acepto")) redirect(`/cursos/${slug}?e=acepto#inscripcion`)
    cid = await contactoPorEmail(email, t(fd.get("nombre"), 120), { telefono: t(fd.get("telefono"), 40), organizacion: t(fd.get("organizacion")), origen: "Academia (curso)" })
  }
  const bloq = await one<{ portal_acceso: string }>("select portal_acceso from db_contactos where id=$1", [cid])
  if (bloq?.portal_acceso === "bloqueado") redirect(`/cursos/${slug}?e=bloqueado#inscripcion`)
  const r = await inscribir(cid, edicion, "web", true)
  await audit({ id: 0, usuario: `alumno:${cid}` }, r.ok ? "curso_inscripcion" : "curso_inscripcion_error", "am_edicion", edicion, r.ok ? slug : r.error)
  if (!r.ok) redirect(`/cursos/${slug}?e=${encodeURIComponent(r.error)}#inscripcion`)
  if (yo && yo.id === cid) redirect(`/mi-cuenta/cursos/${r.id}`)
  redirect(`/cursos/${slug}?ok=1#inscripcion`)
}

/** Modo prueba (solo desarrollo local, CURSOS_PRUEBA=1 y sin Mercado Pago): simula el pago para probar compra → inscripción → aula. */
const modoPrueba = () => process.env.CURSOS_PRUEBA === "1" && process.env.NODE_ENV !== "production" && !process.env.MP_ACCESS_TOKEN

/** Comprar un curso pago: crea la orden y va a Mercado Pago (pesos, con cuotas) o PayPal (dólares). Al pagarse, la entrega inscribe sola. */
async function comprar(fd: FormData) {
  "use server"
  const slug = String(fd.get("slug") ?? "")
  const c = await curso(slug)
  if (!c || !c.precio) redirect(`/cursos/${slug}`)
  if (fd.get("website")) redirect(`/cursos/${slug}`)
  const email = (t(fd.get("email")) ?? "").toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`/cursos/${slug}?e=email#inscripcion`)
  const exterior = fd.get("pasarela") === "paypal"
  const prueba = !exterior && modoPrueba()
  if (exterior ? !(c.precio_usd && paypalConfigurado()) : !(mpConfigurado() || prueba)) redirect(`/cursos/${slug}?e=pago#inscripcion`)
  await edicionPermanente(c.id)
  const monto = exterior ? Number(c.precio_usd) : Number(c.precio)
  const o = await one<{ id: number; token: string }>(
    "insert into am_ordenes(curso_id,email,nombre,monto,moneda,pasarela,fuente) values ($1,$2,$3,$4,$5,$6,'curso') returning id, token",
    [c.id, email, t(fd.get("nombre"), 120), monto, exterior ? "USD" : "ARS", exterior ? "paypal" : prueba ? "prueba" : "mercadopago"])
  if (prueba) {
    await entregarOrden(o!.id, `PRUEBA-${o!.id}`, "prueba")
    redirect(`/gracias/${o!.token}`)
  }
  const pref = exterior
    ? await crearOrdenPayPal({ orden: o!.id, titulo: `Curso: ${c.titulo}`, usd: monto, token: o!.token, volver: `https://sistema.devisebit.com/api/academia/paypal?t=${o!.token}`, cancelar: `${URL_ACADEMIA}/gracias/${o!.token}?e=1` })
    : await crearPreferencia({ orden: o!.id, titulo: `Curso: ${c.titulo}`, precio: monto, email, token: o!.token, cuotas: c.cuotas })
  if (!pref.ok) redirect(`/cursos/${slug}?e=pago#inscripcion`)
  await q("update am_ordenes set mp_preferencia=$1 where id=$2", [pref.id, o!.id])
  await audit({ id: 0, usuario: "web" }, exterior ? "curso_checkout_paypal" : "curso_checkout", "am_orden", o!.id, slug)
  redirect(pref.url)
}

export default async function Curso({ params, searchParams }: { params: { slug: string }; searchParams: { ok?: string; e?: string } }) {
  const c = await curso(params.slug)
  if (!c) notFound()
  const [ediciones, lecciones, yo] = await Promise.all([
    q<any>(`select e.*, (select count(*)::int from am_inscripciones i where i.edicion_id=e.id and i.estado<>'baja') inscriptos,
              (select count(*)::int from am_clases k where k.edicion_id=e.id) clases
            from am_ediciones e where e.curso_id=$1 and e.estado in ('inscripcion','en_curso') order by e.inicio nulls first, e.id`, [c.id]),
    q<any>("select modulo, titulo, tipo, duracion_min from am_lecciones where curso_id=$1 and publicada order by orden, id", [c.id]),
    clienteActual(),
  ])
  const abiertas = ediciones.filter((e) => !e.cupo || e.inscriptos < e.cupo)
  const ya = yo ? await one<{ id: number }>("select i.id from am_inscripciones i join am_ediciones e on e.id=i.edicion_id where e.curso_id=$1 and i.contacto_id=$2 and i.estado<>'baja'", [c.id, yo.id]) : null
  const err: Record<string, string> = { email: "Revisá el email.", acepto: "Necesitamos tu conformidad para registrarte.", edicion: "Elegí una edición.", bloqueado: "Tu cuenta tiene el acceso suspendido. Escribinos por WhatsApp.", pago: "No pudimos iniciar el pago. Probá de nuevo o escribinos por WhatsApp." }
  const pago = !!c.precio
  const venta = pago && (mpConfigurado() || modoPrueba())
  const conPayPal = pago && !!c.precio_usd && paypalConfigurado()
  const doc = c.docente_slug ? String(c.docente_slug).split(",").map((x: string) => perfil(x.trim())).filter(Boolean) : []
  const precioTxt = pago ? pesos(c.precio) : "Gratis"
  const modulos = Array.from(new Set(lecciones.map((l) => l.modulo || "Contenido")))
  return (
    <main>
      <section className="ficha-head bg-[#0E1116] text-white">
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-10 sm:pt-8 sm:pb-16 grid grid-cols-1 md:grid-cols-5 gap-6 lg:gap-8 items-center">
          <div className="md:col-span-3">
            <nav aria-label="Ruta"><Link href="/cursos" className="inline-flex items-center min-h-[44px] -ml-1 px-1 text-sm text-white/70 hover:text-white">← Cursos</Link></nav>
            <p className="m-0 mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[#FF6A63]">{modalidad(c.modalidad)}{c.horas ? ` · ${Number(c.horas)} horas` : ""}{c.certifica ? " · Con certificado" : ""}</p>
            <h1 className="acad-h1-m m-0 mt-3 font-extrabold text-white">{c.titulo}</h1>
            {c.bajada && <p className="acad-lead m-0 mt-4 text-white/80">{c.bajada}</p>}
            {c.docente && <p className="m-0 mt-4 text-sm text-white/70">{doc.length > 1 ? "Docentes" : "Docente"}: {doc.length ? doc.map((d: any, k: number) => <span key={d.slug}>{k ? " y " : ""}<Link href={`/equipo/${d.slug}`} className="font-bold text-white underline decoration-white/30 hover:decoration-white">{d.nombre}</Link></span>) : <strong className="text-white">{c.docente}</strong>}</p>}
            <ul className="m-0 mt-5 p-0 list-none flex flex-wrap gap-2 text-sm">
              {c.nuevo && <li className="chip bg-[#C8231F] text-white">Nuevo</li>}
              {c.modalidad === "online" && <li className="chip bg-white/10 text-white">Empezás cuando quieras</li>}
              {c.certifica && <li className="chip bg-white/10 text-white">Certificado verificable</li>}
              {c.videollamada && <li className="chip bg-white/10 text-white">Incluye videollamada de 30 min con el docente</li>}
            </ul>
          </div>
          {c.imagen && <img src={c.imagen} alt="" width={1280} height={720} decoding="async" className="md:col-span-2 w-full h-auto rounded-2xl aspect-video object-cover" />}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8 min-w-0 order-1">
          {c.descripcion && <article className="prosa" dangerouslySetInnerHTML={{ __html: mdWeb(c.descripcion) }} />}
          {lecciones.length > 0 && (
            <section aria-labelledby="t-prog">
              <h2 id="t-prog" className="m-0 text-2xl font-extrabold">Programa <span className="text-base font-semibold text-[#4A515C]">· {lecciones.length} lecciones</span></h2>
              {modulos.map((m) => (
                <div key={m} className="mt-4">
                  <h3 className="m-0 text-sm font-bold uppercase tracking-wider text-[#4A515C]">{m}</h3>
                  <ol className="m-0 mt-2 p-0 list-none bg-white rounded-2xl border border-[#E2E5EA] flex flex-col overflow-hidden">
                    {lecciones.filter((l) => (l.modulo || "Contenido") === m).map((l, k) => (
                      <li key={k} className="flex items-center gap-3 px-4 py-3 min-h-[52px] text-[15px] leading-snug border-b border-[#EEF0F3] last:border-0"><span className="w-8 h-8 shrink-0 rounded-full bg-[#FDECEB] text-[#C8231F] flex items-center justify-center text-sm" aria-hidden="true">{tipoLeccion(l.tipo).i}</span><span className="flex-1 min-w-0">{l.titulo}</span>{l.duracion_min && <span className="shrink-0 text-sm text-[#4A515C] tabular-nums">{l.duracion_min} min</span>}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          )}
        </div>

        <aside id="inscripcion" aria-label="Inscripción" className="flex flex-col gap-4 scroll-mt-20 order-2">
          <div className="card flex flex-col gap-3 [@media(min-width:768px)_and_(min-height:900px)]:sticky md:top-24 shadow-[0_8px_30px_rgba(14,17,22,.06)]">
            <div className="flex flex-col gap-1">
              <p className="m-0 text-3xl font-extrabold leading-none">{precioTxt}{pago && <span className="text-sm font-semibold text-[#4A515C]"> ARS</span>}</p>
              {pago && c.precio_usd && <p className="m-0 text-base font-bold text-[#262C37]">{dolares(c.precio_usd)} <span className="text-sm font-semibold text-[#4A515C]">desde el exterior</span></p>}
              {pago && c.cuotas > 1 && <p className="m-0 text-sm font-semibold text-emerald-700">{textoCuotas(c.precio, c.cuotas)}</p>}
            </div>
            {searchParams.ok ? (
              <div role="status" className="rounded-xl bg-emerald-50 p-4 text-sm"><strong className="block mb-1">¡Listo, ya estás inscripto!</strong>Te mandamos un email con el acceso al curso (revisá también spam o promociones). También podés entrar desde <Link href="/mi-cuenta" className="underline font-semibold">Mi cuenta</Link> con tu email.</div>
            ) : ya ? (
              <Link href={`/mi-cuenta/cursos/${ya.id}`} className="btn-p min-h-[52px] text-base">Ir a mi curso</Link>
            ) : pago ? (
              venta || conPayPal ? (
                <form action={comprar} className="flex flex-col gap-3">
                  <input type="hidden" name="slug" value={c.slug} />
                  {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">{err[searchParams.e] ?? searchParams.e}</p>}
                  <label className="lbl">Nombre y apellido (para el certificado)<input name="nombre" required defaultValue={yo?.nombre ?? ""} autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="inp" /></label>
                  <label className="lbl">Email (ahí te llega el acceso al aula)<input name="email" type="email" inputMode="email" required defaultValue={yo?.email ?? ""} autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="go" className="inp" /></label>
                  <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                  {venta && <BotonEnviar cargando={modoPrueba() ? "Procesando…" : "Abriendo Mercado Pago…"}>{modoPrueba() ? `Comprar (modo prueba) ${precioTxt}` : `Pagar ${precioTxt} con Mercado Pago`}</BotonEnviar>}
                  {venta && <p className="m-0 text-sm text-[#4A515C]">Desde Argentina: tarjeta, débito o dinero en cuenta{c.cuotas > 1 ? `, hasta ${c.cuotas} cuotas sin interés` : ""}. Al acreditarse el pago quedás inscripto y te llega el acceso.</p>}
                  {conPayPal && (
                    <div className="flex flex-col gap-2 border-t border-[#E2E5EA] pt-3">
                      <button type="submit" name="pasarela" value="paypal" className="btn min-h-[48px] w-full bg-[#FFC439] text-[#0E1116] hover:bg-[#F2BA36] font-bold">Pagar {dolares(c.precio_usd)} con PayPal o tarjeta internacional</button>
                      <p className="m-0 text-sm text-[#4A515C]">¿Estás fuera de Argentina? Pagás en dólares, sin crear cuenta.</p>
                    </div>
                  )}
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="m-0 text-sm text-[#4A515C]">El pago online se está activando. Escribinos y te mandamos el link de pago.</p>
                  <a href={`https://wa.me/5491173466490?text=${encodeURIComponent(`Hola DEVISEBIT, quiero comprar el curso ${c.titulo}`)}`} className="btn-p min-h-[52px] text-base">Comprar por WhatsApp</a>
                </div>
              )
            ) : !abiertas.length ? (
              <p className="m-0 text-sm text-[#4A515C]">No hay ediciones con inscripción abierta. Suscribite a la newsletter desde la portada y te avisamos.</p>
            ) : (
              <form action={anotarme} className="flex flex-col gap-3">
                <input type="hidden" name="slug" value={c.slug} />
                {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">{err[searchParams.e] ?? searchParams.e}</p>}
                {abiertas.length === 1 && !abiertas[0].inicio ? <input type="hidden" name="edicion" value={abiertas[0].id} /> : <fieldset className="flex flex-col gap-2 m-0 p-0 border-0">
                  <legend className="text-sm font-semibold mb-1">Edición</legend>
                  {abiertas.map((e, k) => (
                    <label key={e.id} className="flex gap-3 items-start text-[15px] rounded-xl border border-[#E2E5EA] p-3 min-h-[52px] cursor-pointer has-[:checked]:border-[#C8231F] has-[:checked]:bg-[#FDECEB]">
                      <input type="radio" name="edicion" value={e.id} defaultChecked={k === 0} className="mt-0.5" />
                      <span><strong className="block">{e.nombre}</strong><span className="text-sm text-[#4A515C]">{e.inicio ? `Desde ${fecha(e.inicio)}` : "Empezás cuando quieras"}{e.horario ? ` · ${e.horario}` : ""}{e.lugar ? ` · ${e.lugar}` : ""}{e.cupo ? ` · Quedan ${e.cupo - e.inscriptos} lugares` : ""}</span></span>
                    </label>
                  ))}
                </fieldset>}
                {yo ? (
                  <p className="m-0 text-sm">Te inscribís como <strong>{yo.nombre}</strong> ({yo.email}).</p>
                ) : (
                  <>
                    <label className="lbl">Nombre y apellido<input name="nombre" required autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="inp" /></label>
                    <label className="lbl">Email<input name="email" type="email" inputMode="email" required autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="next" className="inp" /></label>
                    <label className="lbl">WhatsApp (opcional)<input name="telefono" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" className="inp" /></label>
                    <label className="lbl">Organización (opcional)<input name="organizacion" autoComplete="organization" enterKeyHint="done" className="inp" /></label>
                    <label className="flex gap-3 items-start text-sm leading-snug text-[#4A515C] py-1 cursor-pointer"><input type="checkbox" name="acepto" value="1" required className="mt-0.5" /> Acepto recibir el acceso, recordatorios y novedades de la Academia por email (me puedo dar de baja cuando quiera).</label>
                  </>
                )}
                <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                <BotonEnviar cargando="Inscribiendo…">{c.precio ? "Reservar mi lugar" : "Inscribirme gratis"}</BotonEnviar>
              </form>
            )}
            <ul className="m-0 p-0 list-none text-sm text-[#4A515C] flex flex-col gap-1 border-t border-[#EEF0F3] pt-3">
              <li>✓ Acceso desde tu cuenta, sin contraseñas</li>
              {c.modalidad === "online" && <li>✓ A tu ritmo: sin fecha de inicio ni clases obligatorias</li>}
              {c.horas && <li>✓ Duración estimada: {Number(c.horas)} horas</li>}
              {c.videollamada && <li>✓ Una videollamada de 30 minutos con el docente</li>}
              {lecciones.length > 0 && <li>✓ {lecciones.length} lecciones y materiales descargables</li>}
              <li>✓ Seguimiento de tu avance</li>
              {c.certifica && <li>✓ Certificado verificable al aprobar</li>}
            </ul>
          </div>
        </aside>
      </div>
      {!searchParams.ok && (ya || abiertas.length > 0 || pago) && (
        <BarraAccion desde="md" destino="inscripcion" precio={precioTxt} detalle={ya ? "Ya estás inscripto" : [c.certifica ? "Con certificado" : null, abiertas[0]?.inicio ? `Inicia ${fecha(abiertas[0].inicio)}` : null].filter(Boolean).join(" · ") || undefined} etiqueta={ya ? "Ir a mi curso" : c.precio ? "Comprar" : "Inscribirme"} />
      )}
    </main>
  )
}
