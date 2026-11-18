"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requerir } from "@/lib/auth"
import { q, one, audit } from "@/lib/db"
import { evento, marcarEnviado, registrarCambios, CUPO_DIA } from "@/lib/prospeccion"
import { bloques } from "@/lib/prospeccion-bloques"
import { proveedores, enviarCon, plantilla, aHtml } from "@/lib/email"
import { linkBrief } from "@/lib/brief"

const HOY = "(now() at time zone 'America/Argentina/Buenos_Aires')::date"

const volverA = (fd: FormData) => {
  const v = String(fd.get("_volver") ?? "/prospeccion")
  return v.startsWith("/") && !v.startsWith("//") ? v : "/prospeccion"
}

/**
 * Acciones de un clic en Acercamientos (antes Prospección). Cada una deja su línea en la historia,
 * para que se vea qué se hizo, cuándo y quién.
 */
export async function accionAcercamiento(fd: FormData) {
  const u = await requerir(["gerente", "coordinacion"])
  const id = Number(fd.get("_id") ?? 0)
  const acc = String(fd.get("_acc") ?? "")
  const hecho = await aplicar(id, acc, u.nombre ?? u.usuario)
  await audit(u, `acercamiento:${acc}`, "prospeccion", id)
  revalidatePath("/prospeccion")
  revalidatePath("/")
  const v = volverA(fd).replace(/[?&](ok|error)=[^&]*/g, "")
  const aviso = acc === "email" ? (hecho ? "ok=Email enviado" : "error=" + encodeURIComponent("No se pudo enviar el email (revisá que tenga dirección, asunto y mensaje)")) : hecho ? "" : "error=" + encodeURIComponent("No cambió: esa acción no corresponde a su estado")
  redirect(aviso ? `${v}${v.includes("?") ? "&" : "?"}${aviso}` : v)
}

/** Lo mismo para varios a la vez: los tildados en la lista (selección múltiple). */
export async function accionLote(fd: FormData) {
  const u = await requerir(["gerente", "coordinacion"])
  const acc = String(fd.get("_acc") ?? "")
  const ids = [...new Set(fd.getAll("ids").map((x) => Number(x)).filter((x) => x > 0))].slice(0, 300)
  let hechos = 0
  for (const id of ids) if (await aplicar(id, acc, u.nombre ?? u.usuario)) hechos++
  await audit(u, `acercamiento-lote:${acc}`, "prospeccion", ids.length, ids.join(","))
  revalidatePath("/prospeccion")
  revalidatePath("/")
  const v = volverA(fd).replace(/[?&](ok|error)=[^&]*/g, "")
  const msj = hechos === ids.length ? `${hechos} actualizados` : `${hechos} actualizados · ${ids.length - hechos} no cambiaron porque esa acción no corresponde a su estado`
  redirect(ids.length ? `${v}${v.includes("?") ? "&" : "?"}${hechos ? "ok" : "error"}=${encodeURIComponent(hechos ? msj : "Ninguno cambió: esa acción no corresponde al estado de los seleccionados")}` : v)
}

async function aplicar(id: number, acc: string, por: string): Promise<boolean> {
  const r = await one<any>("select * from g_prospeccion where id=$1", [id])
  if (!r) return false
  // En lote se mezclan estados: cada acción solo toca a los que corresponde
  const valeEn: Record<string, string[]> = { email: ["borrador"], enviado: ["borrador"], si: ["borrador"], no: ["borrador"], hoy: ["borrador", "enviado", "respondio"], manana: ["borrador", "enviado", "respondio"],
    seguimiento: ["enviado"], respondio: ["borrador", "enviado", "descartado", "sin_respuesta"], reabrir: ["descartado", "sin_respuesta"], contestado: ["respondio"], reunion: ["respondio", "enviado"], ganado: ["reunion", "respondio"], sin_respuesta: ["enviado"], descartar: ["borrador", "enviado", "respondio", "reunion"] }
  if (valeEn[acc] && !valeEn[acc].includes(r.estado)) return false
  const estado = async (nuevo: string, extra = "") => {
    await q(`update g_prospeccion set estado=$2, actualizado=now() ${extra} where id=$1`, [id, nuevo])
    await registrarCambios(id, r, por)
  }
  switch (acc) {
    case "enviado": await marcarEnviado(id, por); break
    case "hoy":
      await q(`update g_prospeccion set seguimiento=${HOY}, actualizado=now() where id=$1`, [id])
      await evento(id, "aprobado", "Aprobado para escribirle hoy", por)
      break
    case "respondio": await estado("respondio", `, seguimiento=${HOY}`); break
    case "contestado":
      // Ya le contestamos: sale de "Contestar" y vuelve a aparecer en 3 días para ver si sigue la charla
      await q(`update g_prospeccion set seguimiento=${HOY} + 3, actualizado=now() where id=$1`, [id])
      await evento(id, "contestado", "Le contestamos · vuelve en 3 días", por)
      break
    case "seguimiento": {
      const n = Number((await one<{ n: number }>("select count(*)::int n from g_prospeccion_eventos where prospeccion_id=$1 and tipo='seguimiento'", [id]))?.n ?? 0) + 1
      await q(`update g_prospeccion set seguimiento=${HOY} + 7, actualizado=now() where id=$1`, [id])
      await evento(id, "seguimiento", `Seguimiento n.º ${n} enviado · próximo en 7 días`, por)
      break
    }
    case "reunion": await estado("reunion", `, seguimiento=null`); break
    case "ganado": await estado("ganado"); break
    case "sin_respuesta": await estado("sin_respuesta", ", seguimiento=null"); break
    case "descartar": await estado("descartado", ", seguimiento=null"); break
    case "manana":
      await q(`update g_prospeccion set seguimiento=${HOY} + 1, actualizado=now() where id=$1`, [id])
      await evento(id, "pospuesto", "Pasado a mañana", por)
      break
    case "si": {
      // Aprobado para escribirle: va al primer día con lugar (cupo diario), sin amontonar todo en hoy
      const d = await one<{ d: string }>(
        `select to_char(g.d, 'YYYY-MM-DD') d from generate_series(${HOY}, ${HOY} + 60, interval '1 day') g(d)
         where extract(isodow from g.d) < 6
           and (select count(*) from g_prospeccion p where p.estado='borrador' and p.seguimiento = g.d::date) < $1
         order by g.d limit 1`, [CUPO_DIA])
      await q("update g_prospeccion set seguimiento=$2::date, actualizado=now() where id=$1", [id, d?.d ?? null])
      await evento(id, "aprobado", `Aprobado para escribirle · queda para el ${d?.d ?? "próximo día libre"}`, por)
      break
    }
    case "no": await estado("descartado", ", seguimiento=null"); break
    case "email": {
      // Email personal desde el sistema (remitente info@devisebit.com): sale el ASUNTO y el MENSAJE de la ficha
      const to = String(r.destino ?? "").trim()
      const bl = bloques(String(r.notas ?? ""))
      const prov = proveedores()[0]
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to) || !bl.mensaje || !prov) return false
      let texto = bl.mensaje
      const cid = /^consulta:(\d+)/.exec(String(r.ref ?? ""))?.[1]
      if (texto.includes("{{brief}}")) texto = texto.replaceAll("{{brief}}", cid ? await linkBrief(Number(cid)) : "https://sistema.devisebit.com/agendar")
      const res = await enviarCon(prov.id, { email: to, name: r.persona }, bl.asunto || r.asunto || "DEVISEBIT", plantilla(aHtml(texto)), null)
      if (!res.ok) { await evento(id, "nota", `No se pudo enviar el email: ${res.error ?? "error"}`, por); return false }
      await evento(id, "nota", `Email enviado desde el sistema a ${to}`, por)
      await marcarEnviado(id, por)
      break
    }
    case "reabrir": await estado("borrador", `, seguimiento=${HOY}`); break
    default: return false
  }
  return true
}
