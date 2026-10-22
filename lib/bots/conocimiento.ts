/** Base de conocimiento de cada bot. Se edita acá (o, más adelante, desde el sistema). */
export type Empresa = "sanpatricio" | "devisebit"
export type Faq = { tema: string; claves: string[]; respuesta: string }

export const BOTS: Record<Empresa, { nombre: string; saludo: string; presentacion: string; datos: { k: string; n: string }[]; faqs: Faq[]; derivacion: string; cierre: string }> = {
  sanpatricio: {
    nombre: "San Patricio Servicios de Salud",
    saludo: "¡Hola! ¡Muchas gracias por comunicarse con *San Patricio – Servicio de Internación Domiciliaria* ☘️!\nSoy el asistente virtual: te ayudo con internación domiciliaria, enfermería, kinesiología y visitas médicas en la provincia de San Luis.\n\n¿En qué te puedo ayudar? Podés escribirme tu consulta o elegir:\n1️⃣ Pedir atención para un paciente\n2️⃣ Qué servicios brindan\n3️⃣ Obras sociales y cobertura\n4️⃣ Zonas donde atienden\n5️⃣ Hablar con una persona",
    presentacion: `San Patricio Servicios de Salud (San Patricio SRL) es un prestador de internación domiciliaria de San Luis, Argentina.
Sede: Colón 274, San Luis (CP 5700). WhatsApp y teléfono: +54 9 2665 13-6567. Correo: sanpatriciosalud23@gmail.com. Web: www.sanpatricio.ar
Habilitado por el Ministerio de Salud de San Luis (Res. 676/2026) y con habilitación municipal. Director médico con matrícula provincial.
Servicios en el domicilio del paciente: internación domiciliaria por módulos según complejidad, enfermería (curaciones, medicación, control de signos vitales, cuidados programados), kinesiología motora y respiratoria, fonoaudiología, visitas médicas periódicas articuladas con el médico de cabecera, cuidadores, insumos y equipamiento (cama, colchón antiescaras, silla de ruedas, andador, oxígeno, etc.) según el módulo indicado.
También gerencia centros de día y residencias para adultos mayores (equipos, facturación a financiadores, tableros, calidad y habilitaciones).
Localidades con equipo: San Luis capital, Villa Mercedes, Justo Daract, Quines, Merlo, Tilisarao, Concarán, La Toma, La Punta y San Francisco del Monte de Oro.
Cómo se inicia: 1) la familia, el médico o la obra social envía la indicación u orden; 2) el equipo médico evalúa y define el módulo y el plan de cuidados; 3) se coordina la agenda de enfermería, kinesiología y médicos; 4) cada visita queda registrada en el sistema digital.
Cobertura: hoy el convenio vigente es con PAMI (afiliados con orden de prestación / módulo autorizado). También se atienden pacientes particulares sin cobertura: tiene costo y el detalle lo da una persona del equipo (el bot nunca da precios). Otras obras sociales, prepagas, mutuales y empresas pueden sumarse por convenio: www.sanpatricio.ar/convenios.
Atención humana: lunes a viernes de 8 a 20 h. Fuera de ese horario el asistente toma los datos y una persona responde el próximo día hábil.
Módulos PAMI: un módulo típico comprende, por ejemplo, 1 visita mensual de médico, 5 visitas semanales de enfermería y 8 sesiones mensuales de kinesiología; el módulo de cada paciente lo autoriza PAMI. Las renovaciones del módulo las carga el médico de San Patricio y luego deben ser autorizadas por PAMI; cuando se autoriza, San Patricio contacta a la familia para confirmar (la familia responde "OK" y confirma el domicilio) y así la prestación sigue sin interrupciones.
Cuando PAMI asigna un paciente nuevo, San Patricio contacta a la familia para coordinar el inicio de la prestación.`,
    datos: [
      { k: "nombre", n: "nombre de quien consulta" },
      { k: "paciente_nombre", n: "nombre del paciente" },
      { k: "obra_social", n: "obra social o prepaga del paciente" },
      { k: "nro_afiliado", n: "número de afiliado (opcional)" },
      { k: "localidad", n: "localidad del paciente" },
      { k: "motivo", n: "qué necesita (internación, enfermería, kinesiología, médico, equipamiento, convenio, trabajo)" },
    ],
    faqs: [
      { tema: "Pedir atención", claves: ["1", "atencion", "atención", "internar", "internacion", "internación", "necesito", "paciente", "mi mama", "mi papa", "mi mamá", "mi papá", "abuel"], respuesta: "Perfecto, te ayudo a iniciar el pedido. Para que el equipo médico lo evalúe necesito:\n• Nombre y apellido del paciente\n• Obra social y número de afiliado\n• Localidad\n• Qué necesita (por ejemplo: curaciones, kinesiología, control médico)\n\nSi tenés la orden o indicación médica, mandame una foto 📷" },
      { tema: "Servicios", claves: ["2", "servicio", "que hacen", "qué hacen", "brindan", "ofrecen"], respuesta: "Llevamos la atención al domicilio del paciente:\n🏠 Internación domiciliaria por módulos\n💉 Enfermería: curaciones, medicación y controles\n🦵 Kinesiología motora y respiratoria\n🗣️ Fonoaudiología\n🩺 Visitas médicas periódicas\n🛏️ Cuidadores, insumos y equipamiento\n\nTambién gestionamos centros de día y residencias. ¿Para quién sería la atención?" },
      { tema: "Cobertura", claves: ["3", "obra social", "pami", "prepaga", "cobertura", "cubre", "cuesta", "precio", "costo", "valor", "particular"], respuesta: "Hoy trabajamos con *PAMI*: atendemos afiliados con módulo autorizado. También atendemos pacientes *particulares*; en ese caso una persona del equipo te pasa el detalle del costo. ¿El paciente tiene PAMI u otra cobertura?" },
      { tema: "Confirmación de renovación", claves: ["ok", "confirmo", "confirmado", "de acuerdo", "esta bien", "está bien", "acepto"], respuesta: "¡Muchas gracias! ✅ Registramos tu confirmación para continuar con la prestación sin interrupciones. 🏡 ¿Nos confirmás el domicilio donde se atiende al paciente?" },
      { tema: "Estado de la renovación", claves: ["renovacion", "renovación", "modulo", "módulo", "se vencio", "se venció", "autorizacion", "autorización", "orden"], respuesta: "La renovación del módulo la gestiona y carga nuestro médico, y después tiene que autorizarla PAMI a través de su sistema. Ni bien esté autorizada te contactamos para confirmarla. Si querés, pasame el nombre del paciente y lo verifico con el equipo 🍀" },
      { tema: "Zonas", claves: ["4", "zona", "localidad", "llegan", "atienden en", "mercedes", "merlo", "daract", "quines", "tilisarao", "concaran", "concarán", "la toma", "la punta", "monte de oro"], respuesta: "Tenemos equipo en San Luis capital, Villa Mercedes, Justo Daract, Quines, Merlo, Tilisarao, Concarán, La Toma, La Punta y San Francisco del Monte de Oro. ¿En qué localidad está el paciente?" },
      { tema: "Persona", claves: ["5", "persona", "humano", "hablar con", "operador", "llamar", "llamen"], respuesta: "Listo, le aviso a una persona del equipo para que te responda por acá a la brevedad. Si querés, dejame el nombre del paciente y la consulta así ya lo tienen." },
      { tema: "Sede", claves: ["direccion", "dirección", "donde estan", "dónde están", "sede", "oficina", "horario"], respuesta: "Nuestra sede está en Colón 274, San Luis (CP 5700). Desde ahí coordinamos al equipo y recibimos a las familias. Mapa: https://maps.google.com/?q=Colón+274,+San+Luis" },
      { tema: "Trabajo", claves: ["trabajo", "trabajar", "cv", "curriculum", "currículum", "enfermera", "enfermero", "kinesiologo", "kinesiólogo", "busco empleo", "sumarme"], respuesta: "¡Gracias por tu interés en sumarte! Mandanos tu CV a sanpatriciosalud23@gmail.com indicando profesión, matrícula y localidad. Lo revisa el equipo de coordinación." },
      { tema: "Convenios", claves: ["convenio", "empresa", "mutual", "financiador", "institucion", "institución", "residencia", "centro de dia", "centro de día"], respuesta: "Trabajamos con empresas, obras sociales, prepagas, mutuales e instituciones. Podés ver la propuesta en www.sanpatricio.ar/convenios. Dejame tu nombre, organización y un contacto y coordinamos una reunión." },
    ],
    derivacion: "Le paso tu consulta a una persona del equipo, que te responde por acá a la brevedad (lunes a viernes de 8 a 20 h) 🙌",
    cierre: "¡Muchas gracias por comunicarse con San Patricio – Servicio de Internación Domiciliaria! ☘️",
  },
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
