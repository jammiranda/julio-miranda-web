/**
 * Programas ejecutivos de ACADEMIA DEVISEBIT (academia.devisebit.com/programas).
 * Por ahora están "en pendiente": solo título, una línea y fecha de inicio, sin precio ni temario.
 * "Quiero que me avisen" registra el interés en el CRM igual que las listas de espera de productos:
 * /api/suscribir con la etiqueta espera-<tag> y origen "ACADEMIA DEVISEBIT" (se cuentan en Sistema Academia).
 */
export type Programa = { slug: string; tag: string; tipo: string; titulo: string; linea: string; inicio: string }

export const PROGRAMAS: Programa[] = [
  {
    slug: "ia-conversacional",
    tag: "espera-programa-ia-conversacional",
    tipo: "Programa Ejecutivo",
    titulo: "Programa Ejecutivo en IA Conversacional: ventas, turnos y atención por WhatsApp",
    linea: "Para diseñar, poner en marcha y medir asistentes con IA que venden, dan turnos y atienden por WhatsApp sin perder el trato humano.",
    inicio: "Mediados de noviembre de 2026",
  },
  {
    slug: "transformacion-digital-ia",
    tag: "espera-programa-td-ia",
    tipo: "Diplomatura Ejecutiva",
    titulo: "Diplomatura Ejecutiva en Transformación Digital e IA para Organizaciones",
    linea: "Para directivos que quieren conducir la transformación digital de su organización con método, datos e inteligencia artificial.",
    inicio: "Verano 2027",
  },
  {
    slug: "salud-digital",
    tag: "espera-programa-salud-digital",
    tipo: "Programa Ejecutivo",
    titulo: "Programa Ejecutivo en Salud Digital: gestión de prestaciones con datos e IA",
    linea: "Para equipos de gestión de prestadores y financiadores de salud que quieren ordenar prestaciones, auditoría y tableros con datos e IA.",
    inicio: "Verano 2027",
  },
]
