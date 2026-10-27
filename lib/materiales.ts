import { PAGO } from "./precios"
import { URL_SISTEMA } from "./brief"

/** Material comercial que el bot y el equipo pueden mandar por WhatsApp con un clic. */
export type Material = { k: string; n: string; link: string; texto: (nombre?: string | null) => string }

const hola = (n?: string | null) => (n ? `${n.split(" ")[0]}, ` : "")

export const MATERIALES: Material[] = [
  { k: "brochure", n: "Brochure de páginas web (PDF)", link: "https://www.devisebit.com/webs/brochure", texto: (n) => `${hola(n)}te paso el brochure con paquetes, abonos, formas de pago y garantías. Se descarga en PDF desde el botón de arriba: https://www.devisebit.com/webs/brochure` },
  { k: "lista", n: "Lista de precios", link: `${URL_SISTEMA}/lista-precios`, texto: (n) => `${hola(n)}acá tenés la lista de precios vigente de DEVISEBIT, con qué incluye cada servicio: ${URL_SISTEMA}/lista-precios` },
  { k: "webs", n: "Landing · Páginas web", link: "https://www.devisebit.com/webs", texto: (n) => `${hola(n)}acá ves los paquetes de páginas web, trabajos y cómo arrancamos: https://www.devisebit.com/webs` },
  { k: "whatsapp", n: "Landing · Agentes de WhatsApp", link: "https://www.devisebit.com/whatsapp", texto: (n) => `${hola(n)}acá ves cómo funcionan los agentes de WhatsApp con IA y sus planes: https://www.devisebit.com/whatsapp` },
  { k: "redes", n: "Landing · Redes y anuncios", link: "https://www.devisebit.com/redes", texto: (n) => `${hola(n)}acá ves los planes de redes y de gestión de anuncios: https://www.devisebit.com/redes` },
  { k: "sistemas", n: "Landing · Sistemas a medida", link: "https://www.devisebit.com/sistemas", texto: (n) => `${hola(n)}acá ves los sistemas que armamos y cómo trabajamos: https://www.devisebit.com/sistemas` },
  { k: "comunidad", n: "Landing · Plataforma para comunidades", link: "https://www.devisebit.com/comunidad", texto: (n) => `${hola(n)}acá ves la plataforma para gremios, asociaciones y academias: https://www.devisebit.com/comunidad` },
  { k: "casos", n: "Casos de éxito", link: "https://www.devisebit.com/casos-de-exito", texto: (n) => `${hola(n)}te dejo algunos casos de proyectos que hicimos: https://www.devisebit.com/casos-de-exito` },
  { k: "inicio", n: "Formulario para mandar la info del proyecto", link: "https://www.devisebit.com/webs#inicio", texto: (n) => `${hola(n)}para arrancar, cargá la información de tu negocio acá (lo que no tengas, te lo brindamos): https://www.devisebit.com/webs#inicio\nSi preferís, mandámela por este chat: logo, fotos, textos y colores.` },
  { k: "youtube", n: "Canal de YouTube", link: "https://www.youtube.com/@devisebitsrl", texto: (n) => `${hola(n)}en nuestro canal de YouTube tenés guías, casos reales y demos: https://www.youtube.com/@devisebitsrl` },
  { k: "pago", n: "Datos de pago (CBU y alias)", link: "", texto: (n) => `${hola(n)}te paso los datos para la seña 👇\n*Titular:* ${PAGO.titular}\n*CUIT:* ${PAGO.cuit}\n*Banco:* ${PAGO.banco} · ${PAGO.cuenta}\n*CBU:* ${PAGO.cbu}\n*Alias:* ${PAGO.alias}\nPagando por transferencia tenés 10% de descuento. Cuando transfieras, mandame el comprobante por acá y te enviamos la factura.` },
]

export const material = (k: string) => MATERIALES.find((m) => m.k === k)
