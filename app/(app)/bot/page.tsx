import Link from "next/link"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { s } from "@/lib/util"
import { fechaHora } from "@/lib/consultas"
import { BOTS } from "@/lib/bots/conocimiento"
import { modoBot } from "@/lib/bot"
import { revisionSemanal, ultimoInforme } from "@/lib/revision"
import { importarConocimiento, leerUrl } from "@/lib/importar-conocimiento"

export const maxDuration = 120

export const dynamic = "force-dynamic"

function empresaDe(_rol?: string, _pedida?: string) {
  return "devisebit" as const
}

async function agregar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const e = empresaDe(u.rol, String(fd.get("e")))
  const respuesta = s(fd.get("respuesta"))
  if (respuesta) {
    await q("insert into bot_conocimiento(empresa,pregunta,respuesta,origen,creado_por) values ($1,$2,$3,'manual',$4)", [e, s(fd.get("pregunta")), respuesta, u.nombre])
    await audit(u, "bot_ensenar", "bot", e)
  }
  redirect(`/bot?e=${e}&ok=1`)
}

/** Importar: archivo (PDF, TXT, MD, CSV), texto pegado o una página web → sugerencias para aprobar. */
async function importar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const e = empresaDe(u.rol, String(fd.get("e")))
  const arch = fd.get("archivo") as File | null
  const url = s(fd.get("url")), texto = s(fd.get("texto"))
  let r: { ok: boolean; n?: number; error?: string }
  try {
    if (arch && arch.size > 0) {
      if (arch.size > 4 * 1024 * 1024) redirect("/bot?imp=" + encodeURIComponent("El archivo pesa más de 4 MB."))
      const buf = Buffer.from(await arch.arrayBuffer())
      const pdf = /pdf$/i.test(arch.type) || /\.pdf$/i.test(arch.name)
      if (!pdf && !/\.(txt|md|csv)$/i.test(arch.name) && !/^text\//.test(arch.type)) redirect("/bot?imp=" + encodeURIComponent("Por ahora acepta PDF, TXT, MD o CSV. Para un Word, guardalo como PDF."))
      r = await importarConocimiento(pdf ? { nombre: arch.name, pdfBase64: buf.toString("base64"), texto } : { nombre: arch.name, texto: buf.toString("utf8") + (texto ? "\n\n" + texto : "") }, e, u.nombre)
    } else if (url) {
      r = await importarConocimiento({ nombre: url, texto: await leerUrl(url) }, e, u.nombre)
    } else if (texto) {
      r = await importarConocimiento({ nombre: "texto pegado", texto }, e, u.nombre)
    } else r = { ok: false, error: "Subí un archivo, pegá un texto o poné un link." }
  } catch (x: any) {
    if (x?.digest?.startsWith?.("NEXT_REDIRECT")) throw x
    r = { ok: false, error: String(x?.message ?? x).slice(0, 160) }
  }
  await audit(u, "bot_importar", "bot", e, r.ok ? `${r.n} sugerencias` : r.error)
  redirect("/bot?imp=" + encodeURIComponent(r.ok ? `Listo: ${r.n} sugerencias para revisar abajo.` : r.error ?? "No se pudo importar."))
}

async function modo(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const e = empresaDe(u.rol, String(fd.get("e")))
  const m = String(fd.get("modo"))
  if (["siempre", "fuera_horario", "nunca"].includes(m)) await q("insert into config(clave,valor) values ($1,$2) on conflict (clave) do update set valor=excluded.valor", [`bot_modo_${e}`, m])
  await audit(u, "bot_modo", "bot", e, m)
  redirect(`/bot?e=${e}`)
}

async function cambiar(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  const e = empresaDe(u.rol, String(fd.get("e")))
  if (fd.get("a") === "guardar") await q("update bot_conocimiento set pregunta=$1, respuesta=$2 where id=$3 and empresa=$4", [s(fd.get("pregunta")), s(fd.get("respuesta")) ?? "", id, e])
  else await q("update bot_conocimiento set activo = not activo where id=$1 and empresa=$2", [id, e])
  await audit(u, "bot_conocimiento_" + fd.get("a"), "bot", id)
  redirect(`/bot?e=${e}`)
}

async function revisarAhora() {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const r = await revisionSemanal(true).catch((x) => String(x))
  await audit(u, "bot_revision", "bot", "devisebit", r)
  redirect(`/bot?rev=${encodeURIComponent(r)}`)
}

async function sugerencia(fd: FormData) {
  "use server"
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("id"))
  if (fd.get("a") === "aprobar") await q("update bot_conocimiento set pregunta=$1, respuesta=$2, activo=true, origen='revision_aprobada' where id=$3 and origen='revision'", [s(fd.get("pregunta")), s(fd.get("respuesta")) ?? "", id])
  else await q("update bot_conocimiento set origen='revision_descartada' where id=$1 and origen='revision'", [id])
  await audit(u, "bot_sugerencia_" + fd.get("a"), "bot", id)
  redirect("/bot")
}

export default async function Bot({ searchParams }: { searchParams: { e?: string; ok?: string; rev?: string; imp?: string } }) {
  const u = await requerir(["gerente", "coordinacion"])
  const e = empresaDe(u.rol, searchParams.e)
  const todas = await q<any>("select * from bot_conocimiento where empresa=$1 and origen <> 'revision_descartada' order by activo desc, id desc", [e])
  const pendientes = todas.filter((r) => r.origen === "revision" && !r.activo)
  const rows = todas.filter((r) => !(r.origen === "revision" && !r.activo))
  const inf = await ultimoInforme().catch(() => null)
  const stats = await q<{ autor: string; n: number }>("select autor, count(*)::int n from wa_mensajes where empresa=$1 and creado > now() - interval '30 days' group by autor", [e])
  const st = Object.fromEntries(stats.map((x) => [x.autor, x.n]))
  const ia = !!process.env.ANTHROPIC_API_KEY
  const md = await modoBot(e as "devisebit")
  return (
    <div className="flex flex-col gap-5 max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="m-0">Bot · Conocimiento</h1>
          <p className="m-0 text-sm text-[#4A515C]">Todo lo que el equipo le enseña al asistente de WhatsApp de {BOTS[e as "devisebit"].nombre}. Lo usa en cada respuesta.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card"><div className="text-xs font-semibold uppercase text-[#4A515C]">Mensajes recibidos (30 días)</div><div className="text-2xl font-extrabold">{st.cliente ?? 0}</div></div>
        <div className="card"><div className="text-xs font-semibold uppercase text-[#4A515C]">Respondió el bot</div><div className="text-2xl font-extrabold">{st.bot ?? 0}</div></div>
        <div className="card"><div className="text-xs font-semibold uppercase text-[#4A515C]">Respondió el equipo</div><div className="text-2xl font-extrabold">{st.equipo ?? 0}</div></div>
        <div className="card"><div className="text-xs font-semibold uppercase text-[#4A515C]">Inteligencia artificial</div><div className={`text-lg font-extrabold ${ia ? "text-[#C8231F]" : "text-amber-700"}`}>{ia ? "Activa" : "Sin activar"}</div></div>
      </div>

      <form action={modo} className="card flex flex-col gap-3">
        <input type="hidden" name="e" value={e} />
        <h2 className="m-0 text-base">¿Cuándo responde el bot?</h2>
        <div className="flex flex-col gap-2 text-sm">
          {[["siempre", "Siempre", "Responde todos los mensajes al instante. Si alguien del equipo contesta (desde el sistema o desde el celular), el bot se corre 24 h en ese chat."],
            ["fuera_horario", "Solo fuera del horario de atención", "De lunes a viernes de 8 a 18 h responde el equipo (el bot solo registra y avisa); de noche y fines de semana atiende el bot."],
            ["nunca", "Nunca (solo registra y avisa)", "No responde: guarda cada conversación en el CRM y manda la notificación."]].map(([v, t, d]) => (
            <label key={v} className="flex gap-2 items-start"><input type="radio" name="modo" value={v} defaultChecked={md === v} className="mt-1" /><span><strong>{t}</strong><span className="block text-[#4A515C]">{d}</span></span></label>
          ))}
        </div>
        <div><button className="btn-s">Guardar</button></div>
      </form>

      <form action={agregar} className="card flex flex-col gap-3">
        <input type="hidden" name="e" value={e} />
        <h2 className="m-0 text-base">Enseñarle algo nuevo</h2>
        <p className="m-0 text-sm text-[#4A515C]">Escribilo como se lo explicarías a una persona nueva del equipo. También podés enseñarle desde cualquier conversación del CRM, con el botón "Enseñar al bot" debajo de una respuesta tuya.</p>
        <label className="lbl">Cuando pregunten… (opcional)<input name="pregunta" className="inp" placeholder="Ej.: ¿Atienden los fines de semana?" /></label>
        <label className="lbl">El bot tiene que saber / responder…<textarea name="respuesta" rows={3} required className="inp" placeholder="Ej.: El equipo atiende de lunes a viernes de 8 a 18 h; fuera de ese horario respondo yo y el equipo retoma el siguiente día hábil." /></label>
        <div><button className="btn-p">Guardar</button>{searchParams.ok && <span className="ml-3 text-sm text-[#9E1A17]">Guardado. El bot ya lo usa.</span>}</div>
      </form>

      <form action={importar} className="card flex flex-col gap-3">
        <input type="hidden" name="e" value={e} />
        <h2 className="m-0 text-base">Importar información</h2>
        <p className="m-0 text-sm text-[#4A515C]">Si alguien te pasa un documento, un folleto o una página con información, subilo acá. La IA lo convierte en respuestas para el bot y te las deja abajo como sugerencias: el bot no las usa hasta que las aprobás.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="lbl">Archivo (PDF, TXT, MD o CSV, hasta 4 MB)<input type="file" name="archivo" accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown,text/csv" className="inp" /></label>
          <label className="lbl">O un link a una página<input name="url" type="url" placeholder="https://…" className="inp" /></label>
        </div>
        <label className="lbl">O pegá el texto (también sirve para aclarar el archivo)<textarea name="texto" rows={3} className="inp" placeholder="Ej.: condiciones del servicio, preguntas frecuentes de un cliente, horarios…" /></label>
        <div><button className="btn-p">Importar y sugerir</button>{searchParams.imp && <span className="ml-3 text-sm text-[#9E1A17]">{searchParams.imp}</span>}</div>
      </form>

      <section className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-base">Revisión semanal</h2>
          <form action={revisarAhora}><button className="btn-s py-1.5">Revisar ahora</button></form>
        </div>
        <p className="m-0 text-sm text-[#4A515C]">Cada viernes a las 8 h se revisan los chats de la semana: dónde Bit inventó algo, se fue largo, no cerró o no derivó. Lo que se puede enseñar queda abajo como sugerencia: el bot no lo usa hasta que lo aprobás.</p>
        {searchParams.rev && <p className="m-0 text-sm text-[#9E1A17]">Resultado: {searchParams.rev}</p>}
        {inf ? (
          <div className="text-sm flex flex-col gap-2">
            <div className="text-xs text-[#4A515C]">Última revisión: {inf.fecha} · {inf.chats} chats · {inf.fallas.length} fallas · {inf.sugerencias} sugerencias</div>
            {inf.resumen && <p className="m-0">{inf.resumen}</p>}
            {inf.fallas.length > 0 && <ul className="m-0 pl-5">{inf.fallas.map((f, i) => <li key={i}><strong>{f.chat}:</strong> {f.problema}</li>)}</ul>}
          </div>
        ) : <p className="m-0 text-sm text-[#4A515C]">Todavía no corrió ninguna revisión.</p>}
      </section>

      {pendientes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-base">Sugerencias para aprobar ({pendientes.length})</h2>
          {pendientes.map((r) => (
            <form key={r.id} action={sugerencia} className="card flex flex-col gap-2">
              <input type="hidden" name="id" value={r.id} />
              <div className="text-xs text-[#4A515C]">{r.creado_por ?? "Revisión semanal"} · {fechaHora(r.creado)}</div>
              <input name="pregunta" defaultValue={r.pregunta ?? ""} className="inp" placeholder="Cuando pregunten…" />
              <textarea name="respuesta" defaultValue={r.respuesta} rows={3} className="inp" />
              <div className="flex gap-2">
                <button name="a" value="aprobar" className="btn-p py-1.5">Aprobar y enseñar</button>
                <button name="a" value="descartar" className="btn-s py-1.5">Descartar</button>
              </div>
            </form>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-base">Lo que ya sabe ({rows.filter((r) => r.activo).length})</h2>
        {rows.map((r) => (
          <details key={r.id} className={`card ${r.activo ? "" : "opacity-50"}`}>
            <summary className="cursor-pointer">
              <strong>{r.pregunta ?? "Información general"}</strong>
              <div className="text-sm text-[#262C37] whitespace-pre-line">{r.respuesta}</div>
              <div className="text-xs text-[#4A515C] mt-1">{r.origen === "conversacion" ? "Aprendido de una conversación" : r.origen === "revision_aprobada" ? "Sugerido por la revisión semanal" : "Cargado a mano"} · {r.creado_por ?? "—"} · {fechaHora(r.creado)}{r.activo ? "" : " · desactivado"}</div>
            </summary>
            <form action={cambiar} className="flex flex-col gap-2 mt-3">
              <input type="hidden" name="id" value={r.id} /><input type="hidden" name="e" value={e} />
              <input name="pregunta" defaultValue={r.pregunta ?? ""} className="inp" placeholder="Cuando pregunten…" />
              <textarea name="respuesta" defaultValue={r.respuesta} rows={3} className="inp" />
              <div className="flex gap-2">
                <button name="a" value="guardar" className="btn-s py-1.5">Guardar cambios</button>
                <button name="a" value="toggle" className="btn-s py-1.5">{r.activo ? "Desactivar" : "Activar"}</button>
              </div>
            </form>
          </details>
        ))}
        {!rows.length && <p className="text-sm text-[#4A515C]">Todavía no le enseñaron nada. Hoy responde con la información base de la empresa.</p>}
      </section>
    </div>
  )
}
