import { PAGO } from "./precios"
import { URL_SISTEMA } from "./brief"
import { MV, PDF_ASESORIA } from "./material"

/**
 * Material comercial que el bot y el equipo pueden mandar con un clic, por WhatsApp o por email.
 * `frase` es la línea de contexto (sin saludo ni link): por WhatsApp sale como «Nombre, frase: link» y por email como párrafo con el link en un botón.
 */
export type Material = {
  k: string; n: string; link: string; texto: (nombre?: string | null) => string
  frase: string; boton: string
  /** Párrafos extra del email (texto simple de lib/email), después del botón. */
  correo?: string
}

const hola = (n?: string | null) => (n ? `${n.split(" ")[0]}, ` : "")

/** Material con link: el mensaje de WhatsApp es «frase: link» más `wa` (lo que solo tiene sentido por chat). */
const m = (k: string, n: string, link: string, frase: string, boton: string, o: { wa?: string; correo?: string } = {}): Material => ({
  k, n, link, frase, boton, correo: o.correo,
  texto: (nom) => `${hola(nom)}${frase}: ${link}${o.wa ?? ""}`,
})

export const MATERIALES: Material[] = [
  m("brochure", "Folleto de páginas web (PDF)", `${MV}/folletos/devisebit-webs.pdf`, "te paso el folleto de páginas web, con qué incluye y cómo trabajamos", "Ver el folleto"),
  m("lista", "Lista de precios", `${URL_SISTEMA}/lista-precios`, "acá tenés la lista de precios vigente de DEVISEBIT, con qué incluye cada servicio", "Ver la lista de precios"),
  m("webs", "Landing · Páginas web", "https://www.devisebit.com/webs", "acá ves los paquetes de páginas web, trabajos y cómo arrancamos", "Ver páginas web"),
  m("whatsapp", "Landing · Agentes de WhatsApp", "https://www.devisebit.com/whatsapp", "acá ves cómo funcionan los agentes de WhatsApp con IA y sus planes", "Ver agentes de WhatsApp"),
  m("redes", "Landing · Redes y anuncios", "https://www.devisebit.com/redes", "acá ves los planes de redes y de gestión de anuncios", "Ver redes y anuncios"),
  m("sistemas", "Landing · Sistemas a medida", "https://www.devisebit.com/sistemas", "acá ves los sistemas que armamos y cómo trabajamos", "Ver sistemas a medida"),
  m("comunidad", "Landing · Plataforma para comunidades", "https://www.devisebit.com/comunidad", "acá ves la plataforma para gremios, asociaciones y academias", "Ver la plataforma"),
  m("casos", "Casos de éxito", "https://www.devisebit.com/casos-de-exito", "te dejo algunos casos de proyectos que hicimos", "Ver casos de éxito"),
  m("inicio", "Formulario para mandar la info del proyecto", "https://www.devisebit.com/webs#inicio", "para arrancar, cargá la información de tu negocio acá (lo que no tengas, te lo brindamos)", "Cargar la información",
    { wa: "\nSi preferís, mandámela por este chat: logo, fotos, textos y colores.", correo: "Si preferís, respondé este correo con el logo, las fotos, los textos y los colores." }),
  m("youtube", "Canal de YouTube", "https://www.youtube.com/@devisebitsrl", "en nuestro canal de YouTube tenés guías, casos reales y demos", "Ir al canal"),
  {
    k: "pago", n: "Datos de pago (CBU y alias)", link: "", frase: "te paso los datos para la seña", boton: "",
    texto: (n) => `${hola(n)}te paso los datos para la seña 👇\n*Titular:* ${PAGO.titular}\n*CUIT:* ${PAGO.cuit}\n*Banco:* ${PAGO.banco} · ${PAGO.cuenta}\n*CBU:* ${PAGO.cbu}\n*Alias:* ${PAGO.alias}\nPagando por transferencia tenés 10% de descuento. Cuando transfieras, mandame el comprobante por acá y te enviamos la factura.`,
    correo: `- **Titular:** ${PAGO.titular}\n- **CUIT:** ${PAGO.cuit}\n- **Banco:** ${PAGO.banco} · ${PAGO.cuenta}\n- **CBU:** ${PAGO.cbu}\n- **Alias:** ${PAGO.alias}\n\nPagando por transferencia tenés 10% de descuento. Cuando transfieras, respondé este correo con el comprobante y te enviamos la factura.`,
  },
  ...([["webs", "Páginas web con IA"], ["whatsapp", "Asistente de WhatsApp con IA"], ["sistemas", "Sistemas a medida"], ["padron", "Sistema de padrón"], ["obras-sociales", "Sistema para obras sociales"], ["academia", "Plataforma de cursos"], ["panel-contenido", "Panel de Contenido"], ["transformacion-digital", "Transformación Digital"]] as const).map(([s, n]) =>
    m(`folleto-${s}`, `Folleto · ${n} (PDF)`, `${MV}/folletos/devisebit-${s}.pdf`, `te paso el folleto de ${n} para que lo veas con calma`, "Ver el folleto")),
  m("asesoria-pdf", "Asesoría y consultoría · formatos y valores (PDF)", PDF_ASESORIA, "te paso las formas de contratar asesoría en tecnología e IA, con valores", "Ver formatos y valores",
    { wa: "\nSi querés, agendamos una primera reunión para ver cuál te conviene.", correo: "Si querés, agendamos una primera reunión para ver cuál te conviene." }),
  m("panel-pdf", "Panel de Contenido · presentación (PDF)", `${MV}/panel-de-contenido-devisebit.pdf`, "te paso la presentación del Panel de Contenido, con pantallas reales", "Ver la presentación"),
]

export const material = (k: string) => MATERIALES.find((m) => m.k === k)
