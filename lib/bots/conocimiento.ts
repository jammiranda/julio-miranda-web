/** Base de conocimiento de cada bot. Se edita acá (o, más adelante, desde el sistema). */
export type Empresa = "devisebit"
export type Faq = { tema: string; claves: string[]; respuesta: string }

export const BOTS: Record<Empresa, { nombre: string; saludo: string; presentacion: string; datos: { k: string; n: string }[]; faqs: Faq[]; derivacion: string; cierre: string }> = {
  devisebit: {
    nombre: "DEVISEBIT SRL",
    saludo: "¡Hola! Te escribe el asistente de *DEVISEBIT* 👋\nHacemos software e inteligencia artificial para salud, gobierno, universidades, gremios y empresas, desde 2009.\n\n¿Qué estás buscando?\n1️⃣ Un sistema, app o web a medida\n2️⃣ Asistente de WhatsApp con IA\n3️⃣ Tableros e indicadores\n4️⃣ Ver productos listos para implementar\n5️⃣ Hablar con una persona",
    presentacion: `DEVISEBIT SRL es una empresa argentina de software e inteligencia artificial, desde 2009. Trabaja para salud, gobierno, universidades, gremios y empresas.
Contacto: WhatsApp +54 9 11 7346-6490, info@devisebit.com, www.devisebit.com. Oficinas: Luna 24, 6.º piso, Parque Patricios (Polo Tecnológico de la Ciudad de Buenos Aires) y Circular Cowork, Av. de los Lagos 7008, Nordelta, Tigre. Trabaja con clientes de todo el país en forma remota.
Servicios: desarrollo a medida (sistemas web de gestión, apps iOS y Android, webs conectadas, integraciones); inteligencia artificial aplicada (asistentes de WhatsApp 24 h, clasificación y derivación de consultas, extracción de datos de la web, resúmenes y reportes automáticos); tableros e inteligencia de negocio (Power BI o web, alertas, reportes mensuales, datos de Excel convertidos en indicadores); gestión de proyectos IT; transformación digital (diagnóstico, hoja de ruta, capacitación, academias online); soporte y ciberseguridad (monitoreo, copias de seguridad, mesa de ayuda).
Productos listos para implementar: sistema para clínicas e internación domiciliaria (turnos, historia clínica, prestaciones, facturación, tablero); asistente de WhatsApp con IA; CRM de afiliados y prestadores; tableros de control; app y credencial digital; academias online con pagos y certificados; votación electrónica y control de acceso con QR; gestor documental con firma digital.
Casos: app Soy Tigre del Municipio de Tigre, Academia BA Emprende (GCBA), seguimiento de proyectos de la UBA, Red Federal de Monitoreo Ambiental, venta de entradas para SIBEN.
Cómo trabaja: relevamiento, propuesta cerrada con alcance, fecha y precio fijo por escrito, entregas cada dos semanas, soporte y mejora continua. Primera reunión de 30 minutos sin costo.
No se informan precios por este canal: cada propuesta se arma a medida. La persona puede pasar los detalles por acá o pedir una reunión de 30 minutos sin costo.
Atención humana: lunes a viernes de 8 a 20 h.${process.env.DB_AGENDA_URL ? `\nPara agendar la reunión: ${process.env.DB_AGENDA_URL}` : ""}`,
    datos: [
      { k: "nombre", n: "nombre" },
      { k: "organizacion", n: "empresa u organización" },
      { k: "motivo", n: "qué necesita" },
      { k: "email", n: "email (opcional)" },
    ],
    faqs: [
      { tema: "A medida", claves: ["1", "medida", "sistema", "una app", "aplicacion", "aplicación", "web", "pagina", "página", "software", "desarrollo"], respuesta: "Hacemos sistemas web de gestión, apps para iOS y Android y webs conectadas a lo que ya usás, con alcance, fecha y precio fijo por escrito. Contame en dos líneas qué necesitás resolver y para qué organización, y te propongo una reunión de 30 minutos sin costo." },
      { tema: "WhatsApp IA", claves: ["2", "bot", "whatsapp", "asistente", "chatbot", "inteligencia artificial", "automatizar", "automatizacion", "automatización"], respuesta: "Nuestro asistente de WhatsApp con IA responde las 24 horas, da y confirma turnos, deriva a tu equipo cuando hace falta y guarda todo en el CRM. Se implementa en semanas. ¿Qué tipo de consultas reciben hoy y cuántas por día, más o menos?" },
      { tema: "Tableros", claves: ["3", "tablero", "dashboard", "indicadores", "power bi", "reportes", "datos", "excel"], respuesta: "Armamos tableros con indicadores al día, alertas y reportes automáticos, en Power BI o web, incluso a partir de tus Excel. ¿Qué información te gustaría ver y de dónde sale hoy?" },
      { tema: "Productos", claves: ["4", "producto", "listo", "clinica", "clínica", "crm", "academia", "cursos", "votacion", "votación", "credencial", "firma digital", "documental", "molinete"], respuesta: "Tenemos productos probados en producción: sistema para clínicas e internación domiciliaria, asistente de WhatsApp con IA, CRM de afiliados, tableros, app y credencial digital, academias online, votación y control de acceso, y gestor documental con firma digital. Los ves en www.devisebit.com/productos. ¿Cuál te interesa? Te coordino una demostración." },
      { tema: "Persona", claves: ["5", "persona", "humano", "hablar con", "llamar", "llamen", "reunion", "reunión"], respuesta: "Perfecto, le aviso al equipo para que te escriba por acá (lunes a viernes de 8 a 20 h)." + (process.env.DB_AGENDA_URL ? ` Si preferís, agendá directamente una reunión de 30 minutos: ${process.env.DB_AGENDA_URL}` : "") + " Si me dejás tu nombre, organización y qué necesitás, ya llegan con todo." },
      { tema: "Precio", claves: ["precio", "cuesta", "costo", "presupuesto", "cotizacion", "cotización", "valor", "cuanto sale", "cuánto sale"], respuesta: "Cada propuesta se arma a medida, con alcance, fecha y precio fijo por escrito. Pasame todos los detalles y te la armo. También te dejo la opción de una reunión corta de 30 minutos, sin costo" + (process.env.DB_AGENDA_URL ? `: ${process.env.DB_AGENDA_URL}` : "") + ". ¿Me contás qué necesitás y tu organización?" },
      { tema: "Ubicación", claves: ["donde estan", "dónde están", "oficina", "direccion", "dirección", "nordelta", "parque patricios"], respuesta: "Estamos en Luna 24, 6.º piso, Parque Patricios (Polo Tecnológico de la Ciudad de Buenos Aires) y en Circular Cowork, Av. de los Lagos 7008, Nordelta. Trabajamos con clientes de todo el país." },
      { tema: "Trabajo", claves: ["trabajo", "trabajar", "cv", "curriculum", "currículum", "busco empleo", "pasantia", "pasantía"], respuesta: "¡Gracias por tu interés! Podés dejar tu CV en www.devisebit.com/trabaja-con-nosotros." },
    ],
    derivacion: "Le paso tu consulta al equipo de DEVISEBIT, que te responde por acá a la brevedad (lunes a viernes de 8 a 20 h) 🙌",
    cierre: "¡Gracias por escribirnos! Cualquier cosa, seguimos por acá. Equipo DEVISEBIT",
  },
}
