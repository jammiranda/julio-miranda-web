import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { sembrar, slugDe, URL_ACADEMIA, mpConfigurado } from "@/lib/academia"
import { fechaHora } from "@/lib/consultas"

export const dynamic = "force-dynamic"
export const maxDuration = 120

async function guardarGuia(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = s(fd.get("id")), titulo = s(fd.get("titulo")) ?? "Sin título"
  const v = [titulo, s(fd.get("bajada")), s(fd.get("categoria")), String(fd.get("contenido") ?? ""), fd.get("exclusiva") === "on", fd.get("publicada") === "on", fd.get("destacada") === "on"]
  if (id) await q("update am_guias set titulo=$1,bajada=$2,categoria=$3,contenido=$4,exclusiva=$5,publicada=$6,destacada=$7,actualizado=now() where id=$8", [...v, Number(id)])
  else await q("insert into am_guias(titulo,bajada,categoria,contenido,exclusiva,publicada,destacada,slug) values ($1,$2,$3,$4,$5,$6,$7,$8)", [...v, slugDe(titulo) + "-" + Date.now().toString(36).slice(-4)])
  await audit(u, "academia_guia", "am_guia", id ?? titulo)
  revalidatePath("/academia-admin")
}

async function guiaIA(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const tema = s(fd.get("tema"))
  if (!tema || !process.env.ANTHROPIC_API_KEY) redirect("/academia-admin?err=Falta%20el%20tema%20o%20la%20clave%20de%20IA")
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5", max_tokens: 3500, messages: [{ role: "user", content: `Escribí una guía práctica para la Academia DEVISEBIT (lectores: dueños, gerentes y equipos de pymes e instituciones argentinas, no técnicos), en español rioplatense, clara, concreta y accionable, de 600 a 900 palabras. Tema: ${tema}.
Nada inventado: si das datos o precios, que sean generales o indicá que son de referencia. Sin nombres de clientes. Cerrá con un botón a WhatsApp ([[Texto|https://wa.me/5491173466490?text=...]]) relacionado al tema.
Formato: "## " subtítulos, "### ", párrafos, "- " listas, "1. " pasos, **negrita**, "> " destacado, [texto](url).
Respondé SOLO un JSON: {"titulo":"...","bajada":"...(1 oración)","categoria":"...(2-3 palabras)","contenido":"..."}` }] }),
  }).catch(() => null)
  let o: any = null
  try { const j = await r!.json(); o = JSON.parse(((j.content ?? []).map((x: any) => x.text ?? "").join("")).match(/\{[\s\S]*\}/)![0]) } catch {}
  if (!o?.contenido) redirect("/academia-admin?err=La%20IA%20no%20pudo%20escribirla%20ahora")
  await q("insert into am_guias(titulo,bajada,categoria,contenido,publicada,slug) values ($1,$2,$3,$4,false,$5)", [o.titulo, o.bajada, o.categoria, o.contenido, slugDe(o.titulo)])
  await audit(u, "academia_guia_ia", "am_guia", o.titulo)
  redirect("/academia-admin?ok=Borrador%20creado%3A%20revisalo%20y%20public%C3%A1lo")
}

async function guardarProducto(fd: FormData) {
  "use server"
  const u = await requerir(["gerente"])
  const id = Number(fd.get("id"))
  const precio = s(fd.get("precio"))
  const est = ["venta", "lista_espera", "oculto"].includes(String(fd.get("estado"))) ? String(fd.get("estado")) : "lista_espera"
  await q("update am_productos set titulo=$1,bajada=$2,descripcion=$3,precio=$4,estado=$5,archivo_url=$6 where id=$7", [s(fd.get("titulo")), s(fd.get("bajada")), String(fd.get("descripcion") ?? ""), precio ? Number(precio.replace(/\./g, "").replace(",", ".")) || null : null, est, s(fd.get("archivo_url")), id])
  await audit(u, "academia_producto", "am_producto", id, est)
  revalidatePath("/academia-admin")
}

export default async function AcademiaAdmin({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requerir(["gerente", "coordinacion"])
  await sembrar()
  const [guias, productos, ordenes, subs] = await Promise.all([
    q<any>("select * from am_guias order by publicada, creado desc"),
    q<any>("select p.*, (select count(*)::int from db_contactos c where ('espera-'||p.slug) = any(c.tags)) espera from am_productos p order by id"),
    q<any>("select o.*, p.titulo from am_ordenes o join am_productos p on p.id=o.producto_id order by o.creado desc limit 30"),
    one<any>("select count(*) filter (where suscrito_en is not null and email_estado='activo')::int activos, count(*) filter (where suscrito_en > now() - interval '7 days')::int semana from db_contactos"),
  ])
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="m-0">Sistema Academia</h1><p className="m-0 text-sm text-[#4A515C]">Guías gratis, newsletter y productos en <a href={URL_ACADEMIA} target="_blank" rel="noopener noreferrer" className="underline">academia.devisebit.com</a>.</p></div>
        <div className="flex gap-3 text-sm"><span className="card py-2 px-4"><strong>{subs?.activos ?? 0}</strong> suscriptos</span><span className="card py-2 px-4"><strong>{subs?.semana ?? 0}</strong> nuevos esta semana</span></div>
      </div>
      {searchParams.ok && <p className="m-0 text-sm text-emerald-700">{searchParams.ok}</p>}
      {searchParams.err && <p className="m-0 text-sm text-rojo">{searchParams.err}</p>}

      <form action={guiaIA} className="card flex flex-col sm:flex-row gap-2 items-stretch sm:items-end border-dashed">
        <label className="lbl flex-1">✨ Nueva guía con IA (queda como borrador)<input name="tema" placeholder="Ej.: cómo usar IA para responder reclamos, Mercado Pago en tu tienda online…" className="inp" /></label>
        <button className="btn-p">Escribir guía</button>
      </form>

      <section id="guias" className="flex flex-col gap-2 scroll-mt-28">
        <h2 className="m-0">Guías <span className="text-sm font-normal text-[#4A515C]">· {guias.filter((g) => g.publicada).length} publicadas</span></h2>
        {guias.map((g) => (
          <details key={g.id} className="card py-3">
            <summary className="cursor-pointer flex flex-wrap items-center gap-2"><strong>{g.titulo}</strong><span className={`chip ${g.publicada ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{g.publicada ? "Publicada" : "Borrador"}</span>{g.exclusiva && <span className="chip bg-[#FDECEB] text-[#9E1A17]">Pide email</span>}<span className="text-xs text-[#4A515C]">{g.vistas} visitas</span>{g.publicada && <a href={`${URL_ACADEMIA}/guias/${g.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs underline">ver</a>}</summary>
            <form action={guardarGuia} className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="hidden" name="id" value={g.id} />
              <label className="lbl md:col-span-2">Título<input name="titulo" defaultValue={g.titulo} className="inp" /></label>
              <label className="lbl">Bajada<input name="bajada" defaultValue={g.bajada ?? ""} className="inp" /></label>
              <label className="lbl">Categoría<input name="categoria" defaultValue={g.categoria ?? ""} className="inp" /></label>
              <label className="lbl md:col-span-2">Contenido<textarea name="contenido" rows={14} defaultValue={g.contenido} className="inp font-mono text-sm" /></label>
              <div className="md:col-span-2 flex flex-wrap gap-4 items-center text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" name="publicada" defaultChecked={g.publicada} /> Publicada</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="destacada" defaultChecked={g.destacada} /> Destacada</label>
                <label className="flex items-center gap-2"><input type="checkbox" name="exclusiva" defaultChecked={g.exclusiva} /> Pide email para leerla (imán)</label>
                <button className="btn-p py-1.5">Guardar</button>
              </div>
            </form>
          </details>
        ))}
      </section>

      <section id="productos" className="flex flex-col gap-2 scroll-mt-28">
        <h2 className="m-0">Productos</h2>
        {!mpConfigurado() && <p className="m-0 text-sm text-[#4A515C]">Para vender, cargá <code>MP_ACCESS_TOKEN</code> de Mercado Pago en Vercel. Mientras tanto los productos funcionan como lista de espera.</p>}
        {productos.map((p) => (
          <form key={p.id} action={guardarProducto} className="card grid grid-cols-1 md:grid-cols-6 gap-3">
            <input type="hidden" name="id" value={p.id} />
            <label className="lbl md:col-span-3">Título<input name="titulo" defaultValue={p.titulo} className="inp" /></label>
            <label className="lbl">Precio (ARS)<input name="precio" inputMode="decimal" defaultValue={p.precio ?? ""} className="inp" /></label>
            <label className="lbl md:col-span-2">Estado<select name="estado" defaultValue={p.estado} className="inp"><option value="lista_espera">Lista de espera ({p.espera} anotados)</option><option value="venta">A la venta</option><option value="oculto">Oculto</option></select></label>
            <label className="lbl md:col-span-6">Bajada<input name="bajada" defaultValue={p.bajada ?? ""} className="inp" /></label>
            <label className="lbl md:col-span-6">Descripción<textarea name="descripcion" rows={6} defaultValue={p.descripcion} className="inp font-mono text-sm" /></label>
            <label className="lbl md:col-span-5">Link del archivo que se entrega (PDF en Drive con acceso por link, etc.)<input name="archivo_url" type="url" defaultValue={p.archivo_url ?? ""} className="inp" /></label>
            <div className="flex items-end"><button className="btn-p w-full">Guardar</button></div>
          </form>
        ))}
      </section>

      <section className="card p-0 overflow-hidden">
        <h2 className="m-0 px-5 pt-4 text-base">Ventas</h2>
        <div className="overflow-x-auto"><table className="tbl"><thead><tr><th>Fecha</th><th>Producto</th><th>Comprador</th><th>Monto</th><th>Estado</th></tr></thead>
          <tbody>{ordenes.map((o) => <tr key={o.id}><td>{fechaHora(o.creado)}</td><td>{o.titulo}</td><td>{o.nombre ?? ""} {o.email}</td><td>{o.moneda} {Number(o.monto).toLocaleString("es-AR")}</td><td>{o.estado}</td></tr>)}
            {!ordenes.length && <tr><td colSpan={5} className="text-center text-[#4A515C] py-5">Todavía no hay ventas.</td></tr>}</tbody></table></div>
      </section>
    </div>
  )
}
