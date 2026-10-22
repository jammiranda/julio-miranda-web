import { timingSafeEqual } from "crypto"
export function claveOk(k: string | null, envName = "IMPORT_KEY") {
  const env = process.env[envName]
  if (!env || !k || env.length !== k.length) return false
  return timingSafeEqual(Buffer.from(env), Buffer.from(k))
}
