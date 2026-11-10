import { NextResponse, type NextRequest } from "next/server"
import { usuarioActual } from "@/lib/auth"
import { audit, q } from "@/lib/db"
import { ENVIOS_POR_DIA } from "@/lib/base-tigre"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Pasa a Envíos (CRM, clase "suscriptor") el segmento de emails corporativos de la Base Tigre, en tandas de 300 (tope diario de Brevo).
 * Orden estable por md5(email): tanda 1 = primeros 300, tanda 2 = el resto. No pisa contactos que ya existen. Solo gerente.
 */
export async function POST(req: NextRequest) {
  const u = await usuarioActual()
  if (!u || u.rol !== "gerente") return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  try {
    const b = await req.json().catch(() => ({}))
    const tanda = Number(b.tanda)
    if (tanda !== 1 && tanda !== 2) return NextResponse.json({ ok: false, error: "Tanda inválida" }, { status: 400 })
    const r = await q<{ id: number }>(
      `with seg as (
         select email, nombre, apellido, row_number() over (order by md5(lower(email))) rn
           from base_tigre where estado='activo' and tipo_email='corporativo'
       )
       insert into db_contactos(nombre, email, origen, etapa, clase, categoria, tags, notas)
       select coalesce(nullif(trim(coalesce(nombre,'')),''), split_part(email,'@',1)), email, 'App Tigre', 'base', 'suscriptor', 'App Tigre',
              array['tigre-corporativo', $1::text], 'Base Tigre · sin consentimiento propio: baja en un clic en cada envío'
         from seg where ${tanda === 1 ? "rn <= $2" : "rn > $2"}
       on conflict (lower(email)) where email is not null do nothing
       returning id`,
      [`tigre-tanda-${tanda}`, ENVIOS_POR_DIA],
    )
    await audit(u, "pasar_base_tigre_a_envios", "base_tigre", `tanda-${tanda}`, `${r.length} contactos pasados a Envíos`)
    return NextResponse.json({ ok: true, pasados: r.length })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error" }, { status: 400 })
  }
}
