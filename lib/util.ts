export const MODULOS = ["A1", "A2", "A3", "B", "C", "SE", "CP"] as const
export const TIPOS = [
  { v: "enfermeria", n: "Enfermería" },
  { v: "kinesiologia", n: "Kinesiología" },
  { v: "medico", n: "Médico" },
  { v: "fonoaudiologia", n: "Fonoaudiología" },
  { v: "cuidador", n: "Cuidador" },
] as const
export const TIPO_NOMBRE: Record<string, string> = Object.fromEntries(TIPOS.map((t) => [t.v, t.n]))
export const LOCALIDADES = ["San Luis", "Villa Mercedes", "Justo Daract", "Quines", "Merlo", "Tilisarao", "Concarán", "La Toma", "La Punta", "San Francisco del Monte de Oro"]

export const pesos = (n: number | string | null | undefined) =>
  n == null || n === "" ? "—" : "$ " + Math.round(Number(n)).toLocaleString("es-AR")

export function fecha(d: string | Date | null | undefined) {
  if (!d) return "—"
  const x = typeof d === "string" ? new Date(d.length === 10 ? d + "T12:00:00" : d) : d
  return x.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "America/Argentina/Buenos_Aires" })
}

export function hoyISO() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" })
}
export function periodoActual() {
  return hoyISO().slice(0, 7)
}
export function rangoPeriodo(p: string) {
  const [y, m] = p.split("-").map(Number)
  const ini = `${p}-01`
  const fin = new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
  return { ini, fin }
}
export const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
export function nombrePeriodo(p: string) {
  const [y, m] = p.split("-").map(Number)
  return `${MESES[m - 1]} ${y}`
}
export function periodosRecientes(n = 12) {
  const out: string[] = []
  const [y, m] = periodoActual().split("-").map(Number)
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1))
    out.push(d.toISOString().slice(0, 7))
  }
  return out
}
export const s = (v: FormDataEntryValue | null) => {
  const t = (v ?? "").toString().trim()
  return t === "" ? null : t
}
