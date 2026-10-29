import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { GRUPOS, VIDEOS, itemMaterial, type ItemMaterial } from "@/lib/material"
import { enviarBrevo, plantilla } from "@/lib/email"
import Copiar from "@/components/Copiar"

export const dynamic = "force-dynamic"

const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)

async function guardarVideo(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const k = String(fd.get("k") ?? "")
  const url = s(fd.get("url"))
  if (!VIDEOS.some((v) => v.k === k)) return
  if (url && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url)) redirect("/material?err=" + encodeURIComponent("Pegá un link de YouTube (youtube.com o youtu.be)."))
  if (url) await q("insert into material_links(k,url,por) values ($1,$2,$3) on conflict (k) do update set url=excluded.url, actualizado=now(), por=excluded.por", [k, url, u.nombre])
  else await q("delete from material_links where k=$1", [k])
  await audit(u, "material_video", "material", k)
  revalidatePath("/material")
}

async function mandar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const email = (s(fd.get("email")) ?? "").toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(email)) redirect("/material?err=" + encodeURIComponent("El email no es válido."))
  const nombre = s(fd.get("nombre"))
  const ks = fd.getAll("k").map(String)
  const videos = await q<{ k: string; url: string }>("select k, url from material_links")
  const lista: { titulo: string; url: string }[] = []
  for (const k of ks) {
    const it = itemMaterial(k)
    if (it) lista.push({ titulo: it.titulo + (it.tipo === "pdf" ? " (PDF)" : it.tipo === "zip" ? " (ZIP)" : ""), url: it.url })
    const v = VIDEOS.find((x) => x.k === k), vu = videos.find((x) => x.k === k)
    if (v && vu) lista.push({ titulo: `${v.titulo} (video)`, url: vu.url })
  }
  if (!lista.length) redirect("/material?err=" + encodeURIComponent("Elegí al menos un material."))
  const nota = s(fd.get("nota"))
  const cuerpo = `<p style="margin:0 0 12px;font-size:16px">Hola${nombre ? ` ${esc(nombre.split(" ")[0])}` : ""} 👋</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#262C37">${nota ? esc(nota) : "Te dejamos el material que conversamos:"}</p>
<ul style="margin:0 0 18px;padding-left:18px;font-size:15px;line-height:1.8">${lista.map((x) => `<li><a href="${x.url}" style="color:#C8231F;font-weight:600">${esc(x.titulo)}</a></li>`).join("")}</ul>
<p style="margin:0;font-size:14px;color:#4A515C">Cualquier duda respondé este correo o escribinos por WhatsApp al +54 9 11 7346-6490.</p>`
  const env = await enviarBrevo({ email, name: nombre }, "Material de DEVISEBIT", plantilla(cuerpo, { preheader: "El material que conversamos" }))
  await audit(u, "material_enviado", "material", email, ks.join(","))
  redirect("/material?ok=" + encodeURIComponent(env.ok ? `Enviado a ${email}` : `No se pudo enviar: ${(env as any).error}`))
}

const ICONO: Record<ItemMaterial["tipo"], string> = { pdf: "PDF", zip: "ZIP", png: "IMG", video: "▶", link: "↗" }
const msgWA = (titulo: string, url: string) => `Hola! Te paso ${titulo}: ${url}`

export default async function Material({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  await requerir(["gerente", "coordinacion"])
  const videos = await q<{ k: string; url: string }>("select k, url from material_links").catch(() => [])
  const urlVideo = (k: string) => videos.find((v) => v.k === k)?.url ?? ""
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="m-0">Material de venta</h1>
        <p className="m-0 text-sm text-[#4A515C]">Todo para mandar a un cliente en un clic: folletos, el PDF del Panel, piezas para redes y los videos ocultos. Copiá el link, copiá el mensaje para WhatsApp o mandalo por email desde abajo. Las demos interactivas se mandan desde <a href="/demos-admin" className="underline">Demos</a>, y el manual y la presentación institucional desde <a href="/biblioteca" className="underline">Documentos de la empresa</a>.</p>
      </div>
      {searchParams.ok && <p className="m-0 text-sm text-emerald-700">{searchParams.ok}</p>}
      {searchParams.err && <p className="m-0 text-sm text-rojo">{searchParams.err}</p>}

      {GRUPOS.map((g) => (
        <section key={g.t} className="flex flex-col gap-3" aria-labelledby={`g-${g.t}`}>
          <div><h2 id={`g-${g.t}`} className="m-0 text-lg">{g.t}</h2><p className="m-0 text-sm text-[#4A515C]">{g.d}</p></div>
          <ul className="m-0 p-0 list-none grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {g.items.map((it) => (
              <li key={it.k} className="card !p-3 flex flex-col gap-2">
                {it.tipo === "png" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.url} alt={it.titulo} loading="lazy" className="w-full aspect-square object-cover rounded-lg border border-[#E2E5EA]" />
                ) : (
                  <div className={`flex items-center justify-center rounded-lg h-20 text-lg font-extrabold ${it.marca === "blanca" ? "bg-[#EEF2F7] text-[#1D4E89]" : "bg-[#0E1116] text-[#FF6A63]"}`} aria-hidden="true">{ICONO[it.tipo]}</div>
                )}
                <strong className="text-sm leading-snug">{it.titulo}</strong>
                {it.detalle && <span className="text-xs text-[#4A515C]">{it.detalle}</span>}
                <div className="mt-auto flex flex-wrap gap-1.5">
                  <a href={it.url} target="_blank" rel="noopener noreferrer" className="btn-s !py-1 !px-3 !text-xs">Abrir</a>
                  <Copiar texto={it.url} etiqueta="Copiar link" />
                  <Copiar texto={msgWA(it.titulo, it.url)} etiqueta="Mensaje WhatsApp" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-3" aria-labelledby="g-videos">
        <div><h2 id="g-videos" className="m-0 text-lg">Videos de demos (YouTube ocultos)</h2><p className="m-0 text-sm text-[#4A515C]">Pegá el link de cada video cuando lo subas a YouTube como oculto. Solo lo ve quien tiene el link.</p></div>
        <ul className="m-0 p-0 list-none grid gap-2">
          {VIDEOS.map((v) => {
            const url = urlVideo(v.k)
            return (
              <li key={v.k} className="card !p-3 flex flex-wrap items-center gap-2">
                <strong className="text-sm min-w-[220px] flex-1">{v.titulo}</strong>
                <form action={guardarVideo} className="flex gap-1.5 flex-[2_1_320px]">
                  <input type="hidden" name="k" value={v.k} />
                  <input name="url" defaultValue={url} placeholder="https://youtu.be/…" className="inp !py-1.5 flex-1" aria-label={`Link de YouTube: ${v.titulo}`} />
                  <button className="btn-s !py-1 !px-3 !text-xs">Guardar</button>
                </form>
                {url && <div className="flex gap-1.5"><Copiar texto={url} etiqueta="Copiar link" /><Copiar texto={msgWA(`el video "${v.titulo}"`, url)} etiqueta="Mensaje WhatsApp" /></div>}
              </li>
            )
          })}
        </ul>
      </section>

      <form action={mandar} className="card flex flex-col gap-3">
        <h2 className="m-0 text-lg">Mandar material por email</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="lbl">Email *<input name="email" type="email" required className="inp" autoComplete="off" /></label>
          <label className="lbl">Nombre<input name="nombre" className="inp" /></label>
        </div>
        <label className="lbl">Mensaje (opcional)<input name="nota" className="inp" placeholder="Te dejamos el material que conversamos:" /></label>
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-2">
          <legend className="lbl mb-1">Qué mandar</legend>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {GRUPOS.flatMap((g) => g.items.filter((it) => it.tipo !== "png")).map((it) => (
              <label key={it.k} className="flex items-center gap-2 rounded-lg border border-[#E2E5EA] px-3 py-2 text-sm"><input type="checkbox" name="k" value={it.k} />{it.titulo}{it.marca === "blanca" ? " · marca blanca" : ""}</label>
            ))}
            {VIDEOS.filter((v) => urlVideo(v.k)).map((v) => (
              <label key={v.k} className="flex items-center gap-2 rounded-lg border border-[#E2E5EA] px-3 py-2 text-sm"><input type="checkbox" name="k" value={v.k} />▶ {v.titulo}</label>
            ))}
          </div>
        </fieldset>
        <button className="btn-p self-start">Mandar por email</button>
      </form>
    </div>
  )
}
