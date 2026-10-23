import { randomBytes } from "crypto"
import { q, one } from "./db"

export const URL_SISTEMA = process.env.SISTEMA_URL ?? "https://sistema.devisebit.com"

/** Link único del brief de una consulta (formulario de 3 minutos para armar la propuesta). */
export async function linkBrief(cid: number) {
  let r = await one<{ brief_token: string | null }>("select brief_token from consultas where id=$1", [cid])
  if (!r?.brief_token) {
    const tok = randomBytes(9).toString("base64url")
    await q("update consultas set brief_token=coalesce(brief_token,$1) where id=$2", [tok, cid])
    r = await one<{ brief_token: string | null }>("select brief_token from consultas where id=$1", [cid])
  }
  return `${URL_SISTEMA}/brief/${r!.brief_token}`
}

export type Servicio = { nombre: string; categoria: string | null; descripcion: string | null; precio_desde: string | null; precio_hasta: string | null; moneda: string; plazo: string | null; link: string | null }

const fmt = (n: string | number, m: string) => `${m === "ARS" ? "$" : m + " "}${Number(n).toLocaleString("es-AR")}`

/** Catálogo con rangos de referencia, plazos y links, tal como lo cargó el equipo en Servicios. */
export async function catalogo() {
  const s = await q<Servicio>("select nombre, categoria, descripcion, precio_desde, precio_hasta, moneda, plazo, link from db_servicios where activo order by categoria, nombre")
  return s.map((x) => {
    const rango = x.precio_desde && x.precio_hasta ? `desde ${fmt(x.precio_desde, x.moneda)} hasta ${fmt(x.precio_hasta, x.moneda)}` : x.precio_desde ? `desde ${fmt(x.precio_desde, x.moneda)}` : null
    return { ...x, rango }
  })
}

/** Opciones del brief. */
export const TIPOS = ["Sitio web institucional", "Tienda online / venta por web", "Sistema de gestión a medida", "App para celular", "Asistente de WhatsApp con IA", "Tablero de indicadores", "Academia / cursos online", "Integración entre sistemas", "Otro"]
export const FUNCIONES = ["Catálogo de productos", "Pagos online (Mercado Pago, tarjetas)", "Turnos / reservas", "Usuarios y permisos", "Panel para cargar contenido", "Formularios y CRM", "WhatsApp integrado", "Facturación / AFIP", "Reportes y tableros", "Varios idiomas", "Integración con mi sistema actual", "Inteligencia artificial"]
export const PLAZOS = ["Lo antes posible", "En 1 mes", "En 2 a 3 meses", "Más adelante / evaluando"]
export const INVERSION = ["Menos de USD 1.000", "USD 1.000 a 3.000", "USD 3.000 a 8.000", "USD 8.000 a 20.000", "Más de USD 20.000", "Prefiero que me orienten"]
