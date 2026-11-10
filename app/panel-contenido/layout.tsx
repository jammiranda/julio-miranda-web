import Progreso from "@/components/Progreso"
import type { Metadata } from "next"
import { Suspense } from "react"
import { unstable_cache } from "next/cache"
import { waitUntil } from "@vercel/functions"
import { redirect } from "next/navigation"
import { cerrarSesion, ROL_NOMBRE } from "@/lib/auth"
import { instagram, registrarSeguidores, historialSeguidores } from "@/lib/instagram"
import { one, q } from "@/lib/db"
import { facebook } from "@/lib/facebook"
import { diaHace } from "@/lib/panel-analisis"
import { PREFS_BASE, prefsDe } from "@/lib/panel-prefs"
import { safe } from "@/lib/panel"
import { acceso, base, fmt, Spark, NoPermiso } from "./_ui"
import Nav from "./_nav"
import Buscar from "./_buscar"
import "./panel.css"

export const metadata: Metadata = { title: "Panel de Contenido · DEVISEBIT", robots: { index: false, follow: false } }

async function salir() {
  "use server"
  cerrarSesion()
  redirect("/login")
}

// La foto diaria de seguidores y la sincronización de publicaciones se hacen en segundo plano y como mucho cada 6 horas (además del cron de las 8)
const registroDiario = unstable_cache(async () => { await registrarSeguidores().catch(() => null); return Date.now() }, ["pc-ig-registro"], { revalidate: 21600 })

/** Pendientes que se muestran como globito en el menú (se recalculan como mucho cada minuto). */
const avisosMenu = unstable_cache(
  async () => {
    const r = await safe(one<{ c: number }>(`select count(*)::int c from consultas where empresa='devisebit' and (estado='nueva' or (necesita_humano and estado in ('nueva','contactada')))`))
    return { crm: r?.c ?? 0 }
  },
  ["pc-avisos-menu"],
  { revalidate: 60 },
)

/** Indicador destacado del menú lateral: cada usuario elige cuál (por defecto, las visitas diarias de la web). */
async function Destacado({ id }: { id: string }) {
  // La foto diaria de seguidores y el historial de Instagram se siguen guardando sea cual sea el indicador elegido
  waitUntil(registroDiario().catch(() => null))
  if (id === "ninguno") return null
  let rotulo = "", valor = "—", pie = "", serie: number[] = [], color = "var(--info)"
  if (id === "visitas") {
    const filas = await safe(q<{ dia: string; c: number }>(`select to_char(dia,'YYYY-MM-DD') dia, sum(n)::int c from pv_visitas where dia > current_date - 14 group by dia`))
    const por = new Map((filas ?? []).map((f) => [f.dia, Number(f.c)]))
    serie = Array.from({ length: 14 }, (_, i) => por.get(diaHace(13 - i)) ?? 0)
    const hoy = serie[13], ayer = serie[12], prom = serie.slice(6, 13).reduce((a, x) => a + x, 0) / 7
    rotulo = "Visitas de hoy · web"; valor = filas ? fmt(hoy) : "—"
    pie = filas ? `ayer ${fmt(ayer)} · promedio de 7 días ${fmt(prom)}` : "Sin datos de visitas"
  } else if (id === "consultas") {
    const r = await safe(one<{ d30: number; d7: number }>(`select count(*) filter (where creado > now()-interval '30 days')::int d30, count(*) filter (where creado > now()-interval '7 days')::int d7 from consultas where empresa='devisebit'`))
    rotulo = "Consultas · 30 días"; valor = r ? fmt(r.d30) : "—"; pie = r ? `${fmt(r.d7)} en los últimos 7 días` : ""; color = "var(--warn)"
  } else if (id === "fb_seg") {
    const fb = await facebook()
    rotulo = "Seguidores en Facebook"; valor = fb.ok ? fmt(fb.seguidores) : "—"; serie = fb.ok ? fb.serieSeguidores : []; pie = fb.ok ? "página DEVISEBIT · Metricool" : "Facebook sin datos"; color = "var(--fb)"
  } else {
    const [ig, hist] = await Promise.all([instagram(), historialSeguidores(60).catch(() => [])])
    rotulo = "Seguidores en Instagram"; valor = ig?.ok ? fmt(ig.perfil.seguidores) : "—"; serie = hist.map((h) => h.seguidores); color = "var(--ig)"
    pie = ig?.ok ? `@${ig.perfil.username}${hist.length > 1 ? ` · evolución de ${hist.length} días` : ""}` : "Instagram sin conexión"
  }
  return (
    <div className="pc-acct">
      <div className="l">{rotulo}</div>
      <div className="n">{valor}</div>
      {serie.length > 1 && <Spark vals={serie} color={color} alto={28} className="pc-sp" />}
      <div className="l">{pie}</div>
    </div>
  )
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await acceso()
  const b = base()
  const pref = u ? await prefsDe(u.id) : PREFS_BASE
  const av = u ? await avisosMenu().catch(() => ({ crm: 0 })) : { crm: 0 }
  return (
    <>
      <Progreso />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,500..800&family=Instrument+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" />
      <div className="pc">
        <a className="pc-skip" href="#contenido">Saltar al contenido</a>
        <aside className="pc-side">
          <div className="pc-brand">
            <a href={b || "/"} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <span className="pc-mark" style={{ backgroundImage: "url(/marca/logo-devisebit.png)" }} aria-hidden="true" />
              <span><b>DEVISEBIT</b><small>Panel de contenido</small></span>
            </a>
            <form action={salir} className="pc-salir-movil"><button className="pc-btn" style={{ padding: "4px 10px", fontSize: 12 }}>Salir</button></form>
          </div>
          {u && <Buscar base={b} oficina={u.rol === "gerente"} />}
          {u && (
            <Suspense fallback={<div className="pc-acct"><div className="l">&nbsp;</div><div className="n">…</div></div>}>
              <Destacado id={pref.lateral} />
            </Suspense>
          )}
          {u && <Nav base={b} oficina={u.rol === "gerente"} avisos={{ crm: av.crm }} />}
          <div className="pc-foot">
            {u && <span>{u.nombre} · {ROL_NOMBRE[u.rol]}</span>}
            <span>DEVISEBIT SRL · datos propios, sin cifras inventadas</span>
            <form action={salir}><button>Cerrar sesión</button></form>
          </div>
        </aside>
        <main className="pc-main" id="contenido" tabIndex={-1}>
          <div className="pc-wrap">{u ? children : <NoPermiso />}</div>
        </main>
      </div>
    </>
  )
}
