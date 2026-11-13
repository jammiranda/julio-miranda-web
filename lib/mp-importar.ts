import * as XLSX from "xlsx"
import { q } from "@/lib/db"

/**
 * Importa el reporte de Mercado Pago (Actividad o "Todas las transacciones", en CSV o Excel) a Finanzas.
 * - Solo entran los EGRESOS (montos negativos). Los cobros a clientes ya están en cada proyecto, así no se duplican.
 * - Cada fila se identifica por su ID de operación (o por fecha+detalle+monto), así se puede subir el mismo archivo dos veces sin duplicar.
 * - Las reglas de g_reglas (Google Ads, Meta, Vercel, Anthropic, Donweb...) ponen categoría, proveedor y "laboral".
 *   Lo que no coincide con ninguna regla queda en "Por clasificar".
 */

type Regla = { patron: string; categoria: string | null; ambito: string; proveedor: string | null }
export type ResultadoMP = { leidas: number; egresos: number; nuevos: number; repetidos: number; ingresosOmitidos: number; laborales: number; porClasificar: number; error?: string }

const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

function buscarCol(cab: string[], ...claves: string[]) {
  for (const k of claves) {
    const i = cab.findIndex((c) => c === k)
    if (i >= 0) return i
  }
  for (const k of claves) {
    const i = cab.findIndex((c) => c.includes(k))
    if (i >= 0) return i
  }
  return -1
}

/** "1.234,56" / "-1234.56" / "$ -1.234" → número */
export function aNumero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null
  let t = String(v ?? "").replace(/[^\d,.\-]/g, "")
  if (!t || t === "-") return null
  const coma = t.lastIndexOf(","), punto = t.lastIndexOf(".")
  if (coma > punto) t = t.replace(/\./g, "").replace(",", ".")
  else t = t.replace(/,/g, "")
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

/** Fecha de MP: ISO (2026-11-05T10:20:00.000-04:00), dd/mm/aaaa, dd-mm-aaaa o número de Excel → aaaa-mm-dd */
export function aFecha(v: unknown): string | null {
  if (typeof v === "number" && v > 30000 && v < 80000) {
    const d = XLSX.SSF.parse_date_code(v)
    return d ? `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}` : null
  }
  const t = String(v ?? "").trim()
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/)
  if (m) {
    const y = m[3].length === 2 ? `20${m[3]}` : m[3]
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`
  }
  return null
}

function hash(s: string) {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** Lee el archivo y devuelve la tabla como filas de texto (detecta la fila de títulos aunque el reporte traiga líneas de encabezado). */
export function leerTabla(buf: ArrayBuffer, nombre: string): unknown[][] {
  const wb = /\.csv$|\.txt$/i.test(nombre)
    ? XLSX.read(new TextDecoder("utf-8").decode(buf), { type: "string", raw: true, FS: detectarSeparador(new TextDecoder("utf-8").decode(buf)) })
    : XLSX.read(buf, { type: "array", raw: true })
  const hoja = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<unknown[]>(hoja, { header: 1, raw: true, defval: "" })
}
function detectarSeparador(txt: string) {
  const l = txt.split(/\r?\n/).slice(0, 10).join("\n")
  const pc = (l.match(/;/g) ?? []).length, c = (l.match(/,/g) ?? []).length, tab = (l.match(/\t/g) ?? []).length
  return tab > pc && tab > c ? "\t" : pc >= c ? ";" : ","
}

export async function importarMercadoPago(tabla: unknown[][], usuario: string): Promise<ResultadoMP> {
  const r: ResultadoMP = { leidas: 0, egresos: 0, nuevos: 0, repetidos: 0, ingresosOmitidos: 0, laborales: 0, porClasificar: 0 }
  // Fila de títulos: la primera que tenga algo de fecha y algo de monto
  const iCab = tabla.findIndex((f) => {
    const c = f.map(norm)
    return c.some((x) => x.includes("fecha") || x.includes("date")) && c.some((x) => /monto|importe|amount|valor|neto/.test(x))
  })
  if (iCab < 0) return { ...r, error: "No encontré las columnas de fecha y monto. Subí el reporte de Mercado Pago tal como se descarga (CSV o Excel)." }
  const cab = tabla[iCab].map(norm)
  const cFecha = buscarCol(cab, "transaction_date", "fecha de origen", "fecha de creacion", "fecha", "date_created", "date")
  const cMonto = buscarCol(cab, "transaction_amount", "monto neto", "importe", "monto", "net_amount", "settlement_net_amount", "amount", "valor")
  const cDesc = buscarCol(cab, "descripcion", "description", "detalle", "concepto", "transaction_type", "tipo de operacion", "tipo")
  const cContra = buscarCol(cab, "contraparte", "nombre", "counterpart", "pagador", "vendedor", "store", "payer")
  const cId = buscarCol(cab, "source_id", "id de operacion", "numero de operacion", "operacion", "reference_id", "id")
  const cMoneda = buscarCol(cab, "transaction_currency", "moneda", "currency")
  if (cFecha < 0 || cMonto < 0) return { ...r, error: "No encontré las columnas de fecha y monto en el archivo." }

  const reglas = await q<Regla>("select patron, categoria, ambito, proveedor from g_reglas order by length(patron) desc")
  const provs = await q<{ id: number; nombre: string }>("select id, nombre from g_proveedores")
  const provId = (n: string | null) => (n ? provs.find((p) => p.nombre === n)?.id ?? null : null)

  for (const fila of tabla.slice(iCab + 1)) {
    const monto = aNumero(fila[cMonto])
    const fecha = aFecha(fila[cFecha])
    if (monto == null || !fecha || monto === 0) continue
    r.leidas++
    if (monto > 0) { r.ingresosOmitidos++; continue }
    r.egresos++
    const desc = [cDesc >= 0 ? fila[cDesc] : "", cContra >= 0 && cContra !== cDesc ? fila[cContra] : ""].map((x) => String(x ?? "").trim()).filter(Boolean).join(" · ") || "Movimiento de Mercado Pago"
    const idOp = cId >= 0 ? String(fila[cId] ?? "").trim() : ""
    const externo = `mp:${idOp && /\d{4,}/.test(idOp) ? idOp : hash(`${fecha}|${desc}|${monto}`)}`
    const moneda = cMoneda >= 0 && /usd|u\$s|dolar/.test(norm(fila[cMoneda])) ? "USD" : "ARS"
    const d = norm(desc)
    const regla = reglas.find((x) => d.includes(norm(x.patron)))
    const ins = await q<{ id: number }>(
      `insert into g_movimientos(tipo,concepto,categoria,monto,moneda,estado,fecha,medio,externo_id,proveedor_id,ambito,origen,nota,creado_por)
       values ('egreso',$1,$2,$3,$4,'pagado',$5,'Mercado Pago',$6,$7,$8,'mercadopago',$9,$10)
       on conflict (externo_id) where externo_id is not null do nothing returning id`,
      [desc.slice(0, 200), regla?.categoria ?? null, Math.abs(monto), moneda, fecha, externo, provId(regla?.proveedor ?? null), regla?.ambito ?? null,
       regla ? `Clasificado solo por la regla "${regla.patron}".` : "Importado de Mercado Pago. Falta marcar si es laboral o personal.", usuario],
    )
    if (!ins.length) { r.repetidos++; continue }
    r.nuevos++
    if (regla?.ambito === "laboral") r.laborales++
    if (!regla) r.porClasificar++
  }
  return r
}
