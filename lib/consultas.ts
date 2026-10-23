export const ESTADOS = [
  { v: "nueva", n: "Sin atender", c: "bg-red-50 text-rojo" },
  { v: "contactada", n: "En conversación", c: "bg-amber-50 text-amber-700" },
  { v: "calificada", n: "Calificada", c: "bg-sky-50 text-sky-700" },
  { v: "convertida", n: "Pasó al CRM", c: "bg-emerald-50 text-emerald-700" },
  { v: "descartada", n: "Descartada", c: "bg-slate-100 text-slate-600" },
]
export const CANAL: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", web: "Web", telefono: "Teléfono", email: "Email", linkedin: "LinkedIn", referido: "Referido", otro: "Otro" }
export const MOTIVOS = ["Sistema o app a medida", "Sitio web", "Asistente de WhatsApp con IA", "Tableros e indicadores", "Producto listo", "Presupuesto", "Trabajar con nosotros", "Otro"]
export function hace(d: string | Date) {
  const min = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60000))
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 48) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} días`
}
export const fechaHora = (d: string | Date) => new Date(d).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
