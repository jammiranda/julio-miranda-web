import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { q, one, audit } from "@/lib/db"
import { mdWeb, mpConfigurado, crearPreferencia } from "@/lib/academia"
import Suscribir from "@/components/Suscribir"
import BarraAccion from "../../_ui/BarraAccion"
import BotonEnviar from "../../_ui/BotonEnviar"
export const dynamic = "force-dynamic"

/** Un producto con archivo cifrado solo se vende si la clave para abrirlo está cargada. */
const archivoListo = (p: any) => !String(p?.archivo_url ?? "").startsWith("enc:") || !!process.env.ACADEMIA_ARCHIVOS_KEY

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await one<any>("select titulo, bajada from am_productos where slug=$1 and estado<>'oculto'", [params.slug]).catch(() => null)
  return p ? { title: p.titulo, description: p.bajada } : {}
}

async function comprar(fd: FormData) {
  "use server"
  const p = await one<any>("select * from am_productos where slug=$1 and estado='venta'", [String(fd.get("slug"))])
  const email = String(fd.get("email") ?? "").trim().toLowerCase()
  if (!p || !p.precio || !archivoListo(p) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !mpConfigurado()) redirect(`/productos/${fd.get("slug")}?e=1`)
  const o = await one<{ id: number; token: string }>("insert into am_ordenes(producto_id,email,nombre,monto,moneda) values ($1,$2,$3,$4,$5) returning id, token", [p.id, email, String(fd.get("nombre") ?? "").slice(0, 120) || null, p.precio, p.moneda])
  const pref = await crearPreferencia({ orden: o!.id, titulo: p.titulo, precio: Number(p.precio), email, token: o!.token })
  if (!pref.ok) redirect(`/productos/${p.slug}?e=1`)
  await q("update am_ordenes set mp_preferencia=$1 where id=$2", [pref.id, o!.id])
  await audit({ id: 0, usuario: "web" }, "academia_checkout", "am_orden", o!.id)
  redirect(pref.url)
}

export default async function Producto({ params, searchParams }: { params: { slug: string }; searchParams: { e?: string } }) {
  const p = await one<any>("select * from am_productos where slug=$1 and estado<>'oculto'", [params.slug])
  if (!p) notFound()
  const venta = p.estado === "venta" && p.precio && mpConfigurado() && archivoListo(p)
  const precio = p.precio ? `${p.moneda === "ARS" ? "$" : p.moneda + " "}${Number(p.precio).toLocaleString("es-AR")}` : ""
  return (
    <main>
      <header className="ficha-head bg-[#0E1116] text-white"><div className="max-w-5xl mx-auto px-4 pt-8 pb-10 sm:py-14">
        <span className="chip bg-[#C8231F] text-white">{venta ? "Disponible" : "Próximamente"}</span>
        <h1 className="acad-h1-m m-0 mt-4 font-extrabold text-white">{p.titulo}</h1>
        <p className="acad-lead m-0 mt-4 text-white/80 max-w-2xl">{p.bajada}</p>
        {venta && (
          <div id="cta-arriba" className="md:hidden mt-6 flex items-center gap-4">
            <span className="text-3xl font-extrabold text-white">{precio}</span>
            <a href="#comprar" className="btn-p min-h-[48px] text-base flex-1">{p.servicio ? "Contratar" : "Comprar"}</a>
          </div>
        )}
      </div></header>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_380px] gap-8 lg:gap-12 items-start">
        <article className="prosa" dangerouslySetInnerHTML={{ __html: mdWeb(String(p.descripcion ?? "").replace(/\\n/g, "\n")) }} />
        <aside id="comprar" aria-label={venta ? "Comprar" : "Lista de espera"} className="card flex flex-col gap-3 md:sticky md:top-24 scroll-mt-20 shadow-[0_8px_30px_rgba(14,17,22,.06)]">
          {venta ? (
            <form action={comprar} className="flex flex-col gap-3">
              <p className="m-0 text-3xl font-extrabold">{precio}</p>
              <input type="hidden" name="slug" value={p.slug} />
              <label className="lbl">Nombre<input name="nombre" autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="inp" /></label>
              <label className="lbl">{p.servicio ? "Email (te escribimos para coordinar)" : "Email (te llega la descarga)"}<input name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck={false} enterKeyHint="go" required className="inp" /></label>
              <BotonEnviar cargando="Abriendo Mercado Pago…">Comprar con Mercado Pago</BotonEnviar>
              <p className="m-0 text-sm text-[#4A515C]">Pago seguro con Mercado Pago: tarjeta, débito o dinero en cuenta. {p.servicio ? "Después del pago coordinamos la fecha con vos. ¿Preferís transferencia o factura A? Escribinos por WhatsApp." : "Descarga inmediata."}</p>
              {searchParams.e && <p role="alert" className="m-0 text-sm text-rojo">No pudimos iniciar el pago. Revisá el email o probá de nuevo.</p>}
            </form>
          ) : (
            <>
              <p className="m-0 text-lg font-extrabold">Anotate y te avisamos primero</p>
              <p className="m-0 text-sm text-[#4A515C]">Los primeros de la lista lo reciben con descuento de lanzamiento.</p>
              <Suscribir tag={`espera-${p.slug}`.slice(0, 40)} boton="Anotarme" />
            </>
          )}
        </aside>
      </div>
      <BarraAccion desde="md" destino="comprar" tambien="cta-arriba" precio={venta ? precio : "Próximamente"} detalle={venta ? (p.servicio ? "Pago seguro · Mercado Pago" : "Descarga inmediata") : "Lista de espera con descuento"} etiqueta={venta ? (p.servicio ? "Contratar" : "Comprar") : "Anotarme"} />
    </main>
  )
}
