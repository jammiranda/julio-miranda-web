import { q, one } from "./db"
import { URL_ACADEMIA } from "./academia"
import { aHtml, plantilla, enviarBrevo } from "./email"

/**
 * Recursos con palabra clave (estilo "comentá GUIA y te lo mando por DM").
 * - Link corto público: academia.devisebit.com/r/<palabra> (cuenta los clics y lleva al recurso con UTM).
 * - En Instagram o WhatsApp, si alguien escribe la palabra, el bot manda el link y pide el email;
 *   cuando lo deja, se guarda como contacto con la etiqueta recurso-<palabra> y le llega el link por correo.
 */
export type Recurso = { palabra: string; titulo: string; url: string; mensaje: string | null; activo: boolean; usos: number; emails: number }

const limpiar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()
export const palabraValida = (p: string) => limpiar(p).replace(/ /g, "").slice(0, 24)
export const linkRecurso = (palabra: string) => `${URL_ACADEMIA}/r/${palabra.toLowerCase()}`

/** Busca una palabra clave en un mensaje corto (hasta 8 palabras): "GUIA", "hola! quiero la GUIA", "guía 🙌". */
export async function recursoEnMensaje(texto: string | null): Promise<Recurso | null> {
  if (!texto) return null
  const t = limpiar(texto)
  if (!t || t.split(" ").length > 8) return null
  const activos = await q<Recurso>("select * from am_recursos where activo").catch(() => [] as Recurso[])
  const palabras = new Set(t.split(" "))
  return activos.find((r) => palabras.has(r.palabra) || t.replace(/ /g, "") === r.palabra) ?? null
}

export async function sumarUso(palabra: string) {
  await q("update am_recursos set usos=usos+1 where palabra=$1", [palabra]).catch(() => {})
}

/** Guarda el contacto con la etiqueta del recurso y le manda el link por email. */
export async function entregarPorEmail(r: Recurso, email: string, nombre: string | null, origen: string) {
  const tag = `recurso-${r.palabra.toLowerCase()}`
  await q(`insert into db_contactos(nombre,email,etapa,origen,categoria,tags,consentimiento,clase) values (coalesce($1,split_part($2,'@',1)),$2,'nuevo',$3,'Recurso gratis',array[$4,'academia']::text[],'Sí','suscriptor')
           on conflict (lower(email)) where email is not null do update set tags=(select array(select distinct unnest(db_contactos.tags || array[$4,'academia']::text[]))), actualizado=now()`, [nombre, email, origen, tag]).catch(() => {})
  await q("update am_recursos set emails=emails+1 where palabra=$1", [r.palabra]).catch(() => {})
  const link = linkRecurso(r.palabra) + "?utm_medium=email"
  return enviarBrevo({ email, name: nombre ?? undefined }, `Tu recurso: ${r.titulo}`, plantilla(aHtml(`# ¡Acá lo tenés!\n\n${r.mensaje ? r.mensaje + "\n\n" : ""}[[Abrir: ${r.titulo}|${link}]]\n\nTodos los martes mandamos una guía práctica nueva de IA y tecnología aplicada. Si no te interesa, podés darte de baja desde cualquier correo.\n\n— Equipo de la ACADEMIA DEVISEBIT`), { preheader: r.titulo }))
}

export async function recurso(palabra: string) {
  return one<Recurso>("select * from am_recursos where palabra=$1 and activo", [palabraValida(palabra)])
}
