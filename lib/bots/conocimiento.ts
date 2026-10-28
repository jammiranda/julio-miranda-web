/** Base de conocimiento de cada bot. Se edita acá (o, más adelante, desde el sistema). */
export type Empresa = "devisebit"
export type Faq = { tema: string; claves: string[]; respuesta: string }

/** Nombre del asistente (con IA). Nunca se hace pasar por una persona. */
export const NOMBRE_BOT = process.env.DB_NOMBRE_BOT ?? "Bit"

/** Quién del equipo toma cada tipo de caso cuando el bot deriva. */
export const EQUIPO: { area: string; nombre: string; rol: string; cuando: string }[] = [
  { area: "comercial", nombre: "Julio Miranda", rol: "CEO y gerente de proyectos IT", cuando: "propuestas, precios especiales, contratos, sistemas a medida, reuniones con decisores" },
  { area: "coordinacion", nombre: "Bárbara Zoltan", rol: "coordinadora general", cuando: "clientes que ya contrataron, proyectos en curso (información, avances y fechas de entrega), pagos y facturas, cierres de venta (contrato, seña y alta del cliente) y coordinación general del equipo" },
  { area: "diseno", nombre: "Jime", rol: "diseño y redes", cuando: "redes sociales, diseño, marca, contenidos, anuncios" },
  { area: "desarrollo", nombre: "Jonathan Olmedo", rol: "desarrollo", cuando: "problemas técnicos de clientes actuales, integraciones, soporte" },
]

export const BOTS: Record<Empresa, { nombre: string; saludo: string; presentacion: string; datos: { k: string; n: string }[]; faqs: Faq[]; derivacion: string; cierre: string }> = {
  devisebit: {
    nombre: "DEVISEBIT SRL",
    saludo: "¡Hola! Soy *Bit*, el asistente con IA de *DEVISEBIT* 👋\nHacemos páginas web, bots de WhatsApp, redes y sistemas, desde 2009. Respondo las 24 horas.\n\n¿Qué estás buscando?\n1️⃣ Una página web (desde $199.000)\n2️⃣ Un asistente de WhatsApp con IA\n3️⃣ Redes sociales y anuncios\n4️⃣ Un sistema o plataforma a medida\n5️⃣ Hablar con una persona del equipo",
    presentacion: `DEVISEBIT SRL es una empresa argentina de software e inteligencia artificial, desde 2009. Trabaja para salud, gobierno, universidades, gremios y empresas.
Contacto: WhatsApp +54 9 11 7346-6490, info@devisebit.com, www.devisebit.com. Oficinas: Luna 24, 6.º piso, Parque Patricios (Polo Tecnológico de la Ciudad de Buenos Aires) y Circular Cowork, Av. de los Lagos 7008, Nordelta, Tigre. Trabaja con clientes de todo el país en forma remota.
Servicios: desarrollo a medida (sistemas web de gestión, apps iOS y Android, webs conectadas, integraciones); inteligencia artificial aplicada (asistentes de WhatsApp 24 h, clasificación y derivación de consultas, extracción de datos de la web, resúmenes y reportes automáticos); tableros e inteligencia de negocio (Power BI o web, alertas, reportes mensuales, datos de Excel convertidos en indicadores); gestión de proyectos IT; transformación digital (diagnóstico, hoja de ruta, capacitación, academias online); soporte y ciberseguridad (monitoreo, copias de seguridad, mesa de ayuda).
Productos listos para implementar: sistema para clínicas e internación domiciliaria (turnos, historia clínica, prestaciones, facturación, tablero); asistente de WhatsApp con IA; CRM de afiliados y prestadores; tableros de control; app y credencial digital; academias online con pagos y certificados; votación electrónica y control de acceso con QR; gestor documental con firma digital.
Casos: app Soy Tigre del Municipio de Tigre, Academia BA Emprende (GCBA), seguimiento de proyectos de la UBA, Red Federal de Monitoreo Ambiental, venta de entradas para SIBEN.
Cómo trabaja: relevamiento, propuesta cerrada con alcance, fecha y precio fijo por escrito, entregas cada dos semanas, soporte y mejora continua. Primera reunión de 30 minutos sin costo.
Los servicios con paquete tienen precio publicado (ver LISTA DE PRECIOS): se informa sin vueltas. Lo que es a medida se cotiza con el brief o en una reunión de 30 minutos sin costo.
Formas de pago: transferencia a DEVISEBIT SRL (alias devisebitsrl) con 10% de descuento, o tarjeta hasta 3 cuotas sin interés. Proyectos con 50% de seña y el resto contra entrega. Contrato por WhatsApp, se firma desde el celular, y factura de DEVISEBIT SRL por cada pago.
Atención del equipo: lunes a viernes de 8 a 18 h. Fuera de ese horario responde el asistente, las 24 horas.${process.env.DB_AGENDA_URL ? `\nPara agendar la reunión: ${process.env.DB_AGENDA_URL}` : ""}`,
    datos: [
      { k: "nombre", n: "nombre" },
      { k: "organizacion", n: "empresa u organización" },
      { k: "motivo", n: "qué necesita" },
      { k: "email", n: "email (opcional)" },
    ],
    faqs: [
      { tema: "A medida", claves: ["1", "pagina web", "página web", "una web", "sitio", "landing", "web"], respuesta: "Hacemos webs a medida diseñadas con IA, sin plantillas:\n• *Landing Express* $199.000 (lista en 2 a 3 días hábiles)\n• *Web PyME* $349.000 (5 días)\n• *Web + Agente WhatsApp* $549.000 (7 días)\nTodas con dominio a tu nombre, SSL y abono de $29.000/mes. 10% off por transferencia o 3 cuotas sin interés.\nMirá todo acá: https://www.devisebit.com/webs\n¿Para qué negocio es?" },
      { tema: "WhatsApp IA", claves: ["2", "bot", "whatsapp", "asistente", "chatbot", "inteligencia artificial", "automatizar", "automatizacion", "automatización"], respuesta: "Un asistente como yo, para tu negocio, que responde las 24 horas:\n• *Agente Respuestas* $290.000 + $79.000/mes\n• *Agente Ventas* $490.000 + $129.000/mes\n• *Agente Turnos* $590.000 + $149.000/mes\nMás info: https://www.devisebit.com/whatsapp\n¿Qué consultas reciben hoy y cuántas por día, más o menos?" },
      { tema: "Redes", claves: ["3", "redes", "instagram", "facebook", "community", "reels", "anuncios", "publicidad", "meta ads", "google ads", "pauta"], respuesta: "Manejamos tus redes y tus anuncios:\n• *Redes Presencia* $299.000/mes (8 placas)\n• *Redes 360* $550.000/mes (12 publicaciones + 8 reels)\n• *Redes 360 + Anuncios* $690.000/mes\n• Solo anuncios: desde $150.000/mes + armado $120.000 (la inversión la pagás directo a Meta o Google)\nMás info: https://www.devisebit.com/redes\n¿Qué redes usás hoy?" },
      { tema: "Gremios y obra social", claves: ["gremio", "sindicato", "padron", "padrón", "afiliados", "obra social", "mutual", "beneficiarios", "credencial"], respuesta: "Para gremios tenemos un *sistema de padrón y obra social*, la parte de gestión de nuestra plataforma gremial (sin la academia):\n• Padrón de afiliados con credencial digital\n• Aportes y cuotas\n• Obra social: beneficiarios, órdenes y autorizaciones, prestadores\n• Tablero para la conducción\n*Desde $1.690.000 + $299.000/mes* (hasta 5.000 afiliados).\nSi además quieren cursos y comunidad, está la plataforma completa: https://www.devisebit.com/comunidad\n¿Cuántos afiliados tienen hoy y cómo llevan el padrón?" },
      { tema: "Productos", claves: ["4", "sistema", "producto", "clinica", "clínica", "crm", "academia", "cursos", "plataforma", "turnos", "stock", "app", "aplicacion", "aplicación", "software"], respuesta: "Armamos sistemas partiendo de módulos probados, por eso cuestan menos:\n• *CRM y ventas* desde $990.000\n• *Turnos y agenda* desde $890.000\n• *Gestión y tableros* desde $1.290.000\n• *Plataforma para comunidades y academias* desde $1.490.000\n• *Sistema para gremios: padrón y obra social* desde $1.690.000\nSistemas: https://www.devisebit.com/sistemas · Comunidades: https://www.devisebit.com/comunidad\n¿Qué te gustaría ordenar o automatizar?" },
      { tema: "Persona", claves: ["5", "persona", "humano", "hablar con", "llamar", "llamen", "asesor"], respuesta: "¡Dale! Le aviso al equipo para que te escriba por acá (lunes a viernes de 8 a 18 h). Si me contás tu nombre y qué necesitás, ya llegan con todo." },
      { tema: "Precio", claves: ["precio", "precios", "cuesta", "costo", "presupuesto", "cotizacion", "cotización", "valor", "cuanto sale", "cuánto sale", "lista"], respuesta: "Te paso la lista de precios vigente: " + (process.env.SISTEMA_URL ?? "https://sistema.devisebit.com") + "/lista-precios\nLas webs arrancan en $199.000, los bots en $290.000 y las redes en $299.000/mes. ¿Qué estás buscando así te digo cuál te conviene?" },
      { tema: "Brochure", claves: ["brochure", "folleto", "pdf", "catalogo", "catálogo", "info por escrito", "mandame info", "más info", "mas info"], respuesta: "Acá tenés el brochure con paquetes, abonos y formas de pago (se descarga en PDF): https://www.devisebit.com/webs/brochure ¿Te armo la propuesta para tu negocio?" },
      { tema: "Pago", claves: ["alias", "cbu", "transferencia", "transferir", "pagar", "seña", "sena", "cuotas", "tarjeta"], respuesta: "Podés pagar por transferencia a DEVISEBIT SRL, *alias devisebitsrl*, con 10% de descuento, o con tarjeta hasta 3 cuotas sin interés. Para arrancar es el 50% de seña y el resto contra entrega, con contrato y factura. Cuando transfieras, mandame el comprobante por acá." },
      { tema: "Tableros", claves: ["tablero", "dashboard", "indicadores", "power bi", "reportes", "excel"], respuesta: "Armamos tableros con indicadores al día, alertas y reportes automáticos, incluso a partir de tus Excel. *Gestión y tableros* arranca en $1.290.000. ¿Qué información te gustaría ver?" },
      { tema: "Ubicación", claves: ["donde estan", "dónde están", "oficina", "direccion", "dirección", "nordelta", "parque patricios"], respuesta: "Estamos en Luna 24, 6.º piso, Parque Patricios (Polo Tecnológico de la Ciudad de Buenos Aires) y en Circular Cowork, Av. de los Lagos 7008, Nordelta. Trabajamos con clientes de todo el país." },
      { tema: "Nombre", claves: ["como te llamas", "cómo te llamás", "tu nombre", "quien sos", "quién sos", "sos un bot", "sos humano", "sos una persona"], respuesta: "Soy *Bit*, el asistente con inteligencia artificial de DEVISEBIT 🤖 Respondo las 24 horas y, cuando hace falta, te paso con una persona del equipo. ¿En qué te ayudo?" },
      { tema: "Trabajo", claves: ["trabajo", "trabajar", "cv", "curriculum", "currículum", "busco empleo", "pasantia", "pasantía"], respuesta: "¡Gracias por tu interés! Podés dejar tu CV en www.devisebit.com/trabaja-con-nosotros." },
    ],
    derivacion: "Le paso tu consulta al equipo de DEVISEBIT, que te responde por acá a la brevedad (lunes a viernes de 8 a 18 h) 🙌",
    cierre: "¡Gracias por escribirnos! Cualquier cosa, seguimos por acá. Equipo DEVISEBIT",
  },
}
