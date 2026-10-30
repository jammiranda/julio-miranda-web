import { readFile } from "fs/promises"
import path from "path"
import { createDecipheriv } from "crypto"

/**
 * Archivos cifrados de la Academia ("enc:private/…"): viven en el repositorio (que es público) cifrados con AES-256-GCM
 * (12 bytes de IV + 16 de tag + datos) y solo se abren en el servidor con una clave cargada en Vercel.
 * Se prueba ACADEMIA_ARCHIVOS_KEY y, si no abre, CURSOS_ARCHIVOS_KEY (materiales de los cursos). El tag de GCM
 * garantiza que una clave equivocada falla en vez de devolver basura.
 */
const CLAVES = ["ACADEMIA_ARCHIVOS_KEY", "CURSOS_ARCHIVOS_KEY"] as const
export const esCifrado = (u: string | null | undefined) => String(u ?? "").startsWith("enc:")
export const hayClaves = () => CLAVES.some((k) => !!process.env[k])

export async function abrirCifrado(archivo: string): Promise<Buffer | null> {
  const buf = await readFile(path.join(process.cwd(), archivo.replace(/^enc:/, ""))).catch(() => null)
  if (!buf) return null
  for (const k of CLAVES) {
    const clave = process.env[k]
    if (!clave) continue
    try {
      const d = createDecipheriv("aes-256-gcm", Buffer.from(clave, "base64"), buf.subarray(0, 12))
      d.setAuthTag(buf.subarray(12, 28))
      return Buffer.concat([d.update(buf.subarray(28)), d.final()])
    } catch {}
  }
  return null
}

export const tipoArchivo = (archivo: string) => (/\.zip(\.enc)?$/.test(archivo) ? "application/zip" : "application/pdf")
export const extension = (archivo: string) => (/\.zip(\.enc)?$/.test(archivo) ? "zip" : "pdf")
