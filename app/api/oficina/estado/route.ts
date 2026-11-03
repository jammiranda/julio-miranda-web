import { NextResponse } from "next/server"
import { listar, soloJulio } from "@/lib/oficina"

export const dynamic = "force-dynamic"

/** Todo lo que necesita la pantalla en un solo pedido (antes eran cuatro cada 5 segundos). */
export async function GET() {
  if (!(await soloJulio())) return NextResponse.json({ ok: false }, { status: 401 })
  const [agentes, eventos, ordenes, tareas] = await Promise.all([
    listar("agentes", { orden: "orden", dir: "asc", limite: 200 }),
    listar("eventos", { orden: "at", dir: "desc", limite: 400 }),
    listar("ordenes", { orden: "creado", dir: "desc", limite: 30 }),
    listar("tareas", { limite: 300 }),
  ])
  return NextResponse.json({ ok: true, agentes, eventos, ordenes, tareas }, { headers: { "cache-control": "no-store" } })
}
