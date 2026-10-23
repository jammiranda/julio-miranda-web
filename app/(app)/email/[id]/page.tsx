import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { waitUntil } from "@vercel/functions"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { ETAPAS } from "@/lib/crm"
import { aHtml, plantilla, enviarBrevo, contarSegmento, encolar, procesarCola, brevoConfigurado, enviadosHoy, LIMITE_DIARIO, type Segmento } from "@/lib/email"

export const dynamic = "force-dynamic"
export const maxDuration = 300

function segDe(fd: FormData): Segmento {
  const all = (k: string) => fd.getAll(k).map(String).filter(Boolean)
  const lista = (k: string) => String(fd.get(k) ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
  return { etapas: all("etapas"), sectores: all("sectores"), categorias: all("categorias"), fuentes: all("fuentes"), tags: lista("tags"), excluirTags: lista("excluir"), soloSuscriptos: fd.get("solo") === "on" }
}

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = s(fd.get("id"))
  const asunto = s(fd.get("asunto")) ?? "Sin asunto"
  const v = [asunto, s(fd.get("preheader")), String(fd.get("contenido") ?? ""), JSON.stringify(segDe(fd))]
  let cid: number
  if (id) { await q("update em_campanias set asunto=$1, preheader=$2, contenido=$3, segmento=$4 where id=$5 and estado='borrador'", [...v, Number(id)]); cid = Number(id) }
  else cid = (await one<{ id: number }>("insert into em_campanias(asunto,preheader,contenido,segmento,creado_por) values ($1,$2,$3,$4,$5) returning id", [...v, u.nombre]))!.id
  const a = String(fd.get("accion") ?? "guardar")
  if (a === "prueba") {
    const to = s(fd.get("prueba"))
    if (!to) redirect(`/email/${cid}?err=${encodeURIComponent("Poné un email para la prueba")}`)
    const r = await enviarBrevo({ email: to! }, `[Prueba] ${asunto.replace(/\{\{nombre\}\}/g, u.nombre.split(" ")[0])}`, plantilla(aHtml(String(fd.get("contenido") ?? "")), { preheader: s(fd.get("preheader")), nombre: u.nombre, baja: "https://sistema.devisebit.com/baja/prueba" }))
    redirect(`/email/${cid}?${r.ok ? "ok=" + encodeURIComponent("Prueba enviada a " + to) : "err=" + encodeURIComponent(r.error ?? "error")}`)
  }
  if (a === "ia") {
    const tema = s(fd.get("tema")) ?? "novedades de la semana"
    const txt = await redactar(tema, fd.get("novedades") === "on")
    if (txt) await q("update em_campanias set asunto=$1, preheader=$2, contenido=$3 where id=$4", [txt.asunto, txt.preheader, txt.contenido, cid])
    redirect(`/email/${cid}?${txt ? "ok=" + encodeURIComponent("Borrador escrito por la IA: revisalo") : "err=" + encodeURIComponent("La IA no pudo escribirlo ahora")}`)
  }
  await audit(u, "email_guardar", "em_campania", cid)
  redirect(`/email/${cid}?ok=Guardado`)
}

async function lanzar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const n = await encolar(id)
  await q("update em_campanias set estado='enviando', lanzada=coalesce(lanzada, now()) where id=$1", [id])
  await audit(u, "email_lanzar", "em_campania", id, `${n} destinatarios`)
  waitUntil(procesarCola())
  redirect(`/email/${id}?ok=${encodeURIComponent(`Campaña en marcha: ${n} destinatarios. Hoy salen hasta ${LIMITE_DIARIO}; el resto sigue solo cada día.`)}`)
}

async function estado(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id")), a = String(fd.get("a"))
  if (a === "pausar") await q("update em_campanias set estado='pausada' where id=$1 and estado='enviando'", [id])
  if (a === "reanudar") { await q("update em_campanias set estado='enviando' where id=$1 and estado='pausada'", [id]); waitUntil(procesarCola()) }
  if (a === "duplicar") {
    const n = await one<{ id: number }>("insert into em_campanias(asunto,preheader,contenido,segmento,creado_por) select 'Copia de '||asunto, preheader, contenido, segmento, $2 from em_campanias where id=$1 returning id", [id, u.nombre])
    redirect(`/email/${n!.id}`)
  }
  redirect(`/email/${id}`)
}

async function redactar(tema: string, conNovedades: boolean) {
  if (!process.env.ANTHROPIC_API_KEY) return null
  let novedades = ""
  if (conNovedades) {
    try { novedades = (await (await fetch("https://www.devisebit.com/novedades", { cache: "no-store" })).text()).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 8000) } catch {}
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5", max_tokens: 2000,
      messages: [{ role: "user", content: `Escribí un newsletter de DEVISEBIT SRL (software e inteligencia artificial para salud, gobierno, universidades, gremios y empresas, desde 2009) en español rioplatense, cercano, útil y concreto, de 250 a 400 palabras. Tema: ${tema}.
${novedades ? `Usá las novedades publicadas en devisebit.com/novedades (texto de la página): ${novedades}\nIncluí 2 o 3 notas con su link (https://www.devisebit.com/novedades/...) si los encontrás.` : ""}
Reglas: sin precios, sin nombres de clientes que no sean casos públicos, nada inventado. Terminá con una invitación a responder el correo o escribir por WhatsApp (https://wa.me/5491173466490).
Formato del contenido (texto simple): "# Título", "## Subtítulo", párrafos, "- " para listas, **negrita**, [texto](url), y un botón con [[Texto del botón|https://...]]. Podés usar {{nombre}} para saludar.
Respondé SOLO un JSON: {"asunto":"...(máx 60 caracteres)","preheader":"...(máx 90)","contenido":"..."}` }],
    }),
  }).catch(() => null)
  if (!r?.ok) return null
  const j = await r.json()
  const t: string = (j.content ?? []).map((x: any) => x.text ?? "").join("")
  try { const o = JSON.parse(t.match(/\{[\s\S]*\}/)![0]); return o.contenido ? o : null } catch { return null }
}

export default async function Campania({ params, searchParams }: { params: { id: string }; searchParams: { ok?: string; err?: string } }) {
  const u = await requerir(["gerente", "coordinacion"])
  const nueva = params.id === "nueva"
  const k: any = nueva ? { asunto: "", preheader: "", contenido: "# Hola {{nombre}} 👋\n\nEscribí acá tu novedad.\n\n[[Hablemos por WhatsApp|https://wa.me/5491173466490]]", segmento: {}, estado: "borrador" } : await one<any>("select * from em_campanias where id=$1", [Number(params.id)])
  if (!k) notFound()
  const seg: Segmento = k.segmento ?? {}
  const editable = k.estado === "borrador"
  const [sectores, categorias, fuentes, tags, yo] = await Promise.all([
    q<{ v: string }>("select distinct sector v from db_contactos where sector is not null order by 1"),
    q<{ v: string }>("select distinct categoria v from db_contactos where categoria is not null order by 1"),
    q<{ v: string }>("select distinct fuente v from db_contactos where fuente is not null order by 1"),
    q<{ v: string }>("select distinct unnest(tags) v from db_contactos order by 1"),
    one<{ email: string | null }>("select email from usuarios where id=$1", [u.id]),
  ])
  const total = await contarSegmento(seg)
  const stats = nueva ? null : await one<any>(`select count(*)::int total, count(*) filter (where estado='enviado')::int enviados, count(*) filter (where estado='pendiente')::int pendientes, count(*) filter (where estado='error')::int errores, count(abierto_en)::int abiertos, count(clic_en)::int clics, count(*) filter (where baja)::int bajas from em_envios where campania_id=$1`, [k.id])
  const vista = plantilla(aHtml(k.contenido), { preheader: k.preheader, nombre: u.nombre, baja: "#" })
  const hoy = await enviadosHoy()
  const Chk = ({ name, v, label, on }: { name: string; v: string; label?: string; on: boolean }) => (
    <label className="cursor-pointer"><input type="checkbox" name={name} value={v} defaultChecked={on} disabled={!editable} className="peer sr-only" />
      <span className="inline-block rounded-full border border-[#C3C8D1] bg-white px-3 py-1 text-xs font-semibold peer-checked:border-[#C8231F] peer-checked:bg-[#FDECEB] peer-checked:text-[#9E1A17]">{label ?? v}</span></label>
  )
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><Link href="/email" className="text-sm text-[#4A515C]">← Email marketing</Link><h1 className="m-0">{nueva ? "Nueva campaña" : k.asunto}</h1></div>
        {!nueva && <form action={estado} className="flex gap-2"><input type="hidden" name="id" value={k.id} />
          {k.estado === "enviando" && <button name="a" value="pausar" className="btn-s">Pausar</button>}
          {k.estado === "pausada" && <button name="a" value="reanudar" className="btn-s">Reanudar</button>}
          <button name="a" value="duplicar" className="btn-s">Duplicar</button></form>}
      </div>
      {searchParams.ok && <p role="status" className="m-0 text-sm text-emerald-700">{searchParams.ok}</p>}
      {searchParams.err && <p role="alert" className="m-0 text-sm text-rojo">{searchParams.err}</p>}
      {stats && stats.total > 0 && (
        <section className="grid grid-cols-3 lg:grid-cols-7 gap-3">
          {[["Destinatarios", stats.total], ["Enviados", stats.enviados], ["En cola", stats.pendientes], ["Errores", stats.errores], ["Abrieron", stats.abiertos], ["Clics", stats.clics], ["Bajas", stats.bajas]].map(([t, n]) => <div key={t} className="card py-3"><span className="text-xs uppercase tracking-wider text-[#4A515C] font-semibold">{t}</span><div className="text-2xl font-extrabold">{n}</div></div>)}
        </section>
      )}
      <form action={guardar} className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {!nueva && <input type="hidden" name="id" value={k.id} />}
        <div className="flex flex-col gap-4">
          {editable && (
            <section className="card flex flex-col gap-2 border-dashed">
              <h2 className="m-0 text-base">✨ Que lo escriba la IA</h2>
              <input name="tema" placeholder="Tema: ej. 5 usos de IA para pymes, novedades del mes…" className="inp" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="novedades" defaultChecked /> Usar las últimas novedades de devisebit.com</label>
              <button name="accion" value="ia" className="btn-s self-start">Escribir borrador</button>
            </section>
          )}
          <section className="card flex flex-col gap-3">
            <label className="lbl">Asunto<input name="asunto" defaultValue={k.asunto} disabled={!editable} className="inp" placeholder="Podés usar {{nombre}}" /></label>
            <label className="lbl">Texto de vista previa (preheader)<input name="preheader" defaultValue={k.preheader ?? ""} disabled={!editable} className="inp" /></label>
            <label className="lbl">Contenido<textarea name="contenido" rows={16} defaultValue={k.contenido} disabled={!editable} className="inp font-mono text-sm" /></label>
            <p className="m-0 text-xs text-[#4A515C]"># Título · ## Subtítulo · **negrita** · [texto](https://…) · - lista · ![foto](https://…) · [[Botón|https://…]] · --- separador · {"{{nombre}}"}</p>
          </section>
          <section className="card flex flex-col gap-3">
            <h2 className="m-0 text-base">A quién se manda <span className="font-normal text-[#4A515C]">· {total} contactos con email activo{seg && Object.values(seg).some((x) => (Array.isArray(x) ? x.length : x)) ? " en este segmento" : " (toda la base)"}</span></h2>
            <div className="flex flex-col gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">Etapa</span><div className="flex flex-wrap gap-1.5">{ETAPAS.map((e) => <Chk key={e.v} name="etapas" v={e.v} label={e.n} on={!!seg.etapas?.includes(e.v)} />)}</div></div>
            {sectores.length > 0 && <div className="flex flex-col gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">Sector</span><div className="flex flex-wrap gap-1.5">{sectores.map((x) => <Chk key={x.v} name="sectores" v={x.v} on={!!seg.sectores?.includes(x.v)} />)}</div></div>}
            {categorias.length > 0 && <div className="flex flex-col gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">Categoría</span><div className="flex flex-wrap gap-1.5">{categorias.map((x) => <Chk key={x.v} name="categorias" v={x.v} on={!!seg.categorias?.includes(x.v)} />)}</div></div>}
            {fuentes.length > 0 && <div className="flex flex-col gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">Origen</span><div className="flex flex-wrap gap-1.5">{fuentes.map((x) => <Chk key={x.v} name="fuentes" v={x.v} on={!!seg.fuentes?.includes(x.v)} />)}</div></div>}
            <label className="lbl">Con estas etiquetas (separadas por coma)<input name="tags" defaultValue={(seg.tags ?? []).join(", ")} disabled={!editable} list="tags" className="inp" placeholder={tags.slice(0, 4).map((t) => t.v).join(", ") || "newsletter"} /></label>
            <label className="lbl">Excluir etiquetas<input name="excluir" defaultValue={(seg.excluirTags ?? []).join(", ")} disabled={!editable} className="inp" placeholder="ej. no-enviar" /></label>
            <datalist id="tags">{tags.map((t) => <option key={t.v} value={t.v} />)}</datalist>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="solo" defaultChecked={!!seg.soloSuscriptos} disabled={!editable} /> Solo quienes se suscribieron al newsletter</label>
          </section>
          {editable && (
            <section className="card flex flex-col gap-3">
              <div className="flex flex-wrap gap-2"><button name="accion" value="guardar" className="btn-p">Guardar</button></div>
              <div className="flex flex-wrap gap-2 items-end"><label className="lbl flex-1">Mandar prueba a<input name="prueba" type="email" defaultValue={yo?.email ?? ""} className="inp" /></label><button name="accion" value="prueba" className="btn-s" disabled={!brevoConfigurado()}>Enviar prueba</button></div>
            </section>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:sticky lg:top-28">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">Vista previa (guardá para actualizarla)</span>
          <iframe title="Vista previa" srcDoc={vista} className="w-full h-[720px] rounded-2xl border border-[#E2E5EA] bg-white" />
        </div>
      </form>
      {!nueva && editable && (
        <form action={lanzar} className="card flex flex-wrap items-center justify-between gap-3 border-2 border-[#C8231F]">
          <input type="hidden" name="id" value={k.id} />
          <p className="m-0 text-sm">Se va a mandar a <strong>{total}</strong> contactos. Hoy quedan <strong>{Math.max(0, LIMITE_DIARIO - hoy)}</strong> envíos; el resto sale solo los días siguientes a las 10 h.</p>
          <button className="btn-p" disabled={!brevoConfigurado() || !total}>🚀 Enviar campaña</button>
        </form>
      )}
    </div>
  )
}
