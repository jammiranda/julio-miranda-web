import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { one } from "@/lib/db"
import { archivo } from "@/lib/biblioteca"

export const dynamic = "force-dynamic"

/** Vista interna de cualquier versión (borradores incluidos) para el equipo con sesión. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const u = await usuarioActual()
  if (!u || !["gerente", "coordinacion"].includes(u.rol)) return new NextResponse("Sin permiso", { status: 403 })
  const v = await one<{ id: number; nombre: string; mime: string; completo: boolean }>("select id, nombre, mime, completo from bib_versiones where id=$1", [Number(params.id)])
  const buf = v?.completo ? await archivo(v.id) : null
  if (!v || !buf) return new NextResponse("No encontrado", { status: 404 })
  const disp = req.nextUrl.searchParams.get("descargar") ? "attachment" : "inline"
  return new NextResponse(new Uint8Array(buf), { headers: { "content-type": v.mime, "content-disposition": `${disp}; filename="${encodeURIComponent(v.nombre)}"`, "cache-control": "private, no-store" } })
}
