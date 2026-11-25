import { SOLUCIONES, SOLUCION_DE_PRODUCTO } from "@/lib/marca"
import { DEMO_DE_PRODUCTO, demoUrl } from "@/lib/demos"
import type { ProductoFicha } from "@/components/productos-explorador"

/** Fichas del explorador de productos (inicio y /productos). Un solo lugar para editar. */
const INST = "Instituciones, salud y gremios"
const GEST = "Gestión y datos"

const BASE: Omit<ProductoFicha, "planes" | "demo">[] = [
  { id: "clinicas", grupo: INST, title: "Sistemas de salud · marca blanca", vista: "clinicas", bajada: "Para clínicas, consultorios e internación domiciliaria: pacientes, turnos y visitas, historia clínica, prestaciones y facturación, con tu marca.", items: ["Pacientes e historia clínica", "Turnos y visitas domiciliarias", "Prestaciones y facturación", "Tablero para la dirección"], prueba: "sistema de internación domiciliaria en uso todos los días, disponible con tu marca por abono mensual." },
  { id: "crm", grupo: INST, title: "Padrón, afiliados y obra social", vista: "crm", bajada: "Padrón único con grupos familiares, aportes, órdenes y autorizaciones en línea, prestadores y cartilla.", items: ["Padrón y grupos familiares", "Aportes y cuotas al día", "Órdenes y autorizaciones", "Prestadores y cartilla"], prueba: "gestión gremial y de obra social en San Luis (Comunidad USL)." },
  { id: "academias", grupo: INST, title: "Academias online", vista: "academias", bajada: "Cursos, clases en vivo, inscripciones, pagos y certificados verificables, con tu marca y tu dominio.", items: ["Cursos y clases en vivo", "Inscripciones y pagos", "Exámenes y asistencia", "Certificados verificables"], prueba: "Comunidad USL, con más de 1.000 inscriptos en un año." },
  { id: "app", grupo: INST, title: "App y credencial digital", vista: "app", bajada: "Tu institución en el celular de cada socio o vecino: credencial, beneficios, novedades y avisos.", items: ["Credencial digital", "Beneficios y comercios", "Novedades y avisos", "iOS y Android"], prueba: "app Soy Tigre del Municipio de Tigre, con más de 80.000 vecinos suscriptos." },
  { id: "votacion", grupo: INST, title: "Votación y control de acceso", vista: "votacion", bajada: "Elecciones sin papel con padrón de votantes y resultados al instante; acceso con QR y molinetes.", items: ["Votación electrónica", "Padrón de votantes", "Acceso con QR y molinetes", "Resultados al instante"], prueba: "votación implementada para un Consejo Superior y control de acceso con molinetes." },
  { id: "whatsapp", grupo: GEST, title: "Asistente de WhatsApp con IA", vista: "whatsapp", bajada: "Atiende las 24 horas, da y confirma turnos, califica consultas y deriva a una persona cuando hace falta.", items: ["Responde a toda hora", "Da y confirma turnos", "Deriva a tu equipo", "Registra todo en el CRM"], prueba: "Bit, el asistente de DEVISEBIT, atiende WhatsApp e Instagram todos los días." },
  { id: "tableros", grupo: GEST, title: "Tableros de control", vista: "tableros", bajada: "Los números de tu organización al día, con alertas, desde tus planillas o tus sistemas.", items: ["Indicadores en tiempo real", "Alertas automáticas", "Reportes para la dirección", "Desde Excel o tus sistemas"], prueba: "tableros y reportes para la Subsecretaría de Modernización de la UBA." },
  { id: "documental", grupo: GEST, title: "Gestor documental con firma digital", vista: "documental", bajada: "Expedientes digitales ordenados, con firma, permisos, vencimientos y el historial de cada cambio.", items: ["Expedientes digitales", "Firma digital", "Vencimientos y avisos", "Historial de cambios"], prueba: "gestor documental con firma digital en organizaciones con procesos propios." },
]

export const PRODUCTOS: ProductoFicha[] = BASE.map((p) => {
  const sol = SOLUCIONES.find((x) => x.id === SOLUCION_DE_PRODUCTO[p.id])
  return { ...p, planes: sol?.href, demo: DEMO_DE_PRODUCTO[p.id] ? demoUrl(DEMO_DE_PRODUCTO[p.id]) : undefined }
})

