# Versiones del ecosistema DEVISEBIT

Última actualización: 13/11/2026 · Para Julio Miranda · Fuente: el historial de cambios guardado en GitHub (431 cambios publicados desde el 17 de octubre).

Este documento responde una sola pregunta: **en qué versión está cada cosa y qué cambió en cada versión**. Hasta hoy nada tenía número; acá se le pone número a todo, hacia atrás, y queda la regla para seguir.

---

## 1. Estado actual

| Producto | Dirección web | Versión actual | Fecha | Qué fue lo último |
|---|---|---|---|---|
| Sitio web DEVISEBIT | www.devisebit.com | **1.7.0** | 12/11/2026 | Página interna para bajar los 17 videos al celular y copiar el texto de TikTok |
| Landings de anuncios | www.devisebit.com/webs, /redes, /whatsapp, /sistemas, /comunidad | **1.3.0** | 12/11/2026 | La tipografía pesa la mitad y el botón de enviar también la usa |
| Sistema (CRM y gestión) | sistema.devisebit.com | **3.1.0** | 12/11/2026 | Pantalla nueva «Versiones» en Ajustes, con este documento dentro del Sistema |
| Bot de WhatsApp (Bit) | Atiende por WhatsApp; se maneja desde el Sistema | **1.7.0** | 12/11/2026 | Pide el email siempre en la segunda respuesta |
| Academia | academia.devisebit.com | **2.2.1** | 12/11/2026 | En la portada, desde el celular, los adornos ya no tapan el formulario de suscripción |
| Portal de clientes y alumnos | portal.devisebit.com | **1.2.1** | 12/11/2026 | Las próximas reuniones del inicio muestran la fecha igual que la pantalla Reuniones |
| Panel de Contenido | panel.devisebit.com | **2.2.0** | 13/11/2026 | Pantalla nueva de TikTok, con carga a mano de seguidores, me gusta y videos |
| Oficina | oficina.devisebit.com | **1.1.0** | 07/11/2026 | Las tareas programadas ya pueden leer y actualizar el registro de Prospección |
| Sitio personal de Julio | julio.devisebit.com | **1.5.0** | 12/11/2026 | Se sumaron los básicos: mapa del sitio, página de «no encontrado» y selector de idioma en celular |

**Cómo leerlo:** "publicado" quiere decir que el cambio está en la rama que se despliega sola. La fecha es la del último cambio de esa versión.

**Dos aclaraciones sobre cómo se separó:**

- **Landings de anuncios.** Viven en el mismo código que el sitio web. Solo tienen 11 cambios propios (todos del 12/11). Sus versiones 1.0.0 a 1.2.0 salen de cambios compartidos con el sitio, y por eso esos cambios se cuentan una sola vez, en el sitio.
- **Bot, Academia, Portal, Panel y Oficina** viven en el mismo código que el Sistema. Cada cambio se contó una sola vez, en el producto al que apunta su título. Cuando un cambio tocó dos productos, se anota en el otro como "compartido".

| Producto | Cambios propios | Versiones |
|---|---|---|
| Sitio web DEVISEBIT | 86 | 9 |
| Landings de anuncios | 11 | 4 (3 de ellas con cambios compartidos con el sitio) |
| Sistema (CRM y gestión) | 142 | 12 |
| Bot de WhatsApp (Bit) | 21 | 8 (1 de ellas con cambios compartidos con el Sistema) |
| Academia | 40 | 7 |
| Portal de clientes y alumnos | 14 | 4 |
| Panel de Contenido | 36 | 8 |
| Oficina | 20 | 2 |
| Sitio personal de Julio | 61 | 6 |
| **Total** | **431** | **60** |

Los 431 se reparten así: 97 en el código del sitio web (86 + 11), 273 en el código del Sistema (142 + 21 + 40 + 14 + 36 + 20) y 61 en el sitio personal.

---

## 2. Cómo se numeran las versiones

Cada producto tiene su propio número, con tres partes: **MAYOR.MENOR.CORRECCIÓN** (por ejemplo, 2.1.0).

1. **1.0.0** es la primera versión de ese producto que se publicó.
2. Sube el número del **medio** (1.1.0 → 1.2.0) cuando se agrega algo que una persona puede ver o usar.
3. Sube el **último** (1.2.0 → 1.2.1) cuando solo hay arreglos, seguridad o velocidad.
4. Sube el **primero** (1.x → 2.0.0) solo cuando hay un rediseño o un cambio en la forma de trabajar.
5. Una versión agrupa una tanda de trabajo (en general, un día o un tema), no un cambio suelto.

**Dónde se ve:** en el Sistema, menú Ajustes → Versiones (sistema.devisebit.com/versiones). Se actualiza solo todos los días con lo que se publicó.

**Regla de acá en adelante:** toda publicación lleva un número y una línea en este documento, el mismo día, con la fecha y el rastro de los cambios que incluye. Si no está en este documento, no tiene versión.

**Qué es el "rastro":** el código corto del primer y del último cambio de esa versión, los dos incluidos (por ejemplo `e7561ed..5407524`). Con eso cualquiera que mantenga el sistema puede ver exactamente qué entró.

**Tipos:** Novedad (algo nuevo) · Mejora (algo que ya estaba, mejor) · Corrección (algo que andaba mal) · 🔒 Seguridad.

---

## 3. Versiones por producto

### 3.1 Sitio web DEVISEBIT — www.devisebit.com

86 cambios · 9 versiones · versión actual **1.7.0**

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **1.7.0** | 12/11/2026 | • Juego de videos para redes en versión sin precios, en una carpeta no listada: 17 verticales, 4 videos para LinkedIn, 4 carruseles en PDF y 21 portadas<br>• Es de donde toman el material las publicaciones programadas de Instagram, Facebook, YouTube y LinkedIn<br>• Página interna para bajar los 17 videos verticales al celular y copiar el texto de cada uno para TikTok | Novedad | `35e2cd0..8ec0e3b` (2) |
| **1.6.1** | 12/11/2026 | • Si falla el correo del formulario de contacto, la consulta igual queda registrada en el Sistema<br>• El sitio carga más rápido: las etiquetas de medición se bajan después de que la página ya se ve, y el logo pesa mucho menos<br>• En celular: el contenido ya no se corta contra el borde, los links son más fáciles de tocar y el botón de WhatsApp no tapa los campos<br>• En Casos de éxito, «Ver como lista» ahora lleva a la lista | Corrección | `fa7905f..0e8fd62` (14) |
| **1.6.0** | 10/11/2026 | • Nota semanal en Novedades: IA en Argentina, de asistentes a agentes<br>• La página de Casos de éxito carga más liviana (el mapa 3D se baja aparte) | Mejora | `eb6735f..c0417df` (2) |
| **1.5.0** | 06/11/2026 | • Etiqueta de Google Ads de la cuenta nueva, con conversión por vista de página<br>• PDF del Programa de Socios Comerciales para descargar, con una dirección corta | Novedad | `06f2a67..5a35850` (3) |
| **1.4.0** | 02/11/2026 | • Medición con Google Analytics y píxel de Meta en todo el sitio<br>• El caso de la app Soy Tigre (más de 80.000 vecinos suscriptos) pasa a ser el destacado<br>• Nuevo estilo: menú tipo píldora, cinta de proyectos y frase grande con palabra resaltada<br>• Nota semanal sobre ciberseguridad; las direcciones técnicas del hosting redirigen a www.devisebit.com | Novedad | `3181736..d34a83f` (14) |
| **1.3.0** | 31/10/2026 | • Sitio en inglés (/en)<br>• Mapa 3D de proyectos en Casos de éxito<br>• Inicio renovado: buscador interactivo de soluciones, bloque de integración y comparativa<br>• Kits DEVISEBIT y revisión completa para buscadores | Novedad | `00c8fff..b87318f` (7) |
| **1.2.0** | 30/10/2026 | • Autodiagnósticos en 3 niveles, con resultado, insignia verificable y hoja de ruta<br>• Nueva línea: Asesoría y consultoría en tecnología e IA, con su página y su PDF<br>• Primera reunión gratuita después del autodiagnóstico<br>• Videos de la demo de padrón con datos personales tapados | Novedad | `e3c9d85..3a4b271` (12) |
| **1.1.0** | 29/10/2026 | • Precios publicados de Sistema de padrón y Sistema para obras sociales<br>• Contador de visitas propio, sin cookies, en todas las páginas<br>• Presentación corta «Conocé DEVISEBIT» y material de redes en carpetas no listadas | Novedad | `a840f88..95a2253` (10) |
| **1.0.0** | 28/10/2026 | • El sitio que ya estaba publicado al 27/10 entra al historial de versiones<br>• Equipo completo, Servicios conectada con las landings y los productos, redes en todas las páginas<br>• Consultoría de Transformación Digital con precios; demos de producto que se piden por email<br>• Revisión completa de lanzamiento | Novedad | `6642f4b..0e74a4e` (22) |

Nota: en las versiones 1.1.0, 1.2.0 y 1.4.0 hay cambios que solo fueron archivos temporales para cargar material en otro lado y que se borraron enseguida. Están contados, pero no cambiaron nada para el visitante.

### 3.2 Landings de anuncios — /webs, /redes, /whatsapp, /sistemas, /comunidad

11 cambios propios · 4 versiones · versión actual **1.3.0**

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **1.3.0** | 12/11/2026 | • El mensaje de WhatsApp ahora dice de qué anuncio vino la persona (antes todo figuraba como «WhatsApp directo»)<br>• Los formularios entran al Sistema con el origen de la visita, además de salir por correo<br>• Precio y plazo a la vista en la portada; el formulario de /webs pide solo 3 datos para empezar<br>• Cargan más rápido y funcionan aunque falle el navegador: tipografía propia, casos e imágenes servidos desde el sitio, video a demanda | Mejora | `e0fae1b..f44853c` (11) |
| **1.2.0** | 05/11/2026 | • Medición con Google Analytics y píxel de Meta<br>• Formularios sin captcha; cada clic a WhatsApp cuenta como conversión<br>• Etiqueta de Google Ads de la cuenta nueva | Novedad | Compartido con el sitio: `ec59ea9`, `3926155`, `06f2a67` |
| **1.1.0** | 29/10/2026 | • Precios publicados en la landing de Comunidad<br>• Contador de visitas propio, sin cookies | Novedad | Compartido con el sitio: `a840f88`, `781e61a` |
| **1.0.0** | 28/10/2026 | • Las cinco landings que ya estaban publicadas entran al historial junto con el sitio<br>• Suman video de YouTube, botón de Inicio y vuelta a la web<br>• Los paquetes de webs se definen por tipo de sitio, no por cantidad de secciones | Novedad | Compartido con el sitio: `6642f4b`, `ebf6cbe`, `8d1334d`, `8f7e51b` |

### 3.3 Sistema (CRM y gestión) — sistema.devisebit.com

142 cambios · 12 versiones · versión actual **3.1.0**

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **3.1.0** | 12/11/2026 | • En Conversaciones se pueden marcar varias consultas y pasarlas al CRM o descartarlas de una vez<br>• El link de agenda, el material y el brief también se mandan por email desde la misma ventana, y el email queda guardado en la consulta<br>• «Pasaron al CRM» cuenta las consultas que ya tienen un contacto comercial; «Ganadas» es solo el contacto que llega a la etapa Ganado. La misma cuenta en Conversaciones y en el Resumen comercial<br>• El brief pregunta la inversión en pesos, con rangos alineados a la lista de precios<br>• Nuevo documento en la Biblioteca: «Alta de cliente · Agente de WhatsApp», versión 1, con la lista de lo que tiene que mandar el cliente<br>• Pantalla nueva «Versiones» en Ajustes: este documento, dentro del Sistema | Novedad | `2abf7b8..dfd8805` (10) |
| **3.0.1** | 12/11/2026 | • 🔒 **Seguridad (10 arreglos):** tres pantallas (Resumen, Proyectos y ficha de contacto) ahora verifican bien que quien entra sea del equipo; los montos de proyectos y cobros solo los ven Dirección y Comercial; el link general de agenda ya no puede mostrar la consulta de otra persona; recuperar la clave tiene límite de pedidos; las tareas automáticas ya no se pueden disparar desde afuera<br>• Se corrigió que los correos podían salir duplicados, y que los recordatorios de pago y de clase podían repetirse<br>• La baja en un clic de Gmail y Yahoo ahora da de baja de verdad<br>• «Sin atender» en Conversaciones ya no engaña; fechas en hora de Argentina; confirmación antes de borrar; pantalla de error con «Reintentar» | 🔒 Seguridad + Corrección | `ed6dbad..4a18588` (25) |
| **3.0.0** | 10/11/2026 | • **Rediseño 2026:** menú de 7 áreas con pestañas y edición al costado, sin saltar de página<br>• Todo abre más rápido: los avisos ya no frenan cada pantalla y hay barra de progreso al instante<br>• Módulo aparte para la base de usuarios de la app Soy Tigre, por rango de edad<br>• Correos con mejor diseño: portada con título, secciones numeradas, botón grande y logo | Novedad (rediseño) | `e6eea29..0309058` (13) |
| **2.5.0** | 08/11/2026 | • Un solo estilo para Comercial, Gestión, Academia y Portal; buscador con Ctrl+K<br>• «Para hoy» e indicadores en el Resumen comercial y en el Tablero de dirección<br>• Prospección: registro con historia de cada contacto y seguimiento a los 7 días<br>• Avisos por Telegram de todo lo que entra | Novedad | `f422747..d0859fb` (7) |
| **2.4.0** | 05/11/2026 | • Botón de eliminar, solo para gerencia y con confirmación, en Consultas, Servicios, Proyectos, Campañas, Agenda, Bot, Recursos y Cursos<br>• El estado de las plantillas de WhatsApp se consulta en vivo<br>• Demo de WhatsApp con seña por PayPal para los 3 agentes | Mejora | `bb13cb0..4776df0` (6) |
| **2.3.0** | 31/10/2026 | • Primera reunión gratuita, con autodiagnóstico previo al agendar<br>• Modelos legales con membrete de DEVISEBIT<br>• Piezas para redes desde el celular, presupuesto desglosado y gestión de financiamiento<br>• Línea interna de Kits DEVISEBIT en la lista de precios (no se publica) | Novedad | `ac9eac8..f7c3b3c` (7) |
| **2.2.0** | 30/10/2026 | • Autodiagnósticos en 3 niveles conectados al CRM, con informe por email y recordatorio<br>• Asesoría y consultoría: en la lista de precios, con control de horas por cliente y avisos al 80 % y al 100 %<br>• Exportar la base depurada como público para anuncios de Meta<br>• Historias, placas y videos cortos para redes | Novedad | `c83bafb..40eadc5` (11) |
| **2.1.0** | 29/10/2026 | • Campaña de relanzamiento «DEVISEBIT se renueva», programada de a 300 correos por día<br>• Limpieza de la base: rebotes, bajas, casillas automáticas y exclusiones fijas quedan fuera de los envíos<br>• Documentos de la empresa (manual, presentación, dossier) con versiones y links personales<br>• Quiénes abrieron cada campaña y a qué landing fueron | Novedad | `2ee32bb..8f2f79e` (20) |
| **2.0.0** | 28/10/2026 | • **Lanzamiento:** nuevo diseño y navegación; el sistema Comercial y el de la Academia quedan separados<br>• Módulos de gestión: tablero de dirección, finanzas, legales, documentos y licitaciones<br>• Correo, calendario y archivos de Google conectados; dominios, hosting y certificados a la vista<br>• Demos privadas con link personal que vence; envíos de email con 8 estilos | Novedad (rediseño) | `36f2c59..80c7082` (19) |
| **1.2.0** | 27/10/2026 | • Agenda configurable por franjas, con link general para agendar<br>• Confirmación y recordatorio al cliente por WhatsApp y email<br>• Perfil de WhatsApp Business editable desde el Sistema<br>• Primeras piezas de marca y videos para YouTube | Novedad | `9f4cdcc..749cad0` (10) |
| **1.1.0** | 26/10/2026 | • Lista de precios dentro del Sistema, con versión pública para compartir<br>• «Mandar material» desde Conversaciones<br>• Selección múltiple en Contactos; avisos que se pueden marcar como leídos<br>• Diagnóstico del envío de correos | Novedad | `7b395dd..ac7b6ec` (5) |
| **1.0.0** | 23/10/2026 | • Primera versión: CRM, conversaciones de WhatsApp e Instagram, proyectos, servicios y usuarios<br>• De dónde llega cada consulta (Google, Meta, web, directo)<br>• Agenda propia con turnos de 30 minutos y fichas comerciales por servicio<br>• Email marketing con campañas, segmentos y baja en un clic | Novedad | `e7561ed..5407524` (9) |

Nota: en este producto están contados 3 cambios que fueron solo republicaciones o uniones de trabajo, sin efecto para quien lo usa.

### 3.4 Bot de WhatsApp (Bit)

21 cambios propios · 8 versiones · versión actual **1.7.0**

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **1.7.0** | 12/11/2026 | • Pide el email siempre en la segunda respuesta (en la primera no)<br>• Puede decir qué incluye cada plan según la lista de precios, y lo que el sitio publica sobre datos personales<br>• Un solo rango de largo para las respuestas | Mejora | `074dca2..89d02f1` (2) |
| **1.6.0** | 12/11/2026 | • **Seguimiento automático:** si el cliente no contesta en 1 hora, Bit manda una sola vez el material de lo que pidió y le pide el email (de 9 a 21 h, y solo si nadie del equipo tomó el chat)<br>• Pide el email temprano, una sola vez y explicando para qué<br>• La primera respuesta a quien llega por un anuncio cierra con opciones numeradas<br>• Se corrigió que podía responder dos veces a mensajes seguidos, un link de folleto caído y que decía que la primera reunión de asesoría se cobraba | Novedad | `0da0e99..9ba06a6` (7) |
| **1.5.0** | 11/11/2026 | • Bit entiende los audios de los clientes: los pasa a texto antes de responder<br>• Si un audio no se puede entender, pide que lo escriban y avisa al equipo<br>• Ya no repite preguntas; los contactos sin empresa también pasan al CRM (cambio del 10/11, compartido con el Panel: `ff50bc9`) | Novedad | `dcfcc91..fa7c72a` (2) |
| **1.4.0** | 06/11/2026 | • Voz más humana: mensajes cortos, una pregunta por vez, sin volcar listas de precios<br>• Reglas para casos difíciles: urgencias, enojo, pedidos fuera de rubro, otro idioma | Mejora | `e616e0f..9d9d105` (2) |
| **1.3.0** | 02/11/2026 | • Cuenta el caso Soy Tigre (más de 80.000 vecinos suscriptos)<br>• Responde sobre Asesoría y sobre los autodiagnósticos (cambios del 30/10, compartidos con el Sistema: `86c397a`, `40eadc5`) | Mejora | `f4465f5` (1) |
| **1.2.0** | 29/10/2026 | • Reglas de formato para WhatsApp y respuestas nuevas a objeciones<br>• No promete referencias ni soporte incluido; las licitaciones las deriva a Comercial<br>• Revisión semanal: los viernes analiza los chats y deja sugerencias para aprobar<br>• Se corrigió que a veces caía al menú de respaldo en vez de responder | Mejora | `9abd5c5..fef1c9c` (6) |
| **1.1.0** | 26/10/2026 | • Pasa a llamarse **Bit** y se presenta como asistente con IA, nunca como persona<br>• Informa los precios vigentes y manda material, brief y agenda<br>• Deriva por área (Julio, Bárbara, Jime, Jonathan) | Novedad | Compartido con el Sistema: `d0127e8`, `5892cf5` |
| **1.0.0** | 23/10/2026 | • El bot nace junto con el Sistema (`e7561ed`, compartido)<br>• Cierre de venta: brief de 3 minutos con link único y propuesta preliminar para el equipo<br>• Manejo de objeciones, rangos de precio y plazos por servicio | Novedad | `b9bf4ed` (1) |

### 3.5 Academia — academia.devisebit.com

40 cambios · 7 versiones · versión actual **2.2.1**

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **2.2.1** | 12/11/2026 | • El certificado se ve completo en el celular<br>• Mejor presencia en Google: los cursos y perfiles entran al mapa del sitio<br>• Textos repetidos y contadores corregidos; los adornos ya no tapan el formulario | Corrección | `9aa9e5e..0c7bd9a` (4) |
| **2.2.0** | 06/11/2026 | • Medición de visitas: páginas más vistas, de dónde llegan y clics en los botones<br>• Ingreso y marca con el mismo estilo que el resto del sistema<br>• La pantalla de Cursos del equipo muestra los mismos indicadores | Mejora | `2fa9398..f9f700c` (3) |
| **2.1.0** | 03/11/2026 | • Rediseño del interior del alumno: Mi cuenta, curso y lección con índice<br>• Nuevo estilo en la portada (menú flotante, cinta y frase grande)<br>• Sistema de la Academia para el equipo: inicio con accesos, alumnos con estados y cursos en tarjetas | Mejora | `466a920..5aa74aa` (7) |
| **2.0.0** | 30/10/2026 | • **8 cursos a tu ritmo** con compra (Mercado Pago o PayPal), cuestionario, videollamada y certificado<br>• Espacio del alumno en la Academia y portada rediseñada por tipo de contenido<br>• Módulo 1 gratis en cinco cursos<br>• Acceso de autor para docentes; materiales protegidos que solo bajan los inscriptos | Novedad (rediseño) | `3e3edfa..91c7a45` (10) |
| **1.2.0** | 28/10/2026 | • Transformación Digital a la venta: guía, taller y diagnóstico<br>• La Academia pasa a tener su propio sistema interno, separado del Comercial<br>• Página del equipo académico; guías con búsqueda y temas<br>• Buena experiencia en celular y tablet; pago con PayPal | Novedad | `a302378..8a1d9e4` (11) |
| **1.1.0** | 27/10/2026 | • 4 guías nuevas<br>• Sección de videos del canal de YouTube, con miniaturas y reproductor<br>• Cursos, clases en vivo y certificado verificable (cambio compartido con el Portal: `f4c7b09`) | Novedad | `718e51e..b35efb6` (4) |
| **1.0.0** | 23/10/2026 | • Primera versión: guías gratis con suscripción y newsletter<br>• Kit en lista de espera o en venta con Mercado Pago y descarga automática<br>• Administración de guías, productos y ventas desde el Sistema | Novedad | `61740ca` (1) |

### 3.6 Portal de clientes y alumnos — portal.devisebit.com

14 cambios · 4 versiones · versión actual **1.2.1**

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **1.2.1** | 12/11/2026 | • 🔒 **Seguridad:** el comprobante de pago verifica que sea del dueño de la cuenta antes de emitirlo, y ya no lo ve cualquier integrante del equipo<br>• El menú marca en qué sección estás; los botones de pago y guardado muestran que están enviando<br>• Cada pantalla tiene su título y una carga más prolija al cambiar de pantalla | 🔒 Seguridad + Mejora | `407e28c..281f7f8` (5) |
| **1.2.0** | 30/10/2026 | • Ingreso fácil: email y un código de 6 dígitos, con alta automática<br>• Después de ingresar, vuelve a la página que la persona había pedido<br>• Los cursos se abren en el aula de la Academia<br>• Pestañas de Autodiagnósticos y de Asesoría (compartido con el Sistema: `86c397a`, `40eadc5`) | Novedad | `3b1e7af..7e43efa` (3) |
| **1.1.0** | 28/10/2026 | • Página de Servicios con «Me interesa»<br>• Pagos y facturas: comprobante numerado, datos de facturación y pedido de factura<br>• Comprar con Mercado Pago o transferencia desde la lista de precios vigente | Novedad | `666554f..1127225` (3) |
| **1.0.0** | 27/10/2026 | • Primera versión: el cliente entra con un link, ve etapas, historial, documentos y aprueba entregas<br>• Cobros por proyecto con estado de cuenta y pago online<br>• Suspensión automática del acceso por pagos vencidos | Novedad | `a16e934..f4c7b09` (3) |

### 3.7 Panel de Contenido — panel.devisebit.com

36 cambios · 8 versiones · versión actual **2.2.0**

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **2.2.0** | 13/11/2026 | • **Tablero diario** (solo para Julio): el informe de la mañana (8:27) y el de cierre (18:57) con semáforo, decisiones para tildar, notas del día y días anteriores; tiene dirección propia (tablero.devisebit.com) y avisa por Telegram cuando sale<br>• En el menú, «Tablero diario» queda justo debajo de «Inicio»<br>• **Pantalla nueva de TikTok:** se cargan a mano los seguidores, los me gusta y los videos (con formulario o planilla), y quedan en el mismo historial que las demás redes<br>• En Inicio, tarjeta de TikTok (sin números hasta que se carguen) e indicador opcional de seguidores<br>• TikTok aparece como una cuenta más en Análisis, y Publicaciones aclara de dónde salen sus datos | Novedad | `c4d22bc..9952dff` (6) |
| **2.1.1** | 12/11/2026 | • «Ganadas» cuenta solo los contactos en etapa Ganado del CRM; la consulta que pasó al CRM se llama «Pasaron al CRM» | Corrección | `63ee348` (1) |
| **2.1.0** | 12/11/2026 | • Los avisos del Panel cuentan las consultas sin atender<br>• Estadísticas de Prospección: enviados, respuestas, reuniones y seguimientos vencidos (cambio del 07/11, compartido con el Sistema: `96603ca`)<br>• Mejor uso desde el celular | Mejora | `ff50bc9..91cd8ec` (2) |
| **2.0.0** | 06/11/2026 | • **Rediseño:** nuevo Análisis, Inicio con alertas, buscador con Ctrl+K y menú agrupado<br>• Tarjetas del Inicio personalizables<br>• Exportar el Análisis en PDF, Excel o texto<br>• Filtro de 15 días y datos corregidos de Facebook, Instagram y Anuncios | Novedad (rediseño) | `cffcc17..f63e6b2` (9) |
| **1.3.0** | 02/11/2026 | • Página de Facebook en el Panel<br>• Historial de publicaciones de todas las redes, que ya no se pierde<br>• Análisis completo por cuenta y LinkedIn personal de Julio<br>• YouTube sigue mostrando datos aunque la fuente no responda | Novedad | `c57a36b..90a8e37` (3) |
| **1.2.0** | 30/10/2026 | • LinkedIn de la página de empresa, subiendo la exportación<br>• Seguimiento de campañas pagas, con bitácora de controles y decisiones | Novedad | `f53b3b5..be6edb4` (6) |
| **1.1.0** | 29/10/2026 | • El Panel pasa a tener dirección propia: panel.devisebit.com<br>• Secciones de Publicaciones, CRM y ventas, Academia, Web, Usuarios, Análisis, YouTube, Anuncios y Competencia<br>• Vistas por video de YouTube y visitas por nota del blog | Novedad | `01b4c15..c54b661` (6) |
| **1.0.0** | 28/10/2026 | • Primera versión, dentro del Sistema: indicadores de CRM, Academia, novedades y webs<br>• Contador de visitas propio<br>• YouTube y usuarios registrados | Novedad | `f22e0b0..cf8b43e` (3) |

### 3.8 Oficina — oficina.devisebit.com

20 cambios · 2 versiones · versión actual **1.1.0** · Solo entra Julio.

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **1.1.0** | 07/11/2026 | • El panel de órdenes queda claro: qué pediste, qué respondió el jefe y quién lo hace<br>• El jefe ya no falla con respuestas largas<br>• Las tareas programadas pueden leer y actualizar Prospección<br>• Los avisos de la Oficina llegan por Telegram (cambio del 08/11, compartido con el Sistema: `d0859fb`) | Mejora | `73b6790..f9e5cc9` (2) |
| **1.0.0** | 03/11/2026 | • Primera versión: oficina de agentes con un jefe de gabinete, conectada a WhatsApp<br>• Organigrama vivo con áreas, responsables y permisos<br>• Llamada de voz con el jefe desde el navegador; botón «Ejecutar ahora»<br>• Vista de torre con un piso por área | Novedad | `60bd888..91a07ad` (18) |

### 3.9 Sitio personal de Julio — julio.devisebit.com

61 cambios · 6 versiones · versión actual **1.5.0**

En este mismo código vive, en una carpeta aparte, el sitio de San Patricio (un cliente), y también imágenes para redes de DEVISEBIT. Esos cambios están contados acá porque comparten historial, pero no tienen versión propia.

| Versión | Fecha | Qué cambió para quien lo usa | Tipo | Rastro |
|---|---|---|---|---|
| **1.5.0** | 12/11/2026 | • LinkedIn en la sección de contacto y en el pie; el CV online se enlaza desde el inicio<br>• El CV se imprime en dos hojas limpias<br>• Datos alineados en todo el sitio: 17 años de trayectoria, 7 sectores, roles vigentes<br>• Mejor en celular y para Google: sin desplazamiento lateral, mejor contraste, mapa del sitio y página de «no encontrado» | Mejora | `fd3e2a9..3e6a2dc` (18) |
| **1.4.0** | 09/11/2026 | • Versión en inglés del perfil, la historia y el portfolio, con selector de idioma y CV en inglés<br>• Textos al día (proyectos de software e IA) | Novedad | `37b4a92..6752bf0` (2) |
| **1.3.0** | 02/11/2026 | • CV de gestión en PDF, con link directo<br>• El bloque «Hoy» ya no se limita a salud | Novedad | `8fd15a4..6e2c194` (3) |
| **1.2.0** | 26/10/2026 | • El perfil se reordena: San Patricio queda como etapa cumplida, con sus logros<br>• Nueva portada de LinkedIn e imágenes para compartir<br>• San Patricio: página de enlaces para Instagram y nota nueva | Mejora | `a2e662d..bbfe66c` (13) |
| **1.1.0** | 20/10/2026 | • Se suma el sitio de San Patricio en su carpeta, con convenios, habilitaciones y Novedades<br>• CV e infografía actualizados; proyectos UBA 2021–2024<br>• Imágenes para la página Trabajos de DEVISEBIT | Novedad | `041989d..369c9a7` (21) |
| **1.0.0** | 17/10/2026 | • Primera versión: perfil, historia y portfolio<br>• Página del CV con vista previa<br>• Imagen para compartir en redes | Novedad | `ff21d38..15595ac` (4) |

---

## 4. Hitos

- **17/10** — Primer cambio de todo el historial: nace el sitio personal de Julio (perfil, historia, portfolio y CV).
- **19/10** — Se suma el sitio de San Patricio en una carpeta aparte.
- **23/10** — Nace el **Sistema** de DEVISEBIT, separado del de San Patricio: CRM, conversaciones, agenda y email marketing. Ese mismo día nacen el **bot** y la **Academia**. Desde el primer día se registra de dónde llega cada consulta.
- **26/10** — El bot pasa a llamarse **Bit**. La lista de precios entra al Sistema.
- **27/10** — Nace el **Portal** de clientes, con cobros y suspensión por deuda. La Academia suma cursos y certificados.
- **28/10** — El **sitio web** de DEVISEBIT y las **landings**, que ya estaban publicados, entran al historial de versiones. Lanzamiento general: Sistema 2.0.0 con nuevo diseño y módulos de gestión. Primera versión del **Panel de Contenido**.
- **29/10** — El Panel pasa a tener dirección propia. Campaña de relanzamiento por email. Documentos de la empresa con versiones. Contador de visitas propio en el sitio.
- **30/10** — Academia 2.0.0: 8 cursos con compra y espacio del alumno. Autodiagnósticos en 3 niveles. Nueva línea de Asesoría. Ingreso al Portal con código de 6 dígitos.
- **31/10** — Sitio web en inglés y mapa 3D de proyectos.
- **02/11** — **Medición de anuncios**: Google Analytics y píxel de Meta en el sitio y las landings. El caso Soy Tigre pasa a ser el destacado.
- **03/11** — Nace la **Oficina** de agentes.
- **05/11** — Etiqueta de Google Ads de la cuenta nueva en el sitio y las landings.
- **06/11** — Rediseño del Panel (2.0.0). Bit con voz más humana. Sitio personal en inglés.
- **08/11** — Avisos por Telegram.
- **10/11** — **Rediseño 2026** del Sistema (3.0.0): menú de 7 áreas y más velocidad.
- **11/11** — Bit entiende audios.
- **12/11** — **Seguimiento automático** de Bit. Las landings empiezan a informar de qué anuncio vino cada consulta. Tanda grande de seguridad y correcciones en todos los productos. A la tarde: pase al CRM de varias consultas a la vez, envío de material por email y la separación entre «Pasaron al CRM» y «Ganadas».
- **13/11** — **Tablero diario** en el Panel: el informe de la mañana y el de cierre en una pantalla, con decisiones para tildar. TikTok entra a las mediciones del Panel.

---

## 5. Lo que no está versionado todavía

Estas cosas existen, pero su historia no se puede reconstruir desde el código: o están como archivo terminado sin su original, o viven en la base de datos.

| Qué | Dónde está hoy | Cómo conviene versionarlo |
|---|---|---|
| **Folletos en PDF** (16 folletos de producto, los dos del Panel, Asesoría, Socios, Conocé DEVISEBIT) | Como archivos terminados dentro del sitio web, sin el original editable | Guardar el original junto al PDF y poner versión y fecha en el nombre o en el pie de cada folleto |
| **Videos y reels** (16 videos de demos, 19 cortos y 1 largo de YouTube, historias y placas) | Como archivos terminados; no está el programa que los genera. La única excepción es el video «Conocé DEVISEBIT», que sí tiene sus fuentes guardadas | Guardar las fuentes de cada pieza, como ya se hace con «Conocé DEVISEBIT», y numerar cada pieza publicada |
| **Documentos de la Biblioteca del Sistema** (manual, presentación, dossier) | En la base de datos, con su propia tabla de versiones | Ya tienen versión propia dentro del Sistema: anotar en este documento la versión vigente de cada uno |
| **Lista de precios** | En la base de datos, con historial de cambios; en el código solo está la carga inicial | Cada cambio de precios lleva fecha de vigencia y una línea en este documento (por ejemplo «Precios 2026-11») |
| **Lo que el equipo le enseñó a Bit** | En la base de datos; el código solo tiene las reglas generales | Exportar una copia fechada después de cada revisión semanal aprobada y anotarla acá |

También queda afuera lo que se configura en otras plataformas (campañas de Google y Meta, plantillas de WhatsApp, publicaciones programadas): este documento solo cubre lo que está en el código.

---

## 6. Datos técnicos

Para quien mantiene el sistema. Un solo repositorio (`julio-miranda-web`) con varias ramas; cada rama se publica por separado.

| Rama | Producto | Proyecto de hosting (Vercel) |
|---|---|---|
| `devisebit-web` | Sitio web DEVISEBIT y landings | `v0-fork-of-devisebit-clone` |
| `devisebit-sistema` | Sistema, Bot, Academia, Portal, Panel y Oficina (una sola aplicación; cada dirección entra a su sección según el dominio) | `devisebit-sistema` |
| `main` | Sitio personal de Julio; sitio de San Patricio en la carpeta `sanpatricio/` | `julio-miranda-web` (San Patricio: proyecto aparte) |

El nombre del proyecto del sitio web figura en el README de la rama. Los otros dos se tomaron de la lista de proyectos de la cuenta por coincidencia de nombre; conviene confirmarlos en Vercel. El README de `devisebit-web` dice que las landings las sirve otro proyecto (`devisebit-landings`), pero los archivos de las landings están en esta rama y ahí se editaron el 12/11: hay que confirmar cuál de los dos atiende hoy esas direcciones.

**Otras ramas:**

- Ya incorporadas a lo publicado, sin nada pendiente: `academia-estilo`, `bot-voz-humana`, `crm-seleccion-avisos`, `fix-audios-bot`, `oficina`, `panel-ux-2026-11`, `rediseno-2026` (en `devisebit-sistema`); `demos-wip`, `devisebit-estilo`, `devisebit-universo` (en `devisebit-web`); `respaldo-perfil-con-san-patricio` (en `main`).
- **Sin incorporar**, con un cambio pendiente cada una: `bot-revision-2026-10-30` y `bot-revision-2026-11-06` (ajustes de Bit propuestos por la revisión semanal), `diseno-antislop` (correcciones de diseño del sitio web, 03/11) y `academia-aula` (2 cambios: un rediseño del espacio del alumno que quedó en prueba; lo publicado tiene otro rediseño, del 03/11). Hay que decidir si se incorporan o se descartan.
- Ajenas a DEVISEBIT: `sistema` (el sistema de San Patricio, 22 cambios, historia separada) y `tmp-carga-x7` (temporal vacía).

**Comandos para regenerar la lista de cambios** (solo lectura):

```bash
git fetch origin

# Todo lo publicado en una rama, del más viejo al más nuevo
git log --date=short --format='%h %ad %s' --reverse origin/devisebit-sistema

# Cambios desde una versión: usar el último código de su rastro.
# Ejemplo: todo lo posterior a Sistema 3.1.0 (rastro 2abf7b8..dfd8805)
git log --date=short --format='%h %ad %s' --reverse dfd8805..origin/devisebit-sistema

# Lo mismo, filtrado por producto dentro de devisebit-sistema
git log --date=short --format='%h %ad %s' --reverse 0c7bd9a..origin/devisebit-sistema -- app/academia 'lib/academia*'
git log --date=short --format='%h %ad %s' --reverse 281f7f8..origin/devisebit-sistema -- app/portal lib/portal.ts
git log --date=short --format='%h %ad %s' --reverse 63ee348..origin/devisebit-sistema -- app/panel-contenido 'lib/panel*'
git log --date=short --format='%h %ad %s' --reverse 89d02f1..origin/devisebit-sistema -- lib/bot.ts lib/reenganche.ts app/api/whatsapp lib/bots
git log --date=short --format='%h %ad %s' --reverse f9e5cc9..origin/devisebit-sistema -- app/oficina 'lib/oficina*'

# Sitio web y landings
git log --date=short --format='%h %ad %s' --reverse 35e2cd0..origin/devisebit-web
git log --date=short --format='%h %ad %s' --reverse f44853c..origin/devisebit-web -- public/lp public/lp-assets

# Sitio personal
git log --date=short --format='%h %ad %s' --reverse 3e6a2dc..origin/main

# Ver qué archivos tocó un cambio y su descripción completa
git show --stat <código>
```

**Cómo se hizo la separación por producto:** primero por el título de cada cambio y, cuando no alcanzaba, por las carpetas que tocó. Los filtros por carpeta de arriba son una aproximación: un cambio que toca dos productos aparece en los dos. Las fechas son las de cada cambio, y el orden es el del historial de la rama; por eso, cuando se unió trabajo hecho en paralelo, puede haber un cambio fechado el 11/11 ubicado después de uno del 12/11.

**Etiquetas recomendadas:** hoy no hay etiquetas de versión en el repositorio. Para que la numeración no dependa solo de este documento, conviene crear una etiqueta por versión actual (por ejemplo `sistema-v3.0.1`, `web-v1.6.1`, `academia-v2.2.1`) sobre el último código de cada rastro.


---

## 7. Último cambio revisado de cada rama

Lo usa la actualización diaria para saber desde dónde seguir. Los cambios que solo actualizan este documento (título «Versiones: actualización…») no se cuentan.

| Rama | Último cambio incluido |
|---|---|
| `devisebit-sistema` | `9952dff` |
| `devisebit-web` | `8ec0e3b` |
| `main` | `3e6a2dc` |
