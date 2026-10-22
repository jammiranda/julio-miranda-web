export const ESTADOS = [
  { v: "nueva", n: "Sin atender", c: "bg-red-50 text-rojo" },
  { v: "contactada", n: "Contactada", c: "bg-amber-50 text-amber-700" },
  { v: "evaluacion", n: "En evaluación", c: "bg-sky-50 text-sky-700" },
  { v: "ingreso", n: "Ingresó", c: "bg-[#E3F2E8] text-[#0B5E31]" },
  { v: "descartada", n: "Descartada", c: "bg-slate-100 text-slate-600" },
]
export const CANAL: Record<string, string> = { whatsapp: "WhatsApp", web: "Web", telefono: "Teléfono", derivacion: "Derivación", instagram: "Instagram", otro: "Otro" }
export const MOTIVOS = ["Internación domiciliaria", "Enfermería", "Kinesiología", "Visita médica", "Equipamiento", "Convenio / institución", "Trabajar con nosotros", "Otro"]
export function hace(d: string | Date) {
  const min = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000))
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 48) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} días`
}
export const fechaHora = (d: string | Date) => new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
