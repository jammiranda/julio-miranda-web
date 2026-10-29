import { randomBytes } from "crypto"
import { q, one } from "./db"
import { enviarBrevo, plantilla } from "./email"
import { URL_SISTEMA } from "./brief"

/**
 * Documentos de la empresa: manual general, presentación institucional y manuales por rol.
 * Cada documento tiene versiones (borrador → vigente → anterior). Se comparte con un link personal
 * que siempre abre la versión vigente, vence, se puede revocar y avisa cuando lo abren.
 * Los archivos se guardan en la base, partidos en trozos (bib_partes), para no depender de la web pública.
 */
export type Doc = { id: number; slug: string; titulo: string; descripcion: string | null; confidencial: boolean; orden: number }
export type Version = { id: number; doc_id: number; version: number; notas: string | null; nombre: string; mime: string; tamano: number; partes: number; completo: boolean; estado: "borrador" | "vigente" | "anterior"; subido_por: string | null; creado: Date; publicado: Date | null }
export type Envio = { id: number; token: string; doc_id: number; email: string | null; nombre: string | null; canal: string; expira: Date; revocado: boolean; visitas: number; descargas: number; ultima: Date | null; creado_por: string | null; creado: Date }

/** Trozo máximo que manda el navegador por pedido (en bytes del archivo, antes de base64). */
export const TROZO = 2_500_000
export const MAX_ARCHIVO = 60_000_000

export const docs = () => q<Doc>("select * from bib_docs order by orden, id")
export const docPorSlug = (slug: string) => one<Doc>("select * from bib_docs where slug=$1", [slug])
export const vigente = (docId: number) => one<Version>("select * from bib_versiones where doc_id=$1 and estado='vigente' and completo order by version desc limit 1", [docId])

export async function archivo(versionId: number): Promise<Buffer | null> {
  const partes = await q<{ datos: string }>("select datos from bib_partes where version_id=$1 order by n", [versionId])
  if (!partes.length) return null
  return Buffer.concat(partes.map((p) => Buffer.from(p.datos, "base64")))
}

export async function publicar(versionId: number) {
  const v = await one<Version>("select * from bib_versiones where id=$1", [versionId])
  if (!v || !v.completo) return false
  await q("update bib_versiones set estado='anterior' where doc_id=$1 and estado='vigente' and id<>$2", [v.doc_id, v.id])
  await q("update bib_versiones set estado='vigente', publicado=now() where id=$1", [v.id])
  return true
}

export const linkEnvio = (e: { token: string }) => `${URL_SISTEMA}/doc/${e.token}`

export async function crearEnvio(o: { docId: number; email?: string | null; nombre?: string | null; canal: "email" | "whatsapp" | "link"; dias: number; por: string; contactoId?: number | null }) {
  const token = randomBytes(18).toString("base64url")
  return (await one<Envio>(
    `insert into bib_envios(token,doc_id,email,nombre,canal,expira,creado_por,contacto_id) values ($1,$2,$3,$4,$5,now() + ($6 || ' days')::interval,$7,$8) returning *`,
    [token, o.docId, o.email ?? null, o.nombre ?? null, o.canal, String(Math.min(Math.max(o.dias, 1), 180)), o.por, o.contactoId ?? null],
  ))!
}

const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
const venceTxt = (d: Date) => new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "numeric", month: "long" })

export async function mandarEnvio(e: Envio, d: Doc, nota?: string | null) {
  const link = linkEnvio(e)
  const cuerpo = `<p style="margin:0 0 12px;font-size:16px">Hola${e.nombre ? ` ${esc(e.nombre.split(" ")[0])}` : ""} 👋</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#262C37">${nota ? esc(nota) : `Te compartimos <strong>${esc(d.titulo)}</strong>.`}</p>
<p style="margin:0 0 20px"><a href="${link}" style="display:inline-block;background:#C8231F;color:#fff;font-weight:700;text-decoration:none;padding:13px 22px;border-radius:10px">Ver el documento</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#4A515C">El link es personal y vale hasta el ${venceTxt(e.expira)}. Siempre abre la versión más reciente.${d.confidencial ? " Es un documento de uso interno: te pedimos no reenviarlo." : ""}</p>
<p style="margin:0;font-size:13px;color:#4A515C">Cualquier duda respondé este correo o escribinos por WhatsApp al +54 9 11 7346-6490.</p>`
  return enviarBrevo({ email: e.email!, name: e.nombre }, d.titulo, plantilla(cuerpo, { preheader: d.titulo }))
}

export const mensajeWA = (e: Envio, d: Doc) =>
  `${e.nombre ? `${e.nombre.split(" ")[0]}, ` : "Hola! "}te comparto ${d.titulo}: ${linkEnvio(e)}\nEs un link personal, vale hasta el ${venceTxt(e.expira)}.`

export const peso = (b: number) => (b >= 1_000_000 ? `${(b / 1_000_000).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1000))} KB`)
