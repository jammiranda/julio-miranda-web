import { q, one } from "./db"

/**
 * Seguimiento de campañas pagas en el Panel (Anuncios → Campañas en seguimiento).
 * Es el tablero común entre Julio, el equipo y Claude para controlar cada campaña y anotar decisiones.
 * - La ficha (plan) y cada control se cargan con POST /api/panel/ads/seguimiento (sesión de Dirección o Comercial).
 * - Cada control guarda los acumulados que muestra el Administrador de anuncios (inversión, impresiones, alcance,
 *   visitas al perfil) y, de paso, cuántos seguidores tiene Instagram y cuántas veces se pidió la palabra clave.
 * - Las decisiones quedan en la bitácora con fecha y autor.
 */
export type Control = { gasto?: number; impresiones?: number; alcance?: number; resultados?: number; clics?: number; frecuencia?: number; por_anuncio?: { nombre: string; gasto?: number; resultados?: number; impresiones?: number }[] }
export type EntradaBitacora = { fecha: string; tipo: "control" | "decision" | "nota"; texto: string; por: string; datos?: Control & { seguidores?: number | null; palabra_usos?: number | null } }
export type Seguimiento = {
  id: number; plataforma: string; campania_id: string; nombre: string; objetivo: string | null; presupuesto_diario: number | null; moneda: string
  inicio: string | null; fin: string | null; publico: string | null; anuncios: string | null; meta: string | null; estado: string
  base_seguidores: number | null; base_palabra: string | null; base_palabra_usos: number | null; bitacora: EntradaBitacora[]; actualizado: string
}

const seguidoresHoy = () => one<{ seguidores: number }>("select seguidores from pc_ig_seguidores order by dia desc limit 1").then((r) => r?.seguidores ?? null).catch(() => null)
const usosPalabra = (p: string | null) => (p ? one<{ usos: number }>("select usos from am_recursos where palabra=$1", [p]).then((r) => r?.usos ?? null).catch(() => null) : Promise.resolve(null))

/** Crea o actualiza la ficha de una campaña. La primera vez guarda la base de seguidores y de la palabra clave. */
export async function guardarCampania(c: Partial<Seguimiento> & { campania_id: string; nombre: string }) {
  const previo = await one<Seguimiento>("select * from ads_seguimiento where campania_id=$1", [c.campania_id])
  const palabra = (c.base_palabra ?? previo?.base_palabra ?? null)?.toUpperCase() ?? null
  const baseSeg = previo?.base_seguidores ?? c.base_seguidores ?? (await seguidoresHoy())
  const baseUsos = previo?.base_palabra_usos ?? c.base_palabra_usos ?? (await usosPalabra(palabra))
  await q(
    `insert into ads_seguimiento(plataforma,campania_id,nombre,objetivo,presupuesto_diario,moneda,inicio,fin,publico,anuncios,meta,estado,base_seguidores,base_palabra,base_palabra_usos)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     on conflict (campania_id) do update set nombre=excluded.nombre, objetivo=coalesce(excluded.objetivo, ads_seguimiento.objetivo),
       presupuesto_diario=coalesce(excluded.presupuesto_diario, ads_seguimiento.presupuesto_diario), moneda=excluded.moneda,
       inicio=coalesce(excluded.inicio, ads_seguimiento.inicio), fin=coalesce(excluded.fin, ads_seguimiento.fin),
       publico=coalesce(excluded.publico, ads_seguimiento.publico), anuncios=coalesce(excluded.anuncios, ads_seguimiento.anuncios),
       meta=coalesce(excluded.meta, ads_seguimiento.meta), estado=excluded.estado, base_palabra=coalesce(ads_seguimiento.base_palabra, excluded.base_palabra), actualizado=now()`,
    [c.plataforma ?? previo?.plataforma ?? "meta", c.campania_id, c.nombre.slice(0, 200), c.objetivo ?? null, c.presupuesto_diario ?? null, (c.moneda ?? previo?.moneda ?? "ARS").slice(0, 3),
      c.inicio ?? null, c.fin ?? null, c.publico ?? null, c.anuncios ?? null, c.meta ?? null, c.estado ?? previo?.estado ?? "activa", baseSeg, palabra, baseUsos],
  )
}

/** Suma una entrada a la bitácora. En los controles guarda además seguidores y usos de la palabra clave del momento. */
export async function anotar(campania_id: string, e: { tipo: EntradaBitacora["tipo"]; texto: string; por: string; datos?: Control; fecha?: string }) {
  const s = await one<Seguimiento>("select * from ads_seguimiento where campania_id=$1", [campania_id])
  if (!s) throw new Error("No existe esa campaña en el seguimiento")
  const datos = e.tipo === "control" ? { ...(e.datos ?? {}), seguidores: await seguidoresHoy(), palabra_usos: await usosPalabra(s.base_palabra) } : e.datos
  const entrada: EntradaBitacora = { fecha: e.fecha ?? new Date().toISOString(), tipo: e.tipo, texto: e.texto.slice(0, 2000), por: e.por.slice(0, 60), ...(datos ? { datos } : {}) }
  await q("update ads_seguimiento set bitacora = bitacora || $2::jsonb, actualizado=now() where campania_id=$1", [campania_id, JSON.stringify([entrada])])
  return entrada
}

/** Fichas con los indicadores calculados para el Panel. */
export async function seguimientos() {
  const filas = await q<Seguimiento>("select *, to_char(inicio,'YYYY-MM-DD\"T\"HH24:MI:SSOF') inicio, to_char(fin,'YYYY-MM-DD\"T\"HH24:MI:SSOF') fin from ads_seguimiento order by (ads_seguimiento.estado='activa') desc, ads_seguimiento.inicio desc nulls last limit 12")
  const segHoy = await seguidoresHoy()
  return Promise.all(filas.map(async (s) => {
    const controles = s.bitacora.filter((b) => b.tipo === "control" && b.datos)
    const ult = controles[controles.length - 1]?.datos ?? null
    const usosHoy = await usosPalabra(s.base_palabra)
    const ahora = Date.now()
    const ini = s.inicio ? new Date(s.inicio).getTime() : null, fin = s.fin ? new Date(s.fin).getTime() : null
    const diasTotal = ini && fin ? Math.max(1, Math.round((fin - ini) / 864e5)) : null
    const diasCorridos = ini ? Math.min(diasTotal ?? Infinity, Math.max(0, Math.floor((ahora - ini) / 864e5))) : null
    const nuevosSeg = segHoy != null && s.base_seguidores != null ? segHoy - s.base_seguidores : null
    const pedidos = usosHoy != null && s.base_palabra_usos != null ? usosHoy - s.base_palabra_usos : null
    const gasto = ult?.gasto ?? null
    return {
      ...s,
      ultimoControl: controles[controles.length - 1]?.fecha ?? null,
      diasTotal, diasCorridos,
      presupuestoTotal: s.presupuesto_diario != null && diasTotal ? Number(s.presupuesto_diario) * diasTotal : null,
      gasto, impresiones: ult?.impresiones ?? null, alcance: ult?.alcance ?? null, resultados: ult?.resultados ?? null, frecuencia: ult?.frecuencia ?? null,
      porAnuncio: ult?.por_anuncio ?? [],
      costoResultado: gasto != null && ult?.resultados ? Math.round(gasto / ult.resultados) : null,
      seguidoresHoy: segHoy, nuevosSeguidores: nuevosSeg,
      costoSeguidor: gasto != null && nuevosSeg && nuevosSeg > 0 ? Math.round(gasto / nuevosSeg) : null,
      pedidosPalabra: pedidos,
    }
  }))
}
