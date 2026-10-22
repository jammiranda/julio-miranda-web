/** Verifica un ID token de Google (lo genera ScriptApp.getIdentityToken() en la planilla de Drive)
 *  y devuelve el email si está autorizado (IMPORT_EMAILS, separados por coma). */
const POR_DEFECTO = ["mirandajulioadrian@gmail.com"]

export async function emailGoogleAutorizado(token: string | null): Promise<string | null> {
  if (!token) return null
  try {
    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, { cache: "no-store" })
    if (!r.ok) return null
    const j = await r.json()
    const email = String(j.email ?? "").toLowerCase()
    const ok = j.email_verified === true || j.email_verified === "true"
    const iss = j.iss === "https://accounts.google.com" || j.iss === "accounts.google.com"
    if (!ok || !iss || Number(j.exp) * 1000 < Date.now()) return null
    const permitidos = [...POR_DEFECTO, ...(process.env.IMPORT_EMAILS ?? "").split(",")].map((x) => x.trim().toLowerCase()).filter(Boolean)
    return permitidos.includes(email) ? email : null
  } catch {
    return null
  }
}
