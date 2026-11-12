import { PAGO } from "./precios"
import { URL_SISTEMA } from "./brief"
import { MV, PDF_ASESORIA, PDF_ALTA_AGENTE } from "./material"

/**
 * Material comercial que el bot y el equipo pueden mandar con un clic, por WhatsApp o por email.
 * `frase` es la línea de contexto (sin saludo ni link): por WhatsApp sale como «Nombre, frase: link» y por email como párrafo con el link en un botón.
 */
export type Material = {
  k: string; n: string; link: string; texto: (nombre?: string | null) => string
  frase: string; boton: string
  /** Párrafos extra del email (texto simple de lib/email), después del botón. */
  correo?: string
  /** Línea de producto a la que corresponde (para sugerirlo según el motivo de la consulta). */
  linea?: Linea
  /** `pedido`: formularios y listas para que el cliente nos mande su información. */
  grupo: "pedido" | "landing" | "folleto" | "otro"
  /** Solo lo manda el equipo desde la consulta: no entra en la lista de material del bot. */
  soloEquipo?: boolean
}

export const LINEAS = { webs: "Páginas web", whatsapp: "Agente de WhatsApp", redes: "Redes y anuncios", sistemas: "Sistemas a medida", comunidad: "Plataforma para comunidades" } as const
export type Linea = keyof typeof LINEAS

const hola = (n?: string | null) => (n ? `${n.split(" ")[0]}, ` : "")

/** Material con link: el mensaje de WhatsApp es «frase: link» más `wa` (lo que solo tiene sentido por chat). */
const m = (k: string, n: string, link: string, frase: string, boton: string, o: { wa?: string; correo?: string; linea?: Linea; grupo?: Material["grupo"]; soloEquipo?: boolean } = {}): Material => ({
  k, n, link, frase, boton, correo: o.correo, linea: o.linea, grupo: o.grupo ?? "otro", soloEquipo: o.soloEquipo,
  texto: (nom) => `${hola(nom)}${frase}: ${link}${o.wa ?? ""}`,
})

export const MATERIALES: Material[] = [
  m("brochure", "Folleto de páginas web (PDF)", `${MV}/folletos/devisebit-webs.pdf`, "te paso el folleto de páginas web, con qué incluye y cómo trabajamos", "Ver el folleto", { linea: "webs", grupo: "folleto" }),
  m("lista", "Lista de precios", `${URL_SISTEMA}/lista-precios`, "acá tenés la lista de precios vigente de DEVISEBIT, con qué incluye cada servicio", "Ver la lista de precios"),
  m("webs", "Landing · Páginas web", "https://www.devisebit.com/webs", "acá ves los paquetes de páginas web, trabajos y cómo arrancamos", "Ver páginas web", { linea: "webs", grupo: "landing" }),
  m("whatsapp", "Landing · Agentes de WhatsApp", "https://www.devisebit.com/whatsapp", "acá ves cómo funcionan los agentes de WhatsApp con IA y sus planes", "Ver agentes de WhatsApp", { linea: "whatsapp", grupo: "landing" }),
  m("redes", "Landing · Redes y anuncios", "https://www.devisebit.com/redes", "acá ves los planes de redes y de gestión de anuncios", "Ver redes y anuncios", { linea: "redes", grupo: "landing" }),
  m("sistemas", "Landing · Sistemas a medida", "https://www.devisebit.com/sistemas", "acá ves los sistemas que armamos y cómo trabajamos", "Ver sistemas a medida", { linea: "sistemas", grupo: "landing" }),
  m("comunidad", "Landing · Plataforma para comunidades", "https://www.devisebit.com/comunidad", "acá ves la plataforma para gremios, asociaciones y academias", "Ver la plataforma", { linea: "comunidad", grupo: "landing" }),
  m("casos", "Casos de éxito", "https://www.devisebit.com/casos-de-exito", "te dejo algunos casos de proyectos que hicimos", "Ver casos de éxito"),
  // Pedidos de información: el formulario de inicio de cada landing (sección #inicio) y la lista de alta del agente
  m("inicio", "Páginas web · formulario de inicio (info del proyecto)", "https://www.devisebit.com/webs#inicio", "para arrancar, cargá la información de tu negocio acá (lo que no tengas, te lo brindamos)", "Cargar la información",
    { wa: "\nSi preferís, mandámela por este chat: logo, fotos, textos y colores.", correo: "Si preferís, respondé este correo con el logo, las fotos, los textos y los colores.", linea: "webs", grupo: "pedido" }),
  m("inicio-whatsapp", "Agente de WhatsApp · formulario de inicio", "https://www.devisebit.com/whatsapp#inicio", "para armar tu agente, contanos acá de tu negocio: el rubro, cuántas consultas recibís por día y qué te preguntan más tus clientes", "Completar el formulario",
    { wa: "\nSi preferís, contámelo por este chat.", correo: "Si preferís, respondé este correo y contanos lo mismo por acá.", linea: "whatsapp", grupo: "pedido", soloEquipo: true }),
  m("alta-agente", "Agente de WhatsApp · alta de cliente (PDF)", PDF_ALTA_AGENTE, "te paso la lista de lo que necesitamos para entrenar y poner en línea tu agente de WhatsApp: datos del negocio, horarios, precios, preguntas frecuentes, tono, derivación y el acceso al número (lo que no tengas armado, te lo brindamos)", "Ver la lista",
    { wa: "\nMandame lo que tengas por este chat: archivos, fotos, links o audios.", correo: "Respondé este correo con lo que tengas a mano: archivos, fotos o links de Google Drive.", linea: "whatsapp", grupo: "pedido", soloEquipo: true }),
  m("inicio-redes", "Redes y anuncios · formulario de inicio", "https://www.devisebit.com/redes#inicio", "para armarte la propuesta con el diagnóstico de tus redes, dejanos acá los links de tus redes y qué querés lograr", "Completar el formulario",
    { wa: "\nSi preferís, pasame los links por este chat.", correo: "Si preferís, respondé este correo con los links de tus redes.", linea: "redes", grupo: "pedido", soloEquipo: true }),
  m("inicio-sistemas", "Sistemas a medida · formulario de inicio", "https://www.devisebit.com/sistemas#inicio", "para coordinar el diagnóstico, contanos acá qué querés resolver, qué usan hoy y cuántas personas lo usarían", "Completar el formulario",
    { wa: "\nSi preferís, contámelo por este chat.", correo: "Si preferís, respondé este correo y contanos lo mismo por acá.", linea: "sistemas", grupo: "pedido", soloEquipo: true }),
  m("inicio-comunidad", "Comunidades · formulario de inicio", "https://www.devisebit.com/comunidad#inicio", "para coordinar la demo, contanos acá de tu comunidad: qué tipo de organización es, cuántos socios o alumnos tiene y qué querés ofrecerles", "Completar el formulario",
    { wa: "\nSi preferís, contámelo por este chat.", correo: "Si preferís, respondé este correo y contanos lo mismo por acá.", linea: "comunidad", grupo: "pedido", soloEquipo: true }),
  m("youtube", "Canal de YouTube", "https://www.youtube.com/@devisebitsrl", "en nuestro canal de YouTube tenés guías, casos reales y demos", "Ir al canal"),
  {
    k: "pago", n: "Datos de pago (CBU y alias)", link: "", frase: "te paso los datos para la seña", boton: "", grupo: "otro",
    texto: (n) => `${hola(n)}te paso los datos para la seña 👇\n*Titular:* ${PAGO.titular}\n*CUIT:* ${PAGO.cuit}\n*Banco:* ${PAGO.banco} · ${PAGO.cuenta}\n*CBU:* ${PAGO.cbu}\n*Alias:* ${PAGO.alias}\nPagando por transferencia tenés 10% de descuento. Cuando transfieras, mandame el comprobante por acá y te enviamos la factura.`,
    correo: `- **Titular:** ${PAGO.titular}\n- **CUIT:** ${PAGO.cuit}\n- **Banco:** ${PAGO.banco} · ${PAGO.cuenta}\n- **CBU:** ${PAGO.cbu}\n- **Alias:** ${PAGO.alias}\n\nPagando por transferencia tenés 10% de descuento. Cuando transfieras, respondé este correo con el comprobante y te enviamos la factura.`,
  },
  // El folleto de páginas web es «brochure» (arriba): acá no se repite
  ...([["whatsapp", "Asistente de WhatsApp con IA", "whatsapp"], ["sistemas", "Sistemas a medida", "sistemas"], ["padron", "Sistema de padrón", "comunidad"], ["obras-sociales", "Sistema para obras sociales", "comunidad"], ["academia", "Plataforma de cursos", "comunidad"], ["panel-contenido", "Panel de Contenido", undefined], ["transformacion-digital", "Transformación Digital", undefined]] as const).map(([s, n, linea]) =>
    m(`folleto-${s}`, `Folleto · ${n} (PDF)`, `${MV}/folletos/devisebit-${s}.pdf`, `te paso el folleto de ${n} para que lo veas con calma`, "Ver el folleto", { linea, grupo: "folleto" })),
  m("asesoria-pdf", "Asesoría y consultoría · formatos y valores (PDF)", PDF_ASESORIA, "te paso las formas de contratar asesoría en tecnología e IA, con valores", "Ver formatos y valores",
    { grupo: "folleto", wa: "\nSi querés, agendamos una primera reunión para ver cuál te conviene.", correo: "Si querés, agendamos una primera reunión para ver cuál te conviene." }),
  m("panel-pdf", "Panel de Contenido · presentación (PDF)", `${MV}/panel-de-contenido-devisebit.pdf`, "te paso la presentación del Panel de Contenido, con pantallas reales", "Ver la presentación", { grupo: "folleto" }),
]

export const material = (k: string) => MATERIALES.find((m) => m.k === k)

/** Línea de producto de una consulta según su motivo (y, si no alcanza, su primer mensaje). Mismas palabras clave que el seguimiento del bot. */
export function lineaDe(motivo?: string | null, mensaje?: string | null): Linea | null {
  for (const t of [motivo, mensaje]) {
    const x = (t ?? "").toLowerCase()
    if (!x.trim()) continue
    if (/whatsapp|\bbot\b|asistente|chatbot|agente/.test(x)) return "whatsapp"
    if (/redes|instagram|facebook|anuncio|seguidor|community|publicidad/.test(x)) return "redes"
    if (/gremio|sindicato|padr[oó]n|afiliad|socios|mutual|obra social|academia|cursos|comunidad/.test(x)) return "comunidad"
    if (/\bweb|sitio|p[aá]gina|landing|tienda/.test(x)) return "webs"
    if (/sistema|\bapp\b|aplicaci[oó]n|crm|turnos|tablero|indicadores|gesti[oó]n|stock|software/.test(x)) return "sistemas"
  }
  return null
}

const GRUPOS: [Material["grupo"], string][] = [["pedido", "Pedidos de información"], ["landing", "Páginas con planes y precios"], ["folleto", "Folletos y presentaciones (PDF)"], ["otro", "Otros"]]

/**
 * El material ordenado para el selector de la consulta: primero lo de la línea de la consulta (con su pedido de información adelante,
 * que queda preseleccionado) y después el resto por tipo. Sin línea reconocida, queda preseleccionado el folleto de páginas web, como antes.
 */
export function materialesPara(linea: Linea | null): { grupos: { t: string; items: Material[] }[]; sugerido: string } {
  const orden = (a: Material, b: Material) => GRUPOS.findIndex((g) => g[0] === a.grupo) - GRUPOS.findIndex((g) => g[0] === b.grupo)
  const propios = linea ? MATERIALES.filter((x) => x.linea === linea).sort(orden) : []
  const resto = MATERIALES.filter((x) => !propios.includes(x))
  return {
    grupos: [...(propios.length ? [{ t: `Para esta consulta · ${LINEAS[linea!]}`, items: propios }] : []), ...GRUPOS.map(([g, t]) => ({ t, items: resto.filter((x) => x.grupo === g) })).filter((g) => g.items.length)],
    sugerido: propios[0]?.k ?? "brochure",
  }
}
