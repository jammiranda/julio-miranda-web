"""Arma ../textos.md: guion locutado (sale de guiones.py) + textos para TikTok, Instagram y YouTube Shorts de cada pieza. Sin precios."""
import pathlib
from guiones import G, grupos
W = "https://www.devisebit.com"
X = {
"b01-3-senales-web": ("3 señales de que tu web te hace perder clientes",
 "3 señales de que tu web te hace perder clientes. ¿Te pasa alguna? Link en el perfil. #paginasweb #pymes #emprendedores #negocios #argentina",
 "3 señales de que tu web te hace perder clientes:\n\n1. En el celular se ve mal.\n2. No aparece en Google.\n3. No tiene botón de WhatsApp.\n\n¿Te pasa alguna? Una web completa puede estar lista en 5 días hábiles. Pedí tu propuesta desde el link del perfil.\n\nTe lo cuenta Bit, nuestro asistente con IA.\n\n#PáginasWeb #PymesArgentinas #Emprendedores #MarketingDigital",
 "3 señales de que tu web te hace perder clientes", f"Se ve mal en el celular, no aparece en Google o no tiene botón de WhatsApp: tres señales para revisar hoy. Una web completa puede estar lista en 5 días hábiles. {W}/webs #Shorts"),
"b02-5-preguntas": ("5 preguntas que contesto solo, todos los días",
 "5 preguntas que se repiten todos los días. Las contesto yo: soy Bit, un asistente con IA. Pedí la demo, link en el perfil. #whatsapp #inteligenciaartificial #pymes #atencionalcliente #negocios",
 "5 preguntas que contesto solo, todos los días:\n\n1. ¿Qué horario tienen?\n2. ¿Cuánto sale? (lo respondo con la info que carga tu negocio)\n3. ¿Cómo llego?\n4. ¿Qué requisitos piden?\n5. ¿Qué medios de pago aceptan?\n\nSoy Bit, un asistente con IA. Pedí la demo desde el link del perfil.\n\n#WhatsAppBusiness #InteligenciaArtificial #PymesArgentinas #AtenciónAlCliente",
 "5 preguntas que un asistente con IA contesta solo", f"Horarios, costos, cómo llegar, requisitos y medios de pago: las preguntas de todos los días, respondidas con la información que carga tu negocio. Chat simulado. {W}/whatsapp #Shorts"),
"b03-dominio": ("¿Tu dominio está a tu nombre?",
 "¿Tu dominio está a tu nombre? Revisalo hoy: buscá quién figura como titular. Más info, link en el perfil. #dominio #paginasweb #pymes #emprendedores #negocios",
 "¿Tu dominio está a tu nombre?\n\nSi lo registró otra persona, ¿quién decide qué pasa con tu web? Revisalo hoy: buscá quién figura como titular.\n\nEn nuestras webs, el .com.ar queda a tu nombre. Más info en el link del perfil.\n\n#Dominio #PáginasWeb #PymesArgentinas #Emprendedores",
 "¿Tu dominio está a tu nombre? Revisalo hoy", f"Si el dominio lo registró otra persona, ¿quién decide qué pasa con tu web? Buscá quién figura como titular. En nuestras webs el .com.ar se registra a tu nombre. {W}/webs #Shorts"),
"b04-planillas": ("Planilla contra sistema",
 "La misma tarea, de dos formas: con planillas o con un sistema. Pedí el diagnóstico sin cargo, link en el perfil. #sistemas #pymes #gestion #excel #negocios",
 "La misma tarea, de dos formas.\n\nCon planillas: buscás el archivo, copiás, pegás y avisás a mano.\nCon un sistema: cargás una vez y todos lo ven al instante.\n\nUn módulo base suele estar en 3 a 6 semanas. El primer paso es un diagnóstico de 30 minutos sin cargo: link en el perfil.\n\nLa comparación del video es ilustrativa.\n\n#SistemasDeGestión #PymesArgentinas #Excel #Software",
 "Planilla contra sistema: la misma tarea de dos formas", f"Con planillas se busca, se copia, se pega y se avisa a mano. Con un sistema se carga una vez y todos lo ven. Un módulo base suele estar en 3 a 6 semanas. Diagnóstico de 30 minutos sin cargo. Comparación ilustrativa. {W}/sistemas #Shorts"),
"b05-ia-por-donde": ("IA en tu negocio: por dónde empezar",
 "IA en tu negocio: empezá por una sola tarea que se repita todos los días. Autodiagnóstico gratis, link en el perfil. #inteligenciaartificial #pymes #automatizacion #negocios #emprendedores",
 "Inteligencia artificial en tu negocio: ¿por dónde empezar?\n\n1. Elegí una sola tarea que se repita todos los días.\n2. Medí cuánto tiempo te lleva hoy.\n3. Automatizala.\n4. Volvé a medir.\n\nCon ese resultado, vas por la siguiente. Hacé el autodiagnóstico gratis desde el link del perfil.\n\n#InteligenciaArtificial #PymesArgentinas #Automatización #TransformaciónDigital",
 "IA en tu pyme: por dónde empezar", f"Una sola tarea que se repita todos los días: medir, automatizar y volver a medir. Autodiagnóstico gratuito: 12 preguntas, 5 minutos. {W}/diagnostico #Shorts"),
"b06-landing-o-web": ("¿Landing o web completa?",
 "¿Landing o web completa? Depende de lo que quieras lograr. Link en el perfil. #paginasweb #landingpage #pymes #emprendedores #marketingdigital",
 "¿Landing o web completa?\n\n→ Para vender una sola cosa: landing. Una página, un mensaje, un botón. Lista en 2 a 3 días hábiles.\n→ Para mostrar todo tu negocio: web completa. Lista en 5 días hábiles.\n\n¿Cuál te sirve? Pedí tu propuesta desde el link del perfil.\n\n#PáginasWeb #LandingPage #PymesArgentinas #MarketingDigital",
 "¿Landing o web completa? Cuál necesitás", f"Landing: una página, un mensaje, un botón, lista en 2 a 3 días hábiles. Web completa: para mostrar todo tu negocio, lista en 5 días hábiles. {W}/webs #Shorts"),
"b07-33-sobre-100": ("33 sobre 100. ¿Cuánto saca tu empresa?",
 "33 sobre 100 es un ejemplo. ¿Cuánto saca tu empresa? Autodiagnóstico gratis, link en el perfil. #pymes #transformaciondigital #negocios #emprendedores #diagnostico",
 "33 sobre 100. ¿Cuánto saca tu empresa?\n\nEl 33 es un ejemplo. Tu puntaje sale de un autodiagnóstico gratis: 12 preguntas, 5 minutos, 6 dimensiones. Al instante ves tu puntaje y 3 prioridades para empezar.\n\nHacelo hoy desde el link del perfil.\n\n#TransformaciónDigital #PymesArgentinas #Diagnóstico #Emprendedores",
 "33 sobre 100: ¿cuánto saca tu empresa?", f"Autodiagnóstico gratuito de madurez digital: 12 preguntas, 5 minutos, 6 dimensiones. Al instante ves tu puntaje y 3 prioridades. El 33 es un resultado de ejemplo. {W}/diagnostico #Shorts"),
"b08-publicar-no-es-vender": ("Publicar no es vender",
 "Publicar no es vender. Las redes necesitan un plan. Link en el perfil. #redessociales #marketingdigital #pymes #emprendedores #negocios",
 "Publicar no es vender.\n\nPodés subir contenido todos los días y que nadie te escriba. Las redes necesitan un plan: calendario, piezas, respuestas a tiempo y un informe para saber qué funcionó.\n\n¿Querés ver cómo sería el tuyo? Pedí tu propuesta desde el link del perfil.\n\n#RedesSociales #MarketingDigital #PymesArgentinas #Emprendedores",
 "Publicar no es vender: las redes necesitan un plan", f"Calendario, piezas, respuestas a tiempo y un informe para saber qué funcionó. {W}/redes #Shorts"),
"b09-mientras-dormis": ("Lo que hago mientras dormís",
 "Esto hago mientras dormís. Soy Bit, tu asistente con IA. Pedí la demo, link en el perfil. #whatsapp #inteligenciaartificial #pymes #turnos #negocios",
 "Esto hago mientras dormís:\n\n→ Entra un mensaje: lo respondo.\n→ Piden un turno: lo agendo.\n→ Si alguien necesita a una persona, lo paso a tu equipo.\n\nA la mañana tenés el resumen esperándote. Soy Bit, tu asistente con IA. Pedí la demo desde el link del perfil.\n\nChats y números del video: ejemplo ilustrativo.\n\n#WhatsAppBusiness #InteligenciaArtificial #PymesArgentinas #Turnos",
 "Lo que hace un asistente con IA mientras dormís", f"Responde mensajes, agenda turnos y deriva a tu equipo lo que necesita a una persona. A la mañana, el resumen. Chat simulado; los números son un ejemplo. {W}/whatsapp #Shorts"),
"b10-lo-que-no-hago": ("3 cosas que NO hago",
 "3 cosas que no hago: no invento, no me hago pasar por una persona y, si no sé, te paso con el equipo. Pedí la demo, link en el perfil. #inteligenciaartificial #whatsapp #pymes #atencionalcliente #negocios",
 "3 cosas que NO hago:\n\n1. No invento respuestas: respondo con la información de tu negocio.\n2. No me hago pasar por una persona: soy Bit, un asistente con IA.\n3. Si no sé, te paso con alguien del equipo, con todo el historial.\n\nPedí la demo desde el link del perfil.\n\n#InteligenciaArtificial #WhatsAppBusiness #PymesArgentinas #AtenciónAlCliente",
 "3 cosas que un asistente con IA NO hace", f"No inventa respuestas, no se hace pasar por una persona y, si no sabe, deriva a alguien del equipo con todo el historial. Chat simulado. {W}/whatsapp #Shorts"),
}
out = ["# Tanda 1 con Bit v3 · textos\n", "Diez piezas verticales (TikTok, Reels, Shorts). Voz: Tomás (es-AR), la misma del piloto. Sin precios. Los chats y los números en pantalla son ejemplos ilustrativos.\n"]
for n, esc in G.items():
    tit, tk, ig, ytt, ytd = X[n]; guion = " ".join(g[0] for _, ch in esc for g in grupos(ch))
    out += [f"\n## {n} · {tit}\n", f"Archivos: `{n}.mp4` · `{n}-portada.jpg` · `contactos/{n}.png`\n", f"**Guion locutado**\n\n{guion}\n", f"**TikTok**\n\n{tk}\n", f"**Instagram**\n\n{ig}\n", f"**YouTube Shorts**\n\nTítulo: `{ytt}`\n\nDescripción: {ytd}\n"]
txt = "\n".join(out); assert "$" not in txt; pathlib.Path(__file__).parent.parent.joinpath("textos.md").write_text(txt); print("ok textos.md", len(txt))
