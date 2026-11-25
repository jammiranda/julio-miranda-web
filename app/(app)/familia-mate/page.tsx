import { requerir } from "@/lib/auth"
import Codigos from "./Codigos"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Familia Mate en el sistema: todo con nombre y apellido (pedido de Julio, 25/11/2026).
 * Usuarios y emails de los cuatro productos, quién paga o tiene un regalo, y los códigos con su uso.
 * Las estadísticas (uso, visitas, embudos) viven en el panel.
 */
const MB = "https://matebot.devisebit.com"
const MC = "https://matecuentas.devisebit.com"

async function get<T>(url: string): Promise<T | null> {
  const k = process.env.STATS_KEY
  if (!k) return null
  try {
    const r = await fetch(url, { headers: { "x-stats-key": k, "x-admin": k, "x-admin-key": k }, cache: "no-store", signal: AbortSignal.timeout(20000) })
    return r.ok ? ((await r.json()) as T) : null
  } catch { return null }
}

type MB = { contactos: any[]; pagos: any[]; usuarios: Record<string, number>; turnos: Record<string, number>; eventos: Record<string, number>; infra: { funciones: string | null; baseDeDatos: string } }
type Promo = { productos: Record<string, string>; codigos: { code: string; producto: string; dias: number; usos_max: number; usos: number; nota: string | null; created_at: string; canjes: { producto: string; quien: string | null; cuando: string }[] }[] }

const f = (d?: string | number | null) => (d ? new Date(d).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric" }) : "—")
const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`

export default async function FamiliaMateSistema() {
  await requerir(["gerente"])
  const [mb, mc, promo] = await Promise.all([
    get<MB>(`${MB}/api/admin/stats`),
    get<Record<string, any>>(`${MC}/api/admin?a=stats`),
    get<Promo>(`${MB}/api/admin/promo`),
  ])

  type Fila = { nombre: string; email: string; tel: string; producto: string; alta: string; ultimo: string; novedades: boolean; plan: string }
  const filas: Fila[] = [
    ...(mb?.contactos ?? []).map((c: any) => ({
      nombre: c.nombre || "", email: c.email || "", tel: c.phone || (c.wa_id ? `+${c.wa_id}` : ""),
      producto: ["MateBot (" + (c.wa_id ? "WhatsApp" : "Telegram") + ")", c.turnos ? "MateTurnos" : "", c.eventos ? "MateEventos" : ""].filter(Boolean).join(" · "),
      alta: c.alta, ultimo: c.last_seen, novedades: !!c.optin, plan: c.plus ? "Plus" : c.step === "ready" ? "Gratis" : "Registro sin terminar",
    })),
    ...((mc?.contactos ?? []) as any[]).map((c) => ({
      nombre: c.nombre || "", email: c.email || "", tel: c.phone || "", producto: "MateCuentas" + (c.whatsapp ? " (con MateBot)" : ""),
      alta: c.alta, ultimo: "", novedades: !!c.optin, plan: c.pro ? (c.viaCodigo ? "Pro (código)" : c.mp ? "Pro (Mercado Pago)" : "Pro") : "Gratis",
    })),
  ].sort((a, b) => String(b.alta).localeCompare(String(a.alta)))
  const csv = "﻿" + ["Nombre,Email,Teléfono,Producto,Plan,Alta,Último uso,Acepta novedades", ...filas.map((c) => [q(c.nombre), q(c.email), q(c.tel), q(c.producto), q(c.plan), f(c.alta), f(c.ultimo || null), c.novedades ? "Sí" : "No"].join(","))].join("\n")

  const pagos = [
    ...(mb?.pagos ?? []).map((p: any) => ({ producto: p.producto, quien: p.nombre, email: p.email, hasta: p.hasta, origen: p.mp ? "Mercado Pago" : p.codigo ? `Código ${p.codigo}` : "Manual" })),
    ...((mc?.contactos ?? []) as any[]).filter((c) => c.pro).map((c) => ({ producto: "MateCuentas Pro", quien: c.nombre, email: c.email, hasta: c.proUntil, origen: c.viaCodigo ? "Código" : c.mp ? "Mercado Pago" : "Manual" })),
  ]

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="m-0">Familia Mate</h1>
        <p className="m-0 text-sm text-[#4A515C]">MateBot, MateCuentas, MateTurnos y MateEventos: quién se registró, quién paga y los códigos de regalo. Los números y gráficos están en el <a href="https://panel.devisebit.com/familia-mate">panel</a>.</p>
      </div>

      <section className="card flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <strong>Usuarios y contactos · {filas.length}</strong>
          <span className="text-sm text-[#4A515C]">{filas.filter((c) => c.email).length} con email · {filas.filter((c) => c.novedades).length} aceptan novedades</span>
          <a className="btn" href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`} download="familia-mate-contactos.csv">Descargar Excel (CSV)</a>
        </div>
        {!filas.length ? <p className="m-0 text-sm">Todavía no hay registros.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Producto</th><th>Plan</th><th>Alta</th><th>Último uso</th><th>Novedades</th></tr></thead>
            <tbody>{filas.map((c, i) => <tr key={i} className="border-t border-[#E6E8EC]"><td>{c.nombre || "—"}</td><td>{c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : "—"}</td><td>{c.tel || "—"}</td><td>{c.producto}</td><td>{c.plan}</td><td>{f(c.alta)}</td><td>{f(c.ultimo || null)}</td><td>{c.novedades ? "Sí" : "No"}</td></tr>)}</tbody></table></div>)}
        <p className="m-0 text-xs text-[#4A515C]">Para mandar novedades por email usá solo a quienes dicen "Sí". MateBot pide el email al registrarse; MateCuentas lo tiene siempre.</p>
      </section>

      <section className="card flex flex-col gap-3" id="invitaciones">
        <strong>Invitaciones · ¿entraron? ¿lo están usando?</strong>
        {(() => {
          const inv = ((mc?.invitaciones ?? []) as any[])
          const codigos = (promo?.codigos ?? []).filter((c) => c.nota || c.canjes.length)
          return (<>
            <span className="text-sm text-[#4A515C]">MateCuentas: {inv.length} invitaciones · {inv.filter((x) => x.joinedAt).length} entraron · {inv.filter((x) => x.estado === "Lo está usando").length} lo están usando</span>
            {inv.length ? <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th>Invitada/o</th><th>Espacio</th><th>Invitó</th><th>Enviada</th><th>Entró</th><th>Última carga</th><th>Estado</th></tr></thead>
              <tbody>{inv.map((x, i) => <tr key={i} className="border-t border-[#E6E8EC]"><td>{x.email || "Por link"}</td><td>{x.spaceName || "—"}</td><td>{x.by || "—"}</td><td>{f(x.sentAt)}</td><td>{f(x.joinedAt)}</td><td>{f(x.ultimaCarga)}</td>
                <td><b style={{ color: x.estado === "Lo está usando" ? "#1E8E3E" : x.joinedAt ? "#B26A00" : "#4A515C" }}>{x.estado}</b></td></tr>)}</tbody></table></div>
              : <p className="m-0 text-sm">Todavía no hay invitaciones por email. Se registran desde MateCuentas → Invitar → "Invitar por email".</p>}
            <span className="text-sm text-[#4A515C] mt-2">Códigos de regalo entregados: {codigos.filter((c) => c.canjes.length).length} usados de {promo?.codigos?.length ?? 0}. El detalle de quién usó cada uno está más abajo, en Códigos de regalo.</span>
          </>)
        })()}
      </section>

      <section className="card flex flex-col gap-3">
        <strong>Planes pagos y regalados · {pagos.length}</strong>
        {!pagos.length ? <p className="m-0 text-sm">Nadie tiene un plan pago todavía.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left"><th>Producto</th><th>Quién</th><th>Email</th><th>Vigente hasta</th><th>Origen</th></tr></thead>
            <tbody>{pagos.map((p, i) => <tr key={i} className="border-t border-[#E6E8EC]"><td>{p.producto}</td><td>{p.quien || "—"}</td><td>{p.email || "—"}</td><td>{p.hasta ? (new Date(p.hasta).getFullYear() > new Date().getFullYear() + 3 ? "Sin límite" : f(p.hasta)) : "Mes a mes"}</td><td>{p.origen}</td></tr>)}</tbody></table></div>)}
        <p className="m-0 text-xs text-[#4A515C]">Los cobros reales de Mercado Pago (montos y fechas) están en Finanzas, junto con el resto de los cobros de DEVISEBIT.</p>
      </section>

      <section className="card flex flex-col gap-3" id="codigos">
        <strong className="text-lg">Códigos de regalo</strong>
        <p className="m-0 text-sm text-[#4A515C]">La persona entra al link que le mandás (matebot.devisebit.com/codigo?c=…) y se activa solo. También puede escribirle a MateBot "codigo ABCD-2345". Acá ves quién usó cada uno y cuándo.</p>
        {promo ? <Codigos productos={promo.productos} codigos={promo.codigos} /> : <p className="m-0 text-sm">No pudimos traer los códigos de MateBot. Recargá en un rato.</p>}
      </section>

      <section className="card text-sm">
        <strong>Dónde están los datos</strong>
        <p className="m-0 mt-1">Funciones en Vercel ({mb?.infra?.funciones === "iad1" ? "Washington D.C., Estados Unidos" : mb?.infra?.funciones ?? "—"}). Base de MateBot, MateTurnos y MateEventos: {mb?.infra?.baseDeDatos ?? "—"} (Virginia, Estados Unidos). MateCuentas: Vercel Blob en Estados Unidos. Todo cifrado en tránsito y en reposo.</p>
      </section>
    </div>
  )
}
