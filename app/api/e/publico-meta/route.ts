import { NextResponse } from "next/server"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { segmentoSQL } from "@/lib/email"
export const dynamic = "force-dynamic"

/**
 * Lista de clientes para un público personalizado de Meta (Facebook/Instagram).
 * Solo la base depurada: email activo, clasificado, nunca «no-enviar», bajas, rebotados ni excluidos (UBA, UTHGRA San Luis, MC Salud).
 * ?red=1 deja solo la red de Julio (revisada en el Drive). Formato de columnas que Meta reconoce solo: email, fn, ln, country.
 */
export async function GET(req: Request) {
  const u = await requerir(["gerente", "coordinacion"])
  const soloRed = new URL(req.url).searchParams.get("red") === "1"
  const { where, args } = segmentoSQL(soloRed ? { tags: ["red-julio"] } : {})
  const filas = await q<{ email: string; nombre: string | null }>(`select distinct on (lower(c.email)) lower(c.email) email, c.nombre from db_contactos c where ${where} order by lower(c.email)`, args)
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const partes = (n: string | null, email: string) => {
    const t = (n ?? "").replace(/\(.*?\)|[^\p{L}\s'-]/gu, " ").trim().split(/\s+/).filter(Boolean)
    if (!t.length || t.join("").toLowerCase() === email.split("@")[0].replace(/[^a-z]/g, "")) return ["", ""]
    return [t[0], t.length > 1 ? t[t.length - 1] : ""]
  }
  const csv = "email,fn,ln,country\n" + filas.map((f) => { const [fn, ln] = partes(f.nombre, f.email); return [f.email, fn, ln, "AR"].map(esc).join(",") }).join("\n")
  await audit(u, "exportar_publico_meta", "db_contactos", undefined, `${filas.length} contactos${soloRed ? " (red de Julio)" : ""}`).catch(() => {})
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="publico-meta-devisebit${soloRed ? "-red" : ""}.csv"` } })
}
