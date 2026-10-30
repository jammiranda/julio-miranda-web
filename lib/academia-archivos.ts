import { createHash } from "crypto"
import { q, one } from "./db"
import { descifrarBloque, cifrarBloque, claveCursos } from "./cifrado-gcm"

/**
 * Materiales protegidos de la Academia guardados en la base (apuntes y cuadernos de los cursos, en PDF).
 *
 * Por qué en la base y no en el repositorio: el repo es público y la clave CURSOS_ARCHIVOS_KEY está solo en Vercel,
 * así que nadie fuera del servidor puede cifrar. El equipo sube el archivo a /api/academia/archivos (por partes de
 * 2,5 MB, como Documentos de la empresa); el servidor cifra CADA parte con AES-256-GCM (IV + tag + datos) antes de
 * guardarla. El archivo en claro nunca queda guardado: solo viaja por HTTPS en la subida y en la descarga.
 *
 * Una lección "descarga" lo referencia con archivo_url = "enc:db:<clave>" (por ejemplo "enc:db:cursos/<slug>/apunte.pdf").
 * Las rutas de descarga del aula (mi-cuenta y portal) ya exigen inscripción y cuenta al día; este módulo solo guarda y abre.
 * Cada clave puede tener varias versiones: la "vigente" es la que se entrega; se conservan la vigente y la anterior.
 */
export const PREFIJO_DB = "enc:db:"
export const TROZO_ARCHIVO = 2_500_000
export const MAX_ARCHIVO_ACADEMIA = 40_000_000

export const esArchivoDb = (u: string | null | undefined) => String(u ?? "").startsWith(PREFIJO_DB)
export const claveDe = (u: string) => u.slice(PREFIJO_DB.length)
/** Claves válidas: minúsculas, números, guiones, puntos y barras (p. ej. cursos/mi-curso/apunte.pdf). */
export const claveValida = (c: string) => /^[a-z0-9][a-z0-9\-_.\/]{2,180}$/.test(c) && !c.includes("..")

export type ArchivoAcademia = { id: number; clave: string; version: number; nombre: string; mime: string; tamano: number; partes: number; sha256: string | null; completo: boolean; vigente: boolean; subido_por: string | null; creado: Date }

const vigenteDe = (clave: string) =>
  one<ArchivoAcademia>("select * from am_archivos where clave=$1 and vigente and completo order by version desc limit 1", [clave])

export async function metaArchivoDb(url: string) {
  return vigenteDe(claveDe(url))
}

/** Arma el archivo descifrando parte por parte. Null si no existe o si no hay clave que lo abra. */
export async function leerArchivoDb(url: string): Promise<Buffer | null> {
  const a = await vigenteDe(claveDe(url))
  if (!a) return null
  return armar(a.id)
}

async function armar(id: number): Promise<Buffer | null> {
  const partes = await q<{ datos: string }>("select datos from am_archivo_partes where archivo_id=$1 order by n", [id])
  if (!partes.length) return null
  const out: Buffer[] = []
  for (const p of partes) {
    const d = descifrarBloque(Buffer.from(p.datos, "base64"))
    if (!d) return null
    out.push(d)
  }
  return Buffer.concat(out)
}

export const listarArchivos = () =>
  q<Omit<ArchivoAcademia, "partes">>("select id, clave, version, nombre, mime, tamano, sha256, completo, vigente, subido_por, creado from am_archivos order by clave, version desc")

// ── Subida por partes ──
export async function iniciarSubida(o: { clave: string; nombre: string; mime: string; tamano: number; sha256?: string | null; por: string }) {
  const r = await one<{ id: number; version: number }>(
    `insert into am_archivos(clave, version, nombre, mime, tamano, partes, sha256, subido_por)
     values ($1, (select coalesce(max(version),0)+1 from am_archivos where clave=$1), $2, $3, $4, $5, $6, $7) returning id, version`,
    [o.clave, o.nombre, o.mime, o.tamano, Math.ceil(o.tamano / TROZO_ARCHIVO), o.sha256 ?? null, o.por],
  )
  // Limpieza: subidas que quedaron a medias hace más de un día
  await q("delete from am_archivos where not completo and creado < now() - interval '1 day'").catch(() => {})
  return r!
}

export async function guardarParte(id: number, n: number, datosBase64: string) {
  const clave = claveCursos()
  if (!clave) throw new Error("Falta CURSOS_ARCHIVOS_KEY en el servidor (o no es una clave de 32 bytes en base64)")
  const a = await one<{ partes: number; completo: boolean }>("select partes, completo from am_archivos where id=$1", [id])
  if (!a || a.completo) throw new Error("Subida no encontrada")
  if (!Number.isInteger(n) || n < 0 || n >= a.partes) throw new Error("Parte inválida")
  const plano = Buffer.from(datosBase64, "base64")
  if (!plano.length || plano.length > TROZO_ARCHIVO) throw new Error("Parte vacía o demasiado grande")
  const cifrado = cifrarBloque(plano, clave).toString("base64")
  await q("insert into am_archivo_partes(archivo_id, n, datos) values ($1,$2,$3) on conflict (archivo_id, n) do update set datos=excluded.datos", [id, n, cifrado])
}

/**
 * Cierra la subida: controla que estén todas las partes, el tamaño y el SHA-256 (descifrando todo), deja esta versión
 * como vigente y borra las versiones más viejas que la anterior. Si es la primera versión de esa clave, publica las
 * lecciones que la esperaban ocultas (las sembradas por el lote "materiales-2026-11"); después, la visibilidad la maneja
 * el equipo en Sistema Academia y una versión nueva no la vuelve a tocar.
 */
export async function cerrarSubida(id: number) {
  const a = await one<ArchivoAcademia>("select * from am_archivos where id=$1", [id])
  if (!a || a.completo) throw new Error("Subida no encontrada")
  const c = await one<{ n: number }>("select count(*)::int n from am_archivo_partes where archivo_id=$1", [id])
  if ((c?.n ?? 0) !== a.partes) throw new Error(`Faltan partes (${c?.n ?? 0} de ${a.partes})`)
  const buf = await armar(id)
  if (!buf) throw new Error("No se pudo verificar el archivo cifrado")
  if (buf.length !== a.tamano) throw new Error(`El tamaño no coincide (${buf.length} ≠ ${a.tamano})`)
  const sha = createHash("sha256").update(buf).digest("hex")
  if (a.sha256 && a.sha256 !== sha) throw new Error("El SHA-256 no coincide: el archivo llegó distinto")
  const previa = await one<{ n: number }>("select count(*)::int n from am_archivos where clave=$1 and completo", [a.clave])
  await q("update am_archivos set completo=true, vigente=true, sha256=$2 where id=$1", [id, sha])
  await q("update am_archivos set vigente=false where clave=$1 and id<>$2", [a.clave, id])
  await q(
    "delete from am_archivos where clave=$1 and id not in (select id from am_archivos where clave=$1 and completo order by version desc limit 2)",
    [a.clave],
  )
  let publicadas = 0
  if (!previa?.n) {
    const r = await q<{ id: number }>("update am_lecciones set publicada=true where archivo_url=$1 and not publicada returning id", [PREFIJO_DB + a.clave])
    publicadas = r.length
  }
  return { version: a.version, sha256: sha, tamano: buf.length, publicadas }
}

// ── Lote "materiales-2026-11": apunte y cuaderno de los 8 cursos a tu ritmo ──
export const LOTE_MATERIALES_2026_11 = "materiales-2026-11"

const CURSOS_CON_MATERIALES = [
  "prompt-engineering-para-ejecutivos",
  "liderazgo-en-la-era-de-la-ia",
  "marca-personal-en-linkedin-para-lideres",
  "ia-para-tu-pyme-5-tareas-en-una-semana",
  "whatsapp-con-ia-asistente-de-tu-negocio",
  "introduccion-a-la-transformacion-digital",
  "panel-de-contenido-con-ia-de-cero-a-produccion",
  "transforma-tu-empresa-con-ia-el-ecosistema-digital",
]

const MATERIALES = [
  {
    archivo: "apunte.pdf",
    titulo: "Apunte del curso (PDF)",
    contenido:
      "El **apunte completo del curso** en PDF, con la marca de ACADEMIA DEVISEBIT: cada lección desarrollada en profundidad, los **casos DEVISEBIT** (cómo lo resolvimos en nuestros propios sistemas), glosario y checklist final.\n\nEs material propio y exclusivo para quienes cursan: te pedimos no compartirlo ni publicarlo. Cada descarga queda registrada en tu cuenta.",
  },
  {
    archivo: "cuaderno.pdf",
    titulo: "Cuaderno de trabajo (PDF)",
    contenido:
      "El **cuaderno de trabajo** para imprimir o completar en la compu: ejercicios por lección, plantillas (tablas, matrices y canvas), un **caso integrador** con una pyme argentina ficticia y un solucionario orientativo al final.\n\nTraelo completo a la videollamada con quien enseña el curso: es la mejor forma de aprovecharla. Material exclusivo para quienes cursan.",
  },
]

/**
 * Agrega al final de cada curso las dos lecciones "descarga". Idempotente: corre una sola vez (am_semillas) y, además,
 * no agrega una lección si el curso ya tiene una con ese archivo o ese título (no pisa lo editado en Sistema Academia).
 * Si el archivo todavía no se subió, la lección queda oculta hasta la primera subida (ver cerrarSubida).
 */
export async function sembrarMateriales() {
  const nuevo = await one<{ lote: string }>("insert into am_semillas(lote) values ($1) on conflict do nothing returning lote", [LOTE_MATERIALES_2026_11])
  if (!nuevo) return
  try {
    for (const slug of CURSOS_CON_MATERIALES) {
      const c = await one<{ id: number }>("select id from am_cursos where slug=$1", [slug])
      if (!c) continue
      for (const m of MATERIALES) {
        const url = `${PREFIJO_DB}cursos/${slug}/${m.archivo}`
        const ya = await one<{ id: number }>("select id from am_lecciones where curso_id=$1 and (archivo_url=$2 or titulo=$3) limit 1", [c.id, url, m.titulo])
        if (ya) continue
        const hay = await vigenteDe(`cursos/${slug}/${m.archivo}`)
        await q(
          `insert into am_lecciones(curso_id, orden, modulo, titulo, tipo, contenido, archivo_url, duracion_min, publicada)
           values ($1, coalesce((select max(orden) from am_lecciones where curso_id=$1),0)+1, 'Materiales del curso', $2, 'descarga', $3, $4, null, $5)`,
          [c.id, m.titulo, m.contenido, url, !!hay],
        )
      }
    }
  } catch (e) {
    await q("delete from am_semillas where lote=$1", [LOTE_MATERIALES_2026_11]).catch(() => {})
    throw e
  }
}
