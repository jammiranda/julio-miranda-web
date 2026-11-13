"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, audit } from "@/lib/db"
import { importarMercadoPago, leerTabla } from "@/lib/mp-importar"

const ir = (base: string, k: "ok" | "error", msg: string) => redirect(`${base}${base.includes("?") ? "&" : "?"}${k}=${encodeURIComponent(msg)}`)
const volverA = (fd: FormData) => {
  const v = String(fd.get("_volver") ?? "/finanzas?ver=movimientos")
  return v.startsWith("/") && !v.startsWith("//") ? v : "/finanzas?ver=movimientos"
}

/** Sube el reporte de Mercado Pago (CSV o Excel) y carga los egresos. */
export async function importarMP(fd: FormData) {
  const u = await requerir(["gerente", "coordinacion"])
  const volver = volverA(fd)
  const f = fd.get("archivo")
  if (!(f instanceof File) || !f.size) ir(volver, "error", "Elegí el archivo descargado de Mercado Pago.")
  const file = f as File
  if (file.size > 8 * 1024 * 1024) ir(volver, "error", "El archivo pesa más de 8 MB. Descargá un rango de fechas más corto.")
  let msg = ""
  try {
    const r = await importarMercadoPago(leerTabla(await file.arrayBuffer(), file.name), u.usuario)
    if (r.error) ir(volver, "error", r.error)
    await audit(u, "importar", "mercadopago", undefined, JSON.stringify(r))
    msg = `Mercado Pago: ${r.nuevos} gastos nuevos (${r.laborales} laborales por regla, ${r.porClasificar} por clasificar), ${r.repetidos} ya estaban, ${r.ingresosOmitidos} ingresos no se cargan porque los cobros van en cada proyecto.`
  } catch (e: any) {
    if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw e
    ir(volver, "error", `No pude leer el archivo: ${e?.message ?? "formato desconocido"}`)
  }
  revalidatePath("/finanzas")
  ir(volver, "ok", msg)
}

/** Marca un movimiento como laboral o personal. Con "regla", además crea la regla para que los próximos entren solos. */
export async function clasificar(fd: FormData) {
  const u = await requerir(["gerente", "coordinacion"])
  const volver = volverA(fd)
  const id = Number(fd.get("id"))
  const ambito = String(fd.get("ambito"))
  if (!id || !["laboral", "personal"].includes(ambito)) ir(volver, "error", "Movimiento inválido.")
  await q("update g_movimientos set ambito=$1, actualizado=now() where id=$2", [ambito, id])
  const patron = String(fd.get("patron") ?? "").trim().toLowerCase()
  if (patron.length >= 3) {
    const m = (await q<any>("select categoria, proveedor_id from g_movimientos where id=$1", [id]))[0]
    const prov = m?.proveedor_id ? (await q<any>("select nombre from g_proveedores where id=$1", [m.proveedor_id]))[0]?.nombre ?? null : null
    await q("insert into g_reglas(patron,categoria,ambito,proveedor) values ($1,$2,$3,$4) on conflict (patron) do update set ambito=excluded.ambito", [patron, m?.categoria ?? null, ambito, prov])
    // La regla también ordena lo que ya estaba sin clasificar
    await q("update g_movimientos set ambito=$1, actualizado=now() where ambito is null and tipo='egreso' and lower(concepto) like '%'||$2||'%'", [ambito, patron])
  }
  await audit(u, "clasificar", "movimientos", id, `${ambito}${patron ? ` · regla "${patron}"` : ""}`)
  revalidatePath("/finanzas")
  ir(volver, "ok", ambito === "laboral" ? "Marcado como gasto laboral." : "Marcado como personal: no suma en los gastos de la empresa.")
}
