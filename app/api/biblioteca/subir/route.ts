import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { MAX_ARCHIVO, TROZO, publicar } from "@/lib/biblioteca"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Subida por partes de una versión nueva: iniciar → parte (n veces) → cerrar. Solo gerencia y coordinación. */
export async function POST(req: NextRequest) {
  const u = await usuarioActual()
  if (!u || !["gerente", "coordinacion"].includes(u.rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  const b = await req.json().catch(() => null)
  if (!b) return NextResponse.json({ error: "Pedido inválido" }, { status: 400 })
  if (b.accion === "iniciar") {
    const doc = await one<{ id: number }>("select id from bib_docs where id=$1", [Number(b.doc)])
    const tamano = Number(b.tamano) || 0
    if (!doc) return NextResponse.json({ error: "Documento no encontrado" }, { status: 404 })
    if (tamano <= 0 || tamano > MAX_ARCHIVO) return NextResponse.json({ error: "El archivo tiene que pesar menos de 60 MB" }, { status: 400 })
    const nombre = String(b.nombre ?? "documento.pdf").slice(0, 160)
    const mime = String(b.mime || "application/pdf").slice(0, 100)
    const v = await one<{ id: number; version: number }>(
      `insert into bib_versiones(doc_id,version,notas,nombre,mime,tamano,partes,subido_por)
       values ($1,(select coalesce(max(version),0)+1 from bib_versiones where doc_id=$1),$2,$3,$4,$5,$6,$7) returning id, version`,
      [doc.id, String(b.notas ?? "").slice(0, 500) || null, nombre, mime, tamano, Math.ceil(tamano / TROZO), u.nombre],
    )
    return NextResponse.json({ id: v!.id, version: v!.version, trozo: TROZO })
  }
  const id = Number(b.id)
  const v = await one<{ id: number; doc_id: number; partes: number; completo: boolean; version: number }>("select id, doc_id, partes, completo, version from bib_versiones where id=$1", [id])
  if (!v || v.completo) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 })
  if (b.accion === "parte") {
    const n = Number(b.n)
    if (!Number.isInteger(n) || n < 0 || n >= v.partes || typeof b.datos !== "string") return NextResponse.json({ error: "Parte inválida" }, { status: 400 })
    await q("insert into bib_partes(version_id,n,datos) values ($1,$2,$3) on conflict (version_id,n) do update set datos=excluded.datos", [id, n, b.datos])
    return NextResponse.json({ ok: true })
  }
  if (b.accion === "cerrar") {
    const c = await one<{ n: number }>("select count(*)::int n from bib_partes where version_id=$1", [id])
    if ((c?.n ?? 0) !== v.partes) return NextResponse.json({ error: "Faltan partes del archivo, probá de nuevo" }, { status: 400 })
    await q("update bib_versiones set completo=true where id=$1", [id])
    if (b.publicar) await publicar(id)
    await audit(u, b.publicar ? "doc_version_publicada" : "doc_version_borrador", "bib_versiones", id, `v${v.version}`)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 })
}
