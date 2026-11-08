import { timingSafeEqual } from "crypto"
import { q, one } from "./db"
import { usuarioActual, type Usuario } from "./auth"
import { SEMILLA, AREAS } from "./oficina-seed"
import { politicaTexto } from "./oficina-politica"
import { enviarTelegram, primeraVez } from "./telegram"

/** Aviso de la Oficina por Telegram (nunca lanza error). Los "hecho" salen en silencio para no sonar a cada corrida. */
const OFICINA_URL = "https://oficina.devisebit.com"
async function avisoOficina(titulo: string, cuerpo?: string, silencioso = false, clave?: string) {
  try {
    if (clave && !(await primeraVez("of:" + clave, 30))) return
    await enviarTelegram({ titulo, cuerpo, url: OFICINA_URL, silencioso })
  } catch {}
}

/** Base de la Oficina: documentos por colección (agentes, eventos, ordenes, tareas), con la misma forma que usa el panel. */
export const COLECCIONES = ["agentes", "eventos", "ordenes", "tareas"] as const
export type Col = (typeof COLECCIONES)[number]
export const esCol = (c: string): c is Col => (COLECCIONES as readonly string[]).includes(c)
export type Doc = { id: string; data: Record<string, any> }

let listo: Promise<void> | null = null
export function preparar() {
  if (!listo) {
    listo = (async () => {
      await q("create table if not exists of_docs (col text not null, id text not null, data jsonb not null default '{}'::jsonb, creado timestamptz not null default now(), actualizado timestamptz not null default now(), primary key (col, id))")
      await q("create index if not exists of_docs_col_idx on of_docs (col, actualizado desc)")
      const n = await one<{ c: number }>("select count(*)::int c from of_docs where col='agentes'")
      if (!n || n.c === 0) for (const s of SEMILLA) await q("insert into of_docs (col,id,data) values ('agentes',$1,$2::jsonb) on conflict do nothing", [s.id, JSON.stringify(s.data)])
      // Migración v6: áreas con título y responsable (una sola vez; no pisa nombres que Julio cambie después)
      const v = await one<{ v: number }>("select (data->>'v')::int v from of_docs where col='_meta' and id='seed'")
      if (!v || v.v < 6) {
        for (const s of SEMILLA) {
          const d = s.data as Record<string, any>
          const patch = s.id === "claude-dev" ? { nombre: d.nombre, piso: d.piso, equipo: d.equipo, rol: d.rol, orden: d.orden, horario: d.horario, trigger: d.trigger, nohace: d.nohace } : s.id === "jefe-gabinete" || d.tipo === "persona" ? { nombre: d.nombre, piso: d.piso, equipo: d.equipo, rol: d.rol, orden: d.orden } : { piso: d.piso, equipo: d.equipo }
          const r = await q("update of_docs set data = data || $2::jsonb, actualizado=now() where col='agentes' and id=$1 returning id", [s.id, JSON.stringify(patch)])
          if (!r.length) await q("insert into of_docs (col,id,data) values ('agentes',$1,$2::jsonb) on conflict do nothing", [s.id, JSON.stringify(d)])
        }
        await q("insert into of_docs (col,id,data) values ('_meta','seed','{\"v\":6}'::jsonb) on conflict (col,id) do update set data='{\"v\":6}'::jsonb")
      }
    })().catch((e) => { listo = null; throw e })
  }
  return listo
}

/** Solo Julio (rol gerente) entra a la Oficina. */
export async function soloJulio(): Promise<Usuario | null> {
  const u = await usuarioActual()
  return u && u.rol === "gerente" ? u : null
}

/** Token de las tareas programadas (solo puede informar estado y leer sus tareas aprobadas). */
export function tokenValido(k: string | null) {
  const t = process.env.OFICINA_TOKEN ?? ""
  if (!t || !k) return false
  const a = Buffer.from(k), b = Buffer.from(t)
  return a.length === b.length && timingSafeEqual(a, b)
}

const campoOk = (c: string | null | undefined) => (c && /^[a-z_]{1,24}$/.test(c) ? c : null)

export async function listar(col: Col, o: { orden?: string | null; dir?: string | null; limite?: number } = {}): Promise<Doc[]> {
  await preparar()
  const campo = campoOk(o.orden)
  const dir = o.dir === "asc" ? "asc" : "desc"
  const lim = Math.max(1, Math.min(o.limite ?? 200, 600))
  const rows = await q<{ id: string; data: Record<string, any> }>(
    `select id, data from of_docs where col=$1 order by ${campo ? `data->>'${campo}' ${dir} nulls last, ` : ""}actualizado desc limit ${lim}`,
    [col],
  )
  return rows.map((r) => ({ id: r.id, data: r.data }))
}
export async function obtener(col: Col, id: string): Promise<Doc | null> {
  await preparar()
  const r = await one<{ id: string; data: Record<string, any> }>("select id, data from of_docs where col=$1 and id=$2", [col, id])
  return r ? { id: r.id, data: r.data } : null
}
export async function agregar(col: Col, data: Record<string, any>, id?: string): Promise<string> {
  await preparar()
  const nuevo = id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
  await q("insert into of_docs (col,id,data) values ($1,$2,$3::jsonb) on conflict (col,id) do update set data=excluded.data, actualizado=now()", [col, nuevo, JSON.stringify(data)])
  if (col === "eventos" && Math.random() < 0.05) await q("delete from of_docs where col='eventos' and id in (select id from of_docs where col='eventos' order by actualizado desc offset 2500)").catch(() => {})
  return nuevo
}
export async function actualizar(col: Col, id: string, patch: Record<string, any>): Promise<boolean> {
  await preparar()
  const r = await q("update of_docs set data = data || $3::jsonb, actualizado=now() where col=$1 and id=$2 returning id", [col, id, JSON.stringify(patch)])
  return r.length > 0
}

const ESTADOS = ["working", "done", "waiting_user", "error", "idle"]
/** Un agente informa cómo va (lo usan las tareas programadas). El paso se recorta y se limpia de datos sensibles obvios. */
export async function informarEstado(agente: string, estado: string, paso: string) {
  await preparar()
  const ag = await obtener("agentes", agente)
  if (!ag) return { ok: false, error: "agente desconocido" }
  if (!ESTADOS.includes(estado)) return { ok: false, error: "estado inválido" }
  const limpio = paso.replace(/https?:\/\/\S+/g, "").replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "").replace(/\s+/g, " ").trim().slice(0, 60)
  await agregar("eventos", { agente, estado, paso: limpio, at: new Date().toISOString(), por: "agente" })
  // Telegram: errores y "te necesita" suenan; los terminados llegan en silencio (el paso ya viene limpio de mails y links)
  const nombre = String(ag.data.nombre ?? agente)
  if (estado === "error") await avisoOficina(`⚠️ ${nombre} falló`, limpio || undefined, false, `${agente}|${estado}|${limpio}`)
  else if (estado === "waiting_user") await avisoOficina(`🙋 ${nombre} te necesita`, limpio || undefined, false, `${agente}|${estado}|${limpio}`)
  else if (estado === "done") await avisoOficina(`✅ ${nombre} terminó`, limpio || undefined, true, `${agente}|${estado}|${limpio}`)
  return { ok: true }
}

/** Tareas ya aprobadas por Julio para un agente. */
export async function tareasPendientes(agente: string) {
  await preparar()
  const rows = await q<{ id: string; data: Record<string, any> }>("select id, data from of_docs where col='tareas' and data->>'agente'=$1 and data->>'estado'='pendiente' order by creado asc limit 20", [agente])
  return rows.map((r) => ({ id: r.id, texto: r.data.texto, orden: r.data.orden ?? null }))
}
export async function cerrarTarea(id: string, nota: string) {
  const t = await obtener("tareas", id)
  const ok = await actualizar("tareas", id, { estado: "hecha", nota: nota.slice(0, 200), hecha: new Date().toISOString() })
  if (ok && t) await avisoOficina(`✅ Tarea hecha · ${t.data.agente ?? ""}`, [String(t.data.texto ?? "").slice(0, 300), nota ? `Nota: ${nota.slice(0, 200)}` : ""].filter(Boolean).join("\n"), true)
  return ok
}

/* ---------------- Jefe de gabinete ---------------- */

const REGLAS = `PERMISOS (obligatorios; el jefe de oficina propone, Julio da el OK final en los temas importantes):\n${politicaTexto()}\n\nREGLAS DEL EQUIPO (obligatorias):
- Nada sale ni se publica sin el OK de Julio donde sea sensible: los agentes solo dejan borradores (Gmail) y listas; las invitaciones o mensajes de LinkedIn los envía Julio a mano. Ningún agente entra a LinkedIn con el navegador.
- Nunca precios en piezas públicas. Nunca nombrar públicamente UTHGRA, OSDEPYM, MC SALUD ni "Grupo San Gabriel". Nunca usar el título "CIO" para Julio.
- San Patricio SRL está congelada: no se le asigna contenido ni cambios; solo puede nombrarse como proyecto de DEVISEBIT.
- Nada de datos de salud ni finanzas familiares en documentos compartidos. Nunca claves ni secretos en la Oficina.
- Claude (desarrollo, id "claude-dev") es compañero de TODAS las áreas: toda tarea que requiera código, desarrollo web, cambios en el panel, la Academia, integraciones o configuración técnica se le asigna a él, y el responsable del área (por ejemplo Jonathan en Sistemas) la pide y valida el resultado. Cuando el reparto incluya a claude-dev, nombrá también al responsable del área que valida. Cambios que afecten producción, cobros o clientes siempre necesitan el OK final de Julio.
- Cada agente hace solo lo que figura en su rol y respeta su límite ("no hace"). Si el pedido excede a todos los agentes, decilo y proponé qué persona del equipo debería hacerlo.`

let ultimoErrorIA = ""

/** Saca el primer objeto JSON válido de una respuesta (tolera texto alrededor y bloques ```json). */
function leerJSON(txt: string | null): any | null {
  if (!txt) return null
  const limpio = txt.replace(/```(?:json)?/g, "")
  const ini = limpio.indexOf("{")
  if (ini < 0) return null
  for (let fin = limpio.lastIndexOf("}"); fin > ini; fin = limpio.lastIndexOf("}", fin - 1)) {
    try { const v = JSON.parse(limpio.slice(ini, fin + 1)); if (v && typeof v === "object") return v } catch {}
  }
  return null
}
async function claude(system: string, user: string, max = 1500): Promise<string | null> {
  ultimoErrorIA = ""
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) { ultimoErrorIA = "Falta la clave de Claude en el servidor"; return null }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.CLAUDE_MODEL_JEFE ?? process.env.CLAUDE_MODEL ?? "claude-sonnet-5-5", max_tokens: max, system, messages: [{ role: "user", content: user }] }),
    })
    if (!r.ok) {
      const t = await r.text().catch(() => "")
      let m = t.slice(0, 160)
      try { m = JSON.parse(t)?.error?.message ?? m } catch {}
      ultimoErrorIA = `Claude respondió ${r.status}: ${String(m).slice(0, 160)}`
      return null
    }
    const j = await r.json()
    return (j.content ?? []).map((c: any) => c.text ?? "").join("")
  } catch (e: any) {
    ultimoErrorIA = `No se pudo llamar a Claude: ${String(e?.message ?? e).slice(0, 120)}`
    return null
  }
}

async function plantel() {
  const ags = await listar("agentes", { orden: "orden", dir: "asc", limite: 100 })
  return ags.filter((a) => a.id !== "jefe-gabinete")
}
async function fotoDelDia() {
  const ev = await listar("eventos", { orden: "at", dir: "desc", limite: 150 })
  const visto = new Set<string>(); const lineas: string[] = []
  for (const e of ev) { if (visto.has(e.data.agente)) continue; visto.add(e.data.agente); lineas.push(`- ${e.data.agente}: ${e.data.estado}${e.data.paso ? ` (${e.data.paso})` : ""} · ${e.data.at}`) }
  const tk = await q<{ data: Record<string, any> }>("select data from of_docs where col='tareas' and data->>'estado'='pendiente' limit 40")
  return `ÚLTIMO ESTADO POR AGENTE:\n${lineas.join("\n") || "(sin reportes)"}\n\nTAREAS PENDIENTES:\n${tk.map((t) => `- ${t.data.agente}: ${t.data.texto}`).join("\n") || "(ninguna)"}`
}

/** Convierte una orden "nueva" en una propuesta de reparto (o en una respuesta, si era una consulta). Julio aprueba o rechaza. */
export async function procesarOrden(id: string): Promise<{ ok: boolean; estado?: string; error?: string }> {
  await preparar()
  const tomada = await q("update of_docs set data = data || '{\"procesando\":true}'::jsonb where col='ordenes' and id=$1 and data->>'estado'='nueva' and coalesce(data->>'procesando','')<>'true' returning id", [id])
  if (!tomada.length) return { ok: false, error: "ya tomada" }
  const o = await obtener("ordenes", id)
  if (!o) return { ok: false, error: "no existe" }
  const ags = await plantel()
  const areas = new Map<number, { titulo: string; resp?: string }>()
  for (const [piso, a] of Object.entries(AREAS)) areas.set(Number(piso), { titulo: a.titulo, resp: a.responsable ? ags.find((x) => x.id === a.responsable)?.data.nombre : undefined })
  const roster = ags.map((a) => `- id "${a.id}" · ${a.data.nombre} · ${a.data.tipo === "persona" ? "PERSONA" : "AGENTE"} · ÁREA: ${areas.get(a.data.piso)?.titulo ?? "—"} (responsable: ${areas.get(a.data.piso)?.resp ?? "a definir"}) · ${a.data.rol}${a.data.horario ? ` · corre: ${a.data.horario}` : ""}${a.data.nohace ? ` · NO HACE: ${a.data.nohace}` : ""}`).join("\n")
  const system = `Sos el jefe de oficina (una IA) de Julio Miranda (DEVISEBIT SRL y su perfil personal). La jefa de gabinete es Bárbara (persona). La oficina se divide en áreas, cada una con un responsable. Recibís las órdenes de Julio una sola vez, las repartís entre los agentes y personas de cada área, y le pedís el OK. Cuando una tarea de un agente necesita seguimiento o revisión humana, sumá una tarea corta para el responsable del área; si cruza varias áreas, sumá a Bárbara como coordinadora. Si un área no tiene responsable, avisalo en el campo aviso. Hablás en español rioplatense, con voseo, breve.\n\n${REGLAS}\n\nEQUIPO DISPONIBLE:\n${roster}\n\nRespondé SOLO un JSON: {"tipo":"orden"|"consulta","resumen":"1 o 2 oraciones en voseo con qué entendiste y cómo lo repartís (o la respuesta, si es una consulta)","reparto":[{"agente":"<id exacto>","tarea":"instrucción concreta, 1 o 2 oraciones"}],"aviso":"opcional: riesgo o dato que Julio debe saber"}. Si es una consulta de seguimiento (ej. "¿qué pasó con…?"), respondé con el estado real usando los datos y dejá reparto vacío. Usá solo ids de la lista. Un agente programado ejecuta sus tareas aprobadas en su próxima corrida; no prometas horarios que no figuren.`
  const pedido = `ORDEN DE JULIO:\n${String(o.data.texto).slice(0, 1500)}\n\n${await fotoDelDia()}`
  let txt = await claude(system, pedido, 4000)
  let p = leerJSON(txt)
  // Segundo intento: si contestó en prosa o se cortó, se le pide solo el JSON (más corto)
  if (!p && txt !== null) {
    txt = await claude(system + "\n\nIMPORTANTE: tu respuesta anterior no fue un JSON válido. Devolvé ÚNICAMENTE el objeto JSON, sin texto antes ni después, con tareas de 1 oración y como máximo 6 ítems en reparto.", pedido, 4000)
    p = leerJSON(txt)
  }
  // Si igual vino en prosa, se toma como respuesta a una consulta (mejor eso que un error)
  if (!p && txt && txt.trim()) p = { tipo: "consulta", resumen: txt.replace(/```(json)?/g, "").trim().slice(0, 600), reparto: [] }
  if (!p) { await actualizar("ordenes", id, { procesando: false, error: `El jefe no pudo analizar la orden. ${ultimoErrorIA || "La IA no respondió; probá de nuevo en un minuto."}`.trim() }); return { ok: false, error: ultimoErrorIA || "sin respuesta de IA" } }
  const validos = new Set(ags.map((a) => a.id))
  const reparto = (Array.isArray(p.reparto) ? p.reparto : []).filter((r: any) => r && validos.has(r.agente) && r.tarea).slice(0, 8).map((r: any) => ({ agente: String(r.agente), tarea: String(r.tarea).slice(0, 400) }))
  const resumen = [String(p.resumen ?? "").slice(0, 600), p.aviso ? `Ojo: ${String(p.aviso).slice(0, 300)}` : ""].filter(Boolean).join(" ")
  if (!reparto.length) { await actualizar("ordenes", id, { procesando: false, estado: "hecha", resumen, reparto: [], decidida: new Date().toISOString() }); await avisoOficina("🧭 Respuesta del jefe de oficina", resumen.slice(0, 600), true); return { ok: true, estado: "hecha" } }
  await actualizar("ordenes", id, { procesando: false, estado: "propuesta", resumen, reparto, error: null })
  await avisoOficina("🧭 Propuesta lista: necesita tu OK", `${resumen.slice(0, 500)}\n${reparto.map((r: any) => `• ${r.agente}: ${String(r.tarea).slice(0, 120)}`).join("\n")}`.slice(0, 900))
  return { ok: true, estado: "propuesta" }
}

/** Reintento manual: deja la orden como nueva (sin trabar) y la vuelve a procesar. */
export async function reintentarOrden(id: string) {
  await q("update of_docs set data = (data - 'error') || '{\"estado\":\"nueva\",\"procesando\":false}'::jsonb, actualizado=now() where col='ordenes' and id=$1 and data->>'estado' in ('nueva')", [id])
  return procesarOrden(id)
}

/** Al aprobar una propuesta, cada ítem se convierte en una tarea para su agente. */
export async function repartir(id: string): Promise<number> {
  const tomada = await q("update of_docs set data = data || '{\"estado\":\"repartida\"}'::jsonb, actualizado=now() where col='ordenes' and id=$1 and data->>'estado'='aprobada' returning data", [id])
  if (!tomada.length) return 0
  const reparto: { agente: string; tarea: string }[] = (tomada[0] as any).data.reparto ?? []
  for (const r of reparto) await agregar("tareas", { agente: r.agente, texto: r.tarea, estado: "pendiente", orden: id, creado: new Date().toISOString() })
  if (reparto.length) await avisoOficina(`📋 ${reparto.length} tarea${reparto.length > 1 ? "s" : ""} repartida${reparto.length > 1 ? "s" : ""}`, reparto.map((r) => `• ${r.agente}: ${String(r.tarea).slice(0, 120)}`).join("\n").slice(0, 900), true)
  return reparto.length
}

/** Aprobar / rechazar desde cualquier lado (web o WhatsApp). */
export async function decidir(id: string, aprobar: boolean) {
  const o = await obtener("ordenes", id)
  if (!o || o.data.estado !== "propuesta") return { ok: false }
  await actualizar("ordenes", id, { estado: aprobar ? "aprobada" : "rechazada", decidida: new Date().toISOString() })
  const n = aprobar ? await repartir(id) : 0
  return { ok: true, tareas: n }
}

export async function ultimaPropuesta(): Promise<Doc | null> {
  const r = await one<{ id: string; data: Record<string, any> }>("select id, data from of_docs where col='ordenes' and data->>'estado'='propuesta' order by creado desc limit 1")
  return r ? { id: r.id, data: r.data } : null
}

/** Texto de una propuesta para mandar por WhatsApp. */
export function textoPropuesta(o: Doc) {
  const l = (o.data.reparto ?? []).map((r: any) => `• ${r.agente}: ${r.tarea}`).join("\n")
  return `${o.data.resumen ?? "Propuesta lista."}\n${l ? `\n${l}\n` : ""}\nRespondé *OK* para aprobar o *NO* para rechazar.`.slice(0, 3900)
}

/* ---------------- Voz ---------------- */

/** Transcribe un audio (WhatsApp). Necesita OPENAI_API_KEY (u otro servicio compatible); sin clave devuelve null. */
export async function transcribir(audio: ArrayBuffer, mime = "audio/ogg"): Promise<string | null> {
  const groq = process.env.GROQ_API_KEY
  const key = groq ?? process.env.STT_API_KEY ?? process.env.OPENAI_API_KEY
  if (!key) return null
  const f = new FormData()
  f.append("file", new Blob([audio], { type: mime }), mime.includes("mp4") ? "audio.m4a" : "audio.ogg")
  f.append("model", process.env.STT_MODEL ?? (groq ? "whisper-large-v3-turbo" : "gpt-4o-mini-transcribe"))
  f.append("language", "es")
  const r = await fetch(process.env.STT_URL ?? (groq ? "https://api.groq.com/openai/v1/audio/transcriptions" : "https://api.openai.com/v1/audio/transcriptions"), { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: f })
  if (!r.ok) return null
  const j = await r.json().catch(() => null)
  return typeof j?.text === "string" ? j.text.trim() : null
}

export const esJulio = (from: string) => {
  const n = (process.env.OFICINA_WA_NUMERO ?? "").replace(/\D/g, "")
  const f = from.replace(/\D/g, "")
  return n.length >= 8 && f.length >= 8 && n.slice(-10) === f.slice(-10)
}
