import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { q } from "@/lib/db"
import { claveIcs } from "@/lib/ics"

export const dynamic = "force-dynamic"

const esc = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")
const dia = (d: Date | string) => (typeof d === "string" ? d : d.toISOString()).slice(0, 10).replace(/-/g, "")
const sig = (d: string) => { const x = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + 1); return dia(x) }

/**
 * Calendario de vencimientos de DEVISEBIT en formato iCalendar: Google Calendar se suscribe a este link y se actualiza solo.
 * Trae los activos digitales vigentes con fecha de vencimiento (dominios, hosting, SSL, casillas). Solo lectura; la clave va en el link.
 */
export async function GET(_: Request, { params }: { params: { token: string } }) {
  const clave = await claveIcs()
  const a = Buffer.from(params.token.replace(/\.ics$/, "")), b = Buffer.from(clave)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return new NextResponse("No autorizado", { status: 401 })
  const filas = await q<{ id: number; tipo: string; nombre: string; cliente: string | null; proveedor: string | null; vence: Date | string; costo: string | null; moneda: string }>(
    "select id, tipo, nombre, cliente, proveedor, vence, costo, moneda from g_activos where estado in ('activo','a_revisar') and vence is not null and vence > current_date - 30 order by vence limit 500")
  const sello = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z"
  const TIPO: Record<string, string> = { dominio: "Dominio", hosting: "Hosting", ssl: "Certificado SSL", correo: "Casilla de correo", servidor: "Servidor", otro: "Activo" }
  const lineas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//DEVISEBIT//Sistema de gestion//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:DEVISEBIT · Vencimientos", "X-WR-TIMEZONE:America/Argentina/Buenos_Aires", "REFRESH-INTERVAL;VALUE=DURATION:PT12H", "X-PUBLISHED-TTL:PT12H"]
  for (const f of filas) {
    const d = dia(f.vence)
    const det = [f.cliente ? `Cliente: ${f.cliente}` : "Sin cliente asignado", f.proveedor ? `Proveedor: ${f.proveedor}` : null, f.costo ? `Costo: ${f.moneda} ${Number(f.costo).toLocaleString("es-AR")}` : null, "Ver en el Sistema: https://sistema.devisebit.com/activos"].filter(Boolean).join("\n")
    lineas.push("BEGIN:VEVENT", `UID:activo-${f.id}@sistema.devisebit.com`, `DTSTAMP:${sello}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${sig(d)}`,
      `SUMMARY:${esc(`Vence ${TIPO[f.tipo] ?? "activo"}: ${f.nombre}`)}`, `DESCRIPTION:${esc(det)}`, "TRANSP:TRANSPARENT",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Vencimiento en 7 días", "TRIGGER:-P7D", "END:VALARM", "END:VEVENT")
  }
  lineas.push("END:VCALENDAR")
  return new NextResponse(lineas.join("\r\n"), { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "no-store" } })
}
