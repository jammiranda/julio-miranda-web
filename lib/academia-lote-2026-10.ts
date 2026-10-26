/** Lote de guías de la Academia publicado el 26/10/2026 (se carga una sola vez, ver sembrar()). */
export const LOTE_2026_10 = "guias-2026-10-26"

export const GUIAS_2026_10: { slug: string; titulo: string; bajada: string; categoria: string; contenido: string; exclusiva?: boolean; destacada?: boolean }[] = [
  {
    slug: "interoperabilidad-salud-clinicas-prestadores", titulo: "Interoperabilidad en salud: qué es y cómo empezar en tu clínica o prestador", categoria: "Salud digital", destacada: true,
    bajada: "Digitalizar ya no alcanza: los sistemas tienen que hablarse. Un camino en cuatro etapas, sin cambiar todo de golpe.",
    contenido: `En 2026 casi todas las instituciones de salud tienen algún sistema. El problema es que muchas veces no se hablan entre sí: la historia clínica por un lado, los turnos por otro, la facturación en una planilla. Eso es lo que resuelve la **interoperabilidad**.

## Qué es, en criollo
Interoperabilidad es que un dato cargado una vez pueda usarse en todos lados: que la receta llegue a la farmacia, que lo registrado en la visita salga en la factura y que la información del paciente pueda viajar, de forma segura, a otra institución cuando corresponde.

## Por qué importa ahora
- La receta electrónica es obligatoria en la Argentina y el país ya supera los **20 millones de prescripciones electrónicas por mes**.
- La interoperabilidad es el eje de la **Estrategia Nacional de Salud Digital 2025-2030**.
- Los financiadores piden cada vez más trazabilidad: qué se hizo, quién, cuándo y con qué indicación.

## Los estándares que conviene conocer
El Ministerio de Salud de la Nación definió estándares para la **Red Nacional de Salud Digital** (Resolución 680/2018):
- **HL7 FHIR:** el "idioma" con el que los sistemas intercambian datos por internet.
- **SNOMED CT:** códigos para diagnósticos, procedimientos y medicamentos. La edición argentina es gratuita.
- **CIE-10:** la clasificación de la OMS para estadísticas.
- **REFEPS y REFES:** los registros nacionales de profesionales y de establecimientos.
- **Índice único de pacientes:** cada institución tiene que identificar a cada persona una sola vez, sin duplicados.

No hace falta que los domines: hace falta que tu proveedor de software los conozca y los use.

## El camino en cuatro etapas
1. **Un solo lugar para lo clínico:** historia clínica y turnos en el mismo sistema, con cada paciente cargado una vez.
2. **Facturación que sale de lo registrado:** nada se vuelve a tipear a mano para facturar.
3. **Datos en formato estándar:** poder exportar la información de un paciente o de un período sin depender del proveedor.
4. **Integraciones:** recién ahora, conectar con financiadores, farmacias y laboratorios.

## Cuatro preguntas para hacerle a tu sistema hoy
- ¿La historia clínica y los turnos están en el mismo sistema?
- ¿La facturación sale de lo registrado o se vuelve a cargar?
- ¿Podés exportar los datos de un paciente en un formato estándar?
- ¿Quién es el dueño de tus datos: vos o tu proveedor?

> Si respondiste "no" a dos o más, el primer paso no es comprar algo nuevo: es ordenar lo que ya tenés.

### Fuentes
[Ministerio de Salud: estándares de salud digital](https://www.argentina.gob.ar/salud/digital/estandares) · [Red Nacional de Salud Digital](https://www.argentina.gob.ar/salud/digital/red) · [Innovación Digital 360 (12/06/2026)](https://www.innovaciondigital360.com/software/software-digitalizacion-sistema-salud-argentina-2026-receta-electronica-interoperabilidad/) · [Novedades DEVISEBIT](https://www.devisebit.com/novedades/salud-digital-2026-interoperabilidad)

[[Quiero revisar mi sistema|https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20le%C3%AD%20la%20gu%C3%ADa%20de%20interoperabilidad]]`,
  },
  {
    slug: "receta-electronica-checklist-consultorios", titulo: "Receta electrónica sin dolores de cabeza: checklist para consultorios y prestadores", categoria: "Salud digital",
    bajada: "Qué exige la norma, qué tiene que tener cada receta y qué revisar en tu plataforma para no tener rechazos.",
    contenido: `Desde 2025 la receta electrónica es obligatoria en la Argentina, y desde julio de ese año alcanza a **cualquier prescripción**: medicamentos, estudios, prácticas y procedimientos (Resolución 2214/2025 del Ministerio de Salud). Esta guía junta lo esencial para que tu consultorio o institución la use sin problemas.

## El marco, en tres líneas
- **Ley 27.553** de recetas electrónicas o digitales.
- **Resolución 2214/2025:** amplía la obligatoriedad a todas las prescripciones.
- Las recetas se emiten desde **plataformas registradas** y los profesionales tienen que estar inscriptos en el **REFEPS** (Red Federal de Registros de Profesionales de la Salud).

## Qué tiene que tener cada receta
- Datos del profesional: nombre, matrícula y especialidad.
- Datos del paciente: DNI y cobertura (obra social o prepaga).
- Lo que se indica: medicamento por nombre genérico, o el estudio o práctica.
- Diagnóstico, fecha de emisión y firma del profesional.
- Un código único que permite validarla en la farmacia o el prestador.

## Checklist para tu consultorio o institución
1. **Todos los profesionales en el REFEPS**, con matrícula vigente y datos al día.
2. **Una plataforma registrada** y conocida por todo el equipo (y una alternativa si se cae).
3. **Datos de cobertura completos** en la ficha de cada paciente: es la causa más común de rechazos.
4. **Plantillas** para las indicaciones frecuentes, así nadie las tipea de cero.
5. **Copia en la historia clínica:** cada receta emitida tiene que quedar registrada en la historia del paciente.
6. **Un responsable** que revise una vez por mes los rechazos y por qué pasaron.

## Validez de referencia
Según lo que informan las coberturas y la prensa especializada: alrededor de **30 días** para medicamentos, **60 días** para estudios y prácticas, y hasta **90 días** para tratamientos crónicos. Confirmalo siempre con cada financiador.

## Errores frecuentes
- Pacientes cargados dos veces con datos distintos.
- Cobertura vencida o mal escrita.
- Recetas emitidas por fuera del sistema que después no aparecen en la historia clínica.

> La receta electrónica funciona mejor cuando no es un sistema aparte: integrada a la historia clínica, se emite en segundos y queda todo registrado.

### Fuentes
[Resolución 2214/2025 (texto)](https://e-legis-ar.msal.gov.ar/legisalud/migration/pdf/msres2214_2025.pdf) · [Diario de Cuyo (21/07/2025)](https://www.diariodecuyo.com.ar/argentina/la-receta-electronica-ahora-tambien-sera-obligatoria-para-estudios-practicas-y-procedimientos-1750997.html) · [iProfesional: 5 claves de las recetas digitales](https://www.iprofesional.com/salud/434799-recetas-digitales-5-claves-que-todo-paciente-debe-conocer-antes-de-su-proxima-consulta)

[[Quiero integrar la receta a mi sistema|https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20le%C3%AD%20la%20gu%C3%ADa%20de%20receta%20electr%C3%B3nica]]`,
  },
  {
    slug: "datos-personales-ley-25326-checklist", titulo: "Datos personales y de salud: lo que tu sistema tiene que cumplir (Ley 25.326)", categoria: "Seguridad",
    bajada: "Un checklist práctico para pymes e instituciones que guardan datos de clientes, pacientes o afiliados.",
    contenido: `Cualquier empresa o institución que guarda nombres, teléfonos, DNI o datos de salud tiene obligaciones con esa información. En la Argentina las fija la **Ley 25.326 de Protección de Datos Personales**, y el organismo de control es la **Agencia de Acceso a la Información Pública (AAIP)**.

## Lo básico de la ley
- **Consentimiento:** los datos se piden para algo concreto y la persona tiene que saber para qué.
- **Datos sensibles:** los datos de salud tienen una protección especial; solo los tratan quienes los necesitan para atender a la persona, con secreto profesional.
- **Derechos de las personas:** pueden pedir ver sus datos, corregirlos o que se borren.
- **Registro:** las bases de datos se inscriben ante la AAIP.

## Checklist para tu sistema
1. **Cada persona con su usuario.** Nada de cuentas compartidas.
2. **Permisos por rol:** quien factura no necesita ver la historia clínica completa.
3. **Registro de accesos:** quién vio o cambió qué y cuándo.
4. **Copias de seguridad** automáticas y probadas.
5. **Conexión cifrada** (https) y verificación en dos pasos para los accesos importantes.
6. **Exportar y borrar a pedido:** poder entregarle a una persona sus datos, o eliminarlos, sin depender de nadie.
7. **Contratos con proveedores** que dejen claro que los datos son tuyos y cómo se protegen.

## Cuidado con la IA
Antes de pegar datos de clientes o pacientes en una herramienta de inteligencia artificial, revisá sus condiciones de privacidad. Si podés, usá datos anonimizados o herramientas integradas a tu propio sistema.

## Cuidado con WhatsApp
Es cómodo, pero un chat no es una historia clínica. Lo importante tiene que quedar registrado en el sistema, con acceso controlado.

> Cumplir la ley no es solo evitar multas: es lo que hace que tus clientes y pacientes confíen en vos.

### Fuentes
[Ley 25.326 (texto)](https://www.argentina.gob.ar/normativa/nacional/ley-25326-64790) · [AAIP: protección de datos personales](https://www.argentina.gob.ar/aaip/datospersonales)

Esta guía es informativa y no reemplaza el asesoramiento legal.

[[Pedí un diagnóstico de tu sistema|https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20quiero%20revisar%20c%C3%B3mo%20protejo%20los%20datos]]`,
  },
  {
    slug: "crm-simple-ordenar-contactos-en-una-semana", titulo: "CRM simple: ordená tus contactos y tus ventas en una semana", categoria: "Ventas y CRM",
    bajada: "Para dejar de perder consultas entre WhatsApp, mails y planillas: qué cargar, qué etapas usar y qué mirar.",
    contenido: `La mayoría de las ventas que se pierden no se pierden por precio: se pierden porque nadie volvió a escribir. Un CRM simple resuelve eso. No hace falta uno caro ni complejo; hace falta usarlo todos los días.

## Día 1: definí qué es un contacto
Nombre, empresa u organización, teléfono, email, de dónde llegó y qué necesita. Nada más por ahora.

## Día 2: elegí tus etapas
Pocas y claras. Por ejemplo:
1. Consulta nueva
2. Contactado
3. Propuesta enviada
4. Ganado
5. Perdido (con el motivo)

## Día 3: juntá todo en un lugar
Pasá los contactos de las planillas, los mails y los chats al CRM. Si tenés una planilla, importala; no los cargues a mano.

## Día 4: conectá los canales
Que cada consulta de WhatsApp, del formulario web o de Instagram entre sola al CRM, con su origen. Así sabés qué canal te trae clientes.

## Día 5: poné próximos pasos
Cada contacto abierto tiene que tener una fecha de seguimiento. Si no la tiene, se pierde.

## Día 6: activá los avisos
Que el sistema te avise cuando un seguimiento vence o cuando entra una consulta nueva.

## Día 7: mirá tres números
- Consultas nuevas de la semana.
- Propuestas enviadas.
- Tasa de cierre (ganados sobre propuestas).

> Un CRM que se usa todos los días vale más que uno perfecto que nadie abre.

## Señales de que lo necesitás ya
- Te enterás tarde de consultas que llegaron hace días.
- No sabés cuántas propuestas tenés abiertas.
- Cuando alguien del equipo falta, nadie sabe en qué quedó cada cliente.

[[Quiero un CRM conectado a WhatsApp|https://wa.me/5491173466490?text=Hola%20DEVISEBIT%2C%20le%C3%AD%20la%20gu%C3%ADa%20de%20CRM]]`,
  },
]
