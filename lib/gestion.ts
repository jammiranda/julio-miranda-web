/**
 * ERP DEVISEBIT: módulos de gestión (finanzas, legales, documentos, licitaciones y tablero de módulos).
 * Cada registro se describe una sola vez acá (campos, opciones y permisos) y lo usan
 * el formulario, la tabla y las acciones de guardar/borrar.
 */
import type { Rol } from "@/lib/auth"

export type Op = { v: string; n: string; c?: string }
export type Campo = {
  k: string
  n: string
  t: "text" | "area" | "date" | "num" | "sel" | "url" | "bool" | "ref"
  ops?: readonly Op[]
  ref?: "contactos" | "proyectos" | "proveedores"
  req?: boolean
  lista?: boolean
  ayuda?: string
  def?: string
  ancho?: boolean
}
export type Ent = {
  tabla: string
  n: string
  uno: string
  campos: Campo[]
  orden: string
  titulo: string
  edita: Rol[]
}

const C = {
  gris: "bg-slate-100 text-slate-700",
  rojo: "bg-red-50 text-rojo",
  ambar: "bg-amber-50 text-amber-700",
  cielo: "bg-sky-50 text-sky-700",
  violeta: "bg-violet-50 text-violet-700",
  verde: "bg-emerald-50 text-emerald-700",
  apagado: "bg-slate-100 text-slate-500",
}

export const MONEDAS: Op[] = [{ v: "ARS", n: "ARS" }, { v: "USD", n: "USD" }]
const EDITAN: Rol[] = ["gerente", "coordinacion"]

/* ---------------- Finanzas ---------------- */
export const CAT_EGRESO = ["Sueldos y honorarios", "Desarrollo tercerizado", "Software y servicios", "Hosting y dominios", "Publicidad", "Impuestos", "Cargas sociales", "Alquiler y cowork", "Contador y legales", "Bancos y comisiones", "Viáticos", "Equipamiento", "Otros"]
export const CAT_INGRESO = ["Desarrollo a medida", "Abonos y mantenimiento", "Webs y SEO", "Bots y automatización", "Academia y cursos", "Consultoría", "Licitaciones", "Otros"]

export const MOVIMIENTOS: Ent = {
  tabla: "g_movimientos", n: "Movimientos", uno: "movimiento", orden: "coalesce(fecha, vence) desc nulls last, id desc", titulo: "concepto", edita: EDITAN,
  campos: [
    { k: "tipo", n: "Tipo", t: "sel", req: true, lista: true, def: "egreso", ops: [{ v: "egreso", n: "Egreso", c: C.rojo }, { v: "ingreso", n: "Ingreso", c: C.verde }] },
    { k: "concepto", n: "Concepto", t: "text", req: true, lista: true },
    { k: "categoria", n: "Categoría", t: "sel", lista: true, ops: [...new Set([...CAT_EGRESO, ...CAT_INGRESO])].map((x) => ({ v: x, n: x })) },
    { k: "monto", n: "Monto", t: "num", req: true, lista: true },
    { k: "moneda", n: "Moneda", t: "sel", def: "ARS", ops: MONEDAS },
    { k: "estado", n: "Estado", t: "sel", lista: true, def: "pagado", ops: [{ v: "pagado", n: "Pagado / cobrado", c: C.verde }, { v: "pendiente", n: "Pendiente", c: C.ambar }, { v: "anulado", n: "Anulado", c: C.apagado }] },
    { k: "fecha", n: "Fecha de pago", t: "date", lista: true, ayuda: "Cuándo salió o entró la plata." },
    { k: "vence", n: "Vence", t: "date", lista: true, ayuda: "Para pendientes: fecha límite de pago." },
    { k: "proveedor_id", n: "Proveedor", t: "ref", ref: "proveedores", lista: true },
    { k: "proyecto_id", n: "Proyecto", t: "ref", ref: "proyectos" },
    { k: "medio", n: "Medio", t: "sel", ops: ["Transferencia", "Mercado Pago", "Tarjeta", "Efectivo", "Débito automático", "Cheque", "Otro"].map((x) => ({ v: x, n: x })) },
    { k: "comprobante", n: "Comprobante (link)", t: "url", ayuda: "Link a la factura o recibo en Drive." },
    { k: "nota", n: "Nota", t: "area", ancho: true },
  ],
}

export const PROVEEDORES: Ent = {
  tabla: "g_proveedores", n: "Proveedores", uno: "proveedor", orden: "nombre", titulo: "nombre", edita: EDITAN,
  campos: [
    { k: "nombre", n: "Nombre o razón social", t: "text", req: true, lista: true },
    { k: "rubro", n: "Rubro", t: "text", lista: true },
    { k: "cuit", n: "CUIT", t: "text", lista: true },
    { k: "condicion_iva", n: "Condición IVA", t: "sel", ops: ["Responsable inscripto", "Monotributo", "Exento", "Exterior"].map((x) => ({ v: x, n: x })) },
    { k: "contacto", n: "Persona de contacto", t: "text" },
    { k: "email", n: "Email", t: "text", lista: true },
    { k: "telefono", n: "Teléfono", t: "text" },
    { k: "notas", n: "Notas", t: "area", ancho: true },
  ],
}

/* ---------------- Legales ---------------- */
export const CONTRATOS: Ent = {
  tabla: "g_contratos", n: "Contratos", uno: "contrato", orden: "case estado when 'en_revision' then 0 when 'borrador' then 1 when 'firmado' then 2 else 3 end, vence nulls last", titulo: "titulo", edita: EDITAN,
  campos: [
    { k: "titulo", n: "Contrato", t: "text", req: true, lista: true },
    { k: "tipo", n: "Tipo", t: "sel", req: true, lista: true, def: "cliente", ops: [
      { v: "cliente", n: "Cliente", c: C.cielo }, { v: "proveedor", n: "Proveedor", c: C.violeta }, { v: "equipo", n: "Equipo / freelance", c: C.ambar },
      { v: "nda", n: "Confidencialidad (NDA)", c: C.gris }, { v: "licitacion", n: "Licitación / organismo", c: C.rojo }, { v: "otro", n: "Otro", c: C.gris }] },
    { k: "contraparte", n: "Contraparte", t: "text", lista: true },
    { k: "contacto_id", n: "Cliente del CRM", t: "ref", ref: "contactos" },
    { k: "proyecto_id", n: "Proyecto", t: "ref", ref: "proyectos" },
    { k: "estado", n: "Estado", t: "sel", lista: true, def: "borrador", ops: [
      { v: "borrador", n: "Borrador", c: C.gris }, { v: "en_revision", n: "En revisión", c: C.ambar }, { v: "firmado", n: "Firmado y vigente", c: C.verde },
      { v: "vencido", n: "Vencido", c: C.rojo }, { v: "rescindido", n: "Rescindido", c: C.apagado }] },
    { k: "inicio", n: "Inicio", t: "date" },
    { k: "vence", n: "Vence", t: "date", lista: true },
    { k: "renovacion_auto", n: "Se renueva solo", t: "bool" },
    { k: "monto", n: "Monto", t: "num", lista: true },
    { k: "moneda", n: "Moneda", t: "sel", def: "ARS", ops: MONEDAS },
    { k: "documento_url", n: "Documento (link)", t: "url", lista: true, ayuda: "PDF firmado o borrador en Drive." },
    { k: "responsable", n: "Responsable", t: "text" },
    { k: "notas", n: "Cláusulas clave y notas", t: "area", ancho: true, ayuda: "Plazos, penalidades, propiedad intelectual, garantía." },
  ],
}

export const AREAS_VENC: Op[] = [
  { v: "impuestos", n: "Impuestos (ARCA, IIBB)", c: C.rojo }, { v: "societario", n: "Societario", c: C.violeta }, { v: "legal", n: "Legal", c: C.violeta },
  { v: "dominios", n: "Dominios y hosting", c: C.cielo }, { v: "suscripciones", n: "Suscripciones", c: C.cielo }, { v: "seguros", n: "Seguros", c: C.ambar },
  { v: "registros", n: "Registros de proveedores", c: C.ambar }, { v: "otro", n: "Otro", c: C.gris },
]
export const VENCIMIENTOS: Ent = {
  tabla: "g_vencimientos", n: "Vencimientos", uno: "vencimiento", orden: "case estado when 'pendiente' then 0 else 1 end, vence", titulo: "titulo", edita: EDITAN,
  campos: [
    { k: "titulo", n: "Qué vence", t: "text", req: true, lista: true },
    { k: "area", n: "Área", t: "sel", lista: true, def: "impuestos", ops: AREAS_VENC },
    { k: "vence", n: "Vence", t: "date", req: true, lista: true },
    { k: "recurrencia", n: "Se repite", t: "sel", lista: true, def: "unica", ops: [{ v: "unica", n: "Una vez" }, { v: "mensual", n: "Todos los meses" }, { v: "anual", n: "Todos los años" }] },
    { k: "estado", n: "Estado", t: "sel", lista: true, def: "pendiente", ops: [{ v: "pendiente", n: "Pendiente", c: C.ambar }, { v: "hecho", n: "Hecho", c: C.verde }], ayuda: "Si se repite, al marcarlo hecho se crea el próximo." },
    { k: "monto", n: "Monto estimado", t: "num" },
    { k: "responsable", n: "Responsable", t: "text", lista: true },
    { k: "nota", n: "Nota", t: "area", ancho: true },
  ],
}

/* ---------------- Documentos ---------------- */
export const CAT_DOC: Op[] = [
  { v: "institucional", n: "Institucional", c: C.gris }, { v: "comercial", n: "Comercial y propuestas", c: C.cielo }, { v: "legal", n: "Legal y contratos", c: C.violeta },
  { v: "contable", n: "Contable e impositivo", c: C.ambar }, { v: "tecnico", n: "Técnico y desarrollo", c: C.verde }, { v: "equipo", n: "Equipo y procesos", c: C.rojo },
  { v: "plantilla", n: "Plantillas", c: C.gris }, { v: "licitacion", n: "Licitaciones", c: C.rojo },
]
export const DOCUMENTOS: Ent = {
  tabla: "g_documentos", n: "Documentos", uno: "documento", orden: "actualizado desc", titulo: "titulo", edita: EDITAN,
  campos: [
    { k: "titulo", n: "Documento", t: "text", req: true, lista: true },
    { k: "categoria", n: "Categoría", t: "sel", lista: true, def: "institucional", ops: CAT_DOC },
    { k: "url", n: "Link (Drive, PDF, web)", t: "url", req: true, lista: true },
    { k: "version", n: "Versión", t: "text", lista: true, def: "1.0" },
    { k: "contacto_id", n: "Cliente", t: "ref", ref: "contactos" },
    { k: "proyecto_id", n: "Proyecto", t: "ref", ref: "proyectos" },
    { k: "responsable", n: "Responsable", t: "text", lista: true },
    { k: "confidencial", n: "Confidencial (solo Dirección y Coordinación)", t: "bool" },
    { k: "descripcion", n: "Para qué sirve", t: "area", ancho: true },
  ],
}

/* ---------------- Licitaciones ---------------- */
export const ESTADOS_LIC: Op[] = [
  { v: "detectada", n: "Detectada", c: C.gris }, { v: "analizando", n: "Analizando pliego", c: C.cielo }, { v: "preparando", n: "Preparando oferta", c: C.ambar },
  { v: "presentada", n: "Presentada", c: C.violeta }, { v: "adjudicada", n: "Adjudicada", c: C.verde }, { v: "perdida", n: "No adjudicada", c: C.apagado }, { v: "descartada", n: "Descartada", c: C.apagado },
]
export const JURIS = ["Nación (COMPR.AR)", "CABA (BAC)", "Provincia de Buenos Aires (PBAC)", "San Luis", "Córdoba", "Catamarca", "Salta", "PAMI", "Municipio", "Universidad", "Privada"]
export const LICITACIONES: Ent = {
  tabla: "g_licitaciones", n: "Licitaciones", uno: "licitación", orden: "case when estado in ('adjudicada','perdida','descartada') then 1 else 0 end, apertura nulls last", titulo: "objeto", edita: EDITAN,
  campos: [
    { k: "objeto", n: "Objeto", t: "text", req: true, lista: true },
    { k: "organismo", n: "Organismo", t: "text", req: true, lista: true },
    { k: "jurisdiccion", n: "Jurisdicción", t: "sel", lista: true, ops: JURIS.map((x) => ({ v: x, n: x })) },
    { k: "numero", n: "N.º de proceso", t: "text" },
    { k: "rubro", n: "Rubro", t: "sel", def: "Software y sistemas", ops: [{ v: "Software y sistemas", n: "Software y sistemas" }, { v: "Comunicación y marketing", n: "Comunicación y marketing" }] },
    { k: "estado", n: "Estado", t: "sel", lista: true, def: "detectada", ops: ESTADOS_LIC },
    { k: "consultas_hasta", n: "Consultas hasta", t: "date" },
    { k: "apertura", n: "Apertura", t: "date", lista: true },
    { k: "monto_estimado", n: "Presupuesto oficial", t: "num", lista: true },
    { k: "moneda", n: "Moneda", t: "sel", def: "ARS", ops: MONEDAS },
    { k: "link", n: "Link al pliego", t: "url", lista: true },
    { k: "responsable", n: "Responsable", t: "text" },
    { k: "notas", n: "Requisitos y notas", t: "area", ancho: true, ayuda: "Garantía de oferta, inscripción requerida, documentación." },
  ],
}

export const ENTIDADES: Record<string, Ent> = {
  movimientos: MOVIMIENTOS, proveedores: PROVEEDORES, contratos: CONTRATOS, vencimientos: VENCIMIENTOS, documentos: DOCUMENTOS, licitaciones: LICITACIONES,
}

/* ---------------- Módulos de DEVISEBIT (el manual operativo, vivo) ---------------- */
export const ESTADOS_MOD: Op[] = [
  { v: "sin_empezar", n: "Sin empezar", c: C.gris }, { v: "en_curso", n: "En curso", c: C.ambar },
  { v: "trabado", n: "Trabado", c: C.rojo }, { v: "listo", n: "Listo", c: C.verde },
]
export const MODULOS_DB = [
  { c: "m01", n: "Dirección y coordinación", r: "Julio + Bárbara", e: "Tablero del lunes y resumen del viernes", href: "/gestion" },
  { c: "m02", n: "Ventas y comercial", r: "Julio · Bárbara agenda y sigue", e: "Propuestas enviadas, reuniones y estado de cada oportunidad", href: "/" },
  { c: "m03", n: "Licitaciones públicas", r: "Julio · Bárbara arma carpetas", e: "Licitaciones abiertas, en preparación y presentadas", href: "/licitaciones" },
  { c: "m04", n: "Marketing y redes", r: "Jime", e: "Grilla de redes, nota del blog publicada y métricas", href: "/email" },
  { c: "m05", n: "Diseño y web", r: "Jime + Jonathan", e: "devisebit.com, casos de éxito y piezas aprobadas", href: "/material" },
  { c: "m06", n: "Desarrollo y producto", r: "Jonathan", e: "Roadmap por producto y avance de cada desarrollo", href: "/proyectos" },
  { c: "m07", n: "Demos, testing y UX", r: "Bárbara", e: "Demo lista por producto y reporte de errores", href: "/demos-admin" },
  { c: "m08", n: "Bots y automatización", r: "Julio + Jonathan", e: "Bot de WhatsApp probado y conectado a todo", href: "/bot" },
  { c: "m09", n: "Administración, finanzas y legal", r: "Julio · contador y abogado validan", e: "Cierre de mes, cobranzas y contratos revisados", href: "/finanzas" },
  { c: "m10", n: "ACADEMIA DEVISEBIT", r: "Julio + Jime", e: "Plan de cursos y avales para certificar", href: "https://academia.devisebit.com/sistema" },
] as const

/* ---------------- Utilidades ---------------- */
export const op = (e: Ent, k: string, v: string | null | undefined) => e.campos.find((c) => c.k === k)?.ops?.find((o) => o.v === v)
export const isoD = (d: unknown): string | null => (d ? (typeof d === "string" ? d : new Date(d as Date).toISOString()).slice(0, 10) : null)
export function dinero(n: number | string | null | undefined, moneda = "ARS") {
  if (n == null || n === "") return "—"
  const v = Math.round(Number(n)).toLocaleString("es-AR")
  return moneda === "USD" ? `US$ ${v}` : `$ ${v}`
}
/** Acepta "1.500.000,50", "1500000.5" o "1500000". */
export function numero(t: string): number | null {
  const x = t.replace(/\s|\$|US/g, "")
  if (!x) return null
  const n = x.includes(",") ? Number(x.replace(/\./g, "").replace(",", ".")) : (x.match(/\./g)?.length ?? 0) > 1 ? Number(x.replace(/\./g, "")) : Number(x)
  return Number.isFinite(n) ? n : null
}
export function sumarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}
export function siguiente(iso: string, rec: string) {
  const d = new Date(iso + "T12:00:00Z")
  if (rec === "mensual") d.setUTCMonth(d.getUTCMonth() + 1)
  else if (rec === "anual") d.setUTCFullYear(d.getUTCFullYear() + 1)
  return d.toISOString().slice(0, 10)
}
