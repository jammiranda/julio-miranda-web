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
  if (campania_id === "120250033073090320") await asegurarPrimera().catch(() => {})
  const s = await one<Seguimiento>("select * from ads_seguimiento where campania_id=$1", [campania_id])
  if (!s) throw new Error("No existe esa campaña en el seguimiento")
  const datos = e.tipo === "control" ? { ...(e.datos ?? {}), seguidores: await seguidoresHoy(), palabra_usos: await usosPalabra(s.base_palabra) } : e.datos
  const entrada: EntradaBitacora = { fecha: e.fecha ?? new Date().toISOString(), tipo: e.tipo, texto: e.texto.slice(0, 2000), por: e.por.slice(0, 60), ...(datos ? { datos } : {}) }
  await q("update ads_seguimiento set bitacora = bitacora || $2::jsonb, actualizado=now() where campania_id=$1", [campania_id, JSON.stringify([entrada])])
  return entrada
}


/** Primera campaña (29/10/2026): se asegura una sola vez por si la carga desde el navegador no llegó. */
let asegurada = false
async function asegurarPrimera() {
  if (asegurada) return
  asegurada = true
  const ya = await one("select 1 from ads_seguimiento where campania_id='120250033073090320'").catch(() => ({}))
  if (ya) return
  await guardarCampania({
    plataforma: "meta", campania_id: "120250033073090320", nombre: "DEVISEBIT · Seguidores Instagram · Base depurada (prueba 10 días)",
    objetivo: "Tráfico → visitas al perfil de Instagram @devisebit", presupuesto_diario: 3000, moneda: "ARS",
    inicio: "2026-10-29T22:25:00-03:00", fin: "2026-11-08T22:25:00-03:00",
    publico: "Base depurada de contactos (lista de clientes) + público similar 1% · Argentina · Advantage+",
    anuncios: "1) DIAGNOSTICO · placa \"¿Empezamos por un diagnóstico?\" con texto propio: seguir a @devisebit y escribir DIAGNOSTICO por DM (el bot responde con el autodiagnóstico).\n2) Servicios · rota 4 posteos: asistente de WhatsApp con IA, IA en salud, CRM con WhatsApp y \"Así trabajamos\".\nBotón: Ir al perfil de Instagram.",
    meta: "Prueba de 10 días para sumar seguidores calificados en Instagram y pedidos de DIAGNOSTICO; ver qué anuncio rinde mejor antes de escalar.",
    estado: "activa", base_palabra: "DIAGNOSTICO",
  })
  await anotar("120250033073090320", { tipo: "decision", por: "Julio", fecha: "2026-10-29T22:55:00-03:00", texto: "Lanzamos la prueba: 10 días, $3.000 por día, cuenta en pesos. Se cambiaron las notas del blog por posteos de servicios (IA y WhatsApp) y se sumó un anuncio con DIAGNOSTICO. Bot de DIAGNOSTICO probado por DM: responde bien." })
  await anotar("120250033073090320", { tipo: "nota", por: "Claude", fecha: "2026-10-29T23:00:00-03:00", texto: "Seguimiento automático lunes, miércoles y viernes 11:43 h: Claude carga acá los números de Meta y avisa. Pendiente: si se sube un reel del bot de WhatsApp a @devisebit, sumarlo como tercer anuncio (mismo presupuesto)." })
}

/** Fichas con los indicadores calculados para el Panel. */
export async function seguimientos() {
  await asegurarPrimera().catch(() => {})
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
