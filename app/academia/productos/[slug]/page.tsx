import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { q, one, audit } from "@/lib/db"
import { mdWeb, mpConfigurado, crearPreferencia } from "@/lib/academia"
import Suscribir from "@/components/Suscribir"
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await one<any>("select titulo, bajada from am_productos where slug=$1 and estado<>'oculto'", [params.slug]).catch(() => null)
  return p ? { title: p.titulo, description: p.bajada } : {}
}

async function comprar(fd: FormData) {
  "use server"
  const p = await one<any>("select * from am_productos where slug=$1 and estado='venta'", [String(fd.get("slug"))])
  const email = String(fd.get("email") ?? "").trim().toLowerCase()
  if (!p || !p.precio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !mpConfigurado()) redirect(`/productos/${fd.get("slug")}?e=1`)
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
  const venta = p.estado === "venta" && p.precio && mpConfigurado()
  return (
    <main>
      <header className="ficha-head bg-[#0E1116] text-white"><div className="max-w-4xl mx-auto px-4 py-14">
        <span className="chip bg-[#C8231F] text-white">{venta ? "Disponible" : "Próximamente"}</span>
        <h1 className="m-0 mt-4 text-4xl sm:text-5xl font-extrabold text-white leading-tight">{p.titulo}</h1>
        <p className="m-0 mt-4 text-lg text-white/80 max-w-2xl">{p.bajada}</p>
      </div></header>
      <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
        <article className="prosa md:col-span-3" dangerouslySetInnerHTML={{ __html: mdWeb(p.descripcion) }} />
        <aside className="md:col-span-2 card flex flex-col gap-3 md:sticky md:top-24">
          {venta ? (
            <form action={comprar} className="flex flex-col gap-3">
              <p className="m-0 text-3xl font-extrabold">{p.moneda === "ARS" ? "$" : p.moneda + " "}{Number(p.precio).toLocaleString("es-AR")}</p>
              <input type="hidden" name="slug" value={p.slug} />
              <label className="lbl">Nombre<input name="nombre" className="inp" /></label>
              <label className="lbl">Email (te llega la descarga)<input name="email" type="email" required className="inp" /></label>
              <button className="btn-p text-base py-3.5">Comprar con Mercado Pago</button>
              <p className="m-0 text-xs text-[#4A515C]">Pago seguro con Mercado Pago: tarjeta, débito o dinero en cuenta. Descarga inmediata.</p>
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
    </main>
  )
}
