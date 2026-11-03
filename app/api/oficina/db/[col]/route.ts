import { NextResponse, type NextRequest } from "next/server"
import { waitUntil } from "@vercel/functions"
import { agregar, esCol, listar, obtener, procesarOrden, soloJulio, informarEstado } from "@/lib/oficina"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const no = () => NextResponse.json({ ok: false, error: "no autorizado" }, { status: 401 })

export async function GET(req: NextRequest, { params }: { params: { col: string } }) {
  if (!(await soloJulio())) return no()
  if (!esCol(params.col)) return NextResponse.json({ ok: false }, { status: 404 })
  const p = req.nextUrl.searchParams
  const docs = await listar(params.col, { orden: p.get("o"), dir: p.get("d"), limite: Number(p.get("l")) || 200 })
  return NextResponse.json({ ok: true, docs }, { headers: { "cache-control": "no-store" } })
}

export async function POST(req: NextRequest, { params }: { params: { col: string } }) {
  const u = await soloJulio()
  if (!u) return no()
  const b = await req.json().catch(() => null)
  if (!b || typeof b !== "object") return NextResponse.json({ ok: false }, { status: 400 })
  if (params.col === "ordenes") {
    const texto = String(b.texto ?? "").trim().slice(0, 1500)
    if (!texto) return NextResponse.json({ ok: false, error: "orden vacía" }, { status: 400 })
    const id = await agregar("ordenes", { texto, estado: "nueva", creado: new Date().toISOString(), por: "Julio", canal: b.canal === "voz" ? "voz" : "web" })
    waitUntil(procesarOrden(id).catch((e) => console.error("jefe", e)))
    return NextResponse.json({ ok: true, id })
  }
  if (params.col === "eventos") {
    const agente = String(b.agente ?? "")
    const ag = await obtener("agentes", agente)
    if (!ag) return NextResponse.json({ ok: false }, { status: 400 })
    const r = await informarEstado(agente, String(b.estado ?? ""), String(b.paso ?? ""))
    // El estado de las personas lo carga Julio a mano: queda marcado como del panel
    return NextResponse.json(r)
  }
  return NextResponse.json({ ok: false, error: "no permitido" }, { status: 403 })
}
