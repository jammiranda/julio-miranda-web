import { q, one } from "./db"

/**
 * Lista de precios vigente de DEVISEBIT (en pesos argentinos, finales).
 * Vive en la tabla db_precios; la primera vez se carga con PRECIOS_INICIALES.
 * La edita Dirección desde Sistema → Precios y cada cambio queda en db_precios_hist.
 * La usan: el bot, la página interna /precios y la lista pública /lista-precios.
 */
export type Precio = {
  id: number; linea: string; producto: string; precio: number | null; abono: number | null
  condicion: string | null; incluye: string | null; mercado_desde: number | null; mercado_hasta: number | null
  fuente: string | null; argumento: string | null; link: string | null; orden: number; activo: boolean; actualizado: string
}

type Inicial = Omit<Precio, "id" | "activo" | "actualizado" | "orden">

const AD = "Agencia Digital, tarifario 2026"
const PW = "Point Web (tarifarios Neowyze y Web360), ago. 2026"

export const PRECIOS_INICIALES: Inicial[] = [
  { linea: "Páginas web", producto: "Landing Express", precio: 199000, abono: 29000, condicion: "Lista en 2 a 3 días hábiles · abono Esencial, mínimo 6 meses", incluye: "Una página de venta enfocada en un servicio o campaña, diseño único con IA, botón de WhatsApp y formulario, adaptada a celular, SEO básico", mercado_desde: 150000, mercado_hasta: 350000, fuente: AD, argumento: "Estamos en la parte baja del mercado para una landing ($150.000 a $350.000) porque una parte se cubre con el abono y diseñamos con IA. No es una plantilla: es un diseño propio.", link: "https://www.devisebit.com/webs" },
  { linea: "Páginas web", producto: "Web PyME", precio: 349000, abono: 29000, condicion: "Lista en 5 días hábiles · abono Esencial, mínimo 6 meses", incluye: "Sitio institucional completo con las páginas que tu negocio necesite, blog, alta en Google Business, Search Console y todo lo de Landing Express", mercado_desde: 350000, mercado_hasta: 800000, fuente: AD, argumento: "Un sitio institucional pyme se cobra entre $350.000 y $800.000; arrancamos en el piso e incluimos Google Business y Search Console.", link: "https://www.devisebit.com/webs" },
  { linea: "Páginas web", producto: "Web + Agente WhatsApp", precio: 549000, abono: 29000, condicion: "Lista en 7 días hábiles · abono Esencial, mínimo 6 meses", incluye: "Todo lo de Web PyME más un bot que responde consultas las 24 horas y deriva a una persona", mercado_desde: 350000, mercado_hasta: 800000, fuente: AD, argumento: "Pagás lo que cuesta una web pyme de agencia y además te llevás un agente que atiende WhatsApp todo el día.", link: "https://www.devisebit.com/webs" },
  { linea: "Páginas web", producto: "Web Autoadministrable", precio: 690000, abono: 29000, condicion: "Desde · plazo según alcance", incluye: "Panel para editar textos, fotos y productos, catálogo o novedades a medida, capacitación", mercado_desde: 350000, mercado_hasta: 800000, fuente: AD, argumento: "Sitio con panel propio: el mercado lo cobra entre $350.000 y $800.000 en pyme y más de $1.000.000 en empresa.", link: "https://www.devisebit.com/webs" },
  { linea: "Abonos de la web", producto: "Abono Esencial", precio: null, abono: 29000, condicion: "Por mes · mínimo 6 meses", incluye: "Servidor, dominio .com.ar a nombre del cliente, SSL, copias de seguridad, soporte por WhatsApp y 2 cambios chicos por mes", mercado_desde: null, mercado_hasta: null, fuente: null, argumento: "Mantiene la web online y segura, y es lo que nos permite cobrar poco por el desarrollo.", link: "https://www.devisebit.com/webs#abonos" },
  { linea: "Abonos de la web", producto: "Abono Crecimiento", precio: null, abono: 79000, condicion: "Por mes", incluye: "Esencial más SEO: una nota por mes, Google Business, Search Console e informe", mercado_desde: 100000, mercado_hasta: 500000, fuente: PW, argumento: "Un SEO mensual de agencia arranca en $100.000 a $200.000; acá va junto con el mantenimiento.", link: "https://www.devisebit.com/webs#abonos" },
  { linea: "Abonos de la web", producto: "Abono Presencia Total", precio: null, abono: 299000, condicion: "Por mes", incluye: "Crecimiento más la base de redes: perfiles, plantillas de marca y 8 publicaciones con placas por mes", mercado_desde: 80000, mercado_hasta: 400000, fuente: PW, argumento: "Un community manager cobra de $80.000 a $400.000 solo por redes; acá tenés redes, web, SEO y mantenimiento juntos.", link: "https://www.devisebit.com/webs#abonos" },
  { linea: "Abonos de la web", producto: "Abono Redes 360", precio: null, abono: 550000, condicion: "Por mes · mínimo 3 meses", incluye: "Presencia Total más 12 publicaciones, 8 reels, historias, respuestas a mensajes e informe. Pauta aparte", mercado_desde: 450000, mercado_hasta: 1000000, fuente: AD, argumento: "Un plan de redes de agencia para empresa va de $450.000 a $1.000.000, y acá incluye 8 reels por mes.", link: "https://www.devisebit.com/redes" },
  { linea: "Agentes de WhatsApp", producto: "Agente Respuestas", precio: 290000, abono: 79000, condicion: "Listo en 5 días hábiles · abono mínimo 6 meses", incluye: "Responde preguntas frecuentes, horarios y precios, deriva a una persona, informe mensual", mercado_desde: null, mercado_hasta: null, fuente: null, argumento: "Atiende las 24 horas por menos de lo que cuesta un mes de una persona a medio tiempo.", link: "https://www.devisebit.com/whatsapp" },
  { linea: "Agentes de WhatsApp", producto: "Agente Ventas", precio: 490000, abono: 129000, condicion: "Listo en 7 días hábiles · abono mínimo 6 meses", incluye: "Respuestas más presentación de productos, calificación del cliente, link de pago y registro en planilla o CRM", mercado_desde: null, mercado_hasta: null, fuente: null, argumento: "Además de responder, vende: califica, manda el link de pago y deja cada contacto registrado.", link: "https://www.devisebit.com/whatsapp" },
  { linea: "Agentes de WhatsApp", producto: "Agente Turnos", precio: 590000, abono: 149000, condicion: "Listo en 10 días hábiles · abono mínimo 6 meses", incluye: "Respuestas más turnos en Google Calendar, recordatorios y reprogramación", mercado_desde: null, mercado_hasta: null, fuente: null, argumento: "Reemplaza la agenda telefónica: da turnos, recuerda y reprograma solo.", link: "https://www.devisebit.com/whatsapp" },
  { linea: "Redes y anuncios", producto: "Redes Presencia", precio: null, abono: 299000, condicion: "Por mes · mínimo 3 meses · arrancamos en 48 h", incluye: "Perfiles, plantillas de marca, 8 publicaciones con placas, calendario e informe", mercado_desde: 80000, mercado_hasta: 400000, fuente: PW, argumento: "Dentro del rango de un community manager, con diseño de marca incluido.", link: "https://www.devisebit.com/redes" },
  { linea: "Redes y anuncios", producto: "Redes 360", precio: null, abono: 550000, condicion: "Por mes · mínimo 3 meses", incluye: "12 publicaciones, 8 reels, historias semanales, respuestas a mensajes y comentarios", mercado_desde: 450000, mercado_hasta: 1000000, fuente: AD, argumento: "Gestión completa con reels: el mercado de agencia para empresa arranca en $450.000.", link: "https://www.devisebit.com/redes" },
  { linea: "Redes y anuncios", producto: "Redes 360 + Anuncios", precio: null, abono: 690000, condicion: "Por mes · mínimo 3 meses · inversión en anuncios aparte", incluye: "Redes 360 más anuncios en Instagram y Facebook con inversión de hasta $800.000 por mes", mercado_desde: 450000, mercado_hasta: 1000000, fuente: AD, argumento: "Redes completas y anuncios en un solo abono, con el armado de campañas bonificado.", link: "https://www.devisebit.com/redes" },
  { linea: "Redes y anuncios", producto: "Gestión de anuncios · una plataforma", precio: 120000, abono: 150000, condicion: "Armado una vez + fee mensual · mínimo 3 meses", incluye: "Meta Ads o Google Ads, hasta 2 campañas, optimización semanal e informe. Incluye hasta $600.000 de inversión por mes; excedente 15%", mercado_desde: 120000, mercado_hasta: 350000, fuente: PW, argumento: "El fee de mercado para Meta Ads va de $120.000 a $350.000 por mes; estamos en el piso. La inversión la paga el cliente directo a Meta o Google.", link: "https://www.devisebit.com/redes" },
  { linea: "Redes y anuncios", producto: "Gestión de anuncios · Meta + Google", precio: 180000, abono: 250000, condicion: "Armado una vez + fee mensual · mínimo 3 meses", incluye: "Dos plataformas, hasta 5 campañas, píxel y conversiones, optimización semanal e informe. Incluye hasta $1.500.000 de inversión; excedente 12%", mercado_desde: 100000, mercado_hasta: 400000, fuente: PW, argumento: "Dos plataformas por el precio de una agencia chica, y sin cobrar porcentaje de la pauta hasta el tope.", link: "https://www.devisebit.com/redes" },
  { linea: "Sistemas a medida", producto: "CRM y ventas", precio: 990000, abono: 99000, condicion: "Desde · abono desde $99.000, mínimo 6 meses", incluye: "Clientes, oportunidades y seguimiento, conectado a WhatsApp y correo, recordatorios y tablero", mercado_desde: 1000000, mercado_hasta: 3000000, fuente: AD, argumento: "Partimos de módulos probados, por eso cuesta menos que un desarrollo desde cero.", link: "https://www.devisebit.com/sistemas" },
  { linea: "Sistemas a medida", producto: "Turnos y agenda", precio: 890000, abono: 99000, condicion: "Desde · abono desde $99.000, mínimo 6 meses", incluye: "Agenda por profesional o sala, turnos online y por WhatsApp, recordatorios, historial", mercado_desde: 1000000, mercado_hasta: 3000000, fuente: AD, argumento: "Módulo probado y adaptado a tu negocio, con precio cerrado por escrito.", link: "https://www.devisebit.com/sistemas" },
  { linea: "Sistemas a medida", producto: "Gestión y tableros", precio: 1290000, abono: 129000, condicion: "Desde · abono desde $129.000, mínimo 6 meses", incluye: "Ingresos, egresos y stock, tableros en tiempo real, reportes, usuarios y permisos", mercado_desde: 1000000, mercado_hasta: 3000000, fuente: AD, argumento: "Gestión y tableros en un sistema propio, por debajo de un desarrollo de empresa a medida.", link: "https://www.devisebit.com/sistemas" },
  { linea: "Plataforma para comunidades", producto: "Academia", precio: 1490000, abono: 249000, condicion: "Hasta 1.000 usuarios · abono mínimo 6 meses", incluye: "Cursos, inscripciones, asistencia, panel docente y alumno, certificados con tu marca", mercado_desde: null, mercado_hasta: null, fuente: null, argumento: "Plataforma probada con más de 1.000 inscriptos en un año, con tu marca y dominio.", link: "https://www.devisebit.com/comunidad" },
  { linea: "Plataforma para comunidades", producto: "Comunidad", precio: 2490000, abono: 449000, condicion: "Hasta 5.000 usuarios · abono mínimo 6 meses", incluye: "Academia más padrón de socios, beneficios, pagos y cuotas en línea, noticias", mercado_desde: null, mercado_hasta: null, fuente: null, argumento: "Todo lo que un gremio o asociación necesita en una sola plataforma, sin desarrollar de cero.", link: "https://www.devisebit.com/comunidad" },
]

/** Productos agregados después de la lista inicial. */
export const ALTAS: Inicial[] = [
  { linea: "Transformación digital", producto: "Taller de Transformación Digital", precio: 290000, abono: null, condicion: "Taller básico: una jornada de 3 horas · hasta 5 personas · virtual o presencial (CABA y GBA). Para equipos más grandes, a cotizar", incluye: "Conceptos y casos reales, autodiagnóstico de madurez digital en vivo, primeros retos priorizados, guía en PDF y certificado de la ACADEMIA DEVISEBIT para cada participante", mercado_desde: null, mercado_hasta: null, fuente: null, argumento: "Es la forma más rápida de alinear a la dirección y al equipo antes de invertir en tecnología.", link: "https://www.devisebit.com/transformacion-digital" },
  { linea: "Transformación digital", producto: "Diagnóstico y hoja de ruta", precio: null, abono: null, condicion: "A cotizar según el tamaño de la organización", incluye: "Entrevistas y relevamiento de procesos, madurez digital en 4 ejes, cadena de valor y modelo de negocio, hoja de ruta por etapas con indicadores, financiamiento aplicable (Kit 4.0 y otros), informe y presentación al directorio", mercado_desde: null, mercado_hasta: null, fuente: null, argumento: "Sale menos que equivocarse en una compra de software: define qué hacer primero y con qué números medirlo.", link: "https://www.devisebit.com/transformacion-digital" },
  { linea: "Plataforma para comunidades", producto: "Sistema para gremios: padrón y obra social", precio: 1690000, abono: 299000, condicion: "Hasta 5.000 afiliados · abono mínimo 6 meses", incluye: "Padrón de afiliados con credencial digital, aportes y cuotas, módulo de obra social (padrón de beneficiarios, órdenes y autorizaciones, prestadores) y tablero para la conducción. Sin academia", mercado_desde: 1000000, mercado_hasta: 3000000, fuente: AD, argumento: "Es la parte de gestión de la plataforma gremial, probada en producción, sin la academia: menos costo para el gremio que solo necesita ordenar padrón y obra social.", link: "https://www.devisebit.com/comunidad" },
  { linea: "Plataforma para comunidades", producto: "Sistema de padrón", precio: 990000, abono: 169000, condicion: "Hasta 5.000 socios · abono mínimo 6 meses", incluye: "Padrón de socios, afiliados o alumnos, credencial digital en el celular, cuotas y aportes al día, beneficios por categoría y tablero para la conducción", mercado_desde: 1000000, mercado_hasta: 3000000, fuente: AD, argumento: "Sistema propio probado en producción, listo en semanas y con precio cerrado, por debajo de un desarrollo a medida.", link: "https://www.devisebit.com/comunidad" },
  { linea: "Plataforma para comunidades", producto: "Sistema para obras sociales", precio: 1290000, abono: 229000, condicion: "Hasta 5.000 beneficiarios · abono mínimo 6 meses", incluye: "Padrón de beneficiarios y grupo familiar, órdenes y autorizaciones en línea, prestadores y cartilla, credencial digital y tablero de consumos y auditoría", mercado_desde: 1000000, mercado_hasta: 3000000, fuente: AD, argumento: "Hecho para obras sociales y prepagas chicas: lo esencial de un sistema de salud, sin pagar un ERP grande.", link: "https://www.devisebit.com/comunidad" },
]

export const PAGO = {
  alias: process.env.DB_ALIAS_PAGO ?? "devisebitsrl",
  titular: "DEVISEBIT SRL",
  cuit: "30-71770834-9",
  banco: "Banco Santander",
  cuenta: "Cuenta corriente en pesos 558-002508/3",
  cbu: "0720558320000000250836",
  texto: "Transferencia a la cuenta de DEVISEBIT SRL con 10% de descuento, o tarjeta hasta 3 cuotas sin interés (6 a 12 con el interés de tu banco). Proyectos: 50% de seña y el resto contra entrega. Todo con contrato y factura de DEVISEBIT SRL.",
}

export const FUENTES_MERCADO = [
  { n: "Agencia Digital, tarifario de marketing digital Argentina 2026", u: "https://agenciadigital.com.ar/tarifario-marketing-digital-argentina/" },
  { n: "Point Web, cuánto cobra una agencia de marketing digital (ago. 2026)", u: "https://pointweb.com.ar/guias/cuanto-cobra-una-agencia-de-marketing-digital/" },
  { n: "Tarifario.info, publicidad digital Argentina (sep. 2026)", u: "https://tarifario.info/publicidad-digital/" },
]

let listo = false
async function asegurar() {
  if (listo) return
  await q(`create table if not exists db_precios (
    id serial primary key, linea text not null, producto text not null, precio numeric, abono numeric,
    condicion text, incluye text, mercado_desde numeric, mercado_hasta numeric, fuente text, argumento text, link text,
    orden int not null default 0, activo boolean not null default true, actualizado timestamptz not null default now()
  )`)
  await q(`create table if not exists db_precios_hist (
    id bigserial primary key, precio_id int, producto text, campo text, antes text, despues text, motivo text, usuario text, creado timestamptz not null default now()
  )`)
  const n = await one<{ n: number }>("select count(*)::int n from db_precios")
  if (!n?.n) {
    for (const [i, p] of PRECIOS_INICIALES.entries()) {
      await q("insert into db_precios(linea,producto,precio,abono,condicion,incluye,mercado_desde,mercado_hasta,fuente,argumento,link,orden) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
        [p.linea, p.producto, p.precio, p.abono, p.condicion, p.incluye, p.mercado_desde, p.mercado_hasta, p.fuente, p.argumento, p.link, (i + 1) * 10])
    }
    await q("insert into db_precios_hist(producto,campo,motivo,usuario) values ('Toda la lista','alta','Lista inicial de lanzamiento con referencias de mercado','Sistema')")
  }
  // Sin cantidad de secciones (limita): se define por el tipo de web
  await q("update db_precios set incluye=replace(incluye,'Una página de hasta 6 secciones','Una página de venta enfocada en un servicio o campaña') where producto='Landing Express' and incluye like 'Una página de hasta 6 secciones%'")
  await q("update db_precios set incluye=replace(incluye,'Hasta 5 secciones','Sitio institucional completo con las páginas que tu negocio necesite') where producto='Web PyME' and incluye like 'Hasta 5 secciones%'")
  // Altas posteriores: se agregan una sola vez si todavía no están
  for (const [i, p] of ALTAS.entries()) {
    const ya = await one("select 1 from db_precios where producto=$1", [p.producto])
    if (ya) continue
    await q("insert into db_precios(linea,producto,precio,abono,condicion,incluye,mercado_desde,mercado_hasta,fuente,argumento,link,orden) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
      [p.linea, p.producto, p.precio, p.abono, p.condicion, p.incluye, p.mercado_desde, p.mercado_hasta, p.fuente, p.argumento, p.link, 1000 + i])
    await q("insert into db_precios_hist(producto,campo,despues,motivo,usuario) values ($1,'alta',$2,'Producto nuevo','Sistema')", [p.producto, String(p.precio ?? "")])
  }
  // 28/10: el taller pasa a "básico hasta 5 personas" y el diagnóstico a cotizar (solo si nadie los editó desde el sistema)
  await q("update db_precios set precio=290000, condicion=$1 where producto='Taller de Transformación Digital' and precio=390000", ["Taller básico: una jornada de 3 horas · hasta 5 personas · virtual o presencial (CABA y GBA). Para equipos más grandes, a cotizar"])
  await q("update db_precios set precio=null, condicion='A cotizar según el tamaño de la organización' where producto='Diagnóstico y hoja de ruta' and precio=890000")
  listo = true
}

export async function precios(soloActivos = true): Promise<Precio[]> {
  await asegurar()
  const r = await q<any>(`select * from db_precios ${soloActivos ? "where activo" : ""} order by orden, id`)
  return r.map((x) => ({ ...x, actualizado: new Date(x.actualizado).toISOString(), precio: x.precio == null ? null : Number(x.precio), abono: x.abono == null ? null : Number(x.abono), mercado_desde: x.mercado_desde == null ? null : Number(x.mercado_desde), mercado_hasta: x.mercado_hasta == null ? null : Number(x.mercado_hasta) }))
}

export async function historial(limite = 50) {
  await asegurar()
  return q<any>("select * from db_precios_hist order by creado desc limit $1", [limite])
}

export const ars = (n: number | null | undefined) => (n == null ? "" : "$" + Math.round(n).toLocaleString("es-AR"))

/** Comparación con el mercado (sobre el precio del proyecto o, si no tiene, el abono). */
export function posicion(p: Precio) {
  const base = p.linea === "Redes y anuncios" && p.producto.startsWith("Gestión") ? p.abono : p.precio ?? p.abono
  if (base == null || p.mercado_desde == null || p.mercado_hasta == null) return { t: "Sin referencia pública", c: "bg-slate-100 text-slate-600" }
  if (base < p.mercado_desde) return { t: "Debajo del mercado", c: "bg-emerald-50 text-emerald-700" }
  if (base <= p.mercado_hasta) return { t: "Dentro del rango", c: "bg-sky-50 text-sky-700" }
  return { t: "Arriba del rango", c: "bg-amber-50 text-amber-700" }
}

/** Texto compacto para el bot. */
export async function preciosParaBot() {
  const ps = await precios().catch(() => [])
  if (!ps.length) return ""
  const lineas: string[] = []
  let actual = ""
  for (const p of ps) {
    if (p.linea !== actual) { actual = p.linea; lineas.push(`\n${p.linea.toUpperCase()}`) }
    const valor = p.precio != null && p.abono != null ? `${ars(p.precio)} + ${ars(p.abono)}/mes` : p.precio != null ? ars(p.precio) : `${ars(p.abono)}/mes`
    lineas.push(`- ${p.producto}: ${valor}. ${p.condicion ?? ""}. Incluye: ${p.incluye ?? ""}.${p.link ? ` Link: ${p.link}` : ""}`)
  }
  return lineas.join("\n").trim()
}
