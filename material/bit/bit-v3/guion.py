"""Guion del piloto. Cada escena: (id, [[texto que dice la voz, subtitulo en pantalla], ...]).
Cada par es un grupo de subtitulo (2 o 3 palabras). La palabra clave va entre *asteriscos*. Subtitulo "" = sin subtitulo.
Sin precios, sin telefonos, sin nombres de clientes."""
ELENA, TOMAS = "es-AR-ElenaNeural", "es-AR-TomasNeural"   # voces neuronales sinteticas es-AR, las mismas de la serie
VOZ, RITMO, BPM = TOMAS, "+14%", 120
ESCENAS = [
 ("calle", [["Once y cuarenta y siete", ""], ["de la noche:", "DE LA NOCHE"], ["Te escribe", "TE ESCRIBE"], ["un cliente.", "UN *CLIENTE*"],
            ["¿Quién le", "¿QUIÉN LE"], ["contesta?", "*CONTESTA?*"]]),
 ("bit", [["Soy Bit,", "SOY *BIT*"], ["un asistente", "UN ASISTENTE"], ["con inteligencia artificial.", "CON *IA*"],
          ["A esa hora", "A ESA HORA"], ["contesto yo.", "*CONTESTO YO*"]]),
 ("chat", [["Me preguntan", "ME PREGUNTAN"], ["por un turno,", "POR UN *TURNO*"], ["respondo", "RESPONDO"], ["en segundos", "EN *SEGUNDOS*"],
           ["y lo dejo", "Y LO DEJO"], ["agendado.", "*AGENDADO*"]]),
 ("cta", [["¿Querés ver", "¿QUERÉS VER"], ["cómo le respondería", "CÓMO LE RESPONDERÍA"], ["a tus clientes?", "A *TUS CLIENTES?*"],
          ["Pedí la demo.", ""], ["Link en el perfil.", ""]]),
]
COLA = 1.2
EXTRA = {"chat": 1.5}   # segundos de aire al final de una escena (el chat respira y Bit celebra)   # segundos de cierre despues de la ultima palabra
