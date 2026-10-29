import { REDES } from "./redes"

/**
 * Estilos de envío (plantillas) para campañas de email, al estilo de los editores de newsletters:
 * cada estilo cambia cabecera, colores, tipografía, portada y botones. El contenido se escribe
 * en texto simple (# Título, ## Subtítulo, **negrita**, [texto](url), - lista, ![foto](url), [[Botón|url]], ---).
 */
export type Estilo = {
  id: string; nombre: string; para: string
  fondo: string; papel: string; texto: string; suave: string; acento: string; botonTexto: string
  cabecera: "oscura" | "clara" | "acento" | "ninguna"; serif?: boolean; radio: number; heroColor?: string
  marca?: string
  ejemplo: { asunto: string; preheader: string; portada?: string; contenido: string }
}

const WA = "https://wa.me/5491173466490"

export const ESTILOS: Estilo[] = [
  { id: "clasico", nombre: "Clásico DEVISEBIT", para: "Novedades y avisos generales", fondo: "#F5F6F8", papel: "#FFFFFF", texto: "#262C37", suave: "#4A515C", acento: "#C8231F", botonTexto: "#FFFFFF", cabecera: "oscura", radio: 16,
    ejemplo: { asunto: "Novedades de DEVISEBIT, {{nombre}}", preheader: "Lo nuevo del mes en un minuto", contenido: "# Hola {{nombre}} 👋\n\nTe contamos en un minuto lo nuevo de este mes.\n\n## Lanzamos la consultoría de transformación digital\nDiagnóstico, hoja de ruta y capacitación con certificado para ordenar tu organización por etapas.\n\n[[Conocé la propuesta|https://www.devisebit.com/transformacion-digital]]\n\n---\n\n¿Querés que lo veamos juntos? Respondé este correo o escribinos por [WhatsApp](" + WA + ")." } },
  { id: "newsletter", nombre: "Newsletter editorial", para: "Notas del blog y contenido para leer", fondo: "#F7F5F0", papel: "#FFFFFF", texto: "#24211C", suave: "#6B655C", acento: "#9E1A17", botonTexto: "#FFFFFF", cabecera: "clara", serif: true, radio: 4,
    ejemplo: { asunto: "3 lecturas para esta semana", preheader: "IA, datos y gestión, explicado simple", contenido: "# Tres lecturas para esta semana\n\nElegimos lo más útil que publicamos en el blog.\n\n## 1. Cómo usan la IA las pymes argentinas\nQué están haciendo, qué funciona y por dónde empezar. [Leer la nota](https://www.devisebit.com/novedades)\n\n## 2. Interoperabilidad en salud\nPor qué que los sistemas se hablen es la clave de 2026. [Leer la nota](https://www.devisebit.com/novedades)\n\n## 3. Guía: de Excel a tablero en 7 días\nUn paso a paso para dejar de armar reportes a mano. [Leer la guía](https://academia.devisebit.com/guias)\n\n---\n\nSi una te sirvió, reenviásela a alguien de tu equipo." } },
  { id: "promo", nombre: "Promoción", para: "Ofertas, lanzamientos con precio, cierre de ventas", fondo: "#FFF5F4", papel: "#FFFFFF", texto: "#1F1F23", suave: "#5A5A63", acento: "#E11D2E", botonTexto: "#FFFFFF", cabecera: "acento", radio: 20, heroColor: "#E11D2E",
    ejemplo: { asunto: "Solo hasta el viernes: tu web lista en días", preheader: "Diseño único con IA y WhatsApp conectado", contenido: "# Tu web lista en días\n\nDiseño único con inteligencia artificial, dominio a tu nombre y WhatsApp conectado para que cada visita sea una consulta.\n\n- Lista en 2 a 7 días hábiles\n- Preparada para Google desde el primer día\n- Hasta 3 cuotas sin interés\n\n[[Quiero mi web|https://www.devisebit.com/webs]]\n\nLa propuesta vale hasta el viernes." } },
  { id: "evento", nombre: "Evento o webinar", para: "Invitaciones a charlas, talleres y clases en vivo", fondo: "#0F1318", papel: "#171C23", texto: "#E8ECF1", suave: "#9AA6B4", acento: "#FF6A63", botonTexto: "#0F1318", cabecera: "oscura", radio: 14,
    ejemplo: { asunto: "Te invitamos: taller de transformación digital", preheader: "En vivo, 3 horas, con certificado", contenido: "# Taller de transformación digital\n\n**Jueves · 10 h · por videollamada**\n\nUna jornada para medir la madurez digital de tu organización y salir con los primeros pasos claros.\n\n## Qué vas a hacer\n- Autodiagnóstico en vivo con tu equipo\n- Casos reales de pymes y organismos\n- Primeros retos priorizados\n\n[[Reservar mi lugar|https://academia.devisebit.com/productos/taller-transformacion-digital]]\n\nCupos limitados. Certificado de la ACADEMIA DEVISEBIT." } },
  { id: "lanzamiento", nombre: "Lanzamiento de producto", para: "Presentar un sistema, app o servicio nuevo", fondo: "#EEF1F6", papel: "#FFFFFF", texto: "#141922", suave: "#4A5568", acento: "#C8231F", botonTexto: "#FFFFFF", cabecera: "oscura", radio: 18, heroColor: "#0E1116",
    ejemplo: { asunto: "Nuevo: Mi cuenta para clientes de DEVISEBIT", preheader: "Seguimiento, pagos y reuniones en un solo lugar", contenido: "# Presentamos Mi cuenta\n\nTodo lo de tu proyecto con DEVISEBIT en un solo lugar.\n\n- **Seguimiento** del avance y novedades del proyecto\n- **Pagos y comprobantes** con Mercado Pago o transferencia\n- **Reuniones** conectadas a nuestra agenda\n- **Cursos** con certificado\n\n[[Entrar a Mi cuenta|https://portal.devisebit.com]]" } },
  { id: "personal", nombre: "Carta personal", para: "Mensajes de Julio, seguimiento y reactivación", fondo: "#FFFFFF", papel: "#FFFFFF", texto: "#1C1C1C", suave: "#666666", acento: "#C8231F", botonTexto: "#FFFFFF", cabecera: "ninguna", radio: 0,
    ejemplo: { asunto: "{{nombre}}, ¿cómo vienen con el proyecto?", preheader: "Un mensaje corto de Julio", contenido: "Hola {{nombre}}:\n\nHace un tiempo hablamos sobre ordenar la atención y los procesos de tu organización y quería saber cómo siguió.\n\nEstos meses sumamos varias cosas que te pueden servir: un diagnóstico de madurez digital y asistentes de WhatsApp que atienden las 24 horas.\n\nSi te parece, coordinamos 30 minutos y lo vemos: [elegí un horario](https://sistema.devisebit.com/agendar).\n\nUn abrazo,\n**Julio Miranda**\nDEVISEBIT SRL" } },
  { id: "academia", nombre: "Academia", para: "Cursos, guías y certificados", fondo: "#F1F5F4", papel: "#FFFFFF", texto: "#1B2423", suave: "#4D5B59", acento: "#0F766E", botonTexto: "#FFFFFF", cabecera: "acento", radio: 14, heroColor: "#0F766E", marca: "ACADEMIA DEVISEBIT",
    ejemplo: { asunto: "Nueva guía: 10 automatizaciones con IA", preheader: "Gratis y en castellano", contenido: "# 10 automatizaciones con IA para tu pyme\n\nUna guía práctica, sin tecnicismos, para ahorrar horas de trabajo repetitivo esta misma semana.\n\n- Responder consultas frecuentes\n- Armar reportes solos\n- Ordenar tus contactos\n\n[[Leer la guía gratis|https://academia.devisebit.com/guias]]\n\n¿Querés ir más allá? Mirá los [cursos con certificado](https://academia.devisebit.com/cursos)." } },
  { id: "institucional", nombre: "Institucional salud y gobierno", para: "Gremios, obras sociales, organismos y salud", fondo: "#F2F6FA", papel: "#FFFFFF", texto: "#1A2433", suave: "#4B5869", acento: "#1D4E89", botonTexto: "#FFFFFF", cabecera: "clara", radio: 8,
    ejemplo: { asunto: "Padrón y obra social, en un solo sistema", preheader: "Para gremios, mutuales y obras sociales", contenido: "# Padrón, aportes y obra social en un solo sistema\n\nPara gremios, mutuales y obras sociales que necesitan ordenar la gestión sin desarrollar desde cero.\n\n## Qué incluye\n- Padrón con credencial digital\n- Aportes y estado de cada afiliado\n- Órdenes, autorizaciones y prestadores\n- Tablero para la conducción\n\n[[Pedir una demo|https://www.devisebit.com/comunidad]]\n\nDesarrollo propio, probado en producción." } },
]

export const estilo = (id?: string | null) => ESTILOS.find((e) => e.id === id) ?? ESTILOS[0]

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/** Texto simple → HTML con los colores y la tipografía del estilo. */
export function cuerpoHtml(md: string, e: Estilo) {
  const f = e.serif ? "Georgia,'Times New Roman',serif" : "Inter,Segoe UI,Helvetica,Arial,sans-serif"
  const inline = (s: string) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, `<a href="$2" style="color:${e.acento};font-weight:600">$1</a>`)
  const out: string[] = []
  let lista: string[] = []
  const cerrar = () => { if (lista.length) { out.push(`<ul style="margin:0 0 16px;padding-left:20px;color:${e.texto}">${lista.map((l) => `<li style="margin:0 0 6px;font-size:16px;line-height:1.55">${inline(l)}</li>`).join("")}</ul>`); lista = [] } }
  for (const raw of md.replace(/\r/g, "").split(/\n{2,}|\n(?=[#\-!\[])/)) {
    const l = raw.trim()
    if (!l) continue
    if (/^- /.test(l)) { for (const x of l.split("\n")) lista.push(x.replace(/^- /, "")); continue }
    cerrar()
    let m
    if ((m = l.match(/^## (.+)/))) out.push(`<h2 style="margin:26px 0 8px;font-family:${f};font-size:20px;line-height:1.3;color:${e.texto}">${inline(m[1])}</h2>`)
    else if ((m = l.match(/^# (.+)/))) out.push(`<h1 style="margin:0 0 14px;font-family:${f};font-size:28px;line-height:1.2;color:${e.texto}">${inline(m[1])}</h1>`)
    else if ((m = l.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/))) out.push(`<img src="${m[2]}" alt="${esc(m[1])}" width="100%" style="display:block;width:100%;max-width:560px;border-radius:${Math.min(e.radio, 14)}px;margin:0 0 16px">`)
    else if ((m = l.match(/^\[\[(.+?)\|(https?:\/\/[^\]]+)\]\]$/))) out.push(`<p style="margin:10px 0 22px"><a href="${m[2]}" style="display:inline-block;background:${e.acento};color:${e.botonTexto};text-decoration:none;font-weight:700;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;padding:14px 26px;border-radius:${e.id === "promo" ? 999 : Math.max(6, Math.min(e.radio, 12))}px">${esc(m[1])}</a></p>`)
    else if (l === "---") out.push(`<hr style="border:0;border-top:1px solid ${e.id === "evento" ? "#2A323D" : "#E2E5EA"};margin:24px 0">`)
    else out.push(`<p style="margin:0 0 14px;font-family:${f};font-size:16px;line-height:1.65;color:${e.texto}">${inline(l).replace(/\n/g, "<br>")}</p>`)
  }
  cerrar()
  return out.join("\n")
}

/** Email completo con el estilo elegido. */
export function emailConEstilo(md: string, o: { estilo?: string | null; preheader?: string | null; baja?: string | null; nombre?: string | null; portada?: string | null }) {
  const e = estilo(o.estilo)
  const nombre = o.nombre ? esc(o.nombre.split(" ")[0]) : ""
  const cuerpo = cuerpoHtml(md, e).replace(/\s?\{\{nombre\}\}/g, (m: string) => (!nombre ? "" : m.startsWith("{") ? nombre : " " + nombre))
  const marca = e.marca ?? "DEVISE<span style=\"color:#FF6A63\">BIT</span>"
  const r = e.radio
  const cab =
    e.cabecera === "oscura" ? `<tr><td style="background:#0E1116;border-radius:${r}px ${r}px 0 0;padding:22px 28px"><span style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:20px;font-weight:800;letter-spacing:.04em;color:#fff">${marca}</span></td></tr>`
    : e.cabecera === "acento" ? `<tr><td style="background:${e.heroColor ?? e.acento};border-radius:${r}px ${r}px 0 0;padding:22px 28px"><span style="font-family:Inter,Segoe UI,Arial,sans-serif;font-size:${e.marca ? 14 : 20}px;font-weight:800;letter-spacing:${e.marca ? ".2em" : ".04em"};color:#fff">${e.marca ?? "DEVISEBIT"}</span></td></tr>`
    : e.cabecera === "clara" ? `<tr><td style="background:${e.papel};border-radius:${r}px ${r}px 0 0;padding:24px 28px 14px;border-bottom:3px solid ${e.acento}"><span style="font-family:${e.serif ? "Georgia,serif" : "Inter,Segoe UI,Arial,sans-serif"};font-size:22px;font-weight:700;color:${e.texto}">DEVISEBIT${e.serif ? " · Novedades" : ""}</span></td></tr>`
    : ""
  const portada = o.portada ? `<tr><td style="background:${e.papel};padding:0"><img src="${esc(o.portada)}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto"></td></tr>` : ""
  const pieColor = e.id === "evento" ? "#9AA6B4" : e.suave
  const pie = e.cabecera === "ninguna"
    ? `<tr><td style="padding:18px 28px;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:${pieColor}">DEVISEBIT SRL · <a href="https://www.devisebit.com" style="color:${pieColor}">devisebit.com</a> · WhatsApp +54 9 11 7346-6490${o.baja ? `<br>Si no querés recibir más correos, <a href="${o.baja}" style="color:${pieColor}">date de baja acá</a>.` : ""}</td></tr>`
    : `<tr><td style="background:${e.papel};border-top:1px solid ${e.id === "evento" ? "#2A323D" : "#EEF0F3"};border-radius:0 0 ${r}px ${r}px;padding:18px 28px;font-family:Arial,sans-serif;font-size:12px;line-height:1.6;color:${pieColor}">
DEVISEBIT SRL · Software e IA. Desde 2009<br>${REDES.map((x) => `<a href="${x.href}" style="color:${e.acento};font-weight:600;text-decoration:none">${x.nombre}</a>`).join(" · ")}<br>WhatsApp +54 9 11 7346-6490 · <a href="https://www.devisebit.com" style="color:${pieColor}">devisebit.com</a><br>
${o.baja ? `Recibís este correo porque estás en contacto con DEVISEBIT. <a href="${o.baja}" style="color:${pieColor}">Darte de baja</a>.` : ""}</td></tr>`
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DEVISEBIT</title></head>
<body style="margin:0;background:${e.fondo}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader ?? "")}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${e.fondo}"><tr><td align="center" style="padding:${e.cabecera === "ninguna" ? "12px" : "24px 12px"}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
${cab}${portada}
<tr><td style="background:${e.papel};padding:30px 28px${e.cabecera === "ninguna" ? ";border-radius:0" : ""}">${cuerpo}</td></tr>
${pie}
</table></td></tr></table></body></html>`
}
