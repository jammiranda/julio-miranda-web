import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { waitUntil } from "@vercel/functions"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { ETAPAS, CLASES } from "@/lib/crm"
import { ESTILOS, estilo as estiloDe, emailConEstilo } from "@/lib/email-estilos"
import { enviarBrevo, contarSegmento, encolar, procesarCola, brevoConfigurado, enviadosHoy, LIMITE_DIARIO, type Segmento, EXCLUIDOS_SQL } from "@/lib/email"

export const dynamic = "force-dynamic"
export const maxDuration = 300

function segDe(fd: FormData): Segmento {
  const all = (k: string) => fd.getAll(k).map(String).filter(Boolean)
  const lista = (k: string) => String(fd.get(k) ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean)
  return { clases: all("clases"), etapas: all("etapas"), sectores: all("sectores"), categorias: all("categorias"), fuentes: all("fuentes"), tags: lista("tags"), excluirTags: lista("excluir"), soloSuscriptos: fd.get("solo") === "on" }
}

async function guardar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = s(fd.get("id"))
  const asunto = s(fd.get("asunto")) ?? "Sin asunto"
  const v = [asunto, s(fd.get("preheader")), String(fd.get("contenido") ?? ""), JSON.stringify(segDe(fd)), estiloDe(s(fd.get("estilo"))).id, s(fd.get("portada"))]
  let cid: number
  if (id) { await q("update em_campanias set asunto=$1, preheader=$2, contenido=$3, segmento=$4, estilo=$5, portada=$6 where id=$7 and estado='borrador'", [...v, Number(id)]); cid = Number(id) }
  else cid = (await one<{ id: number }>("insert into em_campanias(asunto,preheader,contenido,segmento,estilo,portada,creado_por) values ($1,$2,$3,$4,$5,$6,$7) returning id", [...v, u.nombre]))!.id
  const a = String(fd.get("accion") ?? "guardar")
  if (a === "prueba") {
    const to = s(fd.get("prueba"))
    if (!to) redirect(`/email/${cid}?err=${encodeURIComponent("Poné un email para la prueba")}`)
    const r = await enviarBrevo({ email: to! }, `[Prueba] ${asunto.replace(/\{\{nombre\}\}/g, u.nombre.split(" ")[0])}`, emailConEstilo(String(fd.get("contenido") ?? ""), { estilo: s(fd.get("estilo")), portada: s(fd.get("portada")), preheader: s(fd.get("preheader")), nombre: u.nombre, baja: "https://sistema.devisebit.com/baja/prueba" }))
    redirect(`/email/${cid}?${r.ok ? "ok=" + encodeURIComponent("Prueba enviada a " + to) : "err=" + encodeURIComponent(r.error ?? "error")}`)
  }
  if (a === "ia") {
    const tema = s(fd.get("tema")) ?? "novedades de la semana"
    const txt = await redactar(tema, fd.get("novedades") === "on", estiloDe(s(fd.get("estilo"))).nombre + " (" + estiloDe(s(fd.get("estilo"))).para + ")")
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
  if (a === "reanudar") {
    // La red de Julio (revisada en el Drive) entra a la lista: lo que no tenga clase va por sugerencia o como «Aliados y red».
    const { SQL_SUGERENCIA } = await import("@/lib/crm")
    await q(`update db_contactos c set clase=coalesce(s.sug,'aliado'), clasificado_en=now(), clasificado_por='Revisión de Julio (red-julio)'
             from (select c.id, (${SQL_SUGERENCIA}) sug from db_contactos c where c.clase is null and 'red-julio' = any(c.tags)) s where s.id=c.id`).catch(() => {})
    // Se suman a la cola los contactos válidos que todavía no estaban (los «no-enviar» y excluidos nunca entran).
    const n = await encolar(id)
    await q("update em_campanias set estado='enviando' where id=$1 and estado='pausada'", [id])
    await audit(u, "email_reanudar", "em_campania", id, `${n} destinatarios sumados al reanudar`)
    waitUntil(procesarCola())
    redirect(`/email/${id}?ok=${encodeURIComponent(`Campaña reanudada${n ? `: se sumaron ${n} destinatarios nuevos` : ""}. Sale de a ${LIMITE_DIARIO} por día.`)}`)
  }
  if (a === "duplicar") {
    const n = await one<{ id: number }>("insert into em_campanias(asunto,preheader,contenido,segmento,estilo,portada,creado_por) select 'Copia de '||asunto, preheader, contenido, segmento, estilo, portada, $2 from em_campanias where id=$1 returning id", [id, u.nombre])
    redirect(`/email/${n!.id}`)
  }
  redirect(`/email/${id}`)
}

async function redactar(tema: string, conNovedades: boolean, tipo = "Newsletter") {
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
      messages: [{ role: "user", content: `Escribí un email de tipo "${tipo}" de DEVISEBIT SRL (software e inteligencia artificial para salud, gobierno, universidades, gremios y empresas, desde 2009) en español rioplatense, cercano, útil y concreto, de 250 a 400 palabras. Tema: ${tema}.
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
  if (nueva) redirect("/email/plantillas")
  const k: any = await one<any>("select * from em_campanias where id=$1", [Number(params.id)])
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
  const excluidos = (await one<{ n: number }>(`select count(*)::int n from db_contactos c where c.email is not null and ${EXCLUIDOS_SQL}`).catch(() => null))?.n ?? 0
  const stats = nueva ? null : await one<any>(`select count(*)::int total, count(*) filter (where estado='enviado')::int enviados, count(*) filter (where estado='pendiente')::int pendientes, count(*) filter (where estado='error')::int errores, count(abierto_en)::int abiertos, count(clic_en)::int clics, count(*) filter (where baja)::int bajas, count(*) filter (where bot)::int robots from em_envios where campania_id=$1`, [k.id])
  const links = stats && stats.enviados ? await q<{ url: string; n: number; personas: number }>(`select regexp_replace(url, '[?#].*$', '') url, count(*)::int n, count(distinct envio_id)::int personas from em_clics where campania_id=$1 group by 1 order by 2 desc limit 12`, [k.id]).catch(() => []) : []
  const abrieron = stats && stats.abiertos ? await q<any>(`select e.email, e.abierto_en, e.aperturas, e.clics, e.clic_en, c.id cid, c.nombre, c.organizacion, c.clase,
      (select string_agg(distinct regexp_replace(regexp_replace(x.url, '[?#].*$', ''), '^https?://(www\\.)?', ''), ' · ') from em_clics x where x.envio_id=e.id) destinos
    from em_envios e left join db_contactos c on c.id=e.contacto_id
    where e.campania_id=$1 and (e.abierto_en is not null or e.clic_en is not null)
    order by (e.clic_en is not null) desc, e.clics desc, e.abierto_en desc limit 500`, [k.id]).catch(() => []) : []
  const vista = emailConEstilo(k.contenido, { estilo: k.estilo, portada: k.portada, preheader: k.preheader, nombre: u.nombre, baja: "#" })
  const hoy = await enviadosHoy()
  const Chk = ({ name, v, label, on }: { name: string; v: string; label?: string; on: boolean }) => (
    <label className="cursor-pointer"><input type="checkbox" name={name} value={v} defaultChecked={on} disabled={!editable} className="peer sr-only" />
      <span className="inline-block rounded-full border border-[#C3C8D1] bg-white px-3 py-1 text-xs font-semibold peer-checked:border-[#C8231F] peer-checked:bg-[#FDECEB] peer-checked:text-[#9E1A17]">{label ?? v}</span></label>
  )
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><Link href="/email" className="text-sm text-[#4A515C]">← Envíos</Link> · <Link href="/email/plantillas" className="text-sm text-[#4A515C]">Plantillas</Link><h1 className="m-0">{nueva ? "Nueva campaña" : k.asunto}</h1></div>
        {!nueva && <form action={estado} className="flex gap-2"><input type="hidden" name="id" value={k.id} />
          {k.estado === "enviando" && <button name="a" value="pausar" className="btn-s">Pausar</button>}
          {k.estado === "pausada" && <button name="a" value="reanudar" className="btn-s">Reanudar</button>}
          <button name="a" value="duplicar" className="btn-s">Duplicar</button></form>}
      </div>
      {searchParams.ok && <p role="status" className="m-0 text-sm text-emerald-700">{searchParams.ok}</p>}
      {searchParams.err && <p role="alert" className="m-0 text-sm text-rojo">{searchParams.err}</p>}
      {stats && stats.total > 0 && (
        <section className="grid grid-cols-3 lg:grid-cols-8 gap-3">
          {[["Destinatarios", stats.total], ["Enviados", stats.enviados], ["En cola", stats.pendientes], ["Errores", stats.errores], ["Abrieron", stats.abiertos], ["Clics", stats.clics], ["Bajas", stats.bajas], ["Robots filtrados", stats.robots]].map(([t, n]) => <div key={t} className="card py-3"><span className="text-xs uppercase tracking-wider text-[#4A515C] font-semibold">{t}</span><div className="text-2xl font-extrabold">{n}</div></div>)}
        </section>
      )}
      {abrieron.length > 0 && (
        <section className="card flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 text-base">Quiénes abrieron <span className="font-normal text-[#4A515C]">· {abrieron.length} personas, primero las que hicieron clic</span></h2>
            <a href={`/api/e/abrieron/${k.id}`} className="btn-s py-1 px-3 text-xs">Descargar CSV</a>
          </div>
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="tbl"><thead><tr><th>Contacto</th><th>Abrió</th><th className="text-right">Aperturas</th><th className="text-right">Clics</th><th>Fue a</th></tr></thead>
              <tbody>{abrieron.map((a: any) => (
                <tr key={a.email}>
                  <td>{a.cid ? <Link href={`/contactos/${a.cid}`} className="font-semibold hover:underline">{a.nombre || a.email}</Link> : <span className="font-semibold">{a.email}</span>}<div className="text-xs text-[#4A515C]">{a.email}{a.organizacion ? ` · ${a.organizacion}` : ""}</div></td>
                  <td className="text-xs whitespace-nowrap">{a.abierto_en ? new Date(a.abierto_en).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }) : "—"}</td>
                  <td className="text-right">{a.aperturas}</td>
                  <td className="text-right">{a.clics ? <strong className="text-[#9E1A17]">{a.clics}</strong> : "—"}</td>
                  <td className="text-xs">{a.destinos ?? ""}</td>
                </tr>))}</tbody></table>
          </div>
          <p className="m-0 text-xs text-[#4A515C]">Quienes hicieron clic son los más calientes: conviene escribirles o llamarlos. Los filtros antivirus de bancos, gobierno y empresas abren todos los links apenas llega el correo: esos se detectan como robots y no se cuentan acá. Algunos programas (Apple Mail) marcan como abierto solo; otros (Outlook) no lo registran.</p>
        </section>
      )}
      {links.length > 0 && (
        <section className="card flex flex-col gap-2">
          <h2 className="m-0 text-base">Clics por link</h2>
          <table className="tbl"><thead><tr><th>Link</th><th className="text-right">Personas</th><th className="text-right">Clics</th></tr></thead>
            <tbody>{links.map((l) => <tr key={l.url}><td className="break-all">{l.url.replace(/^https?:\/\/(www\.)?/, "")}</td><td className="text-right">{l.personas}</td><td className="text-right">{l.n}</td></tr>)}</tbody></table>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="lbl">Estilo<select name="estilo" defaultValue={k.estilo ?? "clasico"} disabled={!editable} className="inp">{ESTILOS.map((x) => <option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
              <label className="lbl">Imagen de portada (link, opcional)<input name="portada" defaultValue={k.portada ?? ""} disabled={!editable} className="inp" placeholder="https://…/imagen.jpg" /></label>
            </div>
            <label className="lbl">Asunto<input name="asunto" defaultValue={k.asunto} disabled={!editable} className="inp" placeholder="Podés usar {{nombre}}" /></label>
            <label className="lbl">Texto de vista previa (preheader)<input name="preheader" defaultValue={k.preheader ?? ""} disabled={!editable} className="inp" /></label>
            <label className="lbl">Contenido<textarea name="contenido" rows={16} defaultValue={k.contenido} disabled={!editable} className="inp font-mono text-sm" /></label>
            <p className="m-0 text-xs text-[#4A515C]"># Título · ## Subtítulo · **negrita** · [texto](https://…) · - lista · ![foto](https://…) · [[Botón|https://…]] · --- separador · {"{{nombre}}"}</p>
          </section>
          <section className="card flex flex-col gap-3">
            <h2 className="m-0 text-base">A quién se manda <span className="font-normal text-[#4A515C]">· {total} contactos con email activo{seg && Object.values(seg).some((x) => (Array.isArray(x) ? x.length : x)) ? " en este segmento" : " (toda la base)"}</span></h2>
            <div className="flex flex-col gap-2"><span className="text-xs font-semibold uppercase tracking-wider text-[#4A515C]">Lista</span><div className="flex flex-wrap gap-1.5">{CLASES.filter((x) => x.v !== "descartado").map((x) => <Chk key={x.v} name="clases" v={x.v} label={x.n} on={!!seg.clases?.includes(x.v)} />)}</div><span className="text-xs text-[#4A515C]">Solo se manda a contactos clasificados (no a los que están «Por clasificar» ni a los descartados). UBA (uba.ar, rec.uba.ar), UTHGRA San Luis y MC Salud quedan siempre afuera{excluidos ? ` (${excluidos} contactos)` : ""}.</span></div>
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
          <p className="m-0 text-sm">Se va a mandar a <strong>{total}</strong> contactos. Hoy quedan <strong>{Math.max(0, LIMITE_DIARIO - hoy)}</strong> envíos; el resto sale solo los días siguientes a las 8 h.</p>
          <button className="btn-p" disabled={!brevoConfigurado() || !total}>🚀 Enviar campaña</button>
        </form>
      )}
    </div>
  )
}
