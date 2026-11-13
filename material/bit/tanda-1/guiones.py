"""Guiones de la tanda 1 con Bit v3. Voz: Tomas (la del piloto) en todas, para que Bit sea un solo personaje.
Cada pieza: lista de escenas (id, [grupos]). Un grupo es "lo que dice, con la *clave* entre asteriscos" (el subtitulo sale de ahi, en mayusculas)
o ["lo que dice", "SUBTITULO"] cuando en pantalla va otra cosa ("" = sin subtitulo). Sin precios. Hechos: solo los de videos-sin-precio/textos.md."""
TOMAS, ELENA = "es-AR-TomasNeural", "es-AR-ElenaNeural"
VOZ, RITMO, BPM, COLA = TOMAS, "+14%", 120, 1.3
FIN = [["link en el perfil.", ""]]
G = {
"b01-3-senales-web": [
 ("gancho", [["Tres señales", "*3* SEÑALES"], "de que tu web", "te hace perder *clientes*."]),
 ("s1", [["Una:", "*1*"], "en el celular", "se ve *mal*."]),
 ("s2", [["Dos:", "*2*"], "no aparece", "en *Google*."]),
 ("s3", [["Tres:", "*3*"], "no tiene botón", "de *WhatsApp*."]),
 ("cta", ["¿Te pasa *alguna*?", "Una web completa", "puede estar lista", ["en cinco días hábiles.", "EN *5 DÍAS* HÁBILES"], ["Pedí tu propuesta:", ""]] + FIN)],
"b02-5-preguntas": [
 ("gancho", [["Cinco preguntas", "*5* PREGUNTAS"], "que contesto *solo*,", "todos los días."]),
 ("s1", ["¿Qué *horario* tienen?", "¿Cuánto *sale*?", "Eso lo respondo", "con la info", "que carga *tu negocio*."]),
 ("s2", ["¿Cómo *llego*?", "¿Qué *requisitos* piden?", "¿Qué medios", "de *pago* aceptan?"]),
 ("cta", ["Soy *Bit*,", "un asistente", ["con inteligencia artificial.", "CON *IA*"], ["Pedí la demo:", ""]] + FIN)],
"b03-dominio": [
 ("gancho", ["¿Tu *dominio*", "está a *tu nombre*?"]),
 ("s1", ["Si lo registró", "*otra persona*,", "¿quién decide", "qué pasa", "con *tu web*?"]),
 ("s2", ["Revisalo *hoy*:", "buscá quién figura", "como *titular*."]),
 ("s3", ["En nuestras webs,", ["el punto com punto ar", "EL *.COM.AR*"], "queda", "a *tu nombre*."]),
 ("cta", ["Soy *Bit*,", "un asistente", ["con inteligencia artificial.", "CON *IA*"], ["Más info:", ""]] + FIN)],
"b04-planillas": [
 ("gancho", ["La *misma* tarea,", "de *dos* formas."]),
 ("s1", ["Con *planillas*:", "buscás el archivo,", "copiás, pegás", "y avisás *a mano*."]),
 ("s2", ["Con un *sistema*:", "cargás *una vez*", "y todos lo ven", "*al instante*."]),
 ("s3", ["Un módulo base", "suele estar", ["en tres a seis semanas.", "EN *3 A 6* SEMANAS"]]),
 ("cta", [["Pedí el diagnóstico sin cargo:", ""]] + FIN)],
"b05-ia-por-donde": [
 ("gancho", [["Inteligencia artificial", "*IA*"], "en tu negocio:", "¿por dónde *empezar*?"]),
 ("s1", ["Elegí *una sola* tarea", "que se repita", "*todos los días*."]),
 ("s2", ["*Medí* cuánto tiempo", "te lleva hoy.", "*Automatizala*.", "Y volvé", "a *medir*."]),
 ("s3", ["Con ese resultado,", "vas por", "la *siguiente*."]),
 ("cta", [["Hacé el autodiagnóstico gratis:", ""]] + FIN)],
"b06-landing-o-web": [
 ("gancho", ["¿*Landing*", "o web *completa*?"]),
 ("s1", ["Para vender", "*una sola* cosa:", "*landing*.", "Una página,", "un mensaje,", "un *botón*.", ["Lista en dos a tres", "LISTA EN *2 A 3*"], "días hábiles."]),
 ("s2", ["Para mostrar", "*todo* tu negocio:", "web *completa*.", ["Lista en cinco", "LISTA EN *5*"], "días hábiles."]),
 ("cta", ["¿Cuál *te sirve*?", ["Pedí tu propuesta:", ""]] + FIN)],
"b07-33-sobre-100": [
 ("gancho", [["Treinta y tres sobre cien.", "*33* SOBRE 100"], "¿Cuánto saca", "*tu empresa*?"]),
 ("s1", ["Es un *ejemplo*.", "Tu puntaje sale", "de un autodiagnóstico", "*gratis*."]),
 ("s2", [["Doce preguntas,", "*12* PREGUNTAS"], ["cinco minutos,", "*5* MINUTOS"], ["seis dimensiones.", "*6* DIMENSIONES"]]),
 ("s3", ["Al instante", "ves tu *puntaje*", ["y tres prioridades", "Y *3* PRIORIDADES"], "para empezar."]),
 ("cta", [["Hacelo hoy:", ""]] + FIN)],
"b08-publicar-no-es-vender": [
 ("gancho", ["*Publicar*", "no es *vender*."]),
 ("s1", ["Podés subir contenido", "todos los días", "y que *nadie*", "te escriba."]),
 ("s2", ["Las redes", "necesitan un *plan*:", "*calendario*,", "*piezas*,", "*respuestas* a tiempo", "y un *informe*", "para saber", "qué funcionó."]),
 ("cta", ["¿Querés ver", "cómo sería", "*el tuyo*?", ["Pedí tu propuesta:", ""]] + FIN)],
"b09-mientras-dormis": [
 ("gancho", ["Esto hago", "mientras *dormís*."]),
 ("s1", ["Entra un mensaje:", "lo *respondo*.", "Piden un turno:", "lo *agendo*."]),
 ("s2", ["Y si alguien", "necesita a *una persona*,", "lo paso", "a *tu equipo*."]),
 ("s3", ["A la mañana,", "tenés el *resumen*", "esperándote."]),
 ("cta", ["Soy *Bit*,", "tu asistente", ["con inteligencia artificial.", "CON *IA*"], ["Pedí la demo:", ""]] + FIN)],
"b10-lo-que-no-hago": [
 ("gancho", [["Tres cosas", "*3* COSAS"], "que *no* hago."]),
 ("s1", [["Uno:", "*1*"], "no *invento*", "respuestas.", "Respondo con", "la información", "de *tu negocio*."]),
 ("s2", [["Dos:", "*2*"], "no me hago pasar", "por *una persona*.", "Soy *Bit*,", "un asistente", ["con inteligencia artificial.", "CON *IA*"]]),
 ("s3", [["Tres:", "*3*"], "si *no sé*,", "te paso", "con alguien del equipo,", "con todo", "el *historial*."]),
 ("cta", [["Pedí la demo:", ""]] + FIN)],
}
def grupos(chunks):
    """-> [(dicho, mostrado)]"""
    out = []
    for c in chunks:
        if isinstance(c, str): out.append((c.replace("*", ""), c.upper().replace(".", "").replace(",", "").replace(":", "")))
        else: out.append((c[0], c[1]))
    return out
