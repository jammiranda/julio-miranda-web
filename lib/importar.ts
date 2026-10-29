import { q } from "./db"

/** Importación de Excel/CSV: reconoce las columnas por su nombre y crea o actualiza registros. */
const norm = (t: unknown) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()

type Col = { k: string; n: string; sin: string[] }
export const COLUMNAS: Record<string, Col[]> = {
  contactos: [
    { k: "nombre", n: "Nombre", sin: ["nombre", "nombre y apellido", "apellido y nombre", "contacto", "name", "full name", "persona"] },
    { k: "organizacion", n: "Organización", sin: ["organizacion", "empresa", "institucion", "company", "organization", "entidad", "cliente"] },
    { k: "cargo", n: "Cargo", sin: ["cargo", "rol", "puesto", "position", "title", "job title"] },
    { k: "email", n: "Email", sin: ["email", "e mail", "mail", "correo", "correo electronico", "email address"] },
    { k: "telefono", n: "Teléfono", sin: ["telefono", "tel", "celular", "whatsapp", "telefono whatsapp", "movil", "phone", "mobile"] },
    { k: "sector", n: "Sector", sin: ["sector", "rubro", "industria", "industry", "vertical"] },
    { k: "categoria", n: "Categoría", sin: ["categoria", "tipo", "segmento", "category"] },
    { k: "etapa", n: "Etapa", sin: ["etapa", "estado", "status", "stage"] },
    { k: "origen", n: "Origen", sin: ["origen", "fuente", "source", "como llego", "canal"] },
    { k: "proximo", n: "Próximo paso", sin: ["proximo paso", "proxima accion", "next step", "siguiente paso"] },
    { k: "proximo_fecha", n: "Fecha próximo paso", sin: ["fecha proximo paso", "fecha proxima accion", "fecha seguimiento"] },
    { k: "ultimo_contacto", n: "Último contacto", sin: ["ultimo contacto", "last contact", "ultima interaccion"] },
    { k: "interacciones", n: "Interacciones", sin: ["interacciones", "mails intercambiados", "mensajes"] },
    { k: "consentimiento", n: "Consentimiento", sin: ["consentimiento", "consent", "acepta comunicaciones"] },
    { k: "notas", n: "Notas", sin: ["notas", "nota", "observaciones", "comentarios", "notes"] },
    { k: "tags", n: "Etiquetas", sin: ["etiquetas", "etiqueta", "tags", "listas", "lista", "segmento email"] },
  ],
  servicios: [
    { k: "nombre", n: "Servicio", sin: ["servicio", "nombre", "producto"] },
    { k: "categoria", n: "Categoría", sin: ["categoria", "tipo", "linea"] },
    { k: "descripcion", n: "Descripción", sin: ["descripcion", "detalle", "alcance"] },
    { k: "precio_ref", n: "Precio de referencia", sin: ["precio", "precio ref", "precio de referencia", "valor"] },
  ],
}

export function plantilla(ent: string) {
  return "﻿" + (COLUMNAS[ent] ?? []).map((c) => c.n).join(";") + "\r\n"
}

function mapear(ent: string, filas: unknown[][]) {
  const cols = COLUMNAS[ent]
  for (let i = 0; i < Math.min(filas.length, 15); i++) {
    const h = (filas[i] ?? []).map(norm)
    const m: Record<string, number> = {}
    for (const c of cols) {
      const j = h.findIndex((x, idx) => x && (c.sin.includes(x) || norm(c.n) === x) && !Object.values(m).includes(idx))
      if (j >= 0) m[c.k] = j
    }
    if (m.nombre != null || m.email != null) return { fila: i, m }
  }
  return null
}

function fechaISO(v: unknown): string | null {
  const t = String(v ?? "").trim()
  if (!t) return null
  let m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (m) { const y = m[3].length === 2 ? "20" + m[3] : m[3]; return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` }
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  if (/^\d{5}$/.test(t)) return new Date(Date.UTC(1899, 11, 30) + Number(t) * 864e5).toISOString().slice(0, 10)
  return null
}
const txt = (v: unknown, n = 300) => { const t = String(v ?? "").trim(); return t ? t.slice(0, n) : null }

/** Pasa un texto libre de estado a una etapa del embudo. */
export function etapaDe(v: unknown) {
  const t = norm(v)
  if (!t) return null
  if (["base", "nuevo", "conversando", "reunion", "propuesta", "ganado", "perdido"].includes(t)) return t
  if (/perdid|descart|no avanz|rechaz/.test(t)) return "perdido"
  if (/cliente|ganad|activo|contrat/.test(t)) return "ganado"
  if (/propuesta|presupuest|cotiz/.test(t)) return "propuesta"
  if (/reunion|demo|llamada/.test(t)) return "reunion"
  if (/convers|contactad|seguimiento|interes/.test(t)) return "conversando"
  if (/nuevo|lead|consulta/.test(t)) return "nuevo"
  return "base"
}

export async function importar(ent: string, filas: unknown[][], soloExistentes = false) {
  if (!COLUMNAS[ent]) throw new Error("Este módulo no se importa")
  const mp = mapear(ent, filas)
  if (!mp) throw new Error("No reconocí los encabezados. La primera fila tiene que tener los nombres de las columnas (por ejemplo: Nombre, Email, Organización).")
  const g = (row: unknown[], k: string) => (mp.m[k] != null ? row[mp.m[k]] : undefined)
  const datos = filas.slice(mp.fila + 1).filter((r) => r.some((x) => String(x ?? "").trim()))
  let omitidos = 0

  if (ent === "servicios") {
    const rows = datos.map((r) => ({ nombre: txt(g(r, "nombre"), 160), categoria: txt(g(r, "categoria"), 80), descripcion: txt(g(r, "descripcion"), 500), precio_ref: Number(String(g(r, "precio_ref") ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")) || null }))
      .filter((x) => (x.nombre ? true : (omitidos++, false)))
    const r = await q<{ nuevo: boolean }>(
      `insert into db_servicios(nombre,categoria,descripcion,precio_ref)
       select nombre,categoria,descripcion,precio_ref from jsonb_to_recordset($1::jsonb) as x(nombre text, categoria text, descripcion text, precio_ref numeric)
       on conflict (nombre) do update set categoria=coalesce(excluded.categoria,db_servicios.categoria), descripcion=coalesce(excluded.descripcion,db_servicios.descripcion), precio_ref=coalesce(excluded.precio_ref,db_servicios.precio_ref)
       returning (xmax = 0) nuevo`,
      [JSON.stringify(rows)],
    )
    const creados = r.filter((x) => x.nuevo).length
    return { creados, actualizados: r.length - creados, omitidos }
  }

  // Contactos: con email se actualiza el existente (mismo email); sin email se crea si no hay otro con el mismo nombre y organización.
  const vistos = new Set<string>()
  const rows = datos.map((r) => {
    const email = txt(g(r, "email"), 160)?.toLowerCase().replace(/^mailto:/, "") ?? null
    const nombre = txt(g(r, "nombre"), 160) ?? (email ? email.split("@")[0] : null)
    const n = Number(String(g(r, "interacciones") ?? "").replace(/\D/g, ""))
    return {
      nombre, email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
      organizacion: txt(g(r, "organizacion"), 160), cargo: txt(g(r, "cargo"), 120), telefono: txt(g(r, "telefono"), 40),
      sector: txt(g(r, "sector"), 60), categoria: txt(g(r, "categoria"), 80), etapa: etapaDe(g(r, "etapa")), origen: txt(g(r, "origen"), 80) ?? "Importación",
      proximo: txt(g(r, "proximo"), 200), proximo_fecha: fechaISO(g(r, "proximo_fecha")), ultimo_contacto: fechaISO(g(r, "ultimo_contacto")),
      interacciones: Number.isFinite(n) && n > 0 ? n : null, consentimiento: txt(g(r, "consentimiento"), 60), notas: txt(g(r, "notas"), 2000),
      tags: String(g(r, "tags") ?? "").split(/[,;|]/).map((x) => norm(x).replace(/ /g, "-")).filter(Boolean).slice(0, 10),
    }
  }).filter((x) => {
    if (!x.nombre) { omitidos++; return false }
    const k = x.email ?? `${x.nombre}|${x.organizacion ?? ""}`.toLowerCase()
    if (vistos.has(k)) { omitidos++; return false }
    vistos.add(k); return true
  })
  const rec = `x(nombre text, email text, organizacion text, cargo text, telefono text, sector text, categoria text, etapa text, origen text, proximo text, proximo_fecha date, ultimo_contacto date, interacciones int, consentimiento text, notas text, tags text[])`
  const cols = "nombre,email,organizacion,cargo,telefono,sector,categoria,etapa,origen,proximo,proximo_fecha,ultimo_contacto,interacciones,consentimiento,notas,tags"
  const sel = "nombre,email,organizacion,cargo,telefono,sector,categoria,coalesce(etapa,'base'),origen,proximo,proximo_fecha,ultimo_contacto,interacciones,consentimiento,notas,coalesce(tags,'{}')"
  const conMail = rows.filter((x) => x.email), sinMail = rows.filter((x) => !x.email)
  let creados = 0, actualizados = 0
  // Depuración: solo suma etiquetas y notas a los que ya están (por email); nunca crea contactos nuevos.
  if (soloExistentes) {
    for (let i = 0; i < conMail.length; i += 500) {
      const r = await q(
        `update db_contactos c set tags=(select array(select distinct unnest(c.tags || coalesce(x.tags,'{}')))),
           notas=case when x.notas is null or c.notas like '%'||x.notas||'%' then c.notas else concat_ws(E'\\n',c.notas,x.notas) end, actualizado=now()
         from jsonb_to_recordset($1::jsonb) as ${rec} where lower(c.email)=lower(x.email) returning c.id`,
        [JSON.stringify(conMail.slice(i, i + 500))],
      )
      actualizados += r.length; omitidos += conMail.slice(i, i + 500).length - r.length
    }
    return { creados: 0, actualizados, omitidos: omitidos + sinMail.length }
  }
  for (let i = 0; i < conMail.length; i += 500) {
    const r = await q<{ nuevo: boolean }>(
      `insert into db_contactos(${cols}) select ${sel} from jsonb_to_recordset($1::jsonb) as ${rec}
       on conflict (lower(email)) where email is not null do update set
         nombre=coalesce(excluded.nombre,db_contactos.nombre), organizacion=coalesce(excluded.organizacion,db_contactos.organizacion),
         cargo=coalesce(excluded.cargo,db_contactos.cargo), telefono=coalesce(excluded.telefono,db_contactos.telefono),
         sector=coalesce(excluded.sector,db_contactos.sector), categoria=coalesce(excluded.categoria,db_contactos.categoria),
         etapa=case when db_contactos.etapa='base' then excluded.etapa else db_contactos.etapa end,
         proximo=coalesce(excluded.proximo,db_contactos.proximo), proximo_fecha=coalesce(excluded.proximo_fecha,db_contactos.proximo_fecha),
         ultimo_contacto=greatest(excluded.ultimo_contacto,db_contactos.ultimo_contacto), interacciones=coalesce(excluded.interacciones,db_contactos.interacciones),
         consentimiento=coalesce(excluded.consentimiento,db_contactos.consentimiento),
         tags=(select array(select distinct unnest(db_contactos.tags || excluded.tags))),
         notas=case when excluded.notas is null or db_contactos.notas like '%'||excluded.notas||'%' then db_contactos.notas else concat_ws(E'\\n',db_contactos.notas,excluded.notas) end,
         actualizado=now()
       returning (xmax = 0) nuevo`,
      [JSON.stringify(conMail.slice(i, i + 500))],
    )
    const c = r.filter((x) => x.nuevo).length
    creados += c; actualizados += r.length - c
  }
  for (let i = 0; i < sinMail.length; i += 500) {
    const r = await q(
      `insert into db_contactos(${cols}) select ${sel} from jsonb_to_recordset($1::jsonb) as ${rec}
       where not exists (select 1 from db_contactos c where lower(c.nombre)=lower(x.nombre) and coalesce(lower(c.organizacion),'')=coalesce(lower(x.organizacion),''))
       returning id`,
      [JSON.stringify(sinMail.slice(i, i + 500))],
    )
    creados += r.length; omitidos += sinMail.slice(i, i + 500).length - r.length
  }
  return { creados, actualizados, omitidos }
}
