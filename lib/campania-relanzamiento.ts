import { q } from "./db"
import { URL_SISTEMA } from "./brief"

/**
 * Campaña lista para usar: "DEVISEBIT se renueva", con las landings de servicios.
 * Se crea una sola vez como borrador (clave única); después se edita y se envía desde Envíos de email.
 */
export const CLAVE_RELANZAMIENTO = "relanzamiento-2026-11"

const img = (slug: string) => `${URL_SISTEMA}/marca/landings/og-${slug}.jpg`
const WA = "https://wa.me/5491173466490?text=" + encodeURIComponent("Hola, recibí el correo de DEVISEBIT y quiero hacer una consulta")

export const RELANZAMIENTO = {
  asunto: "DEVISEBIT se renueva: software e IA para tu organización",
  preheader: "Webs, sistemas, WhatsApp con IA, redes y transformación digital, en un solo lugar.",
  estilo: "lanzamiento",
  contenido: [
    "# Hola {{nombre}}, DEVISEBIT se renueva",
    "Desde 2009 desarrollamos software para salud, gobierno, universidades, gremios y empresas, y seguimos trabajando como siempre: con **sistemas en producción** y la inteligencia artificial aplicada a lo que de verdad le sirve a tu organización.",
    "Renovamos nuestra imagen y ordenamos todo lo que hacemos para que encuentres rápido lo que necesitás.",,
    "Te cuento en un minuto lo que podemos hacer por vos:",
    "---",
    "## Webs a medida con IA",
    `![Desarrollo web a medida con IA](${img("webs")})`,
    "Diseñadas con IA y revisadas por especialistas, con dominio a tu nombre, preparadas para Google y con WhatsApp conectado para que cada visita sea una consulta.",
    "[[Ver webs a medida|https://www.devisebit.com/webs]]",
    "## Sistemas de gestión a medida",
    `![Sistemas de gestión a medida](${img("sistemas")})`,
    "Clientes, turnos, stock, pagos, documentos y tableros en un solo lugar, armados sobre módulos ya probados en clientes reales.",
    "[[Ver sistemas de gestión|https://www.devisebit.com/sistemas]]",
    "## Agente de WhatsApp con IA",
    `![Agente de WhatsApp con IA](${img("whatsapp")})`,
    "Responde, vende y da turnos las 24 horas, entrenado con la información de tu negocio y conectado a tu sistema.",
    "[[Ver el agente de WhatsApp|https://www.devisebit.com/whatsapp]]",
    "## Gestión de redes sociales",
    `![Gestión de redes sociales](${img("redes")})`,
    "Placas, carruseles y reels con tu marca, publicados por nuestro equipo en Instagram, Facebook y LinkedIn.",
    "[[Ver gestión de redes|https://www.devisebit.com/redes]]",
    "## Comunidad y academia con tu marca",
    `![Comunidad y academia con tu marca](${img("comunidad")})`,
    "Para gremios, mutuales, colegios, cámaras y asociaciones: padrón, beneficios y una academia propia con certificados.",
    "[[Ver comunidad y academia|https://www.devisebit.com/comunidad]]",
    "---",
    "## Transformación digital, con método",
    "Diagnóstico de madurez, hoja de ruta, pilotos y capacitación con certificado. Si querés saber dónde está parada tu organización, hacé el **autodiagnóstico gratis**: son 12 preguntas y te llega el informe por correo.",
    "[[Hacer el autodiagnóstico gratis|https://www.devisebit.com/demos/transformacion-digital.html]]",
    "---",
    `¿Lo charlamos? Respondé este correo, escribinos por [WhatsApp](${WA}) o [elegí un horario](${URL_SISTEMA}/agendar) para una reunión de 30 minutos sin compromiso.`,
    "Un abrazo,\n**Julio Miranda**\nFundador · DEVISEBIT SRL",
  ].join("\n\n"),
  // Toda la base clasificada con email activo (nunca «Por clasificar» ni descartados); se puede acotar antes de enviar.
  segmento: { excluirTags: ["no-enviar"] },
}

/** Crea el borrador una sola vez. Devuelve su id. */
export async function asegurarRelanzamiento(): Promise<number | null> {
  const r = RELANZAMIENTO
  await q(
    `insert into em_campanias(clave, asunto, preheader, contenido, segmento, estilo, creado_por) values ($1,$2,$3,$4,$5,$6,'Sistema')
     on conflict (clave) where clave is not null do nothing`,
    [CLAVE_RELANZAMIENTO, r.asunto, r.preheader, r.contenido, JSON.stringify(r.segmento), r.estilo],
  ).catch(() => {})
  // Si quedó el texto anterior ("está de nuevo en marcha") y nadie lo editó, se reemplaza por el actual.
  await q(
    `update em_campanias set asunto=$2, preheader=$3, contenido=$4 where clave=$1 and estado='borrador' and contenido like '%está de nuevo en marcha%' and contenido like '%Volvemos con un **equipo completo**%'`,
    [CLAVE_RELANZAMIENTO, r.asunto, r.preheader, r.contenido],
  ).catch(() => {})
  const x = await q<{ id: number }>("select id from em_campanias where clave=$1", [CLAVE_RELANZAMIENTO]).catch(() => [])
  return x[0]?.id ?? null
}
