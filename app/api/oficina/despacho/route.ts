import { NextResponse, type NextRequest } from "next/server"
import { actualizar, listar, tareasPendientes, tokenValido } from "@/lib/oficina"

export const dynamic = "force-dynamic"

/**
 * Despachador: pedidos de "Ejecutar ahora".
 *  GET ?k=TOKEN                  → órdenes con arranque pedido y los agentes (con su trigger) que tienen tareas pendientes
 *  GET ?k=TOKEN&lanzado=ORDEN_ID → marca que ya se lanzaron los agentes de esa orden
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  if (!tokenValido(p.get("k"))) return NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })
  const h = { "cache-control": "no-store" }
  const l = p.get("lanzado")
  if (l) { await actualizar("ordenes", l, { lanzada: new Date().toISOString() }); return NextResponse.json({ ok: true }, { headers: h }) }
  const [ords, ags] = await Promise.all([listar("ordenes", { limite: 60 }), listar("agentes", { limite: 200 })])
  const out: { orden: string; texto: string; agentes: { agente: string; trigger: string; tareas: number }[] }[] = []
  for (const o of ords) {
    if (o.data.estado !== "repartida" || !o.data.ejecutar || o.data.lanzada) continue
    const ids = [...new Set<string>((o.data.reparto ?? []).map((r: any) => String(r.agente)))]
    const agentes: { agente: string; trigger: string; tareas: number }[] = []
    for (const id of ids) {
      const a = ags.find((x) => x.id === id)
      const t = a?.data.trigger
      if (!t) continue
      const n = (await tareasPendientes(id)).length
      if (n) agentes.push({ agente: id, trigger: String(t), tareas: n })
    }
    out.push({ orden: o.id, texto: String(o.data.texto ?? "").slice(0, 120), agentes })
  }
  return NextResponse.json({ ok: true, pedidos: out }, { headers: h })
}
