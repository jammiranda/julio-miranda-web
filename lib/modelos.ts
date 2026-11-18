import { q, one } from "./db"

/** Modelos de mensaje reutilizables. Se editan en Comunicación → Modelos de mensaje y se aplican desde la ficha de una consulta. */
export type Modelo = { id: string; nombre: string; canal: "email" | "whatsapp"; asunto: string; cuerpo: string }

export const VARIABLES: [string, string][] = [
  ["{{nombre}}", "nombre de pila del cliente"], ["{{tema}}", "motivo de la consulta"],
  ["{{brief}}", "link al formulario de 3 minutos de esa consulta"], ["{{agenda}}", "link para que elija día y hora"],
]

export const BASE: Modelo[] = [
  {
    id: "recuperar-email", nombre: "Recuperar consulta · email", canal: "email",
    asunto: "{{nombre}}, avancemos con {{tema}} sin esperar la reunión",
    cuerpo: `Hola {{nombre}}, ¿cómo estás? Te escribe Julio, de DEVISEBIT.

Hace unos días nos consultaste por {{tema}} y no quiero que quede en el aire. Te propongo avanzar sin depender de una reunión.

Para armarte una propuesta concreta necesito conocer un poco más tu negocio. Son 3 minutos, desde el celular:

{{brief}}

Con eso te preparo un plan a medida, con alcance, plazo e inversión.

Y si preferís hablarlo, elegí el horario que te quede cómodo acá y te llamo yo:
{{agenda}}

Un abrazo,
Julio Miranda
DEVISEBIT`,
  },
  {
    id: "recuperar-wa", nombre: "Recuperar consulta · WhatsApp", canal: "whatsapp", asunto: "",
    cuerpo: `Hola {{nombre}}, ¿cómo estás? Soy Julio, de DEVISEBIT. Hace unos días nos escribiste por {{tema}} y no quiero que quede en el aire.

Si seguís con la idea, contame en dos líneas de qué es tu negocio y qué necesitás, y te paso una propuesta concreta hoy mismo. Si te resulta más cómodo, lo completás acá en 3 minutos: {{brief}}

Y si ya lo resolviste, avisame y no te molesto más. ¡Gracias!`,
  },
]
export const esBase = (id: string) => BASE.some((b) => b.id === id)

export async function modelos(): Promise<Modelo[]> {
  const r = await one<{ valor: string }>("select valor from config where clave='modelos_mensaje'").catch(() => null)
  let guardados: Modelo[] = []
  try { guardados = r ? JSON.parse(r.valor) : [] } catch { guardados = [] }
  // Los dos de base siempre están (editados o no); después, los que se hayan agregado
  return [...BASE.map((b) => guardados.find((g) => g.id === b.id) ?? b), ...guardados.filter((g) => !esBase(g.id))]
}

export async function guardarModelos(lista: Modelo[]) {
  await q("insert into config(clave,valor) values ('modelos_mensaje',$1) on conflict (clave) do update set valor=excluded.valor", [JSON.stringify(lista)])
}

/** Pone nombre y tema; si no hay nombre, el saludo queda limpio («Hola, …»). {{brief}} y {{agenda}} se resuelven aparte, con la consulta. */
export function aplicar(texto: string, d: { nombre: string | null; tema: string }) {
  return texto.replaceAll("{{tema}}", d.tema).replaceAll("{{nombre}}", d.nombre ?? "")
    .replace(/^ ?, ?/, "").replace(/(Hola|Buenas|Buen día) ,/g, "$1,").replace(/ {2,}/g, " ").replace(/^./, (x) => x.toUpperCase())
}
