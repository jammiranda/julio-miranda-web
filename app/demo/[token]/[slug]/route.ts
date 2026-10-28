import { NextResponse, type NextRequest } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import { one, q } from "@/lib/db"
import { demoInfo } from "@/lib/demos"
import { notificar } from "@/lib/push"

export const dynamic = "force-dynamic"

/** Sirve una demo privada solo con un link personal vigente. */
export async function GET(req: NextRequest, { params }: { params: { token: string; slug: string } }) {
  const slug = params.slug.replace(/\.html$/, "")
  if (!demoInfo(slug)) return new NextResponse("Demo no encontrada", { status: 404 })
  const a = await one<{ id: number; demos: string[]; blanca: boolean; expira: Date; revocado: boolean; visitas: number; nombre: string | null; email: string }>(
    "select id, demos, blanca, expira, revocado, visitas, nombre, email from demo_accesos where token=$1", [params.token],
  )
  if (!a || a.revocado || new Date(a.expira) < new Date() || !a.demos.includes(slug)) return NextResponse.redirect(new URL(`/demo/${encodeURIComponent(params.token)}`, req.url))
  // Un acceso en marca blanca siempre abre la demo sin marca
  if (a.blanca && req.nextUrl.searchParams.get("marca") !== "blanca") {
    const u = req.nextUrl.clone(); u.searchParams.set("marca", "blanca"); return NextResponse.redirect(u)
  }
  let html = await fs.readFile(path.join(process.cwd(), "private", "demos", `${slug}.html`), "utf8")
  html = html.replace(/<head>/i, '<head><meta name="robots" content="noindex,nofollow">')
  await q("update demo_accesos set visitas=visitas+1, ultima=now(), vistas = jsonb_set(vistas, array[$2::text], to_jsonb(coalesce((vistas->>$2)::int,0)+1)) where id=$1", [a.id, slug])
  if (a.visitas === 0) await notificar(["gerente", "coordinacion"], "👀 Abrieron una demo", `${a.nombre ?? a.email} abrió ${demoInfo(slug)!.titulo}`, "/demos-admin").catch(() => {})
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex, nofollow", "x-frame-options": "SAMEORIGIN" } })
}
