import { NextResponse } from "next/server"
import { requerir } from "@/lib/auth"
import { q } from "@/lib/db"
export const dynamic = "force-dynamic"
/** CSV de quienes abrieron o hicieron clic en una campaña (solo gerencia y coordinación). */
export async function GET(_r: Request, { params }: { params: { id: string } }) {
  await requerir(["gerente", "coordinacion"])
  const filas = await q<any>(`select c.nombre, e.email, c.organizacion, c.clase, to_char(e.abierto_en at time zone 'America/Argentina/Buenos_Aires','YYYY-MM-DD HH24:MI') abrio, e.aperturas, e.clics,
      (select string_agg(distinct regexp_replace(x.url, '[?#].*$', ''), ' ') from em_clics x where x.envio_id=e.id) destinos
    from em_envios e left join db_contactos c on c.id=e.contacto_id where e.campania_id=$1 and (e.abierto_en is not null or e.clic_en is not null)
    order by e.clics desc, e.abierto_en desc`, [Number(params.id)])
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const csv = "﻿Nombre,Email,Organización,Lista,Abrió,Aperturas,Clics,Fue a\n" + filas.map((f) => [f.nombre, f.email, f.organizacion, f.clase, f.abrio, f.aperturas, f.clics, f.destinos].map(esc).join(",")).join("\n")
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="abrieron-campania-${params.id}.csv"` } })
}
