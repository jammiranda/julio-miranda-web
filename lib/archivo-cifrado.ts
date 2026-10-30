import { readFile } from "fs/promises"
import path from "path"
import { CLAVES, descifrarBloque } from "./cifrado-gcm"
import { leerArchivoDb, esArchivoDb, metaArchivoDb } from "./academia-archivos"

/**
 * Archivos cifrados de la Academia ("enc:…"). Hay dos lugares posibles:
 * - "enc:private/…": viven en el repositorio (que es público) cifrados con AES-256-GCM
 *   (12 bytes de IV + 16 de tag + datos) y solo se abren en el servidor con una clave cargada en Vercel.
 * - "enc:db:<clave>": viven en la base (am_archivos / am_archivo_partes), subidos por el equipo con
 *   /api/academia/archivos y cifrados en el servidor parte por parte, con el mismo formato (ver lib/academia-archivos.ts).
 * Se prueba ACADEMIA_ARCHIVOS_KEY y, si no abre, CURSOS_ARCHIVOS_KEY (materiales de los cursos). El tag de GCM
 * garantiza que una clave equivocada falla en vez de devolver basura.
 */
export { CLAVES, descifrarBloque }
export const esCifrado = (u: string | null | undefined) => String(u ?? "").startsWith("enc:")
export const hayClaves = () => CLAVES.some((k) => !!process.env[k])

export async function abrirCifrado(archivo: string): Promise<Buffer | null> {
  if (esArchivoDb(archivo)) return leerArchivoDb(archivo)
  const buf = await readFile(path.join(process.cwd(), archivo.replace(/^enc:/, ""))).catch(() => null)
  if (!buf) return null
  return descifrarBloque(buf)
}

export const tipoArchivo = (archivo: string) => (/\.zip(\.enc)?$/.test(archivo) ? "application/zip" : "application/pdf")
export const extension = (archivo: string) => (/\.zip(\.enc)?$/.test(archivo) ? "zip" : "pdf")

/** Nombre y tipo con el que se entrega un archivo cifrado (los de la base guardan su nombre; los del repo lo toman de la ruta). */
export async function datosDescarga(archivo: string): Promise<{ nombre: string; tipo: string }> {
  if (esArchivoDb(archivo)) {
    const m = await metaArchivoDb(archivo)
    if (m) return { nombre: m.nombre, tipo: m.mime }
  }
  return { nombre: `${archivo.replace(/^enc:.*\//, "").replace(/\.(zip|pdf)?\.enc$/, "").replace(/\.(zip|pdf)$/, "")}.${extension(archivo)}`, tipo: tipoArchivo(archivo) }
}
