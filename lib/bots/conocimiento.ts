/** Base de conocimiento de cada bot. Se edita acá (o, más adelante, desde el sistema). */
export type Empresa = "sanpatricio"
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
      { tema: "Pedir atención", claves: ["1", "atencion", "atención", "internar", "internacion", "internación", "necesito", "paciente", "mi mama", "mi papa", "mi mamá", "mi papá", "abuel"], respuesta: "Perfecto, te ayudo a iniciar el pedido 🙌 Te hago unas preguntas rápidas para que el equipo médico lo evalúe (si tenés la orden o indicación médica, después podés mandarme una foto 📷).\n\n¿Qué necesita el paciente? Por ejemplo: *enfermería, kinesiología, control médico, internación domiciliaria o equipamiento*." },
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
}
