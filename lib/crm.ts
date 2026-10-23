/** CRM básico de DEVISEBIT: contactos (embudo), servicios y proyectos, con Trello opcional. */

export const ETAPAS = [
  { v: "nuevo", n: "Nuevo", c: "bg-red-50 text-rojo" },
  { v: "conversando", n: "Conversando", c: "bg-amber-50 text-amber-700" },
  { v: "reunion", n: "Reunión", c: "bg-sky-50 text-sky-700" },
  { v: "propuesta", n: "Propuesta enviada", c: "bg-violet-50 text-violet-700" },
  { v: "ganado", n: "Ganado", c: "bg-emerald-50 text-emerald-700" },
  { v: "perdido", n: "Perdido", c: "bg-slate-100 text-slate-600" },
] as const

export const ESTADOS_PROY = [
  { v: "planificado", n: "Planificado", c: "bg-slate-100 text-slate-700" },
  { v: "en_curso", n: "En curso", c: "bg-sky-50 text-sky-700" },
  { v: "pausado", n: "Pausado", c: "bg-amber-50 text-amber-700" },
  { v: "terminado", n: "Terminado", c: "bg-emerald-50 text-emerald-700" },
  { v: "cancelado", n: "Cancelado", c: "bg-slate-100 text-slate-500" },
] as const

export const SECTORES = ["Salud", "Estado", "Universidad", "Gremio / mutual", "Empresa", "Otro"]

export const etapa = (v: string) => ETAPAS.find((e) => e.v === v) ?? ETAPAS[0]
export const estadoProy = (v: string) => ESTADOS_PROY.find((e) => e.v === v) ?? ESTADOS_PROY[0]

// ── Trello (opcional): TRELLO_KEY y TRELLO_TOKEN en Vercel ──
const T = "https://api.trello.com/1"
export const trelloActivo = () => !!(process.env.TRELLO_KEY && process.env.TRELLO_TOKEN)
const auth = () => `key=${encodeURIComponent(process.env.TRELLO_KEY!)}&token=${encodeURIComponent(process.env.TRELLO_TOKEN!)}`

/** Crea un tablero con listas Pendiente / En curso / Hecho. */
export async function trelloCrearTablero(nombre: string, desc?: string): Promise<{ id: string; url: string }> {
  const r = await fetch(`${T}/boards/?name=${encodeURIComponent(nombre)}&desc=${encodeURIComponent(desc ?? "")}&defaultLists=false&${auth()}`, { method: "POST" })
  if (!r.ok) throw new Error(`Trello ${r.status}: ${await r.text()}`)
  const b = await r.json()
  for (const [i, l] of ["Pendiente", "En curso", "Hecho"].entries()) {
    await fetch(`${T}/lists?name=${encodeURIComponent(l)}&idBoard=${b.id}&pos=${i + 1}&${auth()}`, { method: "POST" })
  }
  return { id: b.id, url: b.shortUrl ?? b.url }
}

/** Saca el id de tablero de una URL de Trello (https://trello.com/b/XXXX/...). */
export const trelloIdDeUrl = (u: string | null | undefined) => u?.match(/trello\.com\/b\/([A-Za-z0-9]+)/)?.[1] ?? null

export type TrelloResumen = { listas: { nombre: string; tarjetas: { nombre: string; url: string; vence: string | null }[] }[]; total: number; hechas: number }

/** Lee listas y tarjetas abiertas de un tablero. */
export async function trelloResumen(board: string): Promise<TrelloResumen> {
  const r = await fetch(`${T}/boards/${board}/lists?cards=open&card_fields=name,shortUrl,due&fields=name&${auth()}`, { cache: "no-store" })
  if (!r.ok) throw new Error(`Trello ${r.status}`)
  const ls = (await r.json()) as { name: string; cards: { name: string; shortUrl: string; due: string | null }[] }[]
  const listas = ls.map((l) => ({ nombre: l.name, tarjetas: l.cards.map((c) => ({ nombre: c.name, url: c.shortUrl, vence: c.due })) }))
  const total = listas.reduce((a, l) => a + l.tarjetas.length, 0)
  const hechas = listas.filter((l) => /hecho|done|terminad|listo/i.test(l.nombre)).reduce((a, l) => a + l.tarjetas.length, 0)
  return { listas, total, hechas }
}

/** Crea una tarjeta en la primera lista del tablero. */
export async function trelloTarjeta(board: string, nombre: string, vence?: string | null) {
  const r = await fetch(`${T}/boards/${board}/lists?fields=name&${auth()}`, { cache: "no-store" })
  if (!r.ok) throw new Error(`Trello ${r.status}`)
  const [l] = (await r.json()) as { id: string }[]
  if (!l) throw new Error("El tablero no tiene listas")
  const c = await fetch(`${T}/cards?idList=${l.id}&name=${encodeURIComponent(nombre)}${vence ? `&due=${vence}` : ""}&${auth()}`, { method: "POST" })
  if (!c.ok) throw new Error(`Trello ${c.status}`)
}
