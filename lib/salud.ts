import type { NextRequest } from "next/server"
import { claveOk } from "./clave"
import { usuarioActual } from "./auth"

/** /api/salud muestra el detalle solo con clave (x-api-key o ?k= con PANEL_TOKEN u OFICINA_TOKEN) o con sesión de Dirección. */
export async function conDetalle(req: NextRequest) {
  const k = req.headers.get("x-api-key") ?? req.nextUrl.searchParams.get("k")
  if (claveOk(k, "PANEL_TOKEN") || claveOk(k, "OFICINA_TOKEN")) return true
  const u = await usuarioActual().catch(() => null)
  return u?.rol === "gerente"
}
