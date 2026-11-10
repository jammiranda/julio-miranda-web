import { NextResponse } from "next/server"
import { one } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Medición de velocidad: dónde corre el servidor, dónde está la base y cuánto tarda un viaje. Sin datos ni claves. */
export async function GET() {
  const host = (() => { try { return new URL(process.env.DATABASE_URL || process.env.POSTGRES_URL || "").hostname } catch { return "" } })()
  const region_base = host.match(/\.([a-z]{2}-[a-z]+-\d)\./)?.[1] ?? null
  await one("select 1") // primera consulta: incluye el arranque
  const ms: number[] = []
  for (let i = 0; i < 5; i++) { const t = Date.now(); await one("select 1"); ms.push(Date.now() - t) }
  const tablas = await one<{ n: number }>("select count(*)::int n from information_schema.tables where table_schema='public'")
  return NextResponse.json({ region_servidor: process.env.VERCEL_REGION ?? null, region_base, viaje_ms: ms, tablas: tablas?.n ?? null })
}
