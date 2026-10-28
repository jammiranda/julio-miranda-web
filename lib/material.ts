/**
 * Material de venta: folletos, PDF del Panel, piezas de redes y videos ocultos.
 * Los archivos están en una carpeta no listada de la web (se comparten por link; no se enlazan desde ningún lado).
 */
export const MV = "https://www.devisebit.com/mv-8f92ddf28895"

export type ItemMaterial = { k: string; titulo: string; detalle?: string; url: string; tipo: "pdf" | "zip" | "png" | "video" | "link"; marca?: "devisebit" | "blanca" }
export type GrupoMaterial = { t: string; d: string; items: ItemMaterial[] }

const PRODUCTOS = [
  { s: "webs", n: "Páginas web con IA" },
  { s: "whatsapp", n: "Asistente de WhatsApp con IA" },
  { s: "sistemas", n: "Sistemas a medida" },
  { s: "padron", n: "Sistema de padrón" },
  { s: "obras-sociales", n: "Sistema para obras sociales" },
  { s: "panel-contenido", n: "Panel de Contenido" },
  { s: "academia", n: "Plataforma de cursos" },
  { s: "transformacion-digital", n: "Transformación Digital" },
]

const PLACAS = [
  ["01-paginas-web-con-ia", "Páginas web con IA"],
  ["02-asistente-de-whatsapp-con-ia", "Asistente de WhatsApp con IA"],
  ["03-sistemas-a-medida", "Sistemas a medida"],
  ["04-sistema-de-padron", "Sistema de padrón"],
  ["05-sistema-para-obras-sociales", "Sistema para obras sociales"],
  ["06-plataforma-de-cursos", "Plataforma de cursos"],
  ["07-panel-de-contenido", "Panel de Contenido"],
  ["08-autodiagnostico-de-madurez-digital", "Autodiagnóstico de madurez digital"],
]

export const VIDEOS = [
  { k: "video-whatsapp", titulo: "Demo · Asistente de WhatsApp con IA" },
  { k: "video-webs", titulo: "Demo · Páginas web con IA" },
  { k: "video-sistemas", titulo: "Demo · Sistemas a medida" },
  { k: "video-padron", titulo: "Demo · Sistema de padrón" },
  { k: "video-obras-sociales", titulo: "Demo · Sistema para obras sociales" },
  { k: "video-academia", titulo: "Demo · Plataforma de cursos" },
  { k: "video-panel", titulo: "Demo · Panel de Contenido" },
  { k: "video-autodiagnostico", titulo: "Autodiagnóstico de madurez digital" },
  { k: "playlist", titulo: "Playlist completa de demos" },
]

export const GRUPOS: GrupoMaterial[] = [
  {
    t: "Folletos para clientes",
    d: "Versión DEVISEBIT, con QR al pedido de demo. Complementan lo que se manda en la venta; sin precios.",
    items: [
      ...PRODUCTOS.map((p) => ({ k: `folleto-${p.s}`, titulo: p.n, url: `${MV}/folletos/devisebit-${p.s}.pdf`, tipo: "pdf" as const, marca: "devisebit" as const })),
      { k: "folletos-zip", titulo: "Todos los folletos (DEVISEBIT y marca blanca)", detalle: "ZIP con los 16 PDF", url: `${MV}/folletos/folletos-devisebit.zip`, tipo: "zip" },
    ],
  },
  {
    t: "Folletos marca blanca",
    d: "Sin DEVISEBIT, con lugar para el logo y el contacto de quien revende. Solo para revendedores y aliados.",
    items: PRODUCTOS.map((p) => ({ k: `blanca-${p.s}`, titulo: p.n, url: `${MV}/folletos/marca-blanca-${p.s}.pdf`, tipo: "pdf" as const, marca: "blanca" as const })),
  },
  {
    t: "Panel de Contenido · PDF de venta",
    d: "Presentación de 10 páginas con pantallas reales del panel.",
    items: [
      { k: "panel-pdf", titulo: "Panel de Contenido · DEVISEBIT", url: `${MV}/panel-de-contenido-devisebit.pdf`, tipo: "pdf", marca: "devisebit" },
      { k: "panel-pdf-blanca", titulo: "Panel de Contenido · marca blanca", url: `${MV}/panel-de-contenido-marca-blanca.pdf`, tipo: "pdf", marca: "blanca" },
    ],
  },
  {
    t: "Piezas para redes",
    d: "Placas 1080×1080 por producto y carrusel 1080×1350. Sin precios. Los textos para Instagram y LinkedIn están en el ZIP.",
    items: [
      ...PLACAS.map(([f, n]) => ({ k: `placa-${f}`, titulo: n, url: `${MV}/redes/${f}.png`, tipo: "png" as const })),
      ...[1, 2, 3, 4, 5, 6].map((i) => ({ k: `carrusel-${i}`, titulo: `Carrusel · placa ${i} de 6`, url: `${MV}/redes/carrusel-0${i}.png`, tipo: "png" as const })),
      { k: "redes-zip", titulo: "Todo (placas, carrusel y textos)", url: `${MV}/redes/redes-demos.zip`, tipo: "zip" },
    ],
  },
]

export const todosLosItems = () => GRUPOS.flatMap((g) => g.items)
export const itemMaterial = (k: string) => todosLosItems().find((i) => i.k === k)
