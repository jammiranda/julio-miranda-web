import { createCipheriv, createDecipheriv, randomBytes } from "crypto"

/**
 * AES-256-GCM con el formato que usa la Academia para sus archivos protegidos: IV (12 bytes) + tag (16) + datos.
 * Las claves (32 bytes en base64) están solo en Vercel: ACADEMIA_ARCHIVOS_KEY y CURSOS_ARCHIVOS_KEY.
 */
export const CLAVES = ["ACADEMIA_ARCHIVOS_KEY", "CURSOS_ARCHIVOS_KEY"] as const

/** Descifra un bloque probando las claves cargadas. El tag de GCM hace que una clave equivocada falle en vez de devolver basura. */
export function descifrarBloque(buf: Buffer): Buffer | null {
  if (buf.length < 28) return null
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

/** Clave para cifrar materiales de cursos: CURSOS_ARCHIVOS_KEY (32 bytes en base64). Null si falta o es inválida. */
export function claveCursos(): Buffer | null {
  const k = process.env.CURSOS_ARCHIVOS_KEY
  if (!k) return null
  const b = Buffer.from(k, "base64")
  return b.length === 32 ? b : null
}

export function cifrarBloque(datos: Buffer, clave: Buffer): Buffer {
  const iv = randomBytes(12)
  const c = createCipheriv("aes-256-gcm", clave, iv)
  const enc = Buffer.concat([c.update(datos), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), enc])
}
