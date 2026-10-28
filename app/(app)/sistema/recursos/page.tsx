import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { palabraValida, linkRecurso, type Recurso } from "@/lib/recursos"
import Copiar from "@/components/Copiar"

export const dynamic = "force-dynamic"

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const palabra = palabraValida(String(fd.get("palabra") ?? ""))
  const titulo = s(fd.get("titulo")), url = s(fd.get("url"))
  if (!palabra || palabra.length < 2 || !titulo || !url || !/^https:\/\//.test(url)) redirect("/sistema/recursos?err=" + encodeURIComponent("Completá palabra (2 o más letras), título y un link que empiece con https://"))
  await q(`insert into am_recursos(palabra,titulo,url,mensaje,activo) values ($1,$2,$3,$4,$5)
           on conflict (palabra) do update set titulo=excluded.titulo, url=excluded.url, mensaje=excluded.mensaje, activo=excluded.activo`,
    [palabra, titulo, url, s(fd.get("mensaje")), fd.get("activo") === "on"])
  await audit(u, "recurso_guardado", "am_recurso", palabra)
  revalidatePath("/sistema/recursos")
  redirect("/sistema/recursos?ok=" + encodeURIComponent(`Guardado: ${palabra}`))
}

const textoPost = (r: Recurso) => `💬 Escribinos "${r.palabra}" por mensaje directo y te mandamos ${r.titulo.charAt(0).toLowerCase() + r.titulo.slice(1)} gratis.`

export default async function Recursos({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const lista = await q<Recurso>("select * from am_recursos order by activo desc, creado desc").catch(() => [] as Recurso[])
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0">Recursos con palabra clave</h1>
        <p className="m-0 text-sm text-[#4A515C] max-w-3xl">Para posteos del estilo “escribinos GUIA y te lo mandamos”. Cuando alguien manda la palabra por Instagram o WhatsApp, Bit le responde al instante con el link y le pide el email; si lo deja, queda como contacto con la etiqueta <code>recurso-…</code> y le llega el link por correo. Cada recurso tiene además un link corto para la bio, historias o anuncios.</p>
      </div>
      {searchParams.ok && <p className="m-0 text-sm text-emerald-700">{searchParams.ok}</p>}
      {searchParams.err && <p className="m-0 text-sm text-rojo">{searchParams.err}</p>}

      <ul className="m-0 p-0 list-none grid gap-3 lg:grid-cols-2">
        {lista.map((r) => (
          <li key={r.palabra} className={`card flex flex-col gap-2 ${r.activo ? "" : "opacity-60"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="chip bg-[#0E1116] text-white !text-sm">{r.palabra}</span>
                <strong className="block mt-2">{r.titulo}</strong>
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#4A515C] break-all">{r.url}</a>
              </div>
              <div className="text-right text-sm shrink-0"><strong className="block text-xl">{r.usos}</strong><span className="text-[#4A515C]">pedidos</span><strong className="block text-xl mt-1">{r.emails}</strong><span className="text-[#4A515C]">emails</span></div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Copiar texto={linkRecurso(r.palabra)} etiqueta="Copiar link corto" />
              <Copiar texto={textoPost(r)} etiqueta="Copiar texto para el posteo" />
            </div>
            <details>
              <summary className="cursor-pointer text-sm font-semibold">Editar</summary>
              <Formulario r={r} />
            </details>
          </li>
        ))}
      </ul>

      <section className="card flex flex-col gap-2">
        <h2 className="m-0 text-lg">Nuevo recurso</h2>
        <Formulario />
      </section>

      <p className="m-0 text-xs text-[#4A515C]">Para que funcione por Instagram, la cuenta tiene que estar conectada al sistema (claves IG_TOKEN e IG_USER_ID en Vercel). Por WhatsApp ya funciona.</p>
    </div>
  )
}

function Formulario({ r }: { r?: Recurso }) {
  return (
    <form action={guardar} className="grid gap-2 sm:grid-cols-2 mt-2">
      <label className="lbl">Palabra clave *<input name="palabra" defaultValue={r?.palabra} readOnly={!!r} required maxLength={24} placeholder="GUIA" className="inp uppercase" /></label>
      <label className="lbl">Título *<input name="titulo" defaultValue={r?.titulo} required placeholder="La guía de IA para pymes" className="inp" /></label>
      <label className="lbl sm:col-span-2">Link del recurso *<input name="url" type="url" defaultValue={r?.url} required placeholder="https://academia.devisebit.com/guias/…" className="inp" /></label>
      <label className="lbl sm:col-span-2">Mensaje (opcional)<input name="mensaje" defaultValue={r?.mensaje ?? ""} placeholder="Una línea que explique qué tiene" className="inp" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="activo" defaultChecked={r ? r.activo : true} /> Activo</label>
      <button className="btn-p sm:justify-self-end">{r ? "Guardar cambios" : "Crear recurso"}</button>
    </form>
  )
}
